const pool = require("../config/db");

const dispatchSalesOrder = async ({
  salesOrderId,
  vehicleNumber,
  driverName,
}) => {
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

    if (order.status !== "CONFIRMED") {
      throw new Error(
        "Only a CONFIRMED Sales Order can be dispatched"
      );
    }

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

    if (itemsResult.rows.length === 0) {
      throw new Error("Sales Order has no items");
    }

    for (const item of itemsResult.rows) {
      if (item.quantity > item.reserved_quantity) {
        throw new Error(
          `Dispatch quantity exceeds reserved quantity for product ${item.product_id}`
        );
      }
    }

    const dispatchNumber = `DSP-${Date.now()}`;

    const dispatchResult = await client.query(
      `INSERT INTO dispatches
       (dispatch_number, sales_order_id, vehicle_number, driver_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        dispatchNumber,
        salesOrderId,
        vehicleNumber,
        driverName,
      ]
    );

    const dispatch = dispatchResult.rows[0];

    for (const item of itemsResult.rows) {
      await client.query(
        `INSERT INTO dispatch_items
         (dispatch_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [
          dispatch.id,
          item.product_id,
          item.quantity,
        ]
      );

      await client.query(
        `UPDATE inventory
         SET
           physical_quantity = physical_quantity - $1,
           reserved_quantity = reserved_quantity - $1
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query(
      `UPDATE sales_orders
       SET status = 'DISPATCHED'
       WHERE id = $1`,
      [salesOrderId]
    );

    await client.query("COMMIT");

    return dispatch;
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      throw new Error(
        "This Sales Order has already been dispatched"
      );
    }

    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  dispatchSalesOrder,
};