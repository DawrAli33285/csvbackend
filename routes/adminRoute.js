const router=require('express').Router();
const {adminLogin,registerAdmin,getFiles,enrichifyData}=require('../controllers/adminController')
router.post('/admin-login',adminLogin)
router.post('/admin-register',registerAdmin)
router.get('/get-files',getFiles)
router.get('/enrichifyData/:file/:id',enrichifyData)

module.exports=router;