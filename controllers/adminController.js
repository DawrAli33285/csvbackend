const csvModel = require("../csvmodel");
const usermodel = require("../usermodel");
let jwt=require('jsonwebtoken')
const nodefetch = require('node-fetch');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const axios=require('axios')

const outputDir = path.join(__dirname, '../tmp/public/files');


module.exports.adminLogin=async(req,res)=>{
    let {email,password}=req.body;
    try{
        let admin=await usermodel.findOne({email})
        if(admin){
            let passwordMatch=await usermodel.findOne({password})
if(!passwordMatch){
    return res.status(500).json({ error: "Incorrect password" });
}
let newadmin=await jwt.sign({admin},'FDKFSKFKSDFKSDFKDAKFKAFKAVKCXVXKGKDSGSDIGSDIGSDIGSD')
return res.status(200).json({
    token:newadmin
})
        }else{
            return res.status(400).json({ error: "Incorrect email" });
        }

    }catch(e){
        console.log(e.message)
        return res.status(400).json({ error: "Error logging in" });
    }
}


module.exports.registerAdmin=async(req,res)=>{
    let {email,password}=req.body;
    try{
        let alreadyCreated=await usermodel.findOne({email})
        if(alreadyCreated){
            return res.status(400).json({
               error:"User already exists"
            })
        }
let admin=await usermodel.create({email,password})
return res.status(200).json({
    admin
})
    }catch(e){
        return res.status(400).json({error: "Error registering admin" });
    }
}



module.exports.getFiles=async(req,res)=>{

    try{
let files=await csvModel.find({}).populate('user')
return res.status(200).json({
    files
})
    }catch(e){
        return res.status(400).json({error: "Error registering admin" });
    }
}


module.exports.enrichifyData = async (req, res) => {
    let { file,id } = req.params;
  
    try {
        const response = await fetch(`http://localhost:5000/files/${file}`);
        if (!response.ok) throw new Error('Failed to fetch file');

        const readableStream = Readable.fromWeb(response.body);
        const results = [];
        
        await new Promise((resolve, reject) => {
            readableStream
                .pipe(csv({
                    separator: ',', 
                    skipLines: 0,
                    headers: [     
                        'First Name',
                        'Last Name',
                        'Email',
                        'Address',
                        'State',
                        'Phone',
                        'URL',
                        'Lead Source',
                        'Lead Quality',
                        'Credit Score'
                    ],
                    mapValues: ({ header, value }) => {
                      
                        if (Array.isArray(value)) {
                            return String.fromCharCode(...value);
                        }
                        return value.trim();
                    }
                }))
                .on('data', async(data) => {
                    const params = {
                        format: "json",
                        id: "DvHdwMzHAPvQ4quyNYq8a4**", 
                        act: "Append,Check,Verify,Move",
                        cols: "AddressLine1,City,State,PostalCode,EmailAddress,TopLevelDomain",
                        first: data.firstName,
                        last: data.lastName,
                        full:data.firstName+' '+data.lastName,
                        a1: data.address,
                        state: data.state,
                        email: data.email,
                        phone: data.phone,
                      };
                      
                   
                      
                      const melisaresponse = await axios.get(
                        "https://personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify",
                        { params }
                      );

                   
                    results.push(melisaresponse.data.Records[0]);
                })
                .on('end', resolve)
                .on('error', reject);
        });

let fileName=`enriched_${file}_${Date.now()}.csv`
        const csvWriter = createObjectCsvWriter({
            path: path.join(outputDir, fileName),
            header: [
                { id: 'FirstName', title: 'First Name' },
                { id: 'LastName', title: 'Last Name' },
                { id: 'AddressLine1', title: 'Address' },
                { id: 'City', title: 'City' },
                { id: 'State', title: 'State' },
                { id: 'PostalCode', title: 'Zip Code' },
                { id: 'EmailAddress', title: 'Verified Email' },
                { id: 'TopLevelDomain', title: 'Email Domain' },
                { id: 'Phone', title: 'Verified Phone' }
            ]
        });

      
        await csvWriter.writeRecords(results);

        await csvModel.findByIdAndUpdate(id,{
            $set:{
                file:fileName
            }
        })


        return res.status(200).json(results);
    } catch (e) {
        console.error('Processing error:', e);
        return res.status(500).json({ error: "Error processing file" });
    }
};