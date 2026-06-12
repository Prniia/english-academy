require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

const path = require("path");

const app = express();
const PORT = 3000;

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Main App Routes
app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes); // admin controls

// Fallback error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err.stack);
  res.status(500).json({
    message: "خطایی در سرور رخ داده است",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Embedded Vite Integration for React Client
if (process.env.NODE_ENV !== "production") {
  import("vite").then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);

      app.listen(PORT, "0.0.0.0", () => {
        console.log(`English Placement Test full-stack app running in Dev Mode on port ${PORT}`);
      });
    });
  }).catch((err) => {
    console.error("Failed to start Vite server:", err);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`English Placement Test full-stack app running in Production Mode on port ${PORT}`);
  });
}
