const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
} = require("../controllers/enquiry.controller");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("SALES_USER"),
  createEnquiry
);

router.get(
  "/",
  authenticate,
  getEnquiries
);

router.get(
  "/:id",
  authenticate,
  getEnquiryById
);

module.exports = router;