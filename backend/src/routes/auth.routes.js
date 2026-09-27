const express = require("express");
const { login } = require("../controllers/auth.controller");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

router.post("/login", login);

router.get("/profile", authenticate, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

router.get(
  "/admin-test",
  authenticate,
  authorize("ADMIN"),
  (req, res) => {
    res.json({
      message: "Admin-only route accessed successfully",
      user: req.user,
    });
  }
);

module.exports = router;