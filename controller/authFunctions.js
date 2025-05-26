const bcrypt = require("bcryptjs");
require('dotenv').config();
const User = require("../database/users");
const validator = require('validator');

/**
    * Registers a new user to the database
    * @param {Request} req - request
    * @param {Response} res - response
    * @returns {Response}
*/
const register = async (req, res) => {
    try {
        const { username, password, email, account_type } = req;

        if (username === "") return res.status(400).json({ message: "Please enter a username" });
        const sanitizedUsername = validator.escape(username);
        const existingUser = await User.findOne({ name: sanitizedUsername });
        if (existingUser) return res.status(400).json({ message: "Username already exists" });

        if (!validator.isEmail(email)) return res.status(400).json({ message: "Please enter a valid email" });
        const sanitizedEmail = validator.normalizeEmail(email);
        const existingEmail = await User.findOne({ email: sanitizedEmail });
        if (existingEmail) return res.status(400).json({ message: "Email already exists" });

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

/**
 * Logs out a user
 * @param {Request} req - request
 * @param {Response} res - response
 * @returns {Response}
 */
const logout = async (req, res) => {
    req.logout(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed', error: err });
        }
    });

    return res.json({ message: 'Logout successful' });
}

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
    return (req, res, next) => {
        const cookies = req.headers.cookie;
        if (cookies) {
            const parts = cookies.split('=');
            if (parts.length < 2 || parts[1] == '') {
                return res.status(401).json({ message: 'Missing authentication token' });
            }
        } else {
            return res.status(401).json({ message: 'Missing authentication token' });
        }

        if (!req.isAuthenticated()) return res.status(401).json({ message: 'Invalid session or session expired.' });
        if (!role.includes(req.user.account_type)) return res.status(403).json({ message: 'Forbidden. You do not have the required permissions.' });

        next();
    };
};

module.exports = { register, verify, logout };