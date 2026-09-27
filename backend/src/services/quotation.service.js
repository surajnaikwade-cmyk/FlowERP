const pool = require("../config/db");

const calculateLineAmount = (
  quantity,
  unitPrice,
  discountPercent,
  gstPercent
) => {
  const baseAmount = quantity * unitPrice;
  const discountAmount = baseAmount * (discountPercent / 100);
  const discountedAmount = baseAmount - discountAmount;
  const gstAmount = discountedAmount * (gstPercent / 100);

  return Number((discountedAmount + gstAmount).toFixed(2));
};

const isValidQuotationTransition = (currentStatus, nextStatus) => {
  const transitions = {
    DRAFT: ["SENT"],
    SENT: ["ACCEPTED", "REJECTED"],
    ACCEPTED: [],
    REJECTED: [],
  };

  return transitions[currentStatus]?.includes(nextStatus) || false;
};

const canConvertQuotation = (status) => status === "ACCEPTED";

const canCreateSalesOrder = (status, existingOrder = null) =>
  canConvertQuotation(status) && !existingOrder;

const canUpdateQuotationStatus = (role, currentStatus, nextStatus) => {
  if (role === "SALES_USER") {
    return currentStatus === "DRAFT" && nextStatus === "SENT";
  }

  if (role === "ADMIN") {
    return currentStatus === "SENT" && ["ACCEPTED", "REJECTED"].includes(nextStatus);
  }

  return false;
};

