import { useState, useEffect } from "react";
import axios from "axios";
import { addError } from './Functions';
import { useNavigate } from 'react-router-dom';

function TeacherAssistantPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [userInfo, setUserInfo] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("/api/auth/verify", { headers: { "Content-Type": "application/json" }, withCredentials: true })
        .then(resp => {
            if (resp.data.user.account_type !== "teacher-assistant") throw new Error("You do not have the required permissions");
            setIsAuthenticated(true);
            setUserInfo(resp.data.user);
        })
        .catch(err => {
            setIsAuthenticated(false);
            addError(`Authentication failed: ${err.response?.data?.message || err.message || "Unknown error"}`);
            navigate('/login');
        });
    }, []);

    const logout = () => {
        axios.post("/api/auth/logout", {}, { headers: { "Content-Type": "application/json" }, withCredentials: true })
        .then(() => navigate('/login'))
        .catch(err => addError(`Logout failed: ${err.response?.data?.message || err.message || "Unknown error"}`));
    }

    return (
        <div>
            {isAuthenticated === null && <div>Loading...</div>}
            {isAuthenticated && <>
                <h1>Teacher Assistant Page</h1>

                <p>Name: {userInfo.name || "N/A"}</p>
                <p>Email: {userInfo.email || "N/A"}</p>
                <p>Account Type: {userInfo.account_type || "N/A"}</p>

                <button onClick={logout}>Logout</button>
            </>}
        </div>
    );
}

export default TeacherAssistantPage