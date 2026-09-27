import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const SalesOrders = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [message, setMessage] = useState("");
  const [dispatchForm, setDispatchForm] = useState({ orderId: null, vehicleNumber: "", driverName: "" });
  const [editingInventory, setEditingInventory] = useState({});

  const loadData = async () => {
    try {
      const [orderData, inventoryData] = await Promise.all([
        api.getSalesOrders(),
        api.getInventory(),
      ]);

      const detailedOrders = await Promise.all(
        orderData.salesOrders.map(async (order) => {
          const detail = await api.getSalesOrder(order.id);
          return detail.salesOrder;
        })
      );

      setOrders(detailedOrders);
      setInventory(inventoryData.inventory);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const confirmOrder = async (id) => {
    try {
      const result = await api.confirmSalesOrder(id);
      setMessage(result.message);
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const dispatchOrder = async (e) => {
    e.preventDefault();
    try {
      const result = await api.dispatchSalesOrder(dispatchForm.orderId, {
        vehicleNumber: dispatchForm.vehicleNumber,
        driverName: dispatchForm.driverName,
      });
      setMessage(result.message);
      setDispatchForm({ orderId: null, vehicleNumber: "", driverName: "" });
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const saveInventory = async (productId) => {
    try {
      const value = editingInventory[productId];
      if (value === undefined || value === "" || !Number.isInteger(Number(value)) || Number(value) < 0) {
        throw new Error("Enter a valid non-negative physical quantity");
      }

      const result = await api.updateInventory(productId, Number(value));
      setMessage(result.message);
      setEditingInventory((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const visibleInventory = isAdmin
    ? inventory
    : inventory.filter((item) => Number(item.available_quantity) > 0);

  return (
    <div>
      <h2>Sales Orders</h2>
      <p>Logged in as: <strong>{user?.role}</strong></p>
      {message && <div className="success">{message}</div>}

      <div className="card">
        <h3>Inventory Availability</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              {isAdmin && <><th>Physical</th><th>Reserved</th></>}
              <th>Available</th>
              {isAdmin && <th>Update Physical Quantity</th>}
            </tr>
          </thead>
          <tbody>
            {visibleInventory.map((item) => (
              <tr key={item.product_id}>
                <td>{item.product_code} - {item.product_name}</td>
                {isAdmin && <>
                  <td>{item.physical_quantity}</td>
                  <td>{item.reserved_quantity}</td>
                </>}
                <td>{item.available_quantity}</td>
                {isAdmin && (
                  <td>
                    <input
                      className="small-input"
                      type="number"
                      min={item.reserved_quantity}
                      placeholder="Enter quantity"
                      value={editingInventory[item.product_id] ?? ""}
                      onChange={(e) => setEditingInventory((current) => ({
                        ...current,
                        [item.product_id]: e.target.value,
                      }))}
                    />
                    <button onClick={() => saveInventory(item.product_id)}>Save</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!isAdmin && visibleInventory.length === 0 && (
          <p>No products currently have available stock.</p>
        )}
      </div>

      <div className="card">
        <h3>Sales Orders</h3>
        <table>
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Products</th><th>Total</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.order_number}</td>
                <td>{order.company_name}</td>
                <td>
                  {order.items?.map((item) => (
                    <div key={item.id}>
                      {item.product_name} × {item.quantity}
                      {" "}({item.available_quantity} available)
                    </div>
                  ))}
                </td>
                <td>₹{order.total_amount}</td>
                <td>{order.status}</td>
                <td>
                  {isAdmin && order.status === "PENDING" && (
                    <button onClick={() => confirmOrder(order.id)}>Confirm</button>
                  )}

                  {isAdmin && order.status === "CONFIRMED" && (
                    <button onClick={() => setDispatchForm({ orderId: order.id, vehicleNumber: "", driverName: "" })}>
                      Dispatch
                    </button>
                  )}

                  {dispatchForm.orderId === order.id && (
                    <form onSubmit={dispatchOrder} className="dispatch-form">
                      <input required placeholder="Enter vehicle number" value={dispatchForm.vehicleNumber}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNumber: e.target.value })} />
                      <input required placeholder="Enter driver name" value={dispatchForm.driverName}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })} />
                      <button type="submit">Dispatch</button>
                      <button type="button" onClick={() => setDispatchForm({ orderId: null, vehicleNumber: "", driverName: "" })}>Cancel</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesOrders;
