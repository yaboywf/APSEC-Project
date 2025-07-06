import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { showMessage, encryptData } from "./Functions";
import axios from "axios";
import '../styles/register2.scss';
import ReCAPTCHA from 'react-google-recaptcha';

function Login2() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, message } = location.state || {};
    const [code, setCode] = useState("");
    const [publicKey, setPublicKey] = useState(null);

    useEffect(() => {
        if (!user || !user.secret_key) navigate("/login");

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

        // Cleanup when component unmounts
        return () => document.body.removeChild(script);
    }, [navigate, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (code === "") return showMessage("Please enter a code");
        if (!e.target.checkValidity()) return;

        try {
            const captchaToken = await new Promise((resolve, reject) => {
                window.grecaptcha.ready(() => {
                    window.grecaptcha.execute('6Ld4encrAAAAABBPqZ_HHZCdDAzUSgbsiLklmkKP', { action: 'login' })
                        .then(resolve)
                        .catch(reject);
                });
            });

            if (!publicKey) return showMessage('Cannot get public key');

            const encryptedCode = await encryptData(publicKey, code);
            if (!encryptedCode) return showMessage('Encryption failed');

            axios.post("/api/auth/verify_2fa", { token: encryptedCode, user_id: user._id, captchaToken }, { withCredentials: true })
                .then(() => {
                    showMessage(message, "success");
                    navigate(`/${user?.account_type}` || '/login', { state: { fa: true } });
                })
                .catch(err => {
                    console.error(err);
                    showMessage(err.response.data.message || "Registration failed");
                });
        } catch (err) {
            console.error('Error during 2FA verification:', err);
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