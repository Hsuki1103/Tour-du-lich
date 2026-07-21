export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('❌ Error:', error);

  // Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    return res.status(400).json({
      success: false,
      message: `Lỗi xác thực dữ liệu: ${message}`
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = err.errors.map(e => e.message).join(', ');
    return res.status(400).json({
      success: false,
      message: `Dữ liệu đã tồn tại: ${message}`
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Lỗi ràng buộc khóa ngoại. Dữ liệu không hợp lệ.'
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File quá lớn. Kích thước tối đa là 5MB.'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ'
  });
};

// 404 Not Found middleware
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route: ${req.originalUrl}`
  });
};