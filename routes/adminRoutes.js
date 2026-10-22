const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

router.get('/dashboard', isAuthenticated, isAdmin, adminController.getDashboard);

module.exports = router;