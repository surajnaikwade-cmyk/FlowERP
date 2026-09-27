const hasRole = (user, allowedRoles) =>
  Boolean(user && allowedRoles.includes(user.role));

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!hasRole(req.user, allowedRoles)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = authorize;
module.exports.hasRole = hasRole;
