const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/explorer');
const Utils = require('./../Utils');

/* Get Product Categories. */
router.get('/', Utils.paramValidator, categoryController.getData);

module.exports = router;
