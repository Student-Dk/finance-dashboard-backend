# Finance Dashboard Backend API

A backend system for a finance dashboard with Role-Based Access Control (RBAC), built with **Node.js**, **Express**, and **MongoDB**.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express | Server and routing |
| MongoDB + Mongoose | Database and ODM |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |
| express-validator | Input validation |
| express-rate-limit | Rate limiting |

---

## Project Structure

```
finance-dashboard-backend/
├── src/
│   ├── app.js                        <- Entry point, Express setup
│   ├── models/
│   │   ├── user.model.js             <- User schema + password hashing
│   │   └── record.model.js           <- Financial record schema + soft delete
│   ├── controllers/
│   │   ├── auth.controller.js        <- Register, Login, GetMe
│   │   ├── user.controller.js        <- User management (Admin only)
│   │   ├── record.controller.js      <- Financial records CRUD
│   │   └── dashboard.controller.js   <- Analytics and summary APIs
│   ├── routes/
│   │   ├── auth.routes.js            <- /api/auth/*
│   │   ├── user.routes.js            <- /api/users/*
│   │   ├── record.routes.js          <- /api/records/*
│   │   └── dashboard.routes.js       <- /api/dashboard/*
│   └── middleware/
│       ├── auth.middleware.js        <- JWT verify + role check
│       ├── validate.middleware.js    <- Input validation rules
│       └── rateLimit.middleware.js   <- Rate limiting
├── scripts/
│   └── createAdmin.js                <- Emergency admin creation script
├── .env.example                      <- Environment variables template
├── .gitignore
├── package.json
└── README.md
```

---

## Setup Instructions

### 1. Clone and install

```bash
git clone <your-repo-url>
cd finance-dashboard-backend
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_db
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
ADMIN_SECRET_KEY=your_admin_secret_here
```

### 3. Start the server

```bash
npm run dev    # Development (auto-restart)
npm start      # Production
```

Server runs at `http://localhost:5000`

---

## How to Create the First Admin

This project uses a "chicken-and-egg" approach — you need an admin to assign roles, but register only creates viewers. Three solutions are implemented:

**Option 1 — First user (recommended for fresh setup):**
The very first user to register automatically becomes an admin. Just call `/api/auth/register` normally.

**Option 2 — Admin secret key:**
Set `ADMIN_SECRET_KEY` in `.env`. Then pass it in the register body:
```json
{ "name": "...", "email": "...", "password": "...", "adminKey": "your_secret" }
```

**Option 3 — Script (emergency):**
```bash
npm run create-admin
```

---

## Roles and Permissions

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| View records | Yes | Yes | Yes |
| View dashboard | Yes | Yes | Yes |
| View own profile | Yes | Yes | Yes |
| Create records | No | Yes | Yes |
| Update records | No | Yes | Yes |
| Delete records | No | No | Yes |
| View all users | No | No | Yes |
| Change user roles | No | No | Yes |
| Activate/deactivate users | No | No | Yes |
| Delete users | No | No | Yes |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create new account |
| POST | `/api/auth/login` | None | Login and get token |
| GET | `/api/auth/me` | Bearer | Get own profile |

**Register**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "adminKey": "optional_for_admin"
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "secret123"
}
```

Response includes a `token` — use this as `Authorization: Bearer <token>` in all protected requests.

---

### User Management (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get single user |
| PATCH | `/api/users/:id/role` | Update role |
| PATCH | `/api/users/:id/status` | Toggle active/inactive |
| DELETE | `/api/users/:id` | Delete user |

**Update role:**
```json
PATCH /api/users/:id/role
{ "role": "analyst" }
```

---

### Financial Records

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/api/records` | Any role | List with filters + search |
| POST | `/api/records` | Analyst, Admin | Create record |
| GET | `/api/records/:id` | Any role | Single record |
| PUT | `/api/records/:id` | Analyst, Admin | Update record |
| DELETE | `/api/records/:id` | Admin only | Soft delete |

**Create record:**
```json
POST /api/records
{
  "amount": 50000,
  "type": "income",
  "category": "salary",
  "date": "2024-03-01",
  "notes": "March salary"
}
```

**Available categories:** `salary`, `freelance`, `investment`, `food`, `rent`, `transport`, `shopping`, `health`, `education`, `entertainment`, `other`

**Filtering (query params):**
```
GET /api/records?type=income
GET /api/records?category=food
GET /api/records?startDate=2024-01-01&endDate=2024-12-31
GET /api/records?page=1&limit=10
GET /api/records?search=grocery     # searches within notes field
```

---

### Dashboard Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Total income, expense, net balance |
| GET | `/api/dashboard/by-category` | Category-wise breakdown |
| GET | `/api/dashboard/monthly-trends` | Month-wise chart data |
| GET | `/api/dashboard/recent` | Latest activity feed |

**Summary response:**
```json
{
  "totalIncome": 60000,
  "totalExpense": 35000,
  "netBalance": 25000,
  "incomeCount": 6,
  "expenseCount": 14,
  "totalRecords": 20
}
```

**Monthly trends:** `GET /api/dashboard/monthly-trends?year=2024`

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Description of what went wrong",
  "errors": [
    { "field": "email", "message": "Please provide a valid email" }
  ]
}
```

| Status Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation error / bad input |
| 401 | Not authenticated (no token / invalid token) |
| 403 | Forbidden (wrong role / inactive account) |
| 404 | Resource not found |
| 409 | Conflict (email already exists) |
| 500 | Internal server error |

---

## Design Decisions and Assumptions

1. **Role assignment on register is blocked** — anyone could become admin if role was accepted from request body. Instead, first user auto-becomes admin, or a secret key must be provided.

2. **Soft delete on records** — records are never permanently removed. `isDeleted: true` hides them from all queries via a pre-find hook. This allows data recovery if needed.

3. **Password field uses `select: false`** — password hash never appears in API responses unless explicitly requested with `.select("+password")`.

4. **JWT-based stateless auth** — no session storage needed. Each request carries its own token.

5. **MongoDB Aggregation Pipeline for dashboard** — more efficient than fetching all records and computing in JavaScript. The database does the heavy lifting.

6. **Admin cannot modify their own role or status** — prevents accidental self-lockout.

7. **Categories are fixed enum** — prevents junk data. `other` category available for uncategorized entries.

8. **Pagination default is 10, max is 100** — protects server from returning huge payloads.

---

## Known Limitations and Future Improvements

1. **Separate update validation rules** — currently create and update use the same validation rules. Ideally, update rules should have all fields marked as optional so partial updates work without re-sending unchanged fields.

2. **Profile update endpoint** — users currently cannot update their own name or email. A `PATCH /api/auth/profile` endpoint can be added in future.

3. **Unit and integration tests** — no automated tests are included. Jest and Supertest can be added as a future improvement.

---

## Quick Test with cURL

```bash
# Register first user (auto admin)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'

# Create a record (replace TOKEN)
curl -X POST http://localhost:5000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"amount":50000,"type":"income","category":"salary"}'

# Dashboard summary
curl http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer TOKEN"
```
