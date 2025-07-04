import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { showMessage } from "./Functions";
import axios from "axios";
import '../styles/register2.scss';
import ReCAPTCHA from 'react-google-recaptcha';

function Login2() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, message } = location.state || {};
    const [code, setCode] = useState("");

    useEffect(() => {
        if (!user || !user.completed_2fa || !user.secret_key) navigate("/login");
    }, [navigate, user]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (code === "") return showMessage("Please enter a code");
        if (!e.target.checkValidity()) return;

        try {
            await window.grecaptcha.ready(() => {
                window.grecaptcha.execute('6Ld4encrAAAAABBPqZ_HHZCdDAzUSgbsiLklmkKP', { action: 'verify_2fa' })
                    .then((token1) => {

                        axios.post("/api/auth/verify_2fa", { token: code, user_id: user._id, captchaToken: token1 }, { withCredentials: true })
                            .then(() => {
                                showMessage(message, "success");
                                navigate(`/${user?.account_type}` || '/login');
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
        <div className="register2" style={{ background: 'url(/register_bg.jpg) center/cover no-repeat' }}>
            <form onSubmit={handleSubmit} noValidate>
                <h1>Complete 2FA</h1>

                <label htmlFor="code">
                    <i className="fa fa-key"></i>
                    Enter the code from your authenticator app:
                </label>
                <input type="number" id="code" name="code" required pattern="[0-9]{6}" placeholder="Enter code" onInput={(e) => setCode(e.target.value)} minLength={6} maxLength={6} min={0} max={999999} />
                <button>Submit</button>
            </form>

            <ReCAPTCHA
                sitekey="6Ld4encrAAAAABBPqZ_HHZCdDAzUSgbsiLklmkKP"
                size="invisible"
            />
        </div>
    )
}

export default Login2