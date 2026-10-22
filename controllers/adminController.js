const Item = require('../models/Item');

exports.getDashboard = async (req, res) => {
  try {
    const totalItems = await Item.countDocuments();
    const activeItems = await Item.countDocuments({ status: 'Active' });
    const recoveredItems = await Item.countDocuments({ status: 'Recovered' });

    res.json({ totalItems, activeItems, recoveredItems });
  } catch (error) {
    res.status(500).json({ message: 'Could not load admin dashboard' });
  }
};