const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const {
  dispatchSalesOrder,
} = require("../controllers/dispatch.controller");

const router = express.Router();

router.post(
  "/sales-orders/:id/dispatch",
  authenticate,
  authorize("ADMIN"),
  dispatchSalesOrder
);

module.exports = router;