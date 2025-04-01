const express = require("express");
const cors = require("cors");

const setupDatabase = require('./database/setup/setup');

async function initializeApp() {
    // Phase 1: Database Setup
    try {
        console.log('Initializing database...');
        await setupDatabase();
        console.log('Database ready');
    } catch (err) {
        console.error('Database initialization error:', err);

        // Graceful shutdown if database is critical
        if (err.message.includes('connection refused')) {
            console.error('Fatal database connection error');
            process.exit(1);
        }

        // Continue for non-critical errors (like existing tables)
    }

    // Phase 2: Express App Setup


    const app = express();
    app.use(cors());
    app.use(express.json());



    // Middleware, routes, etc.
    app.get('/health', (req, res) => {
        res.json({
            status: 'OK',
            database: 'connected'
        });
    });

    // Phase 3: Server Startup
    app.get("/", (req, res) => res.send("Sapce managemnt API Running!"));

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Start with proper error handling
initializeApp().catch(err => {
    console.error('Application startup failed:', err);
    process.exit(1);
});