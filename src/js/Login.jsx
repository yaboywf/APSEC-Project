import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { showMessage, encryptData, decryptData, generateKeys } from './Functions';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from "axios";
import '../styles/login.scss';

function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [publicKey, setPublicKey] = useState(null);
	const [clientPrivateKey, setClientPrivateKey] = useState(null);
	const [clientPublicKeyPem, setClientPublicKeyPem] = useState(null);
	const navigate = useNavigate();

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

		// Get server public key
		axios.get('/api/public_key')
			.then(resp => setPublicKey(resp.data.publicKey))
			.catch(error => {
				showMessage('Failed to fetch public key');
				console.error('Error fetching public key:', error);
			});

		// Generate keys
		const getKeys = async () => {
			try {
				const { privateKey, publicKeyPem } = await generateKeys();
				setClientPrivateKey(privateKey);
				setClientPublicKeyPem(publicKeyPem);
				
				// Check if theres an existing session
				axios.get("/api/auth/verify", { headers: { "Content-Type": "application/json", "client_key": btoa(publicKeyPem.replace(/\n/g, '')) }, withCredentials: true })
					.then(async (resp) => {
						let user = await decryptData(privateKey, resp.data.user);
						user = JSON.parse(user);
						showMessage(`Welcome back, ${resp.data.user?.name}!`, "success");
						navigate(`/${resp.data.user?.account_type}` || "login");
					})
					.catch(err => console.error(err));
			} catch (error) {
				console.error('Key generation failed:', error);
			}
		}

		getKeys();

		// Cleanup when component unmounts
		return () => document.body.removeChild(script);
	}, [navigate]);

	// Handle login submission
	const handleLogin = async (e) => {
		e.preventDefault();

		if (!username || username === "") return showMessage("Please enter a username");
		if (!password || password === "") return showMessage("Please enter a password");

		// Generate the reCAPTCHA token before submitting the form
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
			if (!encryptedUsername || !encryptedPassword) return showMessage('Encryption failed');

			// After token generation, proceed with the form submission
			axios.post("/api/auth/login", { username: encryptedUsername, password: encryptedPassword, captchaToken, client_key: clientPublicKeyPem }, { withCredentials: true })
				.then(async (resp) => {
					let user = await decryptData(clientPrivateKey, resp.data.user);
					user = JSON.parse(user);
					navigate("/login2", { state: { user, message: resp.data.message } })
				})
				.catch(err => {
					console.error(err.response.data);
					if (err.response.data.message === "Please verify your account") return navigate("/register2", { state: { userId: err.response.data.user_id } });
					showMessage(err.response.data.message || "Login failed");
				});
		} catch (err) {
			showMessage(`Error during login submission: ${err}`);
			console.error(err);
		}
	}

	return (
		<div className="login" style={{ background: 'url(/login_bg.jpg) left/cover no-repeat' }}>
			<form onSubmit={handleLogin} noValidate>
				<label htmlFor="username">
					<i className="fa fa-user"></i>
					Username:
				</label>
				<input type="text" id="username" name="username" autoComplete="username" autoFocus required placeholder="Enter Username" onInput={e => setUsername(e.target.value)} />

				<label htmlFor="password">
					<i className="fa fa-lock"></i>
					Password:
				</label>
				<input type="password" id="password" name="password" autoComplete="current-password" required placeholder="Enter Password" onInput={e => setPassword(e.target.value)} />
				<button type="submit">Login</button>

				<p>Don't have an account? <a href="/register">Register</a></p>
			</form>

			<ReCAPTCHA
				sitekey="6Ld4encrAAAAABBPqZ_HHZCdDAzUSgbsiLklmkKP"
				size="invisible"
			/>
		</div>
	);
}

export default Login;