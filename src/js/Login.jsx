import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import '../styles/login.scss';
import { showMessage } from './Functions';
import ReCAPTCHA from 'react-google-recaptcha';

function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
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

		// Cleanup when component unmounts
		return () => document.body.removeChild(script);
	}, []);

	useEffect(() => {
		axios.get("/api/auth/verify", { headers: { "Content-Type": "application/json" }, withCredentials: true })
			.then(resp => {
				showMessage(`Welcome back, ${resp.data.user?.name}!`, "success");
				navigate(`/${resp.data.user?.account_type}` || "login");
			})
			.catch(err => console.error(err));
	}, [navigate]);

	// Handle login submission
	const handleLogin = async (e) => {
		e.preventDefault();

		if (!username || username === "") return showMessage("Please enter a username");
		if (!password || password === "") return showMessage("Please enter a password");

		// Generate the reCAPTCHA token before submitting the form
		try {
			await window.grecaptcha.ready(() => {
				window.grecaptcha.execute('6Ld4encrAAAAABBPqZ_HHZCdDAzUSgbsiLklmkKP', { action: 'login' })
					.then((token) => {
						// After token generation, proceed with the form submission
						axios.post("/api/auth/login", { username, password, captchaToken: token }, { headers: { "Content-Type": "application/json" }, withCredentials: true })
							.then(resp => navigate("/login2", { state: { user: resp.data.user, message: resp.data.message } }))
							.catch(err => {
								console.error(err);

								if (err.response.data.message === "Please verify your account") {
									navigate("/register2", { state: { userId: err.response.data.user_id } });
									return;
								}

								showMessage(err.response.data.message || "Login failed");
							});
					})
					.catch((err) => {
						console.error("Error generating reCAPTCHA token:", err);
					});
			});
		} catch (err) {
			console.error('Error during reCAPTCHA execution:', err);
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