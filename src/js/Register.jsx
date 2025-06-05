import { useState } from "react";
import axios from "axios";
import '../styles/login.scss';
import '../styles/register.scss';
import { showError, hideError, addError } from './Functions';

function Register() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [accountType, setAccountType] = useState("");

	const handleLogin = async (e) => {
		e.preventDefault();
		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

		hideError("username_error");
		hideError("password_error");
		hideError("email_error");
		hideError("accountType_error");

		if (!username || username === "") showError("username_error", "Please enter a username");
		if (!password || password === "") showError("password_error", "Please enter a password");
		if (!emailPattern.test(email)) showError("email_error", "Please enter a valid email");
		if (!accountType || accountType === "") showError("accountType_error", "Please select an account type");
		if (!e.target.checkValidity()) return;

		axios.post("/api/auth/register", { username, password, email, account_type: accountType }, { headers: { "Content-Type": "application/json" }, withCredentials: true })
		.then(resp => {
			addError(resp.data.message, "success");
			console.log(resp.data);
		})
		.catch(err => {
			console.log(err);
			addError(err.response.data.message || "Registration failed");
		});
	}

	return (
		<div className="login register" style={{ background: 'url(/register_bg.jpg) center/cover no-repeat' }}>
			<form onSubmit={handleLogin} noValidate>
				<label htmlFor="username">
					<i className="fa fa-user"></i>
					Username:</label>
				<input type="text" id="username" name="username" autoComplete="username" autoFocus required placeholder="Enter Username" onInput={e => setUsername(e.target.value)} />

				<p id="username_error" className="error"></p>

				<label htmlFor="password">
					<i className="fa fa-lock"></i>
					Password:
				</label>
				<input type="password" id="password" name="password" autoComplete="current-password" required placeholder="Enter Password" onInput={e => setPassword(e.target.value)} />

				<p id="password_error" className="error"></p>

				<label htmlFor="email">
					<i className="fa fa-envelope"></i>
					Email:
				</label>
				<input type="email" id="email" name="email" autoComplete="email" required placeholder="Enter Email" onInput={e => setEmail(e.target.value)} />

				<p id="email_error" className="error"></p>

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

				<p id="accountType_error" className="error"></p>

				<button type="submit">Register</button>

				<p><a href="/login">I have an account</a></p>
			</form>
		</div>
	);
}

export default Register;