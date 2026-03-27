# LeSociety - Dating Platform

> **Clean, reorganized project structure** - Extracted from nested directories on March 26, 2026

## 📁 Project Structure

```
lesociety-clean/
├── frontend/          # Next.js 11 web application
├── backend/           # Express.js API server
├── admin/             # React admin panel
├── database/          # Database dumps and utility scripts
├── assets/            # Design assets and mockups
└── docs-archive/      # Archived AI-generated documentation (38 files)
```

## 🚀 Quick Start

### Frontend (Next.js)
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
# Runs on http://localhost:3000
```

### Backend (Express.js)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB credentials
npm start
# API runs on port 3001 (or configured PORT)
```

### Admin Panel (React)
```bash
cd admin
npm install
npm start
# Runs on http://localhost:3000
```

## 🗄️ Database Setup

### Restore Database from Dump
```bash
cd database
cp .env.example .env
# Edit .env with MongoDB credentials
node restore-db.js
```

### Check User Data
```bash
cd database
node check-user.js
```

## 📦 What's Included

### Frontend (`frontend/`)
- **Framework**: Next.js 11
- **Key Features**:
  - User profiles & matching
  - Date creation flow
  - Real-time chat (Socket.io)
  - Payment integration
  - Mobile-responsive design
- **Main Directories**:
  - `pages/` - Next.js pages & routes
  - `components/` - Reusable React components
  - `modules/` - Feature modules
  - `core/` - Core UI components
  - `styles/` - SCSS stylesheets

### Backend (`backend/`)
- **Framework**: Express.js
- **Key Features**:
  - RESTful API
  - MongoDB integration
  - User authentication
  - Real-time messaging
  - Payment processing
- **Main Directories**:
  - `controllers/` - API route handlers
  - `models/` - Database models
  - `middleware/` - Express middleware
  - `config/` - Configuration files

### Admin Panel (`admin/`)
- **Framework**: React (Create React App)
- **Purpose**: Admin dashboard for platform management
- **Features**:
  - User management
  - Country/category management
  - Content moderation

### Database (`database/`)
- MongoDB BSON dumps
- Restore script (`restore-db.js`)
- User verification script (`check-user.js`)
- Collections: users, dates, chats, notifications, etc.

## 🔧 Environment Configuration

Each application needs its own `.env` file. Templates are provided as `.env.example`.

### Required Environment Variables

**Frontend**: API URLs, Supabase, Mapbox token
**Backend**: MongoDB URI, JWT secret, port
**Database Scripts**: MongoDB credentials

## 📚 Documentation Archive

The `docs-archive/` folder contains 38 AI-generated markdown files from previous development sessions. These are archived for reference but may contain:
- Outdated information
- Conflicting details
- Hallucinated features

**⚠️ Always verify against the actual code, not the archived docs.**

## 🔒 Security Notes

- **DO NOT commit** `.env` files to git
- MongoDB credentials have been removed from this clean structure
- Use `.env.example` as templates and fill in your own credentials
- The `.gitignore` is configured to exclude sensitive files

## 🛠️ Tech Stack

- **Frontend**: Next.js 11, React 17, Socket.io-client, Sass
- **Backend**: Express.js, MongoDB, Socket.io
- **Admin**: React, Redux, React Router
- **Database**: MongoDB Atlas

## 📝 Git Information

- **Original Repo**: https://github.com/Benzom666/v2.git
- **Current Branch**: payment-topper
- **Recent Work**: iOS scrolling fixes, feed optimization, payment features

## 🎯 Next Steps

1. ✅ Set up environment variables for each application
2. ✅ Install dependencies (`npm install` in each directory)
3. ✅ Configure MongoDB connection
4. ✅ Start development servers
5. Test the applications end-to-end

## 📞 Need Help?

- Check the individual README files in each directory (if present)
- Review the code - it's the source of truth
- The docs-archive may have useful context but verify everything

---

**Last Updated**: March 26, 2026
**Cleaned By**: AI Assistant (Workspace Reorganization)
