const mongoose = require('mongoose');

// eslint-disable-next-line import/no-extraneous-dependencies
const slugify = require('slugify');

// eslint-disable-next-line import/no-extraneous-dependencies
const validator = require('validator');
const User = require('./userModel');

//Creer un model tour simple pour nos visites:
const tourSchema = new mongoose.Schema(
  {
    name: {
      //on doit lui definir un type mais on peut aussi ajouter une obligation d etre present et le message d erreur
      type: String,
      required: [true, 'A tour must have a name!'],
      unique: true, //pour qu on ai des noms unique
      trim: true,
      maxLength: [40, 'A tour name must have less or equal 40 characters'], // c est des validateurs ca
      minLength: [10, 'A tour name must have more or equal 10 characters'],
      //validate: [validator.isAlpha, 'Tour name must only contain characters'], // vient de require validator sert a dire que le nom doit contenir que des character! c est naze car espace etc sont pas accordes
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a diffiulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'], // validateur si c autre chose c pas bon
        message: 'Difficulty is either : easy,medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5, //chiffre par default au cas ou on entre pas de note
      min: [1, 'Rating must be above 1.0'], //validateur qui renvoi l erreur si la condition est fausse
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, //pour arrondir par ex: 4.666667 a 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price !'],
    },
    priceDiscount: {
      //ici ns allons faire un custom validation c a dire propre a ns
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current doc on NEW document creation:
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true, //coupera les espace inutile comme "      sds         " ca done "sds"
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], //un tableau de string d image pr avoir plusieurs
    createdAt: {
      type: Date,
      default: Date.now(), //data du jour
    },
    startDates: [Date], //tableau de date avec differentes date de debut de la tournee
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true }, //activera les virtuelles pr les truc pas stockers ds la db
    toObject: { virtuals: true },
  },
);

//grace a ca ds notre analyse de stat faite ds handlerFactory par ex ds lcas ou on ve qles prix <1000:
//au lieu que ca analyse tous les tour (ici que 9 mais des fois ce sera +) ca analyse que les 3 bons
//tourSchema.index({ price: 1 }); // 1 pr croissant -1 pr decroissant
tourSchema.index({ price: 1, ratingsAverage: -1 }); // 1 pr croissant -1 pr decroissant
tourSchema.index({ slug: 1 });

//geospatial:
tourSchema.index({ startLocation: '2dsphere' });

//virtual c cqui na pas forcement besoin d etre stocker ds la db:
tourSchema.virtual('durationWeeks').get(function () {
  // on utilise une function ici et pas une function fleche car on a besoin du this
  return this.duration / 7;
});

//virtual populate:
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//tout comme express mongoose a des middleware :
//DOCUMENT MIDDLEWARE : runs before .save() and create()
tourSchema.pre('save', function (next) {
  // console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});
//on peut faire post aussi
// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//
//
//Par integration: par exemple ca peut etre moins bien si les guides sont stockes et que par exemple il change le mail alors faudra refaire le travail etc:
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   //le resultat de guidesPromises sera un tableau des promesse donc on va les utiliser:
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
//
//
//
//QUERY MIDDLEWARE :
//tourSchema.pre('find', function (next) { ca marche que pr find mais pas pr findOne ou findAndDelete etc donc on fait:
tourSchema.pre(/^find/, function (next) {
  // ceci prendra tt cqui commence par find donc aussi findOne ...
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -passwordResetExpires -passwordResetToken',
  });
  next();
});

//post aussi:
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   //console.log(docs);
//   next();
// });

//AGGREGATION MIDDLEWARE:
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //unshift ajoute au debut du tableau
//   //console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema); // va creer le schema du tour

module.exports = Tour;
