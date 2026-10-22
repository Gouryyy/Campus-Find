const express = require('express');
const router = express.Router();

const itemController = require('../controllers/itemController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { validateItem } = require('../middleware/validationMiddleware');

router.get('/', itemController.getAllItems);
router.get('/:id', itemController.getItem);
router.post('/', isAuthenticated, validateItem, itemController.createItem);
router.put('/:id', isAuthenticated, itemController.updateItem);
router.delete('/:id', isAuthenticated, itemController.deleteItem);

module.exports = router;