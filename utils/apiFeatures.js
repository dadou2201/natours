class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1.Filtering
    const queryObj = { ...this.queryString };
    //on veut exclure ces mot de la requette : donc ca gardera pas cela
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    //console.log(req.query, queryObj);

    //2.Advanced filtering: pour pouvoir avoir en filtre less than , gretter than or equal etc
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr));

    //let query = Tour.find(JSON.parse(queryStr));
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      //console.log(this.queryString.sort);
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      //si egalite sur le prix on ajoute un autre filtre par exp : sort('price ratingAverage)'
      //dans la requette on fera : 127.0.0.1:3000/api/v1/tours?sort=price,ratingAverage
    } else {
      this.query = this.query.sort('-createdAt'); //pour trier par date de creation !
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // on fait - pr exclure ds le json le __v
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
