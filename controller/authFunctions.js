const bcrypt = require("bcryptjs");
require('dotenv').config();
const User = require("../database/users");
const validator = require('validator');
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    try {
        const { username, password, email, account_type } = req;

        if (username === "") return res.status(400).json({ message: "Please enter a username" });
        const sanitizedUsername = validator.escape(username);

        if (!validator.isEmail(email)) return res.status(400).json({ message: "Please enter a valid email" });
        const sanitizedEmail = validator.normalizeEmail(email);

        if (password === "") return res.status(400).json({ message: "Please enter a password" });
        const sanitizedPassword = validator.trim(password);
        const hashedPassword = bcrypt.hashSync(sanitizedPassword, 12);

        const accountTypeOptions = ["student", "teacher", "admin", "teacher-assistant"];
        if (!accountTypeOptions.includes(account_type.toLowerCase())) return res.status(400).json({ message: "Please enter a valid account type" });

        const newMember = new User({ 
            name: sanitizedUsername,
            email: sanitizedEmail,
            account_type: account_type,
            password: hashedPassword
        });

        await newMember.save();
        return res.json({ message: "You are now registered" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

const login = async (req, res) => {
    const user = req.user;
    const token = jwt.sign({ id: user._id.toString(), username: user.username, account_type: user.account_type }, process.env.APP_SECRET, { expiresIn: '2h' });
    return res.json({ message: 'Login successful', token: token, account_type: user.account_type });
};

/**
    * Checks authentication
    * @param {Request} req - request
    * @param {Response} res - response
    * @param {NextFunction} next - next performing action
    * @param {Array<string>} role - The roles that are allowed to access the route.
    * Only the following roles are accepted: 'admin', 'teacher', 'teacher-assistant', 'student'.
    * No given array of roles will allow all authorised to access that route.
    * @returns {void}
*/
const verify = (role = ["student", "teacher", "admin", "teacher-assistant"]) => {
    return async (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized. Missing token' });
        jwt.verify(token, process.env.APP_SECRET, (err, decoded) => {
            if (err) return res.status(401).json({ message: 'Invalid or expired token' });
            console.log(decoded)
            if (!role.includes(decoded.account_type)) return res.status(401).json({ message: 'Unauthorized. Invalid account type' });
            req.user = decoded;
            next();
        });
    }
};

module.exports = { register, login, verify };