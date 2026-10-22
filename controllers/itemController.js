const Item = require('../models/Item');

exports.getAllItems = async (req, res) => {
  try {
    const { type, category, location, status } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    filter.status = status || 'Active';

    const items = await Item.find(filter).sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Could not retrieve items' });
  }
};

exports.getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(400).json({ message: 'Invalid item ID' });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { title, type, category, description, location, date } = req.body;

    if (!title || !type || !category || !description || !location || !date) {
      return res.status(400).json({
        message: 'Please provide all required item details'
      });
    }

    if (!['Lost', 'Found'].includes(type)) {
      return res.status(400).json({ message: 'Type must be Lost or Found' });
    }

    const item = await Item.create({
      title,
      type,
      category,
      description,
      location,
      date,
      status: 'Active',
      userId: req.session.userId
    });

    res.status(201).json({
      message: 'Item reported successfully',
      item
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not create item' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.userId.toString() !== req.session.userId &&
        req.session.role !== 'admin') {
      return res.status(403).json({ message: 'You cannot update this item' });
    }

    const allowedFields = [
      'title',
      'category',
      'description',
      'location',
      'date',
      'status'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    }

    await item.save();

    res.json({
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    res.status(400).json({ message: 'Could not update item' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.userId.toString() !== req.session.userId &&
        req.session.role !== 'admin') {
      return res.status(403).json({ message: 'You cannot delete this item' });
    }

    await item.deleteOne();

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Could not delete item' });
  }
};