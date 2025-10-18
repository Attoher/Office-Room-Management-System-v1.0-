// utils/responseHelper.js
export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  const response = {
    status: 'success',
    data,
    message
  };
  
  // Add count only for arrays
  if (Array.isArray(data)) {
    response.count = data.length;
  }
  
  res.status(statusCode).json(response);
};

export const sendError = (res, error, statusCode = 500) => {
  console.error('❌ Controller Error:', error);
  
  const response = {
    status: 'error',
    error: error.message || 'Internal server error'
  };
  
  // Add details only in development
  if (process.env.NODE_ENV === 'development') {
    response.details = error.details;
    response.stack = error.stack;
  }
  
  res.status(statusCode).json(response);
};