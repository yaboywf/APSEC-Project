import { Outlet } from "react-router-dom";
import '../styles/general.scss';

function Layout() {
    return (
        <main>
            <div className="error_container"></div>
            <Outlet />
        </main>
    )
}

export default Layout