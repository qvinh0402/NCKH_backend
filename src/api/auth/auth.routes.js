const express = require('express');
const controller = require('./auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/admin/login', controller.adminLogin);

// Protected routes - cần xác thực
router.get('/check', authenticateToken, controller.checkAuth);
router.post('/logout', authenticateToken, controller.logout);

module.exports = router;
