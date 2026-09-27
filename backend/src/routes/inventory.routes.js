const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const {
  getInventory,
  updateInventory,
} = require("../controllers/inventory.controller");

const router = express.Router();

router.get("/", authenticate, getInventory);

router.patch(
  "/:productId",
  authenticate,
  authorize("ADMIN"),
  updateInventory
);

module.exports = router;
