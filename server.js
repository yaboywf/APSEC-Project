const express = require("express");
const mongoose = require("mongoose");
const session = require('express-session');
const helmet = require("helmet");
const passport = require('passport');
const path = require("path");

const { register, verify, logout } = require("./controller/authFunctions");
require("./controller/passport");

const app = express();
const PORT = 3000;
require("dotenv").config();

mongoose.set("strictQuery", true);
mongoose.connect(process.env.DB_CONNECT)
    .then(() => console.log("Connected to DB!"))
    .catch((err) => console.log(err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'build')));
app.use(session({
    name: 'userId',
    secret: process.env.APP_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        sameSite: 'lax',
        cookie: {
            maxAge: 30 * 60 * 1000
        },
        rolling: true
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Helmet
/*  Secure your Express applications by setting various HTTP headers. 
    It is designed to protect your app from some common web vulnerabilities, 
    such as clickjacking, cross-site scripting (XSS), and other attacks that
    can be mitigated through HTTP headers.
*/
app.use(helmet({
    // Specifying which content can be loaded and executed by the browser
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Remove unsafe inline during production
            scriptSrc: ["'self'", "'unsafe-inline'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    // Controls how much referrer information is sent with requests
    referrerPolicy: { policy: 'no-referrer' },
    // Prevents the site from being embedded in a frame
    frameguard: { action: 'deny' },
    // Prevent DNS prefetching to mitigate SSRF attacks
    dnsPrefetchControl: { allow: false },
    // Hide the X-Powered-By header to prevent revealing information about your server
    hidePoweredBy: true,
    // Enable the XSS filter (can be turned off in modern browsers)
    xssFilter: true,
    // Prevent sniffing of the content type
    noSniff: true,
    // Enable HTTP Strict Transport Security (HSTS)
    StrictTransportSecurity: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
    },
    // Prevent potentially malicious content (Cross-Origin Resource Sharing)
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    // Prevent any potential script injection attacks through inline event handlers (e.g., `onclick`)
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    // Prevent browsers from opening pop-ups and performing potentially dangerous actions
    featurePolicy: {
        // You can disallow certain features such as microphone, camera, or geolocation access
        accelerometer: "'none'",
        camera: "'none'",
        geolocation: "'none'",
        gyroscope: "'none'",
        magnetometer: "'none'",
        microphone: "'none'",
        payment: "'none'",
        usb: "'none'",
    },
    // Adds an additional level of protection against CSRF (Cross-Site Request Forgery)
    csrfPrevention: true,
}));

// Route for register
app.post("/api/auth/register", (req, res) => {
    register(req.body, res);
});

// Route for login
app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
            return res.status(401).json({ message: info.message || 'Login failed' });
        }

        req.logIn(user, (err) => {
            if (err) { return next(err); }
            return res.json({ message: 'Welcome back, ' + user.name + '!' });
        });
    })(req, res, next);
});

// Protected page. Only admin can access.
app.get("/api/admin", verify(role = ["admin"]), (req, res) => {
    return res.json({ message: `Hello ${req.user.name}. You have access to an admin only page` });
});

// Protected page. Only teacher can access.
app.get("/api/teacher", verify(role = ["teacher"]), (req, res) => {
    return res.json({ message: `Hello ${req.user.name}. You have access to an teacher only page` });
});

// Protected page. Only teacher assistant can access.
app.get("/api/ta", verify(role = ["teacher-assistant"]), (req, res) => {
    return res.json({ message: `Hello ${req.user.name}. You have access to an teacher assistant only page` });
});

// Protected page. Only student can access.
app.get("/api/student", verify(role = ["student"]), (req, res) => {
    return res.json({ message: `Hello ${req.user.name}. You have access to an student only page` });
});

// Protected page. All authenticated users, regardless of role, can access.
app.get("/api/dashboard", verify(), (req, res) => {
    return res.json({ message: "You have access to this page, which requires authentication but is accessible regardless of role" });
});

// All users can access regardless of authentication or role.
app.get("/api/home", (req, res) => {
    return res.json({ message: "Everyone has access to this page" });
});

app.post("/api/logout", verify(), (req, res) => {
    logout(req, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, (err) => {
    if (err) console.error(err);
    console.log(`Listening on port ${PORT}`)
});