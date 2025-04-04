const app = require("./app");
const setupDatabase = require("./database/setup/setup.setup");

async function startServer() {
  // Phase 1: Database Setup
  try {
    console.log("Initializing database...");
    await setupDatabase();
    console.log("Database ready");
  } catch (err) {
    console.error("Database initialization error:", err);
    // Graceful shutdown if database is critical
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
      console.error("Fatal database connection error");
      process.exit(1);
    }

    // Continue for non-critical errors (like existing tables)
  }

  // Start server if database connection is successful
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Start with proper error handling
startServer().catch((err) => {
  console.error("Application startup failed:", err);
  process.exit(1);
});
