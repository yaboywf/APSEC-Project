import { useState } from "react";
import axios from "axios";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const submitForm = (e) => {
        e.preventDefault();
        if (!e.target.checkValidity()) return;

        axios.post("api/auth/login", { username, password }, { headers: { "Content-Type": "application/json" }, withCredentials: true })
        .then(resp => {
            if (resp.data.user) alert(`Hello ${resp.data.user.name}! Login successful as ${resp.data.user.account_type}`);
        })
        .catch(() => {
            alert("Incorrect username or password");
            console.error("Login failed")
        });
    }

    return (
        <div className="login" onSubmit={(e) => submitForm(e)}>
            <h1>Login</h1>

            <form noValidate>
                <label htmlFor="login">Login</label>
                <input type="text" name="login" id="login" autoComplete="name" placeholder="Enter Username" onChange={(e) => setUsername(e.target.value)} required />
                <label htmlFor="password">Password</label>
                <input type="password" name="password" id="password" autoComplete="current-password" placeholder="Enter Password" onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
                <a href="/register">No account? Register one here</a>
            </form>
        </div>
    );
}   

export { Login }