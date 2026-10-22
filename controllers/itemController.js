
const Item = require('../models/Item');

exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Failed to retrieve items' });
  }
};

exports.getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('userId', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve item' });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { title, type, category, description, location, date, imageUrl } = req.body;

    if (!title || !type || !category || !description || !location || !date) {
      return res.status(400).json({
        message: 'Title, type, category, description, location and date are required'
      });
    }

    const item = await Item.create({
      title,
      type,
      category,
      description,
      location,
      date,
      imageUrl: imageUrl || '',
      userId: req.session.userId
    });

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Failed to create item' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (
      item.userId.toString() !== req.session.userId &&
      req.session.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    const allowedFields = [
      'title', 'type', 'category', 'description',
      'location', 'date', 'imageUrl', 'status'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();
    res.json({ message: 'Item updated successfully', item });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Failed to update item' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (
      item.userId.toString() !== req.session.userId &&
      req.session.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await item.deleteOne();
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Failed to delete item' });
  }
};
