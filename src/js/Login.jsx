import { useState } from "react";
import axios from "axios";
import '../styles/login.scss';
import { showError, hideError } from './Functions';

function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const handleLogin = async (e) => {
		e.preventDefault();

		hideError("username_error");
		hideError("password_error");

		if (!username || username === "") showError("username_error", "Please enter a username");
		if (!password || password === "") showError("password_error", "Please enter a password");
		if (!e.target.checkValidity()) return;

		axios.post("/api/auth/login", { username, password }, { headers: { "Content-Type": "application/json" }, withCredentials: true })
		.then(resp => {
			alert(resp.data.message);
			console.log(resp.data);
		})
		.catch(err => {
			console.log(err);
			alert(err.response.data.message);
		});
	}
	
	return (
		<div className="login" style={{ background: 'url(/login_bg.jpg) center/cover no-repeat' }}>
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

				<button type="submit">Login</button>

				<p>Don't have an account? <a href="/register">Register</a></p>
			</form>
		</div>
	);
}

export default Login;
