
exports.isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      message: 'Please log in first'
    });
  }

  next();
};

exports.isAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      message: 'Please log in first'
    });
  }

  if (req.session.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access only'
    });
  }

  next();
};
