const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const path = require("path");
const mongoose = require("mongoose");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;
require("dotenv").config();
mongoose.set("strictQuery", true);
mongoose.connect(process.env.DB_CONNECT)
.then(() => {
    console.log("Connected to DB!");
})
.catch((err) => {
    console.log(err);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'your-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    function (username, password, done) {
        
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    done(null, { id: 1, username: 'admin' });
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));