# Le Society - Dating Platform

## 🚨 **IMPORTANT: READ THIS FIRST!** 🚨

**Before doing ANYTHING, read this file:**

👉 **[START_HERE_FIRST.md](START_HERE_FIRST.md)** 👈

This file contains critical setup steps that prevent hours of debugging.

**TL;DR:** You MUST add `JWT_SECRET_TOKEN` to the backend `.env` or login will fail with "Something went wrong".

---

## Quick Links

- **[START_HERE_FIRST.md](START_HERE_FIRST.md)** - Mandatory quick-start guide (30 seconds)
- **[CRITICAL_FIX_README.md](CRITICAL_FIX_README.md)** - JWT issue deep dive
- **[APPLICATION_ARCHITECTURE.md](APPLICATION_ARCHITECTURE.md)** - Complete documentation (2000+ lines)

---

## Application Overview

**Le Society** is a premium dating platform with:
- User-facing Next.js app
- React admin panel
- Node.js Express API backend
- MongoDB database
- Real-time chat (Socket.IO)
- Token-based economy

---

## Directory Structure

```
v2/
├── START_HERE_FIRST.md              ← READ THIS FIRST!
├── CRITICAL_FIX_README.md           ← JWT fix documentation
├── APPLICATION_ARCHITECTURE.md      ← Complete app docs
│
├── check-user.js                    ← Test database connection
├── restore-db.js                    ← Restore from BSON backups
│
├── database/lesociety/              ← MongoDB backups (BSON)
├── assetsnew/                       ← UI design mockups
│
└── lesociety/latest/home/node/
    ├── secret-time-next-api/        ← Backend API (Port 3001)
    └── secret-time-next/            ← Frontend Next.js (Port 3000)
```

---

## Quick Start (30 Seconds)

```bash
# 1. Add JWT_SECRET_TOKEN (CRITICAL!)
echo "JWT_SECRET_TOKEN=your-secret-key-change-this-in-production" >> v2/lesociety/latest/home/node/secret-time-next-api/.env

# 2. Start backend
cd v2/lesociety/latest/home/node/secret-time-next-api
node bin/www &

# 3. Start frontend
cd ../secret-time-next
npm run dev &

# 4. Open: http://localhost:3000
# 5. Login: afro@yopmail.com / 123456
```

---

## Technology Stack

**Backend:**
- Node.js + Express 4.16.4
- MongoDB Atlas (Mongoose 6.12.0)
- Socket.IO 4.4.1
- JWT authentication
- AWS S3 for file storage
- SendGrid for email

**Frontend:**
- Next.js 11.1.4
- React 17 + Redux + Saga
- Bootstrap + Ant Design
- Socket.IO client
- Axios

---

## Test Credentials

**User Account:**
- Email: afro@yopmail.com
- Password: 123456

---

## Getting Help

1. **Login fails?** → Read [START_HERE_FIRST.md](START_HERE_FIRST.md) (JWT fix)
2. **Need API docs?** → See [APPLICATION_ARCHITECTURE.md](APPLICATION_ARCHITECTURE.md)
3. **Database issues?** → Run `node check-user.js`

---

## Port Usage

- **3001** - Backend API
- **3000** - Frontend Next.js (User App)
- **3002** - React Admin Panel (optional)

---

**For complete documentation, see [APPLICATION_ARCHITECTURE.md](APPLICATION_ARCHITECTURE.md)**

---

**Last Updated:** February 9, 2026
