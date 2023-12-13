//DBosfyYWFO2IpZFg:code db
//site a voir pr la doc : expressjs.com
const path = require('path');
const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
// eslint-disable-next-line import/no-extraneous-dependencies
const rateLimit = require('express-rate-limit');
// eslint-disable-next-line import/no-extraneous-dependencies
const helmet = require('helmet');

// eslint-disable-next-line import/no-extraneous-dependencies
const mongoSanitize = require('express-mongo-sanitize');
// eslint-disable-next-line import/no-extraneous-dependencies
const xss = require('xss-clean');
// eslint-disable-next-line import/no-extraneous-dependencies
const hpp = require('hpp');

// eslint-disable-next-line import/no-extraneous-dependencies
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

//utilisations d express:
// start express app:
const app = express();

// on commence a remplir le site web :
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1. Global Middlewares (le 2. est route handlers vers la ligne 160)
//serving static files:
//app.use(express.static(`${__dirname}/public`)); //accede aux fichiers du filesystem comme public a gauche ds ctrl+b
app.use(express.static(path.join(__dirname, 'public')));

//Set Security http headers
//app.use(helmet());
const scriptSrcUrls = ['https://unpkg.com/', 'https://tile.openstreetmap.org'];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = ['https://unpkg.com', 'https://tile.openstreetmap.org'];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

//set security http headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  }),
);

//development logging:
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //je crois qu il va ns dire en gros ds la console le resultat de notre deamnde par ex: GET /api/v1/tours/233 404 0.532 ms - 40 pqrcqeu lerreur
}

//nombre max de requettes par api , comme recherche de tour etc :
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP , please try again in an hour!',
});
app.use('/api', limiter);

//body parser,reading data from body into req.body:
app.use(express.json({ limit: '10kb' })); // middleware ->ce situe entre la reponse et la demande,sans ca quand on va poster le resultat sera undefined
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//data sanitization against NoSQL query injection:
app.use(mongoSanitize());

//data sanitization against XSS:
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

//creer notre propre middleware:
// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   next(); // oblige sinn ca bloque car ca ne passe pas au suivant ds le middleware c comme ca
// });

//creer notre propre middleware mais ce coup ci en manipulant et utilisant les donnees:
//test middleware:
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //ns permettra d utiliser ds les autres endroit cette methode
  //console.log(x); //uncaught expression voir si ca marche
  //console.log(req.cookies);
  next(); // oblige sinn ca bloque car ca ne passe pas au suivant ds le middleware c comme ca
});

/*
//methode http get:
app.get('/', (req, res) => {
  //res.status(200).send('Hello from the server side!'); // on test sur postman l api en entrant 127.0.0.1:3000 ou comme ca aussi pr avoir du json
  res
    .status(200)
    .json({ message: 'Hello from the server side!', app: 'Natours' });
});

//methode http post:
app.post('/', (req, res) => {
  res.send('You can post to this endpoint...');
});


//lire les donnees du json pour les tours:
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

//recevoir les donnees :
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length, // bonus pr savoir la taille
    data: {
      tours, //c est comme ecrire tours: tours car meme nom on peut faire comme ca
    },
  });
});

//recevoir avc le id: le ? dans y c est pour dire si on met rien c undef au lieu de planter
//app.get('/api/v1/tours/:id/:x/:y?', (req, res) => {
app.get('/api/v1/tours/:id', (req, res) => {
  console.log(req.params);

  const id = req.params.id * 1; //convertit le string en chiffre
  const tour = tours.find((el) => el.id === id); // permet de trouver lequel a le bon id

  //check1 si le chiffre demander n existe pas :
  //   if (id > tours.length) {
  //     return res.status(404).json({
  //       status: 'fail',
  //       message: 'Invalid id',
  //     });
  //   }

  //check2:
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid id',
    });
  }

  //recoit les donnees du bon chiffre:
  res.status(200).json({
    status: 'success',
    data: {
      tours: tour,
    },
  });
});

//poster un nouveau:
app.post('/api/v1/tours', (req, res) => {
  //console.log(req.body); ca ns affiche dans la console ce qu on a creer sur postman quand on fait send

  const newId = tours[tours.length - 1].id + 1; //pour donner l id au nouvo tour
  const newTour = Object.assign({ id: newId }, req.body); //creer un nouvel objet pr le nv tour

  tours.push(newTour); //ajoute le nouveau tour a la liste

  //on relis car on a eu un overide
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        //200 veut dire ok 201 veut dire creer
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
});

//MAJ des donnees:
app.patch('/api/v1/tours/:id', (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid id',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    },
  });
});

//suppression:
app.delete('/api/v1/tours/:id', (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid id',
    });
  }
  //204 c est le code pr supprimer
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`App run on port ${port}`);
});
*/

