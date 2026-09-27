const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateLineAmount,
  isValidQuotationTransition,
  canConvertQuotation,
  canCreateSalesOrder,
  canUpdateQuotationStatus,
} = require("../src/services/quotation.service");
const {
  calculateAvailable,
  canReserve,
} = require("../src/services/inventory.service");
const { hasRole } = require("../src/middleware/role.middleware");

test("quotation total is calculated correctly", () => {
  // 10 × 100 = 1000; 10% discount = 900; 18% GST = 1062.
  assert.equal(calculateLineAmount(10, 100, 10, 18), 1062);
});

test("draft and rejected quotations cannot create sales orders", () => {
  assert.equal(canConvertQuotation("DRAFT"), false);
  assert.equal(canConvertQuotation("REJECTED"), false);
  assert.equal(canCreateSalesOrder("DRAFT"), false);
  assert.equal(canCreateSalesOrder("REJECTED"), false);
  assert.equal(canCreateSalesOrder("ACCEPTED"), true);
});

test("same quotation cannot generate a duplicate sales order", () => {
  assert.equal(canCreateSalesOrder("ACCEPTED", null), true);
  assert.equal(
    canCreateSalesOrder("ACCEPTED", { id: 1, order_number: "SO-1" }),
    false
  );
});

test("cannot reserve more than available inventory", () => {
  assert.equal(calculateAvailable(100, 30), 70);
  assert.equal(canReserve(100, 30, 60), true);
  assert.equal(canReserve(100, 30, 80), false);
});

test("quotation approval is restricted to ADMIN", () => {
  assert.equal(hasRole({ role: "SALES_USER" }, ["ADMIN"]), false);
  assert.equal(hasRole({ role: "ADMIN" }, ["ADMIN"]), true);
});

test("quotation status transitions follow the required workflow", () => {
  assert.equal(isValidQuotationTransition("DRAFT", "SENT"), true);
  assert.equal(isValidQuotationTransition("SENT", "ACCEPTED"), true);
  assert.equal(isValidQuotationTransition("SENT", "REJECTED"), true);
  assert.equal(isValidQuotationTransition("DRAFT", "ACCEPTED"), false);
  assert.equal(isValidQuotationTransition("ACCEPTED", "REJECTED"), false);
});


test("quotation status update permissions follow the approval flow", () => {
  assert.equal(canUpdateQuotationStatus("SALES_USER", "DRAFT", "SENT"), true);
  assert.equal(canUpdateQuotationStatus("SALES_USER", "SENT", "ACCEPTED"), false);
  assert.equal(canUpdateQuotationStatus("SALES_USER", "SENT", "REJECTED"), false);
  assert.equal(canUpdateQuotationStatus("ADMIN", "SENT", "ACCEPTED"), true);
  assert.equal(canUpdateQuotationStatus("ADMIN", "SENT", "REJECTED"), true);
  assert.equal(canUpdateQuotationStatus("ADMIN", "DRAFT", "SENT"), false);
});
