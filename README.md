# FlowERP

A small PERN-stack ERP application for a manufacturing/supply workflow:

**Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch**

## Tech Stack

- React + Vite
- Node.js + Express.js
- PostgreSQL + `pg`
- JWT authentication
- bcryptjs password hashing
- Zod validation where used
- Node's built-in test runner for automated business-rule tests

The project intentionally keeps the architecture simple and uses raw PostgreSQL queries so the workflow is easy to understand and explain.

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

## Database Setup

Create a PostgreSQL database named `flowerp_db`.

Run the SQL files in this order:

1. `database/schema.sql`
2. `database/enquiry.sql`
3. `database/quotation.sql`
4. `database/sales_order.sql`
5. `database/dispatch.sql`
6. `database/seed.sql`

The seed contains two generic demo users and six industrial products. All demo data is non-production sample data.

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/flowerp_db
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=1d
```

## Run Backend

```bash
cd backend
npm install
npm start
```

Development:

```bash
npm run dev
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend uses `http://localhost:5000/api` by default.

## Test Credentials

- Admin: `admin@example.com`
- Sales User: `sales@example.com`

Admin password: `DemoAdmin@123`  
Sales User password: `DemoSales@123`

## Automated Tests

From `backend/`:

```bash
npm test
```

The tests cover quotation calculation, quotation-to-order rules, duplicate-order prevention, inventory availability/reservation rules, backend role authorization, and quotation status transitions.

## Main API Endpoints

```text
POST   /api/auth/login

GET    /api/enquiries
POST   /api/enquiries
GET    /api/enquiries/:id

GET    /api/quotations
POST   /api/quotations
PATCH  /api/quotations/:id/status
POST   /api/quotations/:id/convert

GET    /api/sales-orders
GET    /api/sales-orders/:id
POST   /api/sales-orders/:id/confirm

GET    /api/inventory
PATCH  /api/inventory/:productId

POST   /api/dispatch/sales-orders/:id/dispatch
```

## Business Rules

- `SALES_USER` creates a quotation as `DRAFT` and sends it for approval.
- Only `ADMIN` can accept or reject a `SENT` quotation.
- `SALES_USER` can convert a quotation to a Sales Order only after it is `ACCEPTED`.
- Only `ADMIN` can confirm/reserve stock and dispatch orders.
- Quotation status follows `DRAFT → SENT → ACCEPTED/REJECTED`, with approval performed by ADMIN.
- Only an `ACCEPTED` quotation can create one Sales Order.
- Confirmation uses a PostgreSQL transaction and `FOR UPDATE` row locking.
- Reservation increases `reserved_quantity` only; physical stock does not decrease.
- Dispatch decreases both physical and reserved quantities.
- Inventory availability is `physical_quantity - reserved_quantity`.
- Backend authorization is the source of truth; frontend restrictions are only for user experience.
