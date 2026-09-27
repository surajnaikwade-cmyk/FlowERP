const enquiryService = require("../services/enquiry.service");

const createEnquiry = async (req, res) => {
  try {
    const { customer, requiredDate, notes, items } = req.body;

    if (
      !customer ||
      !customer.companyName ||
      !customer.contactPerson ||
      !customer.mobile ||
      !customer.city
    ) {
      return res.status(400).json({
        message: "Customer details are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one product is required",
      });
    }

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({
          message: "Quantity must be greater than 0",
        });
      }
    }

    const enquiry = await enquiryService.createEnquiry({
      customer,
      requiredDate,
      notes,
      items,
      userId: req.user.id,
    });

    res.status(201).json({
      message: "Enquiry created successfully",
      enquiry,
    });
  } catch (error) {
    console.error("Create enquiry error:", error.message);

    res.status(500).json({
      message: error.message,
    });
  }
};

const getEnquiries = async (req, res) => {
  try {
    const enquiries = await enquiryService.getEnquiries();

    res.json({
      enquiries,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch enquiries",
    });
  }
};

const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await enquiryService.getEnquiryById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found",
      });
    }

    res.json({
      enquiry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch enquiry",
    });
  }
};

module.exports = {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
};