const mongoose=require('mongoose')

const csvSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'user'
    },

    file:{
        type:String,
        required:true
    }

})



const csvModel=mongoose.model('csvmodel')

module.exports=csvModel;