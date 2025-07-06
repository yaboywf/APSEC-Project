import { useState, useEffect } from "react";
import axios from "axios";
import '../styles/login.scss';
import '../styles/register.scss';
import { useNavigate } from 'react-router-dom';
import { showMessage, encryptData, generateKeys, decryptData } from './Functions';
import ReCAPTCHA from 'react-google-recaptcha';

function Register() {
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [accountType, setAccountType] = useState("");
	const [publicKey, setPublicKey] = useState(null);
	const [clientPrivateKey, setClientPrivateKey] = useState(null);
	const [clientPublicKeyPem, setClientPublicKeyPem] = useState(null);

	useEffect(() => {
		// Dynamically load reCAPTCHA script
		const script = document.createElement('script');
		script.src = `https://www.google.com/recaptcha/api.js?render=6Ld4encrAAAAABBPqZ_HHZCdDAzUSgbsiLklmkKP`;
		script.async = true;
		script.defer = true;
		document.body.appendChild(script);

		// Clean up the old script if any
		const oldScript = document.querySelector('script[src="https://www.google.com/recaptcha/api.js?onload=onloadcallback&render=explicit"]');
		if (oldScript) document.body.removeChild(oldScript);

		// Generate keys
		const getKeys = async () => {
			try {
				const { privateKey, publicKeyPem } = await generateKeys();
				setClientPrivateKey(privateKey);
				setClientPublicKeyPem(publicKeyPem);
			} catch (error) {
				console.error('Key generation failed:', error);
			}
		}

		getKeys();

		// Get server public key
		axios.get('/api/public_key')
			.then(resp => setPublicKey(resp.data.publicKey))
			.catch(error => {
				showMessage('Failed to fetch public key');
				console.error('Error fetching public key:', error);
			});

		// Cleanup when component unmounts
		return () => document.body.removeChild(script);
	}, []);

	const handleLogin = async (e) => {
		e.preventDefault();
		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

		if (!username || username === "") return showMessage("Please enter a username");
		if (!password || password === "") return showMessage("Please enter a password");
		if (!emailPattern.test(email)) return showMessage("Please enter a valid email");
		if (!accountType || accountType === "") return showMessage("Please select an account type");
		if (!e.target.checkValidity()) return;

		try {
			const captchaToken = await new Promise((resolve, reject) => {
				window.grecaptcha.ready(() => {
					window.grecaptcha.execute('6Ld4encrAAAAABBPqZ_HHZCdDAzUSgbsiLklmkKP', { action: 'login' })
						.then(resolve)
						.catch(reject);
				});
			});

			if (!publicKey) return showMessage('Cannot get public key');

			const encryptedUsername = await encryptData(publicKey, username);
			const encryptedPassword = await encryptData(publicKey, password);
			const encryptedEmail = await encryptData(publicKey, email);
			const encryptedAccountType = await encryptData(publicKey, accountType);
			if (!encryptedUsername || !encryptedPassword || !encryptedEmail || !encryptedAccountType) return showMessage('Encryption failed');

			axios.post("/api/auth/register", { username: encryptedUsername, password: encryptedPassword, email: encryptedEmail, account_type: encryptedAccountType, captchaToken, client_key: clientPublicKeyPem }, { withCredentials: true })
				.then(async (resp) => {
					let userId = await decryptData(clientPrivateKey, resp.data.user_id);
					console.log(userId);
					navigate("/register2", { state: { userId } });
				})
				.catch(err => {
					console.error(err);
					showMessage(err.response.data.message || "Registration failed");
				});
		} catch (err) {
			console.error('Error during reCAPTCHA execution:', err);
		}
	}

	return (
		<div className="login register" style={{ background: 'url(/register_bg.jpg) center/cover no-repeat' }}>
			<form onSubmit={handleLogin} noValidate>
				<label htmlFor="username">
					<i className="fa fa-user"></i>
					Username:</label>
				<input type="text" id="username" name="username" autoComplete="username" autoFocus required placeholder="Enter Username" onInput={e => setUsername(e.target.value)} />

				<label htmlFor="password">
					<i className="fa fa-lock"></i>
					Password:
				</label>
				<input type="password" id="password" name="password" autoComplete="current-password" required placeholder="Enter Password" onInput={e => setPassword(e.target.value)} />

				<label htmlFor="email">
					<i className="fa fa-envelope"></i>
					Email:
				</label>
				<input type="email" id="email" name="email" autoComplete="email" required placeholder="Enter Email" onInput={e => setEmail(e.target.value)} />

				<label htmlFor="accountType">
					<i className="fa fa-gears"></i>
					Role:
				</label>
				<select name="accountType" id="accountType" required defaultValue={""} onChange={e => setAccountType(e.target.value)}>
					<option value="" hidden>Select an Option</option>
					<option value="admin">Admin</option>
					<option value="teacher">Teacher</option>
					<option value="teacher-assistant">Teacher Assistant</option>
					<option value="student">Student</option>
				</select>

				<button type="submit">Register</button>

				<p><a href="/login">I have an account</a></p>
			</form>

			<ReCAPTCHA
				sitekey="6Ld4encrAAAAABBPqZ_HHZCdDAzUSgbsiLklmkKP"
				size="invisible"
			/>
		</div>
	);
}

export default Register;