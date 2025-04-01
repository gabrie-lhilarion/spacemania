const express = require('express');
const router = express.Router();
const {
    createBooking,
    getWorkspaceAvailability,
    getUserBookings

} = require('../database/bookings/bookings');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;