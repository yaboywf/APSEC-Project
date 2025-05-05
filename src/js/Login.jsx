import React, { useState } from "react";
import axios from "axios";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const submitForm = (e) => {
        e.preventDefault();
        if (!e.target.checkValidity()) return;

        axios.post("http://127.0.0.1:3000/api/auth/login", { username, password }, { headers: { "Content-Type": "application/json" } })
        .then(resp => {
            localStorage.setItem("token", resp.data.token);
            console.log(resp.data.account_type);
        })
        .catch(err => console.error(err.response?.data))
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