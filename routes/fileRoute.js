const express = require('express');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage() 
});
const { saveFile, getFiles, getFile } = require('../controllers/filesController');

const router = express.Router();

router.post("/", upload.single('file'),saveFile);
router.get('/', getFiles);
router.post("/:id",getFile);
module.exports = router;