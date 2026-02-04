/**
 * Dashboard Routes
 */

const express = require('express');
const { getDashboard, getAlerts } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getDashboard);
router.get('/alerts', getAlerts);

module.exports = router;
