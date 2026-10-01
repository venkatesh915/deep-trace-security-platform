const campaignService = require('../services/campaignService');
const { successResponse } = require('../utils/apiResponse');

const createCampaign = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const campaign = await campaignService.createCampaign({
      organizationId: req.user.organizationId,
      createdBy: req.user.id,
      name,
      description,
      status,
    });
    return successResponse(res, 201, 'Campaign created successfully', campaign);
  } catch (error) {
    next(error);
  }
};

const getCampaigns = async (req, res, next) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const result = await campaignService.getCampaigns({
      organizationId: req.user.organizationId,
      userRole: req.user.role,
      userId: req.user.id,
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder,
    });
    return successResponse(res, 200, 'Campaigns retrieved successfully', result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getCampaignById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await campaignService.getCampaignById({
      campaignId: id,
      organizationId: req.user.organizationId,
      userRole: req.user.role,
      userId: req.user.id,
    });
    return successResponse(res, 200, 'Campaign retrieved successfully', campaign);
  } catch (error) {
    next(error);
  }
};

const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    const updated = await campaignService.updateCampaign({
      campaignId: id,
      organizationId: req.user.organizationId,
      userId: req.user.id,
      updateData: { name, description, status },
    });
    return successResponse(res, 200, 'Campaign updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await campaignService.deleteCampaign({
      campaignId: id,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    return successResponse(res, 200, 'Campaign deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

const assignUser = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const assignment = await campaignService.assignUserToCampaign({
      campaignId: id,
      targetUserId: userId,
      organizationId: req.user.organizationId,
      actionUserId: req.user.id,
    });
    return successResponse(res, 200, 'User assigned to campaign successfully', assignment);
  } catch (error) {
    next(error);
  }
};

const removeUser = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const result = await campaignService.removeUserFromCampaign({
      campaignId: id,
      targetUserId: userId,
      organizationId: req.user.organizationId,
      actionUserId: req.user.id,
    });
    return successResponse(res, 200, 'User removed from campaign successfully', result);
  } catch (error) {
    next(error);
  }
};

const getCampaignUsers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const users = await campaignService.getCampaignUsers({
      campaignId: id,
      organizationId: req.user.organizationId,
    });
    return successResponse(res, 200, 'Campaign users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  assignUser,
  removeUser,
  getCampaignUsers,
};
