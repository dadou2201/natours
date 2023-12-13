//fonction qui va remplacer les try catch pour avoir du code plus lisible:
module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
