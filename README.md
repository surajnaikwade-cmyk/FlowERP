# FlowERP

A small PERN-stack ERP application for a manufacturing and supply workflow:

**Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch**

The application demonstrates a simple business workflow using React, Node.js, Express.js, and PostgreSQL, with JWT authentication, role-based authorization, validation, transactions, and inventory management.

The project intentionally keeps the architecture simple and uses raw PostgreSQL queries so the complete workflow is easy to understand, explain, and modify.

---

## Tech Stack

- React + Vite
- Node.js + Express.js
- PostgreSQL + `pg`
- JWT authentication
- bcryptjs password hashing
- Zod validation where used
- Node.js built-in test runner

---

## User Roles

### SALES_USER

The Sales User can:

- Login
- Create customers and enquiries
- Create quotation drafts
- Send quotations to Admin for approval
- View quotations
- Convert an accepted quotation into a Sales Order
- View Sales Orders
- View available inventory

The Sales User cannot:

- Accept quotations
- Reject quotations
- Confirm Sales Orders
- Reserve inventory directly
- Dispatch orders

### ADMIN

The Admin can:

- Login
- View enquiries
- View quotations received for approval
- Accept or reject sent quotations
- View Sales Orders
- View inventory
- Manage inventory
- Confirm Sales Orders
- Reserve inventory through order confirmation
- Dispatch confirmed Sales Orders

---

## Business Workflow

```text
SALES USER
    |
    v
Customer Enquiry
    |
    v
Draft Quotation
    |
    | Send
    v
SENT
    |
    v
ADMIN
    |
    +---- Accept ----> ACCEPTED
    |
    +---- Reject ----> REJECTED
                         |
                         v
                  If ACCEPTED
                         |
                         v
                  SALES USER
                         |
                         v
                   Sales Order
                         |
                         v
                  ADMIN CONFIRMS
                         |
                         v
              Inventory Reservation
                         |
                         v
                      Dispatch
```

### Quotation Status

```text
DRAFT → SENT → ACCEPTED
             ↘ REJECTED
```

Only Admin can approve or reject a `SENT` quotation.

Only an `ACCEPTED` quotation can be converted into a Sales Order.

---

## Project Structure

```text
backend/
  database/
    schema.sql
    enquiry.sql
    quotation.sql
    sales_order.sql
    dispatch.sql
    seed.sql

  src/
    controllers/
    middleware/
    routes/
    services/
    config/
    utils/

  test/

frontend/
  src/
    pages/
    services/
    context/
```

---

## Database Setup

Create a PostgreSQL database named:

```text
flowerp_db
```

Run the SQL files in this order:

1. `database/schema.sql`
2. `database/enquiry.sql`
3. `database/quotation.sql`
4. `database/sales_order.sql`
5. `database/dispatch.sql`
6. `database/seed.sql`

The seed contains two generic demo users and six industrial products.

All seed data is non-production sample data.

---

## Environment Variables

Create:

```text
backend/.env
```

Add:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/flowerp_db
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=1d
```

> Do not commit `.env` to GitHub.

The repository contains `.env.example` as a template.

---

## Run Backend

Open a terminal:

```bash
cd backend
npm install
```

Start the backend:

```bash
npm start
```

For development:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

---

## Run Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the frontend URL, normally:

```text
http://localhost:5173
```

The frontend communicates with:

```text
http://localhost:5000/api
```

---

## Demo Credentials

### Admin

```text
Email: admin@example.com
Password: DemoAdmin@123
```

### Sales User

```text
Email: sales@example.com
Password: DemoSales@123
```

These credentials are for local demonstration only.

---

## Automated Tests

From the `backend` directory:

```bash
npm test
```

The automated tests cover:

- Quotation total calculation
- Draft/Rejected quotation cannot create Sales Order
- Duplicate Sales Order prevention
- Inventory availability/reservation rules
- Backend role authorization
- Quotation status transitions

---

## Main API Endpoints

### Authentication

```text
POST /api/auth/login
```

### Enquiries

```text
GET  /api/enquiries
POST /api/enquiries
GET  /api/enquiries/:id
```

### Quotations

```text
GET   /api/quotations
POST  /api/quotations
PATCH /api/quotations/:id/status
POST  /api/quotations/:id/convert
```

### Sales Orders

```text
GET  /api/sales-orders
GET  /api/sales-orders/:id
POST /api/sales-orders/:id/confirm
```

### Inventory

```text
GET   /api/inventory
PATCH /api/inventory/:productId
```

### Dispatch

```text
POST /api/dispatch/sales-orders/:id/dispatch
```

---

## Important Business Rules

### Quotation

- Sales User creates a quotation as `DRAFT`.
- Sales User sends the quotation for Admin approval.
- Only Admin can accept or reject a `SENT` quotation.
- A quotation cannot move backward from `ACCEPTED` or `REJECTED`.
- Only an `ACCEPTED` quotation can create a Sales Order.
- One quotation can create only one Sales Order.

### Inventory Reservation

When Admin confirms a Sales Order:

1. A PostgreSQL transaction is started.
2. Required inventory rows are locked using `FOR UPDATE`.
3. Available stock is calculated.
4. The order is rejected if available stock is insufficient.
5. Reserved quantity is increased.
6. Sales Order status changes to `CONFIRMED`.
7. The transaction is committed.

Physical inventory does not decrease during reservation.

```text
Available = Physical Quantity - Reserved Quantity
```

### Dispatch

When a confirmed Sales Order is dispatched:

```text
Physical Quantity decreases
Reserved Quantity decreases
```

The system prevents:

- Dispatch beyond reserved quantity
- Duplicate dispatch
- Dispatch of cancelled orders
- Dispatch of non-confirmed orders

### Authorization

Backend authorization is the source of truth.

Frontend role restrictions are used only for user experience and do not replace backend authorization.

---

## Security

Sensitive configuration should be stored in environment variables.

Do not commit:

```text
.env
node_modules/
dist/
*.log
```

The repository `.gitignore` excludes these files.

---

## Why This Project

FlowERP is intentionally kept small rather than implementing a complete enterprise ERP.

The main objective is to demonstrate understanding of:

- REST APIs
- PostgreSQL relational design
- Authentication
- Backend RBAC
- Business workflows
- Transactions
- Inventory reservation
- Database locking
- Validation
- Error handling
- Automated testing
