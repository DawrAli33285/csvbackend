const cloudinary = require('cloudinary').v2;
const path=require('path')
const fs=require('fs')

cloudinary.config({
  cloud_name:"dbjwbveqn",
  api_key: "774241215571685",
  api_secret: "ysIyik3gF03KPDecu-lOHtBYLf8"
});



module.exports.cloudinaryUploadPdf = async (filePath) => { 
    try {
     
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
  
      const data = await cloudinary.uploader.upload(filePath, { 
        resource_type: 'auto',
        folder: process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
      });
      
      return {
        url: data.secure_url
      };
    } catch(e) {
      console.error('Cloudinary upload error:', e);
      throw new Error('File upload failed');
    }
  };