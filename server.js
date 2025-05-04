const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require('express-session');
const helmet = require("helmet");
const passport = require('passport');

const { register, login, verify } = require("./controller/authFunctions");
require("./controller/passport");

const app = express();
const PORT = process.env.PORT || 3000;
require("dotenv").config();

app.use(cors({
	origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	credentials: true
}));

mongoose.set("strictQuery", true);
mongoose.connect(process.env.DB_CONNECT)
.then(() => console.log("Connected to DB!"))
.catch((err) => console.log(err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.APP_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());

app.post("/api/auth/register", (req, res) => {
    register(req.body, res);
});

app.post("/api/auth/login", passport.authenticate('local', { session: false }), (req, res) => {
    login(req, res);
});

app.get("/api/admin", verify(role=["admin"]), (req, res) => {
    return res.json({ message: "You have access to an admin only page", user: req.user });
});

app.get("/api/teacher", verify(role=["teacher"]), (req, res) => {
    return res.json({ message: "You have access to an teacher only page", user: req.user });
});

app.get("/api/ta", verify(role=["teacher-assistant"]), (req, res) => {
    return res.json({ message: "You have access to an teacher assistant only page", user: req.user });
});

app.get("/api/student", verify(role=["student"]), (req, res) => {
    return res.json({ message: "You have access to an student only page", user: req.user });
});

app.get("/api/dashboard", verify, (req, res) => {
    return res.json({ message: "You have access to this page regardless of role. You are logged in", user: req.user });
});

app.listen(PORT, (err) => {
    if (err) console.error(err);
    console.log(`Listening on port ${PORT}`)
});