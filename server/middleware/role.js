const isStudent = (req, res, next) => {
  if (req.user?.role === 'student') return next();
  return res.status(403).json({ message: 'Access denied: Students only' });
};

const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied: Admins only' });
};

module.exports = { isStudent, isAdmin };
