const express = require('express');
const router = express.Router();

const claimController = require('../controllers/claimController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, claimController.getClaims);
router.post('/', isAuthenticated, claimController.createClaim);
router.patch('/:id', isAuthenticated, claimController.updateClaim);

module.exports = router;