import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { showMessage, encryptData } from "./Functions";
import axios from "axios";
import '../styles/register2.scss';
import ReCAPTCHA from 'react-google-recaptcha';

function Register2() {
    const location = useLocation();
    const navigate = useNavigate();
    const { userId } = location.state || {};
    const [qrcode, setQrcode] = useState("");
    const [code, setCode] = useState("");
    const [publicKey, setPublicKey] = useState(null);

    useEffect(() => {
        // Check if user ID exists
        if (!userId) navigate("/register");

        // Generate QR code
        axios.post("/api/auth/generate_2fa", { user_id: userId }, { withCredentials: true })
            .then(resp => setQrcode(resp.data.qrcode))
            .catch(err => {
                console.error(err);
                showMessage(err.response.data.message || "Registration failed");
            });

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
    }, [userId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (code === "") return showMessage("Please enter a code");
        if (!qrcode) return;
        if (!e.target.checkValidity()) return;

        try {
            const captchaToken = await new Promise((resolve, reject) => {
                window.grecaptcha.ready(() => {
                    window.grecaptcha.execute('6Ld4encrAAAAABBPqZ_HHZCdDAzUSgbsiLklmkKP', { action: 'signUp' })
                        .then(resolve)
                        .catch(reject);
                });
            });

            if (!publicKey) return showMessage('Cannot get public key');

            const encryptedCode = await encryptData(publicKey, code);
            if (!encryptedCode) return showMessage('Encryption failed');

            axios.post("/api/auth/verify_2fa", { token: encryptedCode, user_id: userId, captchaToken }, { withCredentials: true })
                .then(() => {
                    showMessage("2FA set up successfully", "success");
                    navigate("/");
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
                <h1>Set Up 2FA</h1>
                {qrcode && <>
                    <p>Scan the QR code with your authenticator app to set up 2FA.</p>
                    <div>
                        <img src={qrcode} alt="QR Code" />
                    </div>
                </>}

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

export default Register2