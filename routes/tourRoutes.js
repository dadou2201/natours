const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

//POST /tour/234fad4/reviews
//GET /tour/234fad4/reviews

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

//router de l aggregation:
router.route('/tour-stats').get(tourController.getTourStats);
//router de l aggregation de resolution probleme cb de tours par mois:
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

//ici on va faire en sorte que le middleware se passe que si id est present c-a-d si on cherche un num en particulier:
//par exemple si on cherche alltours dans postman ca fera rien si on cherche le Tour avc 2 alors ca utilise:
//router.param('id', tourController.checkID); on a changer le code dans tourController ya plus la func

// //geospatial queries:
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

//avant le defi:
// router
//   .route('/')
//   .get(tourController.getAllTours)
//   .post(tourController.createTour);
// router
//   .route('/:id')
//   .get(tourController.getTour)
//   .patch(tourController.updateTour)
//   .delete(tourController.deleteTour);

// module.exports = router;

//defi : on corrige direct dans le code :
//Create a checkBody middleware
//Check if body contains the name and price property
//If not , send back 400 (bad request)
//Add it to the post handler stack

//apres le defi:
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
