//const fs = require('fs');
// eslint-disable-next-line import/no-extraneous-dependencies
const multer = require('multer');
// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

//filtre:
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

//upload.single('image') --> req.file // pour une photo
//upload.array('images')--> req.files // pour plusieurs photo d un array
//upload.fields pour un melange des 2

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  //console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  //1. Cover image:
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2.Images:
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );

  //console.log(req.body);
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next(); // car middleware
};

//on en a plus besoin dans la suite mais c etait pr lire le fichier
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

//dans 3 de nos fonctions on a une verif si l id est bon donc pas top on va creer un middleware qui verifiera lui meme pr les 3:
//fonction dont on a plus besoin apres l utilisation de db donc c etait pr les middleware qu on utilisait ds les section d avant
//exports.checkID = (req, res, next, val) => {
//console.log(`Tour id is:${val}`);
// if (req.params.id * 1 > tours.length) {
//   return res.status(404).json({
//     status: 'fail',
//     message: 'Invalid id',
//   });
// }
//next();
//};

//middleware qui check si le prix et le nom sont bien existant:
//mais plus besoin avec l utilisation de la db car le check se fera auto a la creation du tour
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

//fonction recoit tt les tours avant le handlerFactory.js:
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//***********SEND RESPONSE**************
// res.status(200).json({
//   status: 'success',
//requestedAt: req.requestTime, //ns mettra ds le json la data et heure a lql on a demander
// results: tours.length, // bonus pr savoir la taille
// data: {
//   tours, //c est comme ecrire tours: tours car meme nom on peut faire comme ca
// },
//});

//d ici a la fin c est avant qu on fasse la fonction catchAsync donc au dessus c ss try and catch.
// try {
//   //*************BUILD QUERY********************
//   //on va faire une copie:
//   // //1.Filtering on va le mettre ds la classe la haut
//   // const queryObj = { ...req.query };
//   // //on veut exclure ces mot de la requette : donc ca gardera pas cela
//   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//   // excludedFields.forEach((el) => delete queryObj[el]);
//   // //console.log(req.query, queryObj);
//   // //2.Advanced filtering: pour pouvoir avoir en filtre less than , gretter than or equal etc
//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//   // console.log(JSON.parse(queryStr));
//   // //On a 3 facon de filtrer les recherches :
//   // //a:Suivant la requette
//   // let query = Tour.find(JSON.parse(queryStr));
//   //b: Avec les filtres mis dans find
//   // const query = Tour.find({
//   //   duration: 5,
//   //   difficulty: 'easy',
//   // });
//   //c: Comme ca:
//   // const tours = await Tour.find()
//   //   .where('duration')
//   //   .equals(5)
//   //   .where('difficulty')
//   //   .equals('easy');
//   //3.Sorting:
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   query = query.sort(sortBy);
//   //   //si egalite sur le prix on ajoute un autre filtre par exp : sort('price ratingAverage)'
//   //   //dans la requette on fera : 127.0.0.1:3000/api/v1/tours?sort=price,ratingAverage
//   // } else {
//   //   query = query.sort('-createdAt'); //pour trier par date de creation !
//   // }
//   //4. Field limiting: garder que par exemple le prix le nom etc on choisit
//   // dans le postman 127.0.0.1:3000/api/v1/tours?fields=name,duration,difficulty,price
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select('-__v'); // on fait - pr exclure ds le json le __v
//   // }
//   //5.Pagination:
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page - 1) * limit;
//   // query = query.skip(skip).limit(limit);
//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) throw new Error('This page does not exist');
//   // }
//   //************EXECUTE QUERY*****************
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;
//   //***********SEND RESPONSE**************
//   res.status(200).json({
//     status: 'success',
//     //requestedAt: req.requestTime, //ns mettra ds le json la data et heure a lql on a demander
//     results: tours.length, // bonus pr savoir la taille
//     data: {
//       tours, //c est comme ecrire tours: tours car meme nom on peut faire comme ca
//     },
//   });
// } catch (err) {
//   res.status(404).json({
//     status: 'fail',
//     message: err,
//   });
// }
//});

/*FONCTION GETALLTOURS APRES LE HANDLERFACTORY.JS*/
exports.getAllTours = factory.getAll(Tour);

//ancienne fonction qui recoit les tours avc le numero:
//exports.getTour = (req, res) => {
//console.log(req.params);

//const id = req.params.id * 1; //convertit le string en chiffre
//const tour = tours.find((el) => el.id === id); // permet de trouver lequel a le bon id

//check1 si le chiffre demander n existe pas :
//   if (id > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid id',
//     });
//   }

//check2:
// if (!tour) {
//   return res.status(404).json({
//     status: 'fail',
//     message: 'Invalid id',
//   });
// }

