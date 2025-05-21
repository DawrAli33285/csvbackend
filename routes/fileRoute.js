const express = require('express');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage() 
});
const { saveFile, getFiles } = require('../controllers/filesController');

const router = express.Router();

router.post("/", upload.single('file'),saveFile);
router.get('/', getFiles);

module.exports = router;