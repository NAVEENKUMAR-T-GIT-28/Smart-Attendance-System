import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Sidebar = ({ items, portalLabel, logoColor }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-mark" style={logoColor ? { background: logoColor } : {}}>
                    {user?.role === 'hod' ? 'A' : user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                    <div className="logo-text">AttendGuard</div>
                    <div className="logo-sub">{portalLabel || 'Portal'}</div>
                </div>
            </div>

            <div className="sidebar-nav">
                {items.map((section, si) => (
                    <div key={si}>
                        {section.label && <div className="nav-section-label">{section.label}</div>}
                        {section.links.map((link, li) => (
                            <NavLink
                                key={li}
                                to={link.to}
                                end={link.end}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                <span className="nav-icon">{link.icon}</span>
                                {link.text}
                                {link.badge && <span className="nav-badge">{link.badge}</span>}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="user-card" onClick={handleLogout}>
                    <div className="avatar" style={{ background: 'var(--brand-50)', color: 'var(--brand-600)', fontSize: '14px' }}>
                        {user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <div className="user-name">{user?.name || 'User'}</div>
                        <div className="user-role">{user?.role?.toUpperCase()} • Logout</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
