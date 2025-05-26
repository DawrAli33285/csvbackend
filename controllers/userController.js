const User = require('../usermodel');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const secretKey = '4f8d59a9fcae6340ad41f79cd1bca44cd98cda9f3348e9d1e73d3f083b41b1a6';
const generateToken = (id) => {
    return jwt.sign({ id }, secretKey, { expiresIn: '30d' });
};

const setUser = async (req, res) => {
   
    try {
        const { email, password,name } = req.body;
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await User.create({ email, password,name});
        const token = generateToken(user._id);

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
    subject:'Subject: 🎉 Welcome to Enrichify – Your Account Is Ready!',
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

        <!-- Welcome Content -->
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px;">
            <h2 style="color: #2c3e50; margin-bottom: 25px;">Welcome to Enrichify! 🎉</h2>
            
            <p style="margin-bottom: 20px;">Hi ${user.email},</p>
            
            <p style="margin-bottom: 20px;">Thanks for signing up with Enrichify! Your account has been successfully created, and you're all set to start enriching your data like a pro.</p>

            <div style="text-align: center; margin-top: 30px;">
                <a href="http://enrichifyupload.com/dashboard" 
                   style="background-color: #3498db; color: #ffffff; padding: 12px 25px; 
                          text-decoration: none; border-radius: 4px; display: inline-block;
                          font-weight: bold;">
                    Go to Dashboard
                </a>
            </div>

            <p style="margin-top: 30px; margin-bottom: 20px;">
                From your dashboard, you'll be able to upload CSV files, track enrichment status, and manage your account easily.
            </p>

            <p style="margin-bottom: 20px;">
                If you didn't sign up for this account or have any questions, just reply to this email or reach out to our support team—we're here to help.
            </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 0.9em;">
            <p style="margin-bottom: 10px;">This is an automated notification - please do not reply directly to this message.</p>
            <p>© ${new Date().getFullYear()} Enrichify Lead System. All rights reserved.</p>
        </div>
    </div>
</body>
    `
}

await transporter.sendMail(usermailOptions)
return res.status(201).json({
            _id: user._id,
            email: user.email,
            token
        });

    } catch (error) {
        console.error(error);
       return res.status(400).json({ error: 'Server error' });
    }
};
const getUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && password === user.password) {
            res.json({
                _id: user._id,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
         return res.status(400).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
       return res.status(400).json({ error: 'Server error' });
    }
}

module.exports = {
    setUser,
    getUser
}