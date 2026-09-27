const pool = require("../config/db");

const createEnquiry = async ({
  customer,
  requiredDate,
  notes,
  items,
  userId,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create customer
    const customerResult = await client.query(
      `INSERT INTO customers
       (company_name, contact_person, mobile, email, city)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, company_name, contact_person, mobile, email, city`,
      [
        customer.companyName,
        customer.contactPerson,
        customer.mobile,
        customer.email || null,
        customer.city,
      ]
    );

    const customerRecord = customerResult.rows[0];

    // Generate enquiry number
    const enquiryNumber = `ENQ-${Date.now()}`;

    const enquiryResult = await client.query(
      `INSERT INTO enquiries
       (enquiry_number, customer_id, required_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        enquiryNumber,
        customerRecord.id,
        requiredDate || null,
        notes || null,
        userId,
      ]
    );

    const enquiry = enquiryResult.rows[0];

    // Insert enquiry items
    for (const item of items) {
      const productResult = await client.query(
        `SELECT id FROM products WHERE id = $1`,
        [item.productId]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.productId} not found`);
      }

      await client.query(
        `INSERT INTO enquiry_items
         (enquiry_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [enquiry.id, item.productId, item.quantity]
      );
    }

    await client.query("COMMIT");

    return {
      ...enquiry,
      customer: customerRecord,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getEnquiries = async () => {
  const result = await pool.query(`
    SELECT
      e.id,
      e.enquiry_number,
      e.enquiry_date,
      e.required_date,
      e.notes,
      e.status,
      c.company_name,
      c.contact_person
    FROM enquiries e
    JOIN customers c ON c.id = e.customer_id
    ORDER BY e.id DESC
  `);

  return result.rows;
};

const getEnquiryById = async (id) => {
  const enquiryResult = await pool.query(
    `
    SELECT
      e.*,
      c.company_name,
      c.contact_person,
      c.mobile,
      c.email,
      c.city
    FROM enquiries e
    JOIN customers c ON c.id = e.customer_id
    WHERE e.id = $1
    `,
    [id]
  );

  if (enquiryResult.rows.length === 0) {
    return null;
  }

  const itemsResult = await pool.query(
    `
    SELECT
      ei.id,
      ei.product_id,
      p.product_code,
      p.product_name,
      ei.quantity
    FROM enquiry_items ei
    JOIN products p ON p.id = ei.product_id
    WHERE ei.enquiry_id = $1
    ORDER BY ei.id
    `,
    [id]
  );

  return {
    ...enquiryResult.rows[0],
    items: itemsResult.rows,
  };
};

module.exports = {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
};