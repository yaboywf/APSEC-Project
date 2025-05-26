const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../database/users');
const validator = require('validator');

/**
    * Validates a user via Passport JS
    * @param {Request} req - request
    * @param {Response} res - response
    * @returns {Response}
*/
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const sanitizedName = validator.escape(username);
            const user = await User.findOne({ name: sanitizedName });
            if (!user) return done(null, false, { message: 'Invalid username or password' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return done(null, false, { message: 'Invalid username or password' });

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});
