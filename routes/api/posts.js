const express = require('express');
const router = express.Router();


// @route GET api/Posts
// @desc test route
// @access public
router.get('/', (req, res) => res.send('Posts route'))

module.exports = router;