const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../database/users');
const validator = require('validator');

passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            if (!validator.isAlphanumeric(username)) return done(null, false, { message: 'Invalid username or password' });
            const sanitizedName = validator.escape(username);
            const user = await User.findOne({ username: sanitizedName });
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
