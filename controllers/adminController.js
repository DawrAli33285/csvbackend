const csvModel = require("../csvmodel");
const usermodel = require("../usermodel");
let jwt = require('jsonwebtoken')
const nodefetch = require('node-fetch');
const nodemailer = require('nodemailer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const {cloudinaryUploadPdf}=require('../cloudinary')
const path = require('path');
const axios = require('axios');
const adminModel = require("../adminmodel");


// const outputDir ="/tmp/public/files/images"
const outputDir = process.env.NODE_ENV === 'production' 
  ? '/tmp/files'
  : path.join(__dirname, 'local-files');

module.exports.adminLogin = async (req, res) => {
    let { email, password } = req.body;
    try {
        let admin = await adminModel.findOne({ email })
        if (admin) {
            let passwordMatch = await adminModel.findOne({ password })
            if (!passwordMatch) {
                return res.status(500).json({ error: "Incorrect password" });
            }
            let newadmin = await jwt.sign({ admin }, 'FDKFSKFKSDFKSDFKDAKFKAFKAVKCXVXKGKDSGSDIGSDIGSDIGSD')
            return res.status(200).json({
                token: newadmin
            })
        } else {
            return res.status(400).json({ error: "Incorrect email" });
        }

    } catch (e) {
        console.log(e.message)
        return res.status(400).json({ error: "Error logging in" });
    }
}


module.exports.registerAdmin = async (req, res) => {
    let { email, password } = req.body;
    try {
        let alreadyCreated = await adminModel.findOne({ email })
        if (alreadyCreated) {
            return res.status(400).json({
                error: "User already exists"
            })
        }
        let admin = await adminModelfa.create({ email, password })
        return res.status(200).json({
            admin
        })
    } catch (e) {
        return res.status(400).json({ error: "Error registering admin" });
    }
}


module.exports.getFiles = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      const total = await csvModel.countDocuments({});
      
      const files = await csvModel.find({})
        .populate('user')
        .skip(skip)
        .limit(limit);
  
      return res.status(200).json({
        files,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalFiles: total
      });
    } catch (e) {
      return res.status(400).json({ error: "Error fetching files" });
    }
  }

  module.exports.enrichifyData = async (req, res) => {
    let { file, id } = req.params;

    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });  
        }
        const response = await fetch(`https://csvbackend.vercel.app/files/${file}`);
        const fileData = await csvModel.findOne({ _id: id }).populate('user');
        if (!response.ok) throw new Error('Failed to fetch file');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'support@enrichifydata.com',
                pass: 'ymancwakzaxdpmqg'
            }
        });
        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        const readableStream = Readable.fromWeb(response.body);
        const results = [];
        console.log(`User email: ${fileData.user.email}`);

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
                .on('data', async (data) => {
                    const params = {
                        format: "json",
                        id: "DvHdwMzHAPvQ4quyNYq8a4**",
                        act: "Append,Check,Verify,Move",
                        cols: "AddressLine1,City,State,PostalCode,EmailAddress,TopLevelDomain",
                        first: data.firstName,
                        last: data.lastName,
                        full: data.firstName + ' ' + data.lastName,
                        a1: data.address,
                        state: data.state,
                        email: data.email,
                        phone: data.phone,
                    };

                    try {
                        const melisaresponse = await axios.get(
                            "https://personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify",
                            { params }
                        );
                        const melissaRecord = melisaresponse?.data?.Records[0] || {};

                        
                        const mergedRecord = {
                            FirstName: melissaRecord?.FirstName?.length>0 || data.firstName,
                            LastName: melissaRecord?.LastName?.length>0 || data.lastName,
                            AddressLine1: melissaRecord?.AddressLine1?.length>0 || data.address,
                            City: melissaRecord?.City?.length>0 || '', 
                            State: melissaRecord?.State?.length>0 || data.state,
                            PostalCode: melissaRecord?.PostalCode?.length>0 || '', 
                            EmailAddress: melissaRecord?.EmailAddress?.length>0 || data.email,
                            TopLevelDomain: melissaRecord?.TopLevelDomain?.length>0 || '',
                            Phone: melissaRecord?.Phone?.length>0 || data.phone
                        };

                        results.push(mergedRecord);
                    } catch (error) {
                        console.error('Error processing row:', error);
                       
                        results.push({
                            FirstName: data.firstName,
                            LastName: data.lastName,
                            AddressLine1: data.address,
                            City: '',
                            State: data.state,
                            PostalCode: '',
                            EmailAddress: data.email,
                            TopLevelDomain: '',
                            Phone: data.phone
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        let fileName = `enriched_${file}_${Date.now()}.csv`;
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

        await csvModel.findByIdAndUpdate(id, {
            $set: {
                file: fileName,
                code: verificationCode,
                payed: true
            }
        });

        const mailOptions = {
            from: '"Lead System" <shipmate2134@gmail.com>',
            to: fileData.user.email,
            subject: 'File Processing Complete - Enrichify Lead System',
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>File Access</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 800px; margin: 0 auto;">
                
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2c3e50; margin-bottom: 10px;">
                           
                            Enrichify Lead System
                        </h1>
                        <div style="background-color: #3498db; height: 2px; width: 60px; margin: 0 auto;"></div>
                    </div>
            
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #2c3e50; margin-bottom: 25px;">Your File is Ready</h2>
                        
                        <p style="margin-bottom: 20px;">Dear User,</p>
                        
                        <p style="margin-bottom: 20px;">Your file processing is complete. Use the following link and code to access your file:</p>
            
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="width: 120px; font-weight: bold;">Access Code:</td>
                                    <td>${verificationCode}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold;">File Name:</td>
                                    <td>${fileName}</td>
                                </tr>
                            </table>
                        </div>
            
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="http://18.116.60.175/paidfileaccess/${id}/${verificationCode}" 
                               style="background-color: #3498db; color: #ffffff; padding: 12px 25px; 
                                      text-decoration: none; border-radius: 4px; display: inline-block;
                                      font-weight: bold;">
                                Access Your File
                            </a>
                        </div>
                    </div>
            
                    <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 0.9em;">
                        <p style="margin-bottom: 10px;">This is an automated notification - please do not reply directly to this message.</p>
                        <p>© ${new Date().getFullYear()} Enrichify Lead System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>` 
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json(results);
    } catch (e) {
        console.error('Processing error:', e);
        return res.status(500).json({ error: "Error processing file" });
    }
};

module.exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get paginated users
        const users = await usermodel.find({})
            .skip(skip)
            .limit(limit)
            .select('-password'); // Exclude sensitive data

        // Get total count of users
        const totalUsers = await usermodel.countDocuments();
        const totalPages = Math.ceil(totalUsers / limit);

        return res.status(200).json({
            users,
            totalPages,
            totalUsers,
            currentPage: page
        });
    } catch (e) {
        console.error('Error fetching users:', e);
        return res.status(500).json({
            error: "Error getting users"
        });
    }
};


module.exports.getUserFiles=async(req,res)=>{
    let {id}=req.params;
    try{
let files=await csvModel.find({user:id})
return res.status(200).json({
    files
})
    }catch(e){
        return res.status(400).json({
            error:"Error getting users"
        })  
    }
}

module.exports.updateFile = async (req, res) => {
    try {
      const { id } = req.params;
      const file = await csvModel.findOne({ _id: id }).populate('user');
  
      // Validation checks
      if (!id) return res.status(400).json({ error: "Missing file ID" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      if (!file) return res.status(404).json({ error: "File not found" });
  
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
  
      // Sanitize filename
      const sanitizeFilename = (name) => name.replace(/[^a-zA-Z0-9-_.]/g, '_');
      let uniqueFilename = file.file.includes('enrichified') 
        ? sanitizeFilename(file.file)
        : `enrichified-${sanitizeFilename(file.file)}`;
  
      const outputPath = path.join(outputDir, uniqueFilename);
  
      // 1. Write file first
      fs.writeFileSync(outputPath, req.file.buffer);
      
      // Verify file creation
      if (!fs.existsSync(outputPath)) {
        throw new Error('File write failed');
      }
  
      // 2. Upload to Cloudinary
      const cloudinaryResponse = await cloudinaryUploadPdf(outputPath);
  
      // 3. Update database
      const updatedFile = await csvModel.findByIdAndUpdate(id, {
        $set: {
          file: uniqueFilename,
          url: cloudinaryResponse.url
        }
      }, { new: true });
  
      // 4. Send notification email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'support@enrichifydata.com',
          pass: 'ymancwakzaxdpmqg'
        }
      });
  
      const mailOptions = {
        from: '"Lead System" <shipmate2134@gmail.com>',
        to: file.user.email,
        subject: 'File Processing Complete - Enrichify Lead System',
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>File Access</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 800px; margin: 0 auto;">
       div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
<div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2c3e50; margin-bottom: 10px;">
        Enrichify Lead System
    </h1>
    <div style="background-color: #3498db; height: 2px; width: 60px; margin: 0 auto;"></div>
</div>

<div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #2c3e50; margin-bottom: 25px;">Your File is Ready</h2>
    
    <p style="margin-bottom: 20px;">Hi there,</p>
    
    <p style="margin-bottom: 20px;">Great news! Your enriched file has been successfully processed and re-uploaded to your Enrichify account.</p>

    <p style="margin-bottom: 20px; font-weight: 500; color: #2c3e50;">
        To ensure secure delivery, the file is locked and will only be available for download once your invoice is cleared. 
        Once confirmed, we will send you a unique short code to unlock and download the file.
    </p>

    <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
        <h3 style="color: #2c3e50; margin-bottom: 15px;">How to Access Your File:</h3>
        <ol style="margin-left: 20px; color: #34495e;">
            <li style="margin-bottom: 12px;"><strong>Complete Payment</strong><br>
            Settle your invoice through your account or payment link provided</li>
            
            <li style="margin-bottom: 12px;"><strong>Receive Your Unlock Code</strong><br>
            Once the invoice is cleared, we'll send you a one-time short code</li>
            
            <li><strong>Download Your File</strong><br>
            Log in to your dashboard, enter the short code, and download securely</li>
        </ol>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="http://18.116.60.175/dashboard" 
           style="background-color: #3498db; color: #ffffff; padding: 12px 25px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;
                  font-weight: bold; transition: all 0.3s ease;"
           onmouseover="this.style.backgroundColor='#2980b9'" 
           onmouseout="this.style.backgroundColor='#3498db'">
            👉 Access Dashboard
        </a>
    </div>

    <p style="margin-bottom: 20px; color: #7f8c8d; font-size: 0.95em;">
        If you've already completed payment and haven't received your code yet, 
        please reply to this email and we'll get it to you right away.
    </p>
</div>

<div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 0.9em;">
    <p style="margin-bottom: 10px;">Thank you for choosing Enrichify — we look forward to helping you make the most of your data.</p>
    <p>© ${new Date().getFullYear()} Enrichify Lead System. All rights reserved.</p>
</div>
</div>
        </body>
        </html>` 
      };
  
      await transporter.sendMail(mailOptions);
  
      // 5. Cleanup temporary file
      fs.unlinkSync(outputPath);
  
      return res.status(200).json({
        message: "File updated successfully",
        data: {
          id: updatedFile._id,
          url: updatedFile.url
        }
      });
  
    } catch (e) {
      console.error("Update error:", e);
      
      // Cleanup if file was created
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
  
      return res.status(500).json({
        error: "File update failed",
        details: e.message
      });
    }
  };


module.exports.sendCode=async(req,res)=>{
    let {id}=req.params;
    
    try{
let file=await csvModel.findOne({_id:id}).populate('user')
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'support@enrichifydata.com',
        pass: 'ymancwakzaxdpmqg'
    }
});

const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
await csvModel.findByIdAndUpdate(id, {
    $set: {
      
        code: verificationCode,
        payed: true
    }
});

const mailOptions = {
    from: '"Lead System" <shipmate2134@gmail.com>',
    to: file.user.email,
    subject: 'File Processing Complete - Enrichify Lead System',
    html: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File Access</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 800px; margin: 0 auto;">
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c3e50; margin-bottom: 10px;">
                   
                    Enrichify Lead System
                </h1>
                <div style="background-color: #3498db; height: 2px; width: 60px; margin: 0 auto;"></div>
            </div>
    
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #2c3e50; margin-bottom: 25px;">Your File is Ready</h2>
                
                <p style="margin-bottom: 20px;">Dear User,</p>
                
                <p style="margin-bottom: 20px;">Your file processing is complete. Use the following link and code to access your file:</p>
    
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="width: 120px; font-weight: bold;">Access Code:</td>
                            <td>${verificationCode}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold;">File Name:</td>
                            <td>${file.file}</td>
                        </tr>
                    </table>
                </div>
    
                <div style="text-align: center; margin-top: 30px;">
                    <a href="http://18.116.60.175/dashboard" 
                       style="background-color: #3498db; color: #ffffff; padding: 12px 25px; 
                              text-decoration: none; border-radius: 4px; display: inline-block;
                              font-weight: bold;">
                        Access Your File
                    </a>
                </div>
            </div>
    
            <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 0.9em;">
                <p style="margin-bottom: 10px;">This is an automated notification - please do not reply directly to this message.</p>
                <p>© ${new Date().getFullYear()} Enrichify Lead System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>` 
};

await transporter.sendMail(mailOptions);

    }catch(e){
    console.log(e.message)
        return res.status(500).json({
            error: "Error sending code",
          
        });
    }
}



module.exports.unlocked=async(req,res)=>{
let {id}=req.params;
    try{
let file=await csvModel.updateOne({_id:id},{
    $set:{
        unlocked:true
    }
})

return res.status(200).json({
    message:"unlocked"
})


    }catch(e){
        return res.status(500).json({
            error: "Error sending code",
          
        });
    }
}