import React from "react";

function Login() {
    return (
        <div className="login">
            <h1>Login</h1>

            <form>
                <label htmlFor="login">Login</label>
                <input type="text" name="login" id="login" />
                <label htmlFor="password">Password</label>
                <input type="password" name="password" id="password" />
                <button type="submit">Login</button>
            </form>
        </div>
    );
}   

export { Login }