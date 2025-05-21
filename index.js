const express = require('express');
const cors = require('cors');
const path=require('path')
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoute'); 
const adminRoutes = require('./routes/adminRoute'); 
const fileRoutes = require('./routes/fileRoute');
const port = 5000;
const app = express();

app.use(cors());
app.use(express.json()); 

app.use('/files', express.static(path.join(__dirname, 'tmp', 'public', 'files')));

app.use("/api/user", userRoutes);
app.use("/api/files",fileRoutes)
app.use('/api/admin',adminRoutes)

mongoose.connect('mongodb://localhost:27017/csvfileupload')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});