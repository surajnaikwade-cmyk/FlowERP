const quotationService = require("../services/quotation.service");

const createQuotation = async (req, res) => {
  try {
    const {
      enquiryId,
      validUntil,
      items,
    } = req.body;

    if (!enquiryId || !validUntil) {
      return res.status(400).json({
        message: "Enquiry ID and valid until date are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one quotation item is required",
      });
    }

    const quotation =
      await quotationService.createQuotation({
        enquiryId,
        validUntil,
        items,
        userId: req.user.id,
      });

    res.status(201).json({
      message: "Quotation created successfully",
      quotation,
    });
  } catch (error) {
    console.error(
      "Create quotation error:",
      error.message
    );

    res.status(400).json({
      message: error.message,
    });
  }
};

const getQuotations = async (req, res) => {
  try {
    const quotations =
      await quotationService.getQuotations(req.user.role);

    res.json({
      quotations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch quotations",
    });
  }
};

const updateQuotationStatus = async (req, res) => {
  try {
    const quotation =
      await quotationService.updateQuotationStatus(
        req.params.id,
        req.body.status,
        req.user.role
      );

    if (!quotation) {
      return res.status(404).json({
        message: "Quotation not found",
      });
    }

    res.json({
      message: "Quotation status updated successfully",
      quotation,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const convertQuotationToSalesOrder = async (req, res) => {
  try {
    const salesOrder =
      await quotationService.convertQuotationToSalesOrder(
        req.params.id
      );

    res.status(201).json({
      message: "Sales Order created successfully",
      salesOrder,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  createQuotation,
  getQuotations,
  updateQuotationStatus,
  convertQuotationToSalesOrder,
};