//recoit les donnees du bon chiffre:
// res.status(200).json({
//   status: 'success',
//   data: {
//     tours: tour,
//   },
// });

//fonction qui recoit le tour grace au id avant handlerFactory.js:
//exports.getTour = catchAsync(async (req, res, next) => {
//try {
//populate va prendre les donnees du path ici guides et select va selectionner ce qu on veut ou ne voulons pas ici avec le -
// const tour = await Tour.findById(req.params.id).populate('reviews');

// if (!tour) {
//   return next(new AppError('No tour found with that ID', 404));
// }

// res.status(200).json({
//   status: 'success',
//   data: {
//     tours: tour,
//   },
// });
// } catch (err) {
//   res.status(404).json({
//     status: 'fail',
//     message: err,
//   });
// });
//
//fonction qui recoit le tour grace au id avant handlerFactory.js:
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

//fonction qui creer un nouveau tour avant le handlerFactory.js:
// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body); //create ca va etre une promesse qui va etre gerer avec await car la func est async et dedans on envoi req.body pour recuperer les donnees de la request

//   res.status(201).json({
//     //200 veut dire ok 201 veut dire creer
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
//   //try {
//   //const newTour = newT Tour({})
//   //newTour.save()
//   //on fait comme ca plutot:
//   //const newTour = await Tour.create(req.body); //create ca va etre une promesse qui va etre gerer avec await car la func est async et dedans on envoi req.body pour recuperer les donnees de la request

//   // res.status(201).json({
//   //   //200 veut dire ok 201 veut dire creer
//   //   status: 'success',
//   //   data: {
//   //     tour: newTour,
//   //   },
//   // });
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
// });

//
//ancienne fonction quand on avait encore la lecture du fichier tours
// const newId = tours[tours.length - 1].id + 1; //pour donner l id au nouvo tour
// const newTour = Object.assign({ id: newId }, req.body); //creer un nouvel objet pr le nv tour
// tours.push(newTour); //ajoute le nouveau tour a la liste
// //on relis car on a eu un overide
// fs.writeFile(
//   `${__dirname}/dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   (err) => {
//     res.status(201).json({
//       //200 veut dire ok 201 veut dire creer
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
//   },
// );
//
//FONCTION CREATE APRES LE HANDLERFACTORY.JS:
exports.createTour = factory.createOne(Tour);

//fonction qui maj le tour avant le handlerFactory qui nous simplifie la maj de partout:
// exports.updateTour = catchAsync(async (req, res, next) => {
//   //try {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true, //pour renvoyer le doc maj
//   });

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour, // c est comme faire ca tour: tour,
//     },
//   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
// });

//fonction maj avec factory :
exports.updateTour = factory.updateOne(Tour);

//
//fonction qui supprime le tour avec le handlerFactory.js:
exports.deleteTour = factory.deleteOne(Tour);
//ca c etait le deleteTour avant de faire le handlerFactory.js
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   //try {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   //204 c est le code pr supprimer
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// } catch (err) {
//   res.status(404).json({
//     status: 'fail',
//     message: err,
//   });
// }
//});

//pipline d aggregation:
exports.getTourStats = catchAsync(async (req, res, next) => {
  //try {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // va regrouper selon l id qui sera suivant la difficulte ou la note par ex et mettre numtours etc
        _id: { $toUpper: '$difficulty' }, // mettre en majuscule le titre
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: -1 }, //-1 pr du grand au petit 1 pr du petit au grand
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

//le pipeline d aggregation ns aide a regler des problemes tel que commerciaux imaginons une societe
//ns demande ds ql mois ya le plus de tours pr quil puisse engager des employer ba avc ca c facile:
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  //try {
  const year = req.params.year * 1; //*1 pr transformer string en

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', //unwind va diviser un tableau par ex de 3 dates en 3 fois different par ex [1,2,3] donnera 1 , 2 , 3
    },

    {
      $match: {
        startDates: {
          //on veut les date du 1er janvier de l annee au 31 decembre
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        //on veut regrouper par mois
        _id: { $month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' }, // va creer un tableau pr chaque mois avc le nom des tours qui sont sur ce mois
      },
    },
    {
      $addFields: { month: '$_id' }, //ajoute un texte ds le doc par ex ici month: 7 par ex c le num de l id
    },
    {
      $project: {
        _id: 0, // 0 enleve l id , 1 le met
      },
    },
    {
      $sort: { numToursStarts: 1 }, //tri du petit au grd on peut faire -1
    },
    {
      $limit: 12, // il n y aura plus que 6 resultat sur les 12 mois par exp donc remettons 12
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

//geospatial:
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
