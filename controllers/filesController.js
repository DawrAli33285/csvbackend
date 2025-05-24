const csvModel = require('../csvmodel');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const secretKey = '4f8d59a9fcae6340ad41f79cd1bca44cd98cda9f3348e9d1e73d3f083b41b1a6';
const nodemailer = require('nodemailer');
const usermodel = require('../usermodel');
const adminmodel=require('../adminmodel')

const {cloudinaryUploadPdf}=require('../cloudinary')

const saveFile = async (req, res) => {
    try {

        const token = req.headers.authorization?.split(' ')[1];
        let admin=await adminmodel.findOne({})
  
        if (!token) return res.status(400).json({ error: "Unauthorized" });

        const decoded = jwt.verify(token, secretKey);
        console.log(decoded.id)
        let user = await usermodel.findById(decoded.id)
        const basePath = process.env.NODE_ENV === 'production' 
      ? '/tmp/files'
      : path.join(__dirname, 'local-files'); // Use absolute path

    // Ensure base directory exists
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    // Sanitize filename
    const sanitizeFilename = (name) => name.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    const fileName = `${Date.now()}-${sanitizeFilename(req.file.originalname)}`;
    const filePath = path.join(basePath, fileName);

    // Save file
    fs.writeFileSync(filePath, req.file.buffer);

    // Verify file write
    if (!fs.existsSync(filePath)) {
      throw new Error('File write failed');
    }

    // Upload to Cloudinary
    const cloudinaryFile = await cloudinaryUploadPdf(filePath);
     
        const newFile = await csvModel.create({
            user: decoded.id,
            file: req.file.originalname,
            url:cloudinaryFile.url
        });


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'support@enrichifydata.com',
                pass: 'ymancwakzaxdpmqg'
            }
        });

const usermailOptions={
    from: '"Lead System" <shipmate2134@gmail.com>',
    to: user.email,
    subject:'✅File Upload Received – Enrichify is On It!',
    html:`
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 800px; margin: 0 auto;">
    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">
               
                Enrichify Lead System
            </h1>
            <div style="background-color: #3498db; height: 2px; width: 60px; margin: 0 auto;"></div>
        </div>

        <!-- User Content -->
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px;">
            <h2 style="color: #2c3e50; margin-bottom: 25px;">File Upload Confirmation</h2>
            
            <p style="margin-bottom: 20px;">Hi ${user.email},</p>
            
            <p style="margin-bottom: 20px;">We've received your file upload and it's now being processed through Enrichify. Our system is working to enrich your data and will notify you as soon as your enriched file is ready for review or download.</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 120px; font-weight: bold;">Filename:</td>
                        <td>${newFile.file}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Upload Time:</td>
                        <td>${newFile.createdAt}</td>
                    </tr>
                </table>
            </div>
            </body>
    
    `
}

        const mailOptions = {
            from: '"Lead System" <shipmate2134@gmail.com>',
            to: admin.email,
            subject: 'New File Upload Notification - Enrichify Lead System',
            html: `<!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>File Upload Notification</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 800px; margin: 0 auto;">
              
              <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
                  <!-- Header -->
                  <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #2c3e50; margin-bottom: 10px;">
                         
                          Enrichify Lead System
                      </h1>
                      <div style="background-color: #3498db; height: 2px; width: 60px; margin: 0 auto;"></div>
                  </div>
          
                  <!-- Content -->
                  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <h2 style="color: #2c3e50; margin-bottom: 25px;">New File Submission Received</h2>
                      
                      <p style="margin-bottom: 20px;">Dear Administrator,</p>
                      
                      <p style="margin-bottom: 20px;">A new file has been uploaded to the Enrichify Lead System:</p>
          
                      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                          <table style="width: 100%;">
                              <tr>
                                  <td style="width: 120px; font-weight: bold;">Uploaded by:</td>
                                  <td>${user.email}</td>
                              </tr>
                              <tr>
                                  <td style="font-weight: bold;">File Name:</td>
                                  <td>${newFile.file}</td>
                              </tr>
                              <tr>
                                  <td style="font-weight: bold;">Date & Time:</td>
                                  <td>${newFile.createdAt}</td>
                              </tr>
                          </table>
                      </div>
          
                      <div style="text-align: center; margin-top: 30px;">
                          <a href="https://csvuploadfrontend.vercel.app/admindashboard" 
                             style="background-color: #3498db; color: #ffffff; padding: 12px 25px; 
                                    text-decoration: none; border-radius: 4px; display: inline-block;
                                    font-weight: bold;">
                              Access Dashboard
                          </a>
                      </div>
                  </div>
          
                  <!-- Footer -->
                  <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 0.9em;">
                      <p style="margin-bottom: 10px;">This is an automated notification - please do not reply directly to this message.</p>
                      <p>© ${new Date().getFullYear()} Enrichify Lead System. All rights reserved.</p>
                  </div>
              </div>
          
          </body>
          </html>`
        };
        await transporter.sendMail(mailOptions);
await transporter.sendMail(usermailOptions)

        return res.status(201).json({
            message: "File saved successfully",
            file: {
                id: newFile._id,
                createdAt: newFile.createdAt,
            }
        });
    } catch (error) {
        console.error('Save error:', error.message);
        return res.status(400).json({ error: "Error saving file" });
    }
};

const getFiles = async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(400).json({ error: "Unauthorized" });
  
      const decoded = jwt.verify(token, secretKey);
      
     
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
     
      const total = await csvModel.countDocuments({ user: decoded.id });
      
      const files = await csvModel.find({ user: decoded.id })
        .populate('user')
        .skip(skip)
        .limit(limit);
  
      return res.json({
        files,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalFiles: total
      });
    } catch (error) {
      return res.status(400).json({ error: "Error fetching files" });
    }
  };

const getFile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });
        const decoded = jwt.verify(token, secretKey);
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: "Code is required" });
        
        const fileDocument = await csvModel.findById(req.params.id);
        if (!fileDocument) return res.status(404).json({ error: "File not found" });
        if (fileDocument.code == code) {
            return res.status(200).json({ message: "access code matches", codeMatch: true });
        }
        else {
            return res.status(400).json({ message: "access code does not match", codeMatch: false });
        }

    } catch (error) {
        console.error(error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token expired" });
        }
        res.status(500).json({ error: "Server error while processing file" });
    }
};
module.exports = { saveFile, getFiles, getFile };