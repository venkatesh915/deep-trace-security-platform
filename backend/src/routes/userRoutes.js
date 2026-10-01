const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { validateCreateUser, validateUpdateUser } = require('../validators/userValidator');

// User management endpoints strictly restricted to ADMIN role
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', validateCreateUser, userController.createUser);
router.patch('/:id', validateUpdateUser, userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