/**********************************************
 * ********************************************
 * ********************************************
 */

//ON VEUT REORGANISER UN PEU HISTOIRE QUE CE SOIT PLUS CLAIR DANS LE CODE:
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
// );

//2.ROUTE HANDLERS
// //fonction recoit tt les tours:
// const getAllTours = (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime, //ns mettra ds le json la data et heure a lql on a demander
//     results: tours.length, // bonus pr savoir la taille
//     data: {
//       tours, //c est comme ecrire tours: tours car meme nom on peut faire comme ca
//     },
//   });
// };

// //fonction qui recoit les tours avc le numero:
// const getTour = (req, res) => {
//   console.log(req.params);

//   const id = req.params.id * 1; //convertit le string en chiffre
//   const tour = tours.find((el) => el.id === id); // permet de trouver lequel a le bon id

//   //check1 si le chiffre demander n existe pas :
//   //   if (id > tours.length) {
//   //     return res.status(404).json({
//   //       status: 'fail',
//   //       message: 'Invalid id',
//   //     });
//   //   }

//   //check2:
//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid id',
//     });
//   }

//   //recoit les donnees du bon chiffre:
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tours: tour,
//     },
//   });
// };

// //fonction qui creer un nouveau tour:
// const createTour = (req, res) => {
//   const newId = tours[tours.length - 1].id + 1; //pour donner l id au nouvo tour
//   const newTour = Object.assign({ id: newId }, req.body); //creer un nouvel objet pr le nv tour
//   tours.push(newTour); //ajoute le nouveau tour a la liste
//   //on relis car on a eu un overide
//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     (err) => {
//       res.status(201).json({
//         //200 veut dire ok 201 veut dire creer
//         status: 'success',
//         data: {
//           tour: newTour,
//         },
//       });
//     }
//   );
// };

// //fonction qui maj le tour :
// const updateTour = (req, res) => {
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid id',
//     });
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: '<Updated tour here...>',
//     },
//   });
// };

// //fonction qui supprime le tour:
// const deleteTour = (req, res) => {
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid id',
//     });
//   }
//   //204 c est le code pr supprimer
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// };

// //fonction qui recoit tt les users:
// const getAllUsers = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };

// //fonction qui recoit un user:
// const getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };

// //fonction qui creer un user:
// const createUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };

// //fonction qui update un user:
// const updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };

// //fonction qui supprime un user:
// const deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };

//3.ROUTE:
//const tourRouter = express.Router(); // va ns servir de faire pr chaque chose son propre router

//const userRouter = express.Router(); // pr les users

//recevoir les donnees de tt les tours :
// app.get('/api/v1/tours', getAllTours);
//recevoir les donnees du tour en question
// app.get('/api/v1/tours/:id', getTour);
//poster un nouveau:
// app.post('/api/v1/tours', createTour);
//MAJ des donnees:
// app.patch('/api/v1/tours/:id', updateTour);
//suppression:
// app.delete('/api/v1/tours/:id', deleteTour);

//mais il existe une meilleure facon d ecrire cela pour que ce soit mieux lisible :
//ici en commentaire parcquon va creer pr chacun leur fichier
// tourRouter.route('/').get(getAllTours).post(createTour);
// tourRouter.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

//faisons de meme pour les users:
// userRouter.route('/').get(getAllUsers).post(createUser);
// userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

//3.Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//envoi message d erreur si la requete est pas bonne:
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  //next(err)// on met ici err contrairement au autre next ou on mettait rien pr dire erreur et donc go ds le middleware de gestion d erreur

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//middleware de gestion d erreur:
app.use(globalErrorHandler);

//4. START SERVER que au final en refactorisans le code sera mis dans server.js
// const port = 3000;
// app.listen(port, () => {
//   console.log(`App run on port ${port}...`);
// });

module.exports = app;
