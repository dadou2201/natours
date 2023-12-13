const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

//routes pour la partie web:
router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

// create /login routes:
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

//create /me routes:
router.get('/me', authController.protect, viewsController.getAccount);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData,
);

module.exports = router;
