// middleware/sanitize.js
// This middleware sanitizes user input to prevent XSS attacks.
// It uses DOMPurify to clean the input data before it reaches the controllers.
const DOMPurify = require('isomorphic-dompurify');

const sanitizeInput = (req, res, next) => {
  for (let key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = DOMPurify.sanitize(req.body[key]);
    }
  }
  next();
};

module.exports = sanitizeInput;