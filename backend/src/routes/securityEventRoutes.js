const express = require('express');
const router = express.Router();
const securityEventController = require('../controllers/securityEventController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const {
  validateCreateSecurityEvent,
  validateUpdateSecurityEvent,
} = require('../validators/securityEventValidator');

// All security event routes require authentication
router.use(authenticateToken);

// View events (ADMIN, MANAGER, USER can view permitted org events)
router.get('/', securityEventController.getSecurityEvents);
router.get('/:id', securityEventController.getSecurityEventById);

// Create event (ADMIN, MANAGER)
router.post(
  '/',
  authorizeRoles('ADMIN', 'MANAGER'),
  validateCreateSecurityEvent,
  securityEventController.createSecurityEvent
);

// Update event status / severity (ADMIN, MANAGER)
router.patch(
  '/:id',
  authorizeRoles('ADMIN', 'MANAGER'),
  validateUpdateSecurityEvent,
  securityEventController.updateSecurityEvent
);

module.exports = router;
