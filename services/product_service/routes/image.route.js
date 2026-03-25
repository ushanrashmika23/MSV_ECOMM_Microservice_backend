const express = require('express');
const router = express.Router();
const controller = require('../controllers/imageController');

router.post('/', controller.addImage);
router.get('/product/:productId', controller.getImagesByProduct);
router.delete('/:id', controller.deleteImage);

module.exports = router;