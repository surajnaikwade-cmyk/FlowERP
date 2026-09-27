const inventoryService = require("../services/inventory.service");

const getInventory = async (req, res) => {
  try {
    const inventory = await inventoryService.getInventory();
    res.json({ inventory });
  } catch (error) {
    console.error("Get inventory error:", error.message);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
};

const updateInventory = async (req, res) => {
  try {
    const inventory = await inventoryService.updateInventory(
      req.params.productId,
      req.body.physicalQuantity
    );

    res.json({
      message: "Inventory updated successfully",
      inventory,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getInventory,
  updateInventory,
};
