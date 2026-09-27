const pool = require("../config/db");

const getSalesOrders = async () => {
  const result = await pool.query(`
    SELECT
      so.id,
      so.order_number,
      so.quotation_id,
      so.customer_id,
      c.company_name,
      so.order_date,
      so.total_amount,
      so.status
    FROM sales_orders so
    JOIN customers c
      ON c.id = so.customer_id
    ORDER BY so.id DESC
  `);

  return result.rows;
};

const getSalesOrderById = async (id) => {
  const orderResult = await pool.query(
    `
    SELECT
      so.*,
      c.company_name,
      c.contact_person
    FROM sales_orders so
    JOIN customers c
      ON c.id = so.customer_id
    WHERE so.id = $1
    `,
    [id]
  );

  if (orderResult.rows.length === 0) {
    return null;
  }

  const itemsResult = await pool.query(
    `
    SELECT
      soi.id,
      soi.product_id,
      p.product_code,
      p.product_name,
      soi.quantity,
      soi.unit_price,
      soi.line_amount,
      i.physical_quantity,
      i.reserved_quantity,
      (i.physical_quantity - i.reserved_quantity)
        AS available_quantity
    FROM sales_order_items soi
    JOIN products p
      ON p.id = soi.product_id
    JOIN inventory i
      ON i.product_id = soi.product_id
    WHERE soi.sales_order_id = $1
    ORDER BY soi.id
    `,
    [id]
  );

  return {
    ...orderResult.rows[0],
    items: itemsResult.rows,
  };
};

const confirmSalesOrder = async (salesOrderId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT id, status
       FROM sales_orders
       WHERE id = $1
       FOR UPDATE`,
      [salesOrderId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error("Sales Order not found");
    }

    const order = orderResult.rows[0];

    if (order.status !== "PENDING") {
      throw new Error(
        "Only a PENDING Sales Order can be confirmed"
      );
    }

    // Lock all required inventory rows before checking stock.
    const itemsResult = await client.query(
      `SELECT
         soi.product_id,
         soi.quantity,
         i.physical_quantity,
         i.reserved_quantity
       FROM sales_order_items soi
       JOIN inventory i
         ON i.product_id = soi.product_id
       WHERE soi.sales_order_id = $1
       ORDER BY soi.product_id
       FOR UPDATE`,
      [salesOrderId]
    );

    for (const item of itemsResult.rows) {
      const available =
        item.physical_quantity -
        item.reserved_quantity;

      if (item.quantity > available) {
        throw new Error(
          `Insufficient stock for product ${item.product_id}`
        );
      }
    }

    // Reserve inventory.
    for (const item of itemsResult.rows) {
      await client.query(
        `UPDATE inventory
         SET reserved_quantity =
           reserved_quantity + $1
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    const result = await client.query(
      `UPDATE sales_orders
       SET status = 'CONFIRMED'
       WHERE id = $1
       RETURNING *`,
      [salesOrderId]
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

module.exports = {
  getSalesOrders,
  getSalesOrderById,
  confirmSalesOrder,
};