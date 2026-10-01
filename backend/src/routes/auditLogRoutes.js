const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Audit logs require authentication and role check (ADMIN and MANAGER only; USER receives 403)
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'MANAGER'));

router.get('/', auditLogController.getAuditLogs);

module.exports = router;
