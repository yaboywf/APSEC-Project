import { useState, useEffect } from "react";
import axios from "axios";
import { showMessage, generateKeys, decryptData } from './Functions';
import { useNavigate, useLocation } from 'react-router-dom';

function TeacherAssistantPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [userInfo, setUserInfo] = useState({});
    const [apiResponse, setApiResponse] = useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const { fa } = location.state || {};

    useEffect(() => {
        const getKeys = async () => {
            try {
                const { privateKey, publicKeyPem } = await generateKeys();
                axios.get("/api/auth/verify", { headers: { "Content-Type": "application/json", "client_key": btoa(publicKeyPem.replace(/\n/g, '')) }, withCredentials: true })
                    .then(async (resp) => {
                        let user = await decryptData(privateKey, resp.data.user);
                        user = JSON.parse(user);
                        if (user.account_type !== "teacher-assistant") throw new Error("You do not have the required permissions");
                        setIsAuthenticated(true);
                        setUserInfo(user);
                    })
                    .catch(err => {
                        setIsAuthenticated(false);
                        showMessage(`Authentication failed: ${err.response?.data?.message || err.message || "Unknown error"}`);
                        navigate('/login');
                    });
            } catch (error) {
                console.error('Key generation failed:', error);
            }
        }

        getKeys();

        if (!fa) {
            axios.post("/api/auth/logout", {}, { withCredentials: true })
                .then(() => {
                    showMessage("Authentication failed: 2FA not done");
                    navigate('/login');  
                })
                .catch(err => console.error(err));
        };

        axios.get("/api/ta", { headers: { "Content-Type": "application/json" }, withCredentials: true })
            .then(resp => setApiResponse(resp.data))
            .catch(err => {
                console.error(err);
                showMessage(`API request failed: ${err.response?.data?.message || err.message || "Unknown error"}`);
            });
    }, [navigate, fa]);

    const logout = () => {
        axios.post("/api/auth/logout", {}, { headers: { "Content-Type": "application/json" }, withCredentials: true })
            .then(resp => {
                setIsAuthenticated(false);
                setUserInfo({});
                showMessage(resp.data.message, "success");
                navigate('/login');
            })
            .catch(err => showMessage(`Logout failed: ${err.response?.data?.message || err.message || "Unknown error"}`));
    }

    return (
        <div className="page">
            {isAuthenticated === null && <div className="loader_container">
                <div className="loader"></div>
                <p>Loading...</p>
            </div>}

            {isAuthenticated && <>
                <h1>Teacher Assistant Page</h1>

                <p>Name: {userInfo.name || "N/A"}</p>
                <p>Email: {userInfo.email || "N/A"}</p>
                <p>Account Type: {userInfo.account_type || "N/A"}</p>

                <button onClick={logout}>Logout</button>
            </>}

            {(isAuthenticated && apiResponse.message) && <p>API Response: {apiResponse.message}</p>}
        </div>
    );
}

export default TeacherAssistantPage