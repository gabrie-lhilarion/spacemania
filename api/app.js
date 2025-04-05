const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler.middleware');
const authRoutes = require('./routes/auth.routes');
const userRouter = require('./routes/users.routes');
const workspaceRouter = require('./routes/workspaces.routes');
const bookingRouter = require('./routes/bookings.routes');
const adminRouter = require('./routes/admin.routes');

// Phase 2: Express App Setup
const app = express();
app.use(cors());
app.use(express.json());

// Middleware, routes, etc.
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: 'connected',
  });
});

// Phase 3: Server Startup
app.get('/', (req, res) => res.send('Space management API Running!'));

// routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/workspaces', workspaceRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/admin', adminRouter);

// error middleware
app.use(errorHandler);

module.exports = app;
