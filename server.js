const mongoose = require('mongoose');

const dotenv = require('dotenv');

//fixer les erreurs pas attraper par exemple x qui n est pas defini:
process.on('uncaughtException', (err) => {
  //console.log('UNCAUGHT EXCEPTION! Shutting down...');
  //console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

//va remplacer dans le lien database stocker dans config.env le PASSWORD par notre mdp de la db
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

//connecter la db avec l application
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection succressful!'));
//.catch((err) => console.log('ERROR')); on va le faire globalement

// //creeon un nouveau tour: si on sauvegarde plus d une fois on a une erreure parcque dans tour le nom doit etre unique
// // const testTour = new Tour({
// //   name: 'The Forest Hiker',
// //   rating: 4.7,
// //   price: 497,
// // });

// //un autre ex sans la note qu on a defini a 4.5 par default et ca marche !
// const testTour = new Tour({
//   name: 'The Park Camp',
//   price: 997,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR', err);
//   }); //va sauvegarder le testtour dans la db et faire then catch car c est une promesse

// console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  //console.log(`App run on port ${port}...`);
});

//globalement l erreur qd le mdp est pas bon par exemple:
process.on('unhandledRejection', (err) => {
  //console.log('UNHANDLER REJECTION! Shutting down...');
  //console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

//console.log(x); uncaught expression .
