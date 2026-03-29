function validateBody(rules = []) {
  return (req, res, next) => {
    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        return res.status(400).json({ message: `${rule.field} is required` });
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (rule.type === 'number' && Number.isNaN(Number(value))) {
        return res.status(400).json({ message: `${rule.field} must be a number` });
      }

      if (rule.type === 'string' && typeof value !== 'string') {
        return res.status(400).json({ message: `${rule.field} must be a string` });
      }

      if (rule.minLength && String(value).length < rule.minLength) {
        return res.status(400).json({ message: `${rule.field} must be at least ${rule.minLength} characters` });
      }

      if (rule.enum && !rule.enum.includes(value)) {
        return res.status(400).json({ message: `${rule.field} must be one of ${rule.enum.join(', ')}` });
      }
    }

    return next();
  };
}

module.exports = {
  validateBody,
};
