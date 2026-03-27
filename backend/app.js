const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const winston = require("winston");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/user");
const promotionRouter = require("./routes/promotion");
const datesRouter = require("./routes/date");
const filesRouter = require("./routes/files");
const countryRouter = require("./routes/country");
const requestRouter = require("./routes/request");
const chatRouter = require("./routes/chat");
const defaultMessageRouter = require("./routes/default-messages");
const defaultInfluencerRouter = require("./routes/influencer");
const dashboardRouter = require("./routes/dashboard");
const categoryRouter = require("./routes/category");
const aspirationRouter = require("./routes/aspiration");
const notificationRouter = require("./routes/notification");
const paymentRouter = require("./routes/payment");
const cron = require("node-cron");
const chatController = require("./controllers/v1/chat.js");

const winstonLog = require("./config/winston");
const { rateLimits } = require("./middleware/rateLimiter");

// Load environment variables
require("./lib/env");

global.BASEDIR = __dirname;

const app = express();

// CORS - Allow all Vercel deployments and configured origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

// Simple CORS - allow all .vercel.app domains
const corsOptions = {
    origin: true, // Allow all origins for now to debug
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

mongoose.Promise = global.Promise;

// Build connection URI to handle special characters
// SECURITY: All credentials MUST come from environment variables - no fallbacks
const mongoUri = process.env.MONGO_URI || (() => {
    const user = process.env.MONGO_USER;
    const pass = process.env.MONGO_PASS ? encodeURIComponent(process.env.MONGO_PASS) : null;
    const host = process.env.MONGO_HOST;
    const dbName = process.env.DB_NAME || 'lesociety';
    
    if (!user || !pass || !host) {
        winstonLog.error('FATAL: MongoDB credentials not configured. Set MONGO_URI or MONGO_USER + MONGO_PASS + MONGO_HOST');
        process.exit(1);
    }
    
    return `mongodb+srv://${user}:${pass}@${host}/${dbName}?retryWrites=true&w=majority`;
})();

// Connection pooling and optimization settings
const mongooseOptions = {
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10,
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE) || 2,
    serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_TIMEOUT) || 5000,
    socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000,
};

mongoose
    .connect(mongoUri, mongooseOptions)
    .then(() => winstonLog.info("MongoDB connection successful"))
    .catch((err) => {
        winstonLog.error("MongoDB connection failed:", err);
        process.exit(1);
    });

// Only enable mongoose debug in development
if (process.env.NODE_ENV === 'development') {
    mongoose.set("debug", true);
} else {
    mongoose.set("debug", false);
}

const db = mongoose.connection;
db.on("error", winston.error.bind(winston, "connection error: "));
db.once("open", () => {
    winston.info("Connected to Mongo DB");
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Morgan logging - only in development
if (process.env.NODE_ENV !== 'production') {
    app.use(logger("dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Security headers middleware
app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // HSTS (HTTPS only)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

// Apply rate limiting to routes
app.use("/api/v1/", indexRouter);
app.use("/api/v1/user", rateLimits.api, usersRouter);
app.use("/api/v1/date", rateLimits.date, datesRouter);
app.use("/api/v1/files", rateLimits.api, filesRouter);
app.use("/api/v1/country", rateLimits.api, countryRouter);
app.use("/api/v1/request", rateLimits.api, requestRouter);
app.use("/api/v1/promotion", rateLimits.api, promotionRouter);
app.use("/api/v1/chat", rateLimits.chat, chatRouter);
app.use("/api/v1/defaultMessage", rateLimits.api, defaultMessageRouter);
app.use("/api/v1/influencer", rateLimits.api, defaultInfluencerRouter);
app.use("/api/v1/notification", rateLimits.api, notificationRouter);
app.use("/api/v1/dashboard", rateLimits.api, dashboardRouter);
app.use("/api/v1/categories", rateLimits.api, categoryRouter);
app.use("/api/v1/aspirations", rateLimits.api, aspirationRouter);
app.use("/api/v1/payment", rateLimits.api, paymentRouter);

cron.schedule("* * * * *", function () {
    console.log("running a task every minute");
    chatController.handleCron();
});
// chatController.handleCron();

// catch 404 and forward to error handler
app.all("*", (req, res) => {
    res.status(404).json({
        status: 404,
        message: `Can't find ${req.originalUrl} on this server!`,
    });
});

// error handler
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
});

module.exports = app;
