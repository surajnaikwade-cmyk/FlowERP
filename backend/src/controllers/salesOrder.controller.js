const salesOrderService = require("../services/salesOrder.service");

const getSalesOrders = async (req, res) => {
  try {
    const salesOrders =
      await salesOrderService.getSalesOrders();

    res.json({
      salesOrders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch sales orders",
    });
  }
};

const getSalesOrderById = async (req, res) => {
  try {
    const salesOrder =
      await salesOrderService.getSalesOrderById(
        req.params.id
      );

    if (!salesOrder) {
      return res.status(404).json({
        message: "Sales Order not found",
      });
    }

    res.json({
      salesOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch Sales Order",
    });
  }
};

const confirmSalesOrder = async (req, res) => {
  try {
    const salesOrder =
      await salesOrderService.confirmSalesOrder(
        req.params.id
      );

    res.json({
      message: "Sales Order confirmed and inventory reserved",
      salesOrder,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  getSalesOrders,
  getSalesOrderById,
  confirmSalesOrder,
};