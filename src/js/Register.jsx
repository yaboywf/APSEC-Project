import { useState, useEffect } from "react";
import axios from "axios";
import '../styles/login.scss';
import '../styles/register.scss';
import { useNavigate } from 'react-router-dom';
import { showMessage } from './Functions';
import ReCAPTCHA from 'react-google-recaptcha';

function Register() {
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [accountType, setAccountType] = useState("");

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

	const handleLogin = async (e) => {
		e.preventDefault();
		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

		if (!username || username === "") return showMessage("Please enter a username");
		if (!password || password === "") return showMessage("Please enter a password");
		if (!emailPattern.test(email)) return showMessage("Please enter a valid email");
		if (!accountType || accountType === "") return showMessage("Please select an account type");
		if (!e.target.checkValidity()) return;

		try {
			await window.grecaptcha.ready(() => {
				window.grecaptcha.execute('6Ld4encrAAAAABBPqZ_HHZCdDAzUSgbsiLklmkKP', { action: 'signUp' })
					.then((token) => {
						axios.post("/api/auth/register", { username, password, email, account_type: accountType, captchaToken: token }, { withCredentials: true })
							.then(resp => {
								navigate("/register2", { state: { userId: resp.data.user_id } });
							})
							.catch(err => {
								console.error(err);
								showMessage(err.response.data.message || "Registration failed");
							});
					})
					.catch(err => {
						console.error('Error during reCAPTCHA execution:', err);
					})
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