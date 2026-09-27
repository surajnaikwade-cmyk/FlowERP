const dispatchService = require("../services/dispatch.service");

const dispatchSalesOrder = async (req, res) => {
  try {
    const { vehicleNumber, driverName } = req.body;

    if (!vehicleNumber?.trim() || !driverName?.trim()) {
      return res.status(400).json({
        message: "Vehicle number and driver name are required",
      });
    }

    const dispatch =
      await dispatchService.dispatchSalesOrder({
        salesOrderId: req.params.id,
        vehicleNumber,
        driverName,
      });

    res.status(201).json({
      message: "Sales Order dispatched successfully",
      dispatch,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  dispatchSalesOrder,
};