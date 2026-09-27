import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Enquiries from "./pages/Enquiries.jsx";
import Quotations from "./pages/Quotations.jsx";
import SalesOrders from "./pages/SalesOrders.jsx";
import "./App.css";

function App() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState(user?.role === "ADMIN" ? "dashboard" : "enquiries");

  if (!user) {
    return <Login onLogin={(loggedInUser) => setPage(loggedInUser?.role === "ADMIN" ? "dashboard" : "enquiries")} />;
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="app">
      <header className="navbar">
        <div>
          <h1>FlowERP</h1>
          <small>{user.name} · {user.role}</small>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <nav className="nav-menu">
        {isAdmin && (
          <button onClick={() => setPage("dashboard")}>Dashboard</button>
        )}

        <button onClick={() => setPage("enquiries")}>Enquiries</button>
        <button onClick={() => setPage("quotations")}>Quotations</button>
        <button onClick={() => setPage("sales-orders")}>Sales Orders</button>
      </nav>

      <main className="content">
        {page === "dashboard" && isAdmin && <Dashboard />}
        {page === "enquiries" && <Enquiries canCreate={!isAdmin} />}
        {page === "quotations" && <Quotations />}
        {page === "sales-orders" && <SalesOrders />}
      </main>
    </div>
  );
}

export default App;
