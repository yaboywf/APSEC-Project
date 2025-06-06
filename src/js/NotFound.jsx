import { useNavigate } from 'react-router-dom';
import '../styles/notFound.scss';

function NotFound() {
    const navigate = useNavigate();

    return (
        <div className='not_found' style={{ background: 'url(/not_found_bg.png) center/cover no-repeat' }}>
            <h1>404</h1>
            <h2>Page not found</h2>

            <p>The page you are looking for does not exist. It might have been renamed, moved or deleted.</p>
            <button onClick={() => navigate('/login')}>Return to Login</button>
        </div>
    );
}

export default NotFound;