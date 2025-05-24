const express = require('express');
const cors = require('cors');
const path=require('path')
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoute'); 
const adminRoutes = require('./routes/adminRoute'); 
const fileRoutes = require('./routes/fileRoute');
require('dotenv').config()
const port = process.env.PORT||5000;
const app = express();

app.use(cors());
app.use(express.json()); 

const basePath = process.env.NODE_ENV === 'production' 
  ? '/tmp/files'  // Correct production path
  : './local-files';  // Development path

app.use('/files', express.static(basePath));


app.use("/api/user", userRoutes);
app.use("/api/files",fileRoutes)
app.use('/api/admin',adminRoutes)

mongoose.connect('mongodb+srv://user:user@cluster0.pfn059x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});