const createQuotation = async ({
  enquiryId,
  validUntil,
  items,
  userId,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const enquiryResult = await client.query(
      `SELECT id, customer_id, status
       FROM enquiries
       WHERE id = $1
       FOR UPDATE`,
      [enquiryId]
    );

    if (enquiryResult.rows.length === 0) {
      throw new Error("Enquiry not found");
    }

    const enquiry = enquiryResult.rows[0];

    if (enquiry.status !== "NEW") {
      throw new Error(
        "Quotation can only be created for a NEW enquiry"
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("At least one quotation item is required");
    }

    const enquiryItemsResult = await client.query(
      `SELECT product_id, quantity
       FROM enquiry_items
       WHERE enquiry_id = $1`,
      [enquiryId]
    );

    const enquiryItems = new Map(
      enquiryItemsResult.rows.map((item) => [
        Number(item.product_id),
        Number(item.quantity),
      ])
    );

    for (const item of items) {
      if (
        !Number.isInteger(Number(item.productId)) ||
        Number(item.productId) <= 0
      ) {
        throw new Error("Invalid product ID");
      }

      const requestedQuantity = Number(item.quantity);
      const enquiryQuantity = enquiryItems.get(Number(item.productId));

      if (!enquiryQuantity) {
        throw new Error(
          `Product ${item.productId} is not part of the enquiry`
        );
      }

      if (
        !Number.isInteger(requestedQuantity) ||
        requestedQuantity <= 0 ||
        requestedQuantity > enquiryQuantity
      ) {
        throw new Error(
          `Quotation quantity for product ${item.productId} must be between 1 and ${enquiryQuantity}`
        );
      }
    }

    const quotationNumber = `QTN-${Date.now()}`;

    const quotationResult = await client.query(
      `INSERT INTO quotations
       (quotation_number, enquiry_id, customer_id, valid_until, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        quotationNumber,
        enquiryId,
        enquiry.customer_id,
        validUntil,
        userId,
      ]
    );

    const quotation = quotationResult.rows[0];
    let grandTotal = 0;

    for (const item of items) {
      const productResult = await client.query(
        `SELECT id, base_price
         FROM products
         WHERE id = $1`,
        [item.productId]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const quantity = Number(item.quantity);
      const unitPrice =
        item.unitPrice !== undefined
          ? Number(item.unitPrice)
          : Number(productResult.rows[0].base_price);
      const discountPercent = Number(item.discountPercent || 0);
      const gstPercent = Number(item.gstPercent || 0);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error("Unit price cannot be negative");
      }

      if (
        !Number.isFinite(discountPercent) ||
        discountPercent < 0 ||
        discountPercent > 100
      ) {
        throw new Error("Discount must be between 0 and 100");
      }

      if (
        !Number.isFinite(gstPercent) ||
        gstPercent < 0 ||
        gstPercent > 100
      ) {
        throw new Error("GST must be between 0 and 100");
      }

      const lineAmount = calculateLineAmount(
        quantity,
        unitPrice,
        discountPercent,
        gstPercent
      );

      grandTotal += lineAmount;

      await client.query(
        `INSERT INTO quotation_items
         (quotation_id, product_id, quantity, unit_price,
          discount_percent, gst_percent, line_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          quotation.id,
          item.productId,
          quantity,
          unitPrice,
          discountPercent,
          gstPercent,
          lineAmount,
        ]
      );
    }

    grandTotal = Number(grandTotal.toFixed(2));

    await client.query(
      `UPDATE quotations
       SET grand_total = $1
       WHERE id = $2`,
      [grandTotal, quotation.id]
    );

    await client.query(
      `UPDATE enquiries
       SET status = 'QUOTED'
       WHERE id = $1`,
      [enquiryId]
    );

    await client.query("COMMIT");

    return {
      ...quotation,
      grand_total: grandTotal,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getQuotations = async (role) => {
  const adminFilter = role === "ADMIN"
    ? `WHERE q.status IN ('SENT', 'ACCEPTED', 'REJECTED')`
    : "";

  const result = await pool.query(`
    SELECT
      q.id,
      q.quotation_number,
      q.enquiry_id,
      q.customer_id,
      c.company_name,
      q.valid_until,
      q.status,
      q.grand_total,
      q.created_at
    FROM quotations q
    JOIN customers c ON c.id = q.customer_id
    ${adminFilter}
    ORDER BY q.id DESC
  `);

  return result.rows;
};

const updateQuotationStatus = async (quotationId, status, role) => {
  const allowedStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid quotation status");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `SELECT id, status
       FROM quotations
       WHERE id = $1
       FOR UPDATE`,
      [quotationId]
    );

    if (currentResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const currentStatus = currentResult.rows[0].status;

    if (!isValidQuotationTransition(currentStatus, status)) {
      throw new Error(
        `Invalid quotation status transition: ${currentStatus} → ${status}`
      );
    }

    if (!canUpdateQuotationStatus(role, currentStatus, status)) {
      throw new Error(
        `Role ${role} is not allowed to change quotation status from ${currentStatus} to ${status}`
      );
    }

    const result = await client.query(
      `UPDATE quotations
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, quotationId]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const convertQuotationToSalesOrder = async (quotationId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const quotationResult = await client.query(
      `SELECT id, quotation_number, customer_id, status, grand_total
       FROM quotations
       WHERE id = $1
       FOR UPDATE`,
      [quotationId]
    );

    if (quotationResult.rows.length === 0) {
      throw new Error("Quotation not found");
    }

    const quotation = quotationResult.rows[0];

    if (!canCreateSalesOrder(quotation.status)) {
      throw new Error("Only an ACCEPTED quotation can be converted");
    }

    const existingOrder = await client.query(
      `SELECT id, order_number
       FROM sales_orders
       WHERE quotation_id = $1`,
      [quotationId]
    );

    if (!canCreateSalesOrder(quotation.status, existingOrder.rows[0])) {
      throw new Error(
        "This quotation has already been converted to a Sales Order"
      );
    }

    const orderNumber = `SO-${Date.now()}`;

    const orderResult = await client.query(
      `INSERT INTO sales_orders
       (order_number, quotation_id, customer_id, total_amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        orderNumber,
        quotation.id,
        quotation.customer_id,
        quotation.grand_total,
      ]
    );

    const salesOrder = orderResult.rows[0];

    const quotationItems = await client.query(
      `SELECT product_id, quantity, unit_price, line_amount
       FROM quotation_items
       WHERE quotation_id = $1
       ORDER BY product_id`,
      [quotationId]
    );

    for (const item of quotationItems.rows) {
      await client.query(
        `INSERT INTO sales_order_items
         (sales_order_id, product_id, quantity, unit_price, line_amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          salesOrder.id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.line_amount,
        ]
      );
    }

    await client.query(
      `UPDATE enquiries
       SET status = 'WON'
       WHERE id = (
         SELECT enquiry_id FROM quotations WHERE id = $1
       )`,
      [quotationId]
    );

    await client.query("COMMIT");
    return salesOrder;
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      throw new Error(
        "This quotation has already been converted to a Sales Order"
      );
    }

    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  calculateLineAmount,
  isValidQuotationTransition,
  canConvertQuotation,
  canCreateSalesOrder,
  canUpdateQuotationStatus,
  createQuotation,
  getQuotations,
  updateQuotationStatus,
  convertQuotationToSalesOrder,
};
