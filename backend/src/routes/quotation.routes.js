const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const {
  createQuotation,
  getQuotations,
  updateQuotationStatus,
  convertQuotationToSalesOrder,
} = require("../controllers/quotation.controller");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("SALES_USER"),
  createQuotation
);

router.get(
  "/",
  authenticate,
  getQuotations
);

router.patch(
  "/:id/status",
  authenticate,
  updateQuotationStatus
);

router.post(
  "/:id/convert",
  authenticate,
  authorize("SALES_USER"),
  convertQuotationToSalesOrder
);

module.exports = router;