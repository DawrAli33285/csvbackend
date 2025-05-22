const csvModel = require("../csvmodel");
const usermodel = require("../usermodel");
let jwt = require('jsonwebtoken')
const nodefetch = require('node-fetch');
const nodemailer = require('nodemailer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const adminModel = require("../adminmodel");

const outputDir = path.join(__dirname, '../tmp/public/files');


module.exports.adminLogin = async (req, res) => {
    let { email, password } = req.body;
    try {
        let admin = await adminModel.findOne({ email })
        if (admin) {
            let passwordMatch = await usermodel.findOne({ password })
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
        let admin = await usermodel.create({ email, password })
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
        const response = await fetch(`http://localhost:5000/files/${file}`);
        const fileData = await csvModel.findOne({ _id: id }).populate('user')
        if (!response.ok) throw new Error('Failed to fetch file');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'leads@enrichifydata.com',
                pass: 'cazhzgbslrzvyjfc'
            }
        });
        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        const readableStream = Readable.fromWeb(response.body);
        const results = [];
        console.log(`this is the email of the user ${fileData.user.email}`)
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



                    const melisaresponse = await axios.get(
                        "https://personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify",
                        { params }
                    );


                    results.push(melisaresponse.data.Records[0]);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        let fileName = `enriched_${file}_${Date.now()}.csv`
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
                payed:true
            }
        })

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
                            <img src="https://enrichifydata.com/wp-content/uploads/2024/11/WhatsApp_Image_2024-11-24_at_8.44.26_PM-removebg-preview.png" alt="Enrichify Logo" style="height: 40px; vertical-align: middle;">
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
                            <a href="http://localhost:3000/paidfileaccess/${id}/${verificationCode}" 
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