const express = require('express');
const router = express.Router();

const itemController = require('../controllers/itemController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { validateItem } = require('../middleware/validationMiddleware');

// Get potential matches for an item
router.get(
  '/:id/matches',
  isAuthenticated,
  async (req, res) => {
    try {
      const Item = require('../models/Item');
      const { findPotentialMatches } =
        require('../services/matchingService');

      const item = await Item.findById(req.params.id);

      if (!item) {
        return res.status(404).json({
          message: 'Item not found'
        });
      }

      const matches = await findPotentialMatches(item);

      res.json({ matches });
    } catch (error) {
      console.error('Error finding matches:', error);
      res.status(500).json({
        message: 'Failed to find potential matches'
      });
    }
  }
);

router.get('/', itemController.getAllItems);
router.get('/:id', itemController.getItem);
router.post('/', isAuthenticated, validateItem, itemController.createItem);
router.put('/:id', isAuthenticated, itemController.updateItem);
router.delete('/:id', isAuthenticated, itemController.deleteItem);

module.exports = router;