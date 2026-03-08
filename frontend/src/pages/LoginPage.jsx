import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../utils/api';
import useAuthStore from '../store/authStore';
import { FiShield, FiUser, FiUsers, FiSmartphone, FiMapPin, FiZap, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

const LoginPage = () => {
    const [role, setRole] = useState('hod');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await loginUser({ email, password, role });
            login(res.data.token, res.data.user);

            if (role === 'hod') navigate('/hod');
            else if (role === 'teacher') navigate('/teacher');
            else navigate('/student');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { key: 'hod', label: <><FiShield size={14} style={{ marginRight: 4 }} /> HOD</> },
        { key: 'teacher', label: <><FiUsers size={14} style={{ marginRight: 4 }} /> Teacher</> },
        { key: 'student', label: <><FiUser size={14} style={{ marginRight: 4 }} /> Student</> }
    ];

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="login-brand">
                    <div className="login-brand-logo"><FiShield size={28} /></div>
                    <div className="login-brand-title">Attend<em>Guard</em></div>
                    <div className="login-brand-desc">
                        Secure, hardware-free attendance for Sri Sairam Engineering College.
                    </div>
                </div>
                <div className="login-features">
                    <div className="login-feature">
                        <div className="login-feature-icon"><FiSmartphone size={18} /></div>
                        Biometric via device — no scanner needed
                    </div>
                    <div className="login-feature">
                        <div className="login-feature-icon"><FiMapPin size={18} /></div>
                        GPS campus verification — no proxy possible
                    </div>
                    <div className="login-feature">
                        <div className="login-feature-icon"><FiZap size={18} /></div>
                        Mark attendance in under 10 seconds
                    </div>
                    <div className="login-feature">
                        <div className="login-feature-icon"><FiLock size={18} /></div>
                        One device per student — strictly enforced
                    </div>
                </div>
            </div>

            <div className="login-right">
                <div className="login-title">Welcome back</div>
                <div className="login-sub">Sign in to your account</div>

                <div className="role-tabs">
                    {roles.map(r => (
                        <button
                            key={r.key}
                            className={`role-tab ${role === r.key ? 'active' : ''}`}
                            onClick={() => { setRole(r.key); setError(''); }}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input
                            className="input"
                            type="email"
                            placeholder={role === 'hod' ? 'hod.cce@sairamtit.edu.in' : 'user@sairamtap.edu.in'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingRight: '40px' }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    color: 'var(--text-tertiary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px'
                                }}
                            >
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger mb-4">
                            <span className="alert-icon"><FiAlertCircle size={14} /></span>
                            <span>{error}</span>
                        </div>
                    )}

                    <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
                        {loading ? <span className="spinner" style={{ borderTopColor: 'white' }}></span> : 'Login →'}
                    </button>
                </form>

                <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    Biometric registration happens after first login
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
