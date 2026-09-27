const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const {
  getSalesOrders,
  getSalesOrderById,
  confirmSalesOrder,
} = require("../controllers/salesOrder.controller");

const router = express.Router();

router.get(
  "/",
  authenticate,
  getSalesOrders
);

router.get(
  "/:id",
  authenticate,
  getSalesOrderById
);

router.post(
  "/:id/confirm",
  authenticate,
  authorize("ADMIN"),
  confirmSalesOrder
);

module.exports = router;