const express = require("express");
const mongoose = require("mongoose");
const session = require('express-session');
const helmet = require("helmet");
const passport = require('passport');
const path = require("path");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const cron = require('node-cron');
const axios = require("axios");
const cors = require('cors');
const crypto = require('crypto');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const { register, verify, logout } = require("./controller/authFunctions");
const User = require('./database/users');
require("./controller/passport");

const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 3000;

mongoose.set("strictQuery", true);
mongoose.connect(process.env.DB_CONNECT)
    .then(() => console.log("Connected to DB!"))
    .catch(err => console.error(err));

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

app.use(cors({
    origin: 'http://localhost:3001', // Allow requests from the frontend
    methods: ['GET', 'POST'],       // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
    credentials: true
}));

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
            defaultSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com"],
            // Remove unsafe inline during production
            scriptSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com", "'unsafe-inline'"],
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

// Cron Job to remove unverified accounts after 24 hours
cron.schedule('0 0 * * *', async () => {
    const users = await User.find({ completed_2fa: false });

    users.forEach(async (user) => {
        const timeElapsed = (Date.now() - user.register_time) / (1000 * 60 * 60);
        if (timeElapsed > 24) await User.deleteOne({ _id: user._id });
    });
});

const decryptData = async (encryptedBase64) => {
    try {
        const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
        const decrypted = crypto.privateDecrypt({
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        }, encryptedBuffer);
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Decryption failed: ' + error.message);
    }
};

const encryptData = async (clientPublicKeyPem, data) => {
    try {
        // Convert PEM to CryptoKey
        const pemContents = clientPublicKeyPem
            .replace('-----BEGIN PUBLIC KEY-----', '')
            .replace('-----END PUBLIC KEY-----', '')
            .replace(/\s+/g, '');

        const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

        const publicKey = await crypto.subtle.importKey(
            'spki',
            binaryDer,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true,
            ['encrypt']
        );

        // Encrypt
        const encrypted = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            new TextEncoder().encode(data)
        );

        // Return Base64
        return Buffer.from(encrypted).toString('base64');
    } catch (err) {
        console.error("Client key encryption failed:", err);
        throw new Error("Invalid client public key");
    }
};

// Route for register
app.post("/api/auth/register", async (req, res) => {
    const captcha = req.body.captchaToken;

    if (!captcha) return res.status(400).json({ message: "No captcha token" });

    try {
        const captchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET}&response=${captcha}`);
        const score = captchaResponse.data.score;

        if (!score || score < 0.7) return res.status(400).json({ message: "Captcha verification failed" });        

        register(req.body, res, encryptData, decryptData);
    } catch (error) {
        return res.status(400).json({ message: "Captcha verification failed" });
    }
});

// Route for login
app.post("/api/auth/login", async (req, res, next) => {
    const captcha = req.body.captchaToken;

    if (!captcha) return res.status(400).json({ message: "No captcha token" });

    try {
        const captchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET}&response=${captcha}`);
        const score = captchaResponse.data.score;

        if (!score || score < 0.7) return res.status(400).json({ message: "Captcha verification failed" });

        const username = req.body.username;
        const password = req.body.password;

        if (!username || !password) return res.status(400).json({ message: "Please enter a username and password" });

        const decryptedUsername = (await decryptData(username)).toString('utf8');
        const decryptedPassword = (await decryptData(password)).toString('utf8');
        
        req.body.username = decryptedUsername;
        req.body.password = decryptedPassword;

        passport.authenticate('local', (err, user, info) => {
            if (err) return next(err);
            if (!user) {
                return res.status(401).json({ message: info.message, user_id: info?.user_id || 'Login failed' });
            }

            if (!req.body.client_key) return res.status(400).json({ error: "No client key" })

            req.logIn(user, async (err) => {
                if (err) return next(err);

                const userCopy = { ...user._doc };

                delete userCopy.password;
                delete userCopy.completed_2fa;
                delete userCopy.register_time;
                delete userCopy.createdAt;
                delete userCopy.updatedAt;
                delete userCopy.__v;
                delete userCopy.name;
                delete userCopy.email;

                return res.json({ message: `Welcome back, ${user.name}!`, user: await encryptData(req.body.client_key, JSON.stringify(userCopy)) });
            });
        })(req, res, next);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Route to get public key
app.get('/api/public_key', (req, res) => {
    return res.json({ publicKey });
});

// Route to verify user for frontend
app.get("/api/auth/verify", verify(), async (req, res) => {
    const userCopy = { ...req.user._doc };

    delete userCopy.password;
    delete userCopy.completed_2fa;
    delete userCopy.register_time;
    delete userCopy.createdAt;
    delete userCopy.updatedAt;
    delete userCopy.__v;
    delete userCopy.secret_key;
    delete userCopy._id;
    
    return res.json({ user: await encryptData(atob(req.headers.client_key), JSON.stringify(userCopy)) });
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

app.post("/api/auth/logout", verify(), (req, res) => {
    logout(req, res);
});

app.post('/api/auth/generate_2fa', async (req, res) => {
    try {
        if (!req.body.user_id) return res.status(400).json({ message: 'Missing user ID' });

        // Generate a secret key
        const secret = speakeasy.generateSecret({ name: 'MyApp' });

        // Generate a QR code for the authenticator app
        const data_url = await new Promise((resolve, reject) => {
            qrcode.toDataURL(secret.otpauth_url, (err, url) => {
                if (err) reject(`Error generating QR code: ${err}`);
                else resolve(url);
            });
        });

        await User.findOneAndUpdate({ _id: req.body.user_id }, { $set: { secret_key: secret.base32 } });

        return res.json({ qrcode: data_url });
    } catch (err) {
        res.json({ message: `Error: ${err}` });
    }
});

app.post('/api/auth/verify_2fa', async (req, res) => {
    const captcha = req.body.captchaToken;

    try {
        const captchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET}&response=${captcha}`);
        const score = captchaResponse.data.score;

        if (!score || score < 0.7) return res.status(400).json({ message: "Captcha verification failed" });

        const { token, user_id } = req.body;
        if (!token || !user_id) return res.status(400).json({ error: 'Token and user_id are required.' });

        const decryptedToken = (await decryptData(token)).toString('utf8');
        
        const user = await User.findById(user_id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        // Verify the token
        const verified = speakeasy.totp.verify({
            secret: user.secret_key,
            encoding: 'base32',
            token: decryptedToken
        });

        if (verified) {
            await User.findOneAndUpdate({ _id: user_id }, { $set: { completed_2fa: true } });
            return res.json({ message: '2FA verification successful!' });
        } else {
            return res.status(400).json({ message: 'Invalid code. Please try again.' });
        }
    } catch (error) {
        return res.status(500).json({ message: `Error verifying 2FA: ${error.message}` });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, (err) => {
    if (err) console.error(err);
    console.log(`Listening on port ${PORT}`)
});