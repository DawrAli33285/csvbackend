const User = require('../usermodel');
const jwt = require('jsonwebtoken');
const secretKey = '4f8d59a9fcae6340ad41f79cd1bca44cd98cda9f3348e9d1e73d3f083b41b1a6';
const generateToken = (id) => {
    return jwt.sign({ id }, secretKey, { expiresIn: '30d' });
};

const setUser = async (req, res) => {
   
    try {
        const { email, password } = req.body;
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await User.create({ email, password });
        const token = generateToken(user._id);

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