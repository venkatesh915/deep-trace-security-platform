const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const {
  validateCreateCampaign,
  validateUpdateCampaign,
} = require('../validators/campaignValidator');

// All campaign routes require valid JWT authentication
router.use(authenticateToken);

// List campaigns (ADMIN/MANAGER see all in org; USER sees assigned campaigns)
router.get('/', campaignController.getCampaigns);

// Get single campaign (verified scoped to caller org & assignment for USER)
router.get('/:id', campaignController.getCampaignById);

// Create campaign (ADMIN, MANAGER)
router.post(
  '/',
  authorizeRoles('ADMIN', 'MANAGER'),
  validateCreateCampaign,
  campaignController.createCampaign
);

// Update campaign (ADMIN, MANAGER)
router.patch(
  '/:id',
  authorizeRoles('ADMIN', 'MANAGER'),
  validateUpdateCampaign,
  campaignController.updateCampaign
);

// Delete campaign (ADMIN, MANAGER)
router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'MANAGER'),
  campaignController.deleteCampaign
);

// Campaign user assignments
router.get('/:id/users', campaignController.getCampaignUsers);

router.post(
  '/:id/users/:userId',
  authorizeRoles('ADMIN', 'MANAGER'),
  campaignController.assignUser
);

router.delete(
  '/:id/users/:userId',
  authorizeRoles('ADMIN', 'MANAGER'),
  campaignController.removeUser
);

module.exports = router;
