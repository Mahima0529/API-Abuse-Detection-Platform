/**
 * Wraps async express route handlers to pass unhandled rejections to error middleware.
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = asyncHandler;
