const express= require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rbacMiddleware = require('../middleware/rbac.middleware')

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/send-verification-email', userController.sendVerificationEmail);
router.post('/verify-email', userController.verifyEmail);
router.get('/request-reset-password',userController.requestPasswordReset)
router.post('/reset-password',userController.resetPassword)

router.get('/profile', authMiddleware,rbacMiddleware.rbac(['admin','customer']),userController.getProfile);
router.put('/profile', authMiddleware,rbacMiddleware.rbac(['admin','customer']),userController.updateProfile);
router.put('/profile-deactivate', authMiddleware,rbacMiddleware.rbac(['admin','customer']),userController.deleteProfile);

module.exports = router;