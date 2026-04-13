/**
 * Require the authenticated user (req.user, set by auth middleware) to have
 * one of the allowed roles. Use AFTER the authenticate middleware.
 *
 *   router.get('/', authenticate, requireRole('admin'), handler);
 *   router.post('/', authenticate, requireRole(['admin', 'manager']), handler);
 */
module.exports = function requireRole(allowed) {
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
