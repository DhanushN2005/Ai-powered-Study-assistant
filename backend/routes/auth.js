const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteAccount);
router.put('/password', protect, changePassword);

module.exports = router;
