import { NavLink } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-content">
                <NavLink to="/" className="navbar-brand">
                    🍞 MBG Bread <span>Workforce</span>
                </NavLink>
                <ul className="navbar-nav">
                    <li>
                        <NavLink
                            to="/"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            end
                        >
                            Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/leads"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            Daftar Dapur
                        </NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Navbar;
