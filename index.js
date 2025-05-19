const express=require('express')
const cors=require('cors')
const mongoose=require('mongoose')

const app=express();
app.use(cors())

mongoose.connect(`mongodb://127.0.0.1/csvfileupload`)

