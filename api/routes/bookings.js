const express = require('express');
const router = express.Router();
const {
    createBooking,
    getUserBookings

} = require('../database/bookings/bookings');

router.post('/create', createBooking);
router.post('/getBooking', getUserBookings);

module.exports = router;