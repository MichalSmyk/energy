const express = require('express');
const router = express.Router();
const  orderController = require('./fetchOrder');

router.get('/', orderController.getFulfillments)

module.exports = router;