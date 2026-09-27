import { useEffect, useState } from "react";
import { api } from "../services/api";

const Dashboard = () => {
  const [summary, setSummary] = useState({
    enquiries: 0,
    quotations: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    products: 0,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [enquiryData, quotationData, orderData, inventoryData] =
          await Promise.all([
            api.getEnquiries(),
            api.getQuotations(),
            api.getSalesOrders(),
            api.getInventory(),
          ]);

        setSummary({
          enquiries: enquiryData.enquiries.length,
          quotations: quotationData.quotations.length,
          pendingOrders: orderData.salesOrders.filter(
            (order) => order.status === "PENDING"
          ).length,
          confirmedOrders: orderData.salesOrders.filter(
            (order) => order.status === "CONFIRMED"
          ).length,
          products: inventoryData.inventory.length,
        });
      } catch (error) {
        setMessage(error.message);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Basic overview of the current ERP workflow.</p>

      {message && <div className="error">{message}</div>}

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <h3>Total Enquiries</h3>
          <strong>{summary.enquiries}</strong>
        </div>
        <div className="card dashboard-card">
          <h3>Total Quotations</h3>
          <strong>{summary.quotations}</strong>
        </div>
        <div className="card dashboard-card">
          <h3>Pending Orders</h3>
          <strong>{summary.pendingOrders}</strong>
        </div>
        <div className="card dashboard-card">
          <h3>Confirmed Orders</h3>
          <strong>{summary.confirmedOrders}</strong>
        </div>
        <div className="card dashboard-card">
          <h3>Products</h3>
          <strong>{summary.products}</strong>
        </div>
      </div>

      <div className="card">
        <h3>Admin Responsibilities</h3>
        <p>Review quotations, confirm Sales Orders, manage inventory, and process dispatches.</p>
      </div>
    </div>
  );
};

export default Dashboard;
