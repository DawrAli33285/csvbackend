const mongoose=require('mongoose')

const csvSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'user'
    },

    file:{
        type:String,
        required:true
    },
    payed:{
        type:Boolean,
        default:false
    }

},{timestamps:true})



const csvModel=mongoose.model('csvmodel',csvSchema)

module.exports=csvModel;