const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const enquiryRoutes = require("./routes/enquiry.routes");
const quotationRoutes = require("./routes/quotation.routes");
const salesOrderRoutes = require("./routes/salesOrder.routes");
const dispatchRoutes = require("./routes/dispatch.routes");
const inventoryRoutes = require("./routes/inventory.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "FlowERP API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/inventory", inventoryRoutes);

module.exports = app;