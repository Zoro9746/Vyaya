/**
 * Reports Routes
 */

const express = require('express');
const { getReportData, getExcelData } = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/data', getReportData);
router.get('/excel', getExcelData);

module.exports = router;
