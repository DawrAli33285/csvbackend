const express = require('express');
const cors = require('cors');
const path=require('path')
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoute'); 
const adminRoutes = require('./routes/adminRoute'); 
const fileRoutes = require('./routes/fileRoute');
const csvModel = require('./csvmodel');
require('dotenv').config()
const port = process.env.PORT||5000;
const app = express();

app.use(cors());
app.use(express.json()); 

const basePath = process.env.NODE_ENV === 'production' 
  ? '/tmp/files'  
  : './local-files';  

app.use('/files/:id',async(req,res)=>{
  try{
let file=await csvModel.findOne({_id:id})
return res.status(200).json({
url:file.url
})
  }catch(e){
    return res.status(400).json({
      error:"Cant access the file"
    })
  }
} );


app.use("/api/user", userRoutes);
app.use("/api/files",fileRoutes)
app.use('/api/admin',adminRoutes)

mongoose.connect('mongodb+srv://user:user@cluster0.pfn059x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});