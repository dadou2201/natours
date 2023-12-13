const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');
//const catchAsync = require('../utils/catchAsync');

//avant handlerFactory.js
// exports.getAllReviews = async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// };

//apres handlerFactory.js:
exports.getAllReviews = factory.getAll(Review);

exports.setTourUserIds = (req, res, next) => {
  //Allow nested routes:
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

//fonction avant le handlerFactory:
// exports.createReview = catchAsync(async (req, res, next) => {
//   const newReview = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview,
//     },
//   });
// });

exports.getReview = factory.getOne(Review);
//fonction create apres le factory de celle vers la ligne 28:
exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
