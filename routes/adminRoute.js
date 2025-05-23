const router=require('express').Router();
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage() 
});

const {adminLogin,updateFile,sendCode,unlocked,registerAdmin,getUserFiles,getUsers,getFiles,enrichifyData}=require('../controllers/adminController')
router.post('/admin-login',adminLogin)
router.post('/admin-register',registerAdmin)
router.get('/get-files',getFiles)
router.get('/enrichifyData/:file/:id',enrichifyData)
router.get('/getUsers',getUsers)
router.get('/getUserFiles/:id',getUserFiles)
router.put('/files/:id', upload.single('file'), updateFile);
router.post('/sendCode/:id',sendCode)
router.post('/unlocked/:id',unlocked)
module.exports=router;