import axios from "axios";

function Register() {
    const submitForm = (e) => {
        e.preventDefault();
        if (!e.target.checkValidity()) return;

        const formData = new FormData(e.target);
        const username = formData.get("username");
        const password = formData.get("password");
        const email = formData.get("email");
        const account_type = formData.get("account_type");

        axios.post("http://127.0.0.1:3000/api/auth/register", { username, password, email, account_type }, { headers: { "Content-Type": "application/json" } })
        .then(resp => {
            console.log(resp);
            alert(resp.data.message);
        })
        .catch(err => console.error(err))
    }

    return (
        <div className="register">
            <h1>Register</h1>

            <form onSubmit={(e) => submitForm(e)} noValidate>
                <label htmlFor="username">Username</label>
                <input type="text" name="username" id="username" required placeholder="Enter Username" autoComplete="name" />

                <label htmlFor="password">Password</label>
                <input type="password" name="password" id="password" required placeholder="Enter Password" autoComplete="new-password" />

                <label htmlFor="email">Email</label>
                <input type="email" name="email" id="email" required placeholder="Enter Email" autoComplete="email" />

                <label htmlFor="account-type">Account Type</label>
                <select name="account_type" id="account-type" defaultValue={"student"} required>
                    <option value="student">Student</option>
                    <option value="teacher-assistant">Teacher's Assistant</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                </select>

                <button type="submit">Register</button>
            </form>

            <a href="/">Back to login</a>
        </div>
    );
}

export { Register }