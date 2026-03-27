# AI Agent Instructions - Le Society Project

## 🚨 CRITICAL: READ THIS BEFORE ANY WORK 🚨

**IF YOU ARE AN AI AGENT WORKING ON THIS PROJECT:**

### STEP 1: ALWAYS READ THESE FILES FIRST (IN ORDER)

1. **[START_HERE_FIRST.md](START_HERE_FIRST.md)** - MANDATORY quick-start (30 seconds)
2. **[APPLICATION_ARCHITECTURE.md](APPLICATION_ARCHITECTURE.md)** - Complete app documentation

**DO NOT START CODING OR DEBUGGING WITHOUT READING THESE FILES FIRST!**

---

## ⚠️ THE #1 ISSUE THAT WASTES HOURS

### Problem: "Something went wrong" on login

**Root Cause:** Missing `JWT_SECRET_TOKEN` in backend `.env`

**99% of login issues are caused by this!**

### The Fix (Always Do This First!)

```bash
# Add this line to backend .env
JWT_SECRET_TOKEN=your-secret-key-change-this-in-production
```

**Location:** `v2/lesociety/latest/home/node/secret-time-next-api/.env`

**After adding, restart API:**
```bash
pkill -f "node bin/www"
cd v2/lesociety/latest/home/node/secret-time-next-api
node bin/www &
```

**Verify it works:**
```bash
curl -X POST http://localhost:3001/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "afro@yopmail.com", "password": "123456"}'
```

Expected: `"status": 200` with JWT token

---

## 🎯 Standard Operating Procedure for AI Agents

### When User Reports Login Issues:

**DO NOT:**
- ❌ Start debugging CORS
- ❌ Check database connectivity first
- ❌ Examine frontend code
- ❌ Check network requests
- ❌ Go down debugging rabbit holes

**DO THIS INSTEAD:**
1. ✅ Check if `JWT_SECRET_TOKEN` exists in backend `.env`
2. ✅ Add it if missing (see fix above)
3. ✅ Restart API
4. ✅ Test login endpoint with curl
5. ✅ Only if still fails, then debug further

**This saves 90% of debugging time!**

---

### When User Asks to Start the Application:

**Follow this exact sequence:**

```bash
# 1. Verify JWT_SECRET_TOKEN in .env
grep JWT_SECRET_TOKEN v2/lesociety/latest/home/node/secret-time-next-api/.env

# If not found, add it:
echo "JWT_SECRET_TOKEN=your-secret-key-change-this-in-production" >> v2/lesociety/latest/home/node/secret-time-next-api/.env

# 2. Test database connection
cd v2
node check-user.js

# 3. Start backend
cd lesociety/latest/home/node/secret-time-next-api
node bin/www &

# 4. Wait and verify backend
sleep 3
curl -X POST http://localhost:3001/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "afro@yopmail.com", "password": "123456"}'

# 5. Only if backend works, start frontend
cd ../secret-time-next
npm run dev &

# 6. Inform user: http://localhost:3000
```

---

### When Asked About Application Architecture:

**DO NOT:** Re-analyze the entire codebase

**DO THIS:** Read and reference `APPLICATION_ARCHITECTURE.md` which contains:
- Complete technology stack
- Database schemas (11 collections)
- API endpoints (14 route groups)
- Business logic and workflows
- Authentication flows
- File structure
- Environment variables
- Common issues and fixes

**This saves hundreds of tokens and hours of analysis!**

---

## 📂 Project Structure (Quick Reference)

```
v2/
├── START_HERE_FIRST.md              ← Quick-start guide
├── CRITICAL_FIX_README.md           ← JWT fix details
├── APPLICATION_ARCHITECTURE.md      ← Full documentation
├── AGENTS.md                        ← This file
│
├── lesociety/latest/home/node/
│   ├── secret-time-next-api/        ← Backend (Port 3001)
│   │   ├── .env                     ← ADD JWT_SECRET_TOKEN HERE!
│   │   ├── app.js                   ← Main Express app
│   │   ├── controllers/v1/          ← Business logic
│   │   ├── models/                  ← Mongoose schemas
│   │   └── routes/                  ← API routes
│   │
│   └── secret-time-next/            ← Frontend (Port 3000)
│       ├── pages/                   ← Next.js pages
│       └── components/              ← React components
│
├── database/lesociety/              ← MongoDB backups
├── check-user.js                    ← Test DB script
└── restore-db.js                    ← Restore DB script
```

---

## 🔑 Critical Environment Variables

**Backend `.env` (MUST HAVE):**
```bash
# Database
MONGO_USER=ronyroyrox_db_user
MONGO_PASS=Dgreatreset1!
MONGO_HOST=lesociety.lalld11.mongodb.net
DB_NAME=lesociety

# JWT (BOTH REQUIRED!)
JWT_SECRET=your-secret-key-change-this-in-production
JWT_SECRET_TOKEN=your-secret-key-change-this-in-production

# Application
PORT=3001
NODE_ENV=development
```

