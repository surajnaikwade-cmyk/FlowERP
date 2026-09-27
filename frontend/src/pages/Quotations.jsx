import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Quotations = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState("");
  const [enquiryDetails, setEnquiryDetails] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [validUntil, setValidUntil] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const quotationData = await api.getQuotations();
      const visibleQuotations = isAdmin
        ? quotationData.quotations.filter((item) =>
            ["SENT", "ACCEPTED", "REJECTED"].includes(item.status)
          )
        : quotationData.quotations;
      setQuotations(visibleQuotations);

      if (!isAdmin) {
        const enquiryData = await api.getEnquiries();
        setEnquiries(enquiryData.enquiries.filter((item) => item.status === "NEW"));
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const selectEnquiry = async (id) => {
    setSelectedEnquiry(id);
    if (!id) {
      setEnquiryDetails(null);
      setQuoteItems([]);
      return;
    }

    try {
      const data = await api.getEnquiry(id);
      setEnquiryDetails(data.enquiry);
      setQuoteItems(
        data.enquiry.items.map((item) => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: "",
          discountPercent: "",
          gstPercent: "",
        }))
      );
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateItem = (index, field, value) => {
    setQuoteItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const createQuotation = async (e) => {
    e.preventDefault();
    try {
      if (!selectedEnquiry || quoteItems.length === 0) {
        throw new Error("Select a NEW enquiry first");
      }

      await api.createQuotation({
        enquiryId: Number(selectedEnquiry),
        validUntil,
        items: quoteItems.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          ...(item.unitPrice !== "" ? { unitPrice: Number(item.unitPrice) } : {}),
          discountPercent: item.discountPercent === "" ? 0 : Number(item.discountPercent),
          gstPercent: item.gstPercent === "" ? 0 : Number(item.gstPercent),
        })),
      });

      setMessage("Quotation created as DRAFT");
      setSelectedEnquiry("");
      setEnquiryDetails(null);
      setQuoteItems([]);
      setValidUntil("");
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.updateQuotationStatus(id, status);
      setMessage(`Quotation ${status.toLowerCase()} successfully`);
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const convertQuotation = async (id) => {
    try {
      const result = await api.convertQuotation(id);
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h2>Quotations</h2>

      {!isAdmin && (
        <form onSubmit={createQuotation} className="card">
          <h3>Create Quotation</h3>

          <label htmlFor="quotation-enquiry">Select Enquiry</label>
          <select
            id="quotation-enquiry"
            value={selectedEnquiry}
            onChange={(e) => selectEnquiry(e.target.value)}
            required
          >
            <option value="">Select a NEW enquiry</option>
            {enquiries.map((enquiry) => (
              <option key={enquiry.id} value={enquiry.id}>
                {enquiry.enquiry_number} - {enquiry.company_name}
              </option>
            ))}
          </select>

          {enquiryDetails && (
            <>
              <p><strong>Customer:</strong> {enquiryDetails.company_name}</p>
              <p><strong>Required date:</strong> {enquiryDetails.required_date || "Not specified"}</p>

              {quoteItems.map((item, index) => (
                <div className="quotation-item" key={item.productId}>
                  <strong>{item.productName}</strong>
                  <span>Quantity: {item.quantity}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter unit price (optional)"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Enter discount %"
                    value={item.discountPercent}
                    onChange={(e) => updateItem(index, "discountPercent", e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Enter GST %"
                    value={item.gstPercent}
                    onChange={(e) => updateItem(index, "gstPercent", e.target.value)}
                  />
                </div>
              ))}

              <label htmlFor="valid-until">Valid Until</label>
              <input
                id="valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />

              <button type="submit">Create Draft Quotation</button>
            </>
          )}

          {message && <p>{message}</p>}
        </form>
      )}

      <div className="card">
        <h3>{isAdmin ? "Quotations Received for Approval" : "My Quotations"}</h3>
        <table>
          <thead>
            <tr>
              <th>Quotation</th>
              <th>Customer</th>
              <th>Valid Until</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((q) => (
              <tr key={q.id}>
                <td>{q.quotation_number}</td>
                <td>{q.company_name}</td>
                <td>{q.valid_until}</td>
                <td>₹{q.grand_total}</td>
                <td>{q.status}</td>
                <td>
                  {isAdmin && q.status === "SENT" && (
                    <>
                      <button onClick={() => updateStatus(q.id, "ACCEPTED")}>Accept</button>
                      <button onClick={() => updateStatus(q.id, "REJECTED")}>Reject</button>
                    </>
                  )}
                  {!isAdmin && q.status === "DRAFT" && (
                    <button onClick={() => updateStatus(q.id, "SENT")}>Send</button>
                  )}
                  {!isAdmin && q.status === "ACCEPTED" && (
                    <button onClick={() => convertQuotation(q.id)}>Create Order</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {message && isAdmin && <p>{message}</p>}
      </div>
    </div>
  );
};

export default Quotations;
