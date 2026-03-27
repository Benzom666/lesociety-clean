# 🚀 Deployment Guide - Get LeSociety Live!

## Quick Deploy (Recommended Path)

### Step 1: Deploy Backend to Railway (5 minutes)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy backend
cd ~/lesociety-clean/backend
railway init
railway up

# 4. Add environment variables in Railway dashboard:
# - Go to railway.app
# - Click your project
# - Settings → Variables
# - Add: MONGO_URI, JWT_SECRET, PORT=3001
```

**You'll get:** `https://your-backend.up.railway.app`

---

### Step 2: Deploy Frontend to Vercel (3 minutes)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy frontend
cd ~/lesociety-clean/frontend
vercel

# 4. Add environment variables when prompted:
# NEXT_PUBLIC_DEV_API_URL=https://your-backend.up.railway.app
# NEXT_PUBLIC_DEV_SOCKET_URL=https://your-backend.up.railway.app
```

**You'll get:** `https://your-app.vercel.app`

---

### Step 3: Configure MongoDB Atlas (Already Done!)

You already have MongoDB Atlas configured in your .env files.
Just make sure to:

1. Whitelist Railway's IPs in MongoDB Atlas
2. Or set "Allow access from anywhere" (0.0.0.0/0)

---

## Alternative: Deploy Everything to Railway

```bash
# Backend
cd ~/lesociety-clean/backend
railway init
railway up

# Frontend
cd ~/lesociety-clean/frontend
railway init
railway up

# Admin (optional)
cd ~/lesociety-clean/admin
railway init
railway up
```

Railway gives you $5 credit/month (free forever for small apps)

---

## Alternative: Deploy to Render.com (100% Free)

### Backend:
1. Push code to GitHub
2. Go to render.com → New Web Service
3. Connect GitHub repo
4. Select `backend` folder
5. Build: `npm install`
6. Start: `npm start`
7. Add env variables in dashboard

### Frontend:
1. Render.com → New Static Site
2. Select `frontend` folder
3. Build: `npm run build`
4. Publish: `.next`

---

## What You Need Ready:

### Backend Environment Variables:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/lesociety
JWT_SECRET=your-secret-key-here
PORT=3001
NODE_ENV=production
```

### Frontend Environment Variables:
```
NEXT_PUBLIC_DEV_API_URL=https://your-backend-url.com
NEXT_PUBLIC_DEV_SOCKET_URL=https://your-backend-url.com
```

---

## Costs Comparison:

| Platform | Frontend | Backend | Database | Total/Month |
|----------|----------|---------|----------|-------------|
| **Vercel + Railway + MongoDB Atlas** | Free | $0-5 | Free | **$0-5** |
| **Render (all)** | Free | Free | Atlas Free | **$0** |
| **Railway (all)** | Free* | Free* | Free* | **$0-5** |
| **DigitalOcean** | $5 | $5 | $15 | **$25** |

*Railway: $5 credit/month, enough for small apps

---

## 🎯 My Recommendation:

### For Testing/MVP:
**Vercel (Frontend) + Railway (Backend) + MongoDB Atlas (Free)**
- Total cost: $0-5/month
- Deploy time: ~10 minutes
- Professional URLs
- Auto HTTPS
- Easy updates

### Commands:
```bash
# Backend
cd ~/lesociety-clean/backend
npm install -g @railway/cli
railway login
railway init
railway up

# Frontend  
cd ~/lesociety-clean/frontend
npm install -g vercel
vercel login
vercel
```

---

## Need Help?

1. **Railway Issues:** Check railway.app/docs
2. **Vercel Issues:** Check vercel.com/docs
3. **MongoDB Connection:** Whitelist IPs in Atlas dashboard

---

## After Deployment:

1. Test your live URL
2. Check backend logs for errors
3. Verify MongoDB connection
4. Test payment flows (if using Stripe/etc)
5. Monitor usage on free tiers

**You'll be live in ~15 minutes!** 🚀
