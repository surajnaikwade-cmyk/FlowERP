const pool = require("../config/db");

const calculateAvailable = (physicalQuantity, reservedQuantity) =>
  Number(physicalQuantity) - Number(reservedQuantity);

const canReserve = (physicalQuantity, reservedQuantity, requestedQuantity) =>
  Number.isInteger(Number(requestedQuantity)) &&
  Number(requestedQuantity) > 0 &&
  calculateAvailable(physicalQuantity, reservedQuantity) >= Number(requestedQuantity);

const getInventory = async () => {
  const result = await pool.query(`
    SELECT
      i.id,
      i.product_id,
      p.product_code,
      p.product_name,
      p.category,
      p.unit,
      p.base_price,
      i.physical_quantity,
      i.reserved_quantity,
      (i.physical_quantity - i.reserved_quantity) AS available_quantity
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    ORDER BY p.id
  `);
  return result.rows;
};

const updateInventory = async (productId, physicalQuantity) => {
  const quantity = Number(physicalQuantity);

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Physical quantity must be a non-negative integer");
  }

  const result = await pool.query(
    `UPDATE inventory
     SET physical_quantity = $1
     WHERE product_id = $2
       AND $1 >= reserved_quantity
     RETURNING
       id,
       product_id,
       physical_quantity,
       reserved_quantity,
       (physical_quantity - reserved_quantity) AS available_quantity`,
    [quantity, productId]
  );

  if (result.rows.length === 0) {
    const existing = await pool.query(
      `SELECT reserved_quantity FROM inventory WHERE product_id = $1`,
      [productId]
    );

    if (existing.rows.length === 0) {
      throw new Error("Inventory record not found");
    }

    if (quantity < Number(existing.rows[0].reserved_quantity)) {
      throw new Error(
        "Physical quantity cannot be less than reserved quantity"
      );
    }

    throw new Error("Inventory could not be updated");
  }

  return result.rows[0];
};

module.exports = {
  calculateAvailable,
  canReserve,
  getInventory,
  updateInventory,
};
