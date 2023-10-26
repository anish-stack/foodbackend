const sendErrorResponse = (res, error) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(statusCode).json({ success: false, error: message });
  };
  
  const catchAsyncErrors = (fn) => {
    return (req, res, next) => {
      fn(req, res, next).catch((error) => sendErrorResponse(res, error));
    };
  };

  module.exports=catchAsyncErrors