**Frontend `.env`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## 🧪 Test Credentials

**Always use these for testing:**
- Email: afro@yopmail.com
- Password: 123456

---

## 🚫 Common Pitfalls to Avoid

1. **Starting frontend before backend**
   - Result: Connection errors
   - Fix: Always start backend first

2. **Forgetting JWT_SECRET_TOKEN**
   - Result: "Something went wrong" on login
   - Fix: Add to .env (see above)

3. **Not testing API before frontend**
   - Result: Unknown if backend works
   - Fix: Test login endpoint with curl first

4. **Re-analyzing codebase**
   - Result: Wasted tokens and time
   - Fix: Read APPLICATION_ARCHITECTURE.md

5. **Debugging wrong issues**
   - Result: Hours in rabbit holes
   - Fix: Check JWT_SECRET_TOKEN FIRST

---

## 📊 Application Status Check

**Use this to verify everything is working:**

```bash
# Backend running?
curl http://localhost:3001/api/v1/

# Login working?
curl -X POST http://localhost:3001/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "afro@yopmail.com", "password": "123456"}'

# Frontend running?
curl http://localhost:3000

# Database connected?
cd v2 && node check-user.js
```

---

## 💡 Efficiency Tips for AI Agents

1. **Before debugging:** Check START_HERE_FIRST.md
2. **Before explaining architecture:** Read APPLICATION_ARCHITECTURE.md
3. **Before testing:** Verify JWT_SECRET_TOKEN exists
4. **Before starting app:** Follow exact sequence in this file
5. **When in doubt:** Check the documentation files first

**This approach prevents the same issues from happening repeatedly!**

---

## 🎯 Success Criteria

**Application is working when:**
- ✅ Backend API responds on port 3001
- ✅ Login returns 200 with JWT token
- ✅ Frontend loads on port 3000
- ✅ Can login with afro@yopmail.com / 123456
- ✅ Dashboard loads without errors

---

## 📝 When to Update Documentation

**Update START_HERE_FIRST.md when:**
- New critical setup step discovered
- New common issue found
- Environment variable added

**Update APPLICATION_ARCHITECTURE.md when:**
- New feature added
- Database schema changed
- API endpoint modified
- Workflow updated

**Update this file (AGENTS.md) when:**
- New pattern for AI efficiency discovered
- Common mistake identified
- Better approach found

---

## 🆘 Emergency Commands

**Stop everything:**
```bash
pkill -f node
```

**Restart backend only:**
```bash
pkill -f "node bin/www"
cd v2/lesociety/latest/home/node/secret-time-next-api
node bin/www &
```

**Restart frontend only:**
```bash
pkill -f "next dev"
cd v2/lesociety/latest/home/node/secret-time-next
npm run dev &
```

**Fresh start:**
```bash
pkill -f node
cd v2/lesociety/latest/home/node/secret-time-next-api
node bin/www &
sleep 3
cd ../secret-time-next
npm run dev &
```

---

## 🎓 Learning from History

**Issue:** Login repeatedly failing with "Something went wrong"

**Attempts made:**
1. Checked database connection ✓
2. Checked CORS settings ✓
3. Checked frontend API calls ✓
4. Checked network requests ✓
5. Analyzed error logs ✓

**Actual cause:** Missing `JWT_SECRET_TOKEN` in .env (30-second fix)

**Lesson:** Always check the simplest, most common issues first!

---

## ✅ Final Checklist for AI Agents

Before responding to user:
- [ ] Have I read START_HERE_FIRST.md?
- [ ] Have I checked if JWT_SECRET_TOKEN exists?
- [ ] Have I reviewed relevant sections in APPLICATION_ARCHITECTURE.md?
- [ ] Am I following the standard procedure?
- [ ] Am I avoiding known pitfalls?

---

**Remember:** The goal is efficiency. Don't reinvent the wheel - use the documentation!

---

**Last Updated:** February 9, 2026  
**Reason:** Initial creation to prevent repeated JWT debugging issues

---

## 📱 Mobile Access Issue

### User Reports: "Login doesn't work on mobile"

**Root Cause:** Frontend .env uses `localhost` which doesn't resolve from mobile devices.

**Quick Fix:**

1. Get network IP: `hostname -I | awk '{print $1}'`
2. Update `v2/lesociety/latest/home/node/secret-time-next/.env`:
   ```bash
   NEXT_PUBLIC_DEV_API_URL="http://YOUR_IP:3001"
   NEXT_PUBLIC_DEV_SOCKET_URL="http://YOUR_IP:3001/"
   ```
3. Restart frontend: `pkill -f "next dev" && cd v2/lesociety/latest/home/node/secret-time-next && npm run dev &`
4. Mobile URL: `http://YOUR_IP:3000`

**Note:** Both computer and phone must be on same WiFi network!

---

