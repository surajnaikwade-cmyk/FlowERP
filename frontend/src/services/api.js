const API_URL = "http://localhost:5000/api";

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export const api = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getEnquiries: () =>
    request("/enquiries"),

  createEnquiry: (data) =>
    request("/enquiries", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getQuotations: () =>
    request("/quotations"),

  createQuotation: (data) =>
    request("/quotations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateQuotationStatus: (id, status) =>
    request(`/quotations/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  convertQuotation: (id) =>
    request(`/quotations/${id}/convert`, {
      method: "POST",
    }),

  getSalesOrders: () =>
    request("/sales-orders"),

  getSalesOrder: (id) =>
    request(`/sales-orders/${id}`),

  confirmSalesOrder: (id) =>
    request(`/sales-orders/${id}/confirm`, {
      method: "POST",
    }),

  getEnquiry: (id) =>
    request(`/enquiries/${id}`),

  getInventory: () =>
    request("/inventory"),

  updateInventory: (productId, physicalQuantity) =>
    request(`/inventory/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ physicalQuantity }),
    }),

  dispatchSalesOrder: (id, data) =>
    request(`/dispatch/sales-orders/${id}/dispatch`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};