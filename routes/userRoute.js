const express = require('express');
const { getUser, setUser } = require('../controllers/userController');
const router = express.Router();

router.route("/").post(setUser);
router.post('/login', getUser);
module.exports = router; 