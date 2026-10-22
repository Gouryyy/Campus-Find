exports.validateItem = (req, res, next) => {
  const { title, type, category, description, location, date } = req.body;

  if (!title || !type || !category || !description || !location || !date) {
    return res.status(400).json({ message: 'All item fields are required' });
  }

  if (!['Lost', 'Found'].includes(type)) {
    return res.status(400).json({ message: 'Type must be Lost or Found' });
  }

  next();
};