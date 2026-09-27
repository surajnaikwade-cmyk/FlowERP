import { useEffect, useState } from "react";
import { api } from "../services/api";

const emptyItem = () => ({ productId: "", quantity: 1 });

const Enquiries = ({ canCreate = true }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    mobile: "",
    email: "",
    city: "",
    requiredDate: "",
    notes: "",
  });
  const [items, setItems] = useState([emptyItem()]);

  const loadData = async () => {
    try {
      const [enquiryData, inventoryData] = await Promise.all([
        api.getEnquiries(),
        api.getInventory(),
      ]);
      setEnquiries(enquiryData.enquiries);
      setProducts(inventoryData.inventory);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateItem = (index, field, value) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addItem = () => setItems((current) => [...current, emptyItem()]);

  const removeItem = (index) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const createEnquiry = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (items.some((item) => !item.productId || Number(item.quantity) <= 0)) {
        throw new Error("Select a product and enter a positive quantity for every item");
      }

      await api.createEnquiry({
        customer: form,
        requiredDate: form.requiredDate,
        notes: form.notes,
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })),
      });

      setMessage("Enquiry created successfully");
      setForm({ companyName: "", contactPerson: "", mobile: "", email: "", city: "", requiredDate: "", notes: "" });
      setItems([emptyItem()]);
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h2>Enquiries</h2>

      {canCreate && (
        <form onSubmit={createEnquiry} className="card">
          <h3>Create Enquiry</h3>

          <div className="grid">
            <input required placeholder="Company Name" value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            <input required placeholder="Contact Person" value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            <input required placeholder="Mobile Number" value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            <input type="email" placeholder="Customer Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required placeholder="City" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <div>
              <label htmlFor="required-date">Required Date (date you need the products)</label>
              <input id="required-date" type="date" value={form.requiredDate}
                onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} />
            </div>
          </div>

          <h4>Products</h4>
          {items.map((item, index) => (
            <div className="item-row" key={index}>
              <select
                value={item.productId}
                onChange={(e) => updateItem(index, "productId", e.target.value)}
                required
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.product_code} - {product.product_name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                required
              />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(index)}>Remove</button>
              )}
            </div>
          ))}

          <button type="button" onClick={addItem}>+ Add Item</button>

          <textarea
            placeholder="Notes or additional requirements"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button type="submit">Create Enquiry</button>
          {message && <p>{message}</p>}
        </form>
      )}

      <div className="card">
        <h3>{canCreate ? "Existing Enquiries" : "Enquiries Received"}</h3>
        <table>
          <thead>
            <tr>
              <th>Number</th>
              <th>Customer</th>
              <th>Enquiry Date</th>
              <th>Required Date (Products Needed By)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((item) => (
              <tr key={item.id}>
                <td>{item.enquiry_number}</td>
                <td>{item.company_name}</td>
                <td>{item.enquiry_date}</td>
                <td>{item.required_date || "Not specified"}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Enquiries;
