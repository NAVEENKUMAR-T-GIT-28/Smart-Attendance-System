import { useState, useEffect } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import { FiSmartphone, FiMapPin, FiCheckCircle, FiXCircle, FiCalendar, FiAlertTriangle, FiLogOut, FiLoader } from 'react-icons/fi';

// ─── STUDENT DASHBOARD ──────────────────────────────────────────────────────
const StudentDashboard = () => {
    const { user } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [markingState, setMarkingState] = useState('idle'); // idle, gps, bio, done, error
    const [markMsg, setMarkMsg] = useState('');
    const [markDistance, setMarkDistance] = useState(null);
    const [showRegister, setShowRegister] = useState(false);
    const [regMsg, setRegMsg] = useState('');

    const loadDashboard = () => {
        api.get('/student/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
    };

    useEffect(() => { loadDashboard(); }, []);

    // ── DEVICE REGISTRATION ──
    const registerDevice = async () => {
        try {
            setRegMsg('Starting registration...');
            const optionsRes = await api.post('/webauthn/register-options');
            const attResp = await startRegistration({ optionsJSON: optionsRes.data });
            const verifyRes = await api.post('/webauthn/register-verify', attResp);
            if (verifyRes.data.verified) {
                setRegMsg('✓ Device registered successfully!');
                setShowRegister(false);
                loadDashboard();
            } else {
                setRegMsg('Registration failed. Try again.');
            }
        } catch (err) {
            setRegMsg(err.response?.data?.message || err.message || 'Registration error');
        }
    };

    // ── MARK ATTENDANCE ──
    const markAttendance = async (sessionId) => {
        setMarkingState('gps');
        setMarkMsg('');
        setMarkDistance(null);

        try {
            // 1. Get GPS
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true, timeout: 10000, maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;

            // 2. Get WebAuthn challenge
            setMarkingState('bio');
            const authOptions = await api.post('/webauthn/auth-options');
            const authResp = await startAuthentication({ optionsJSON: authOptions.data });

            // 3. Mark attendance
            const result = await api.post('/student/attendance/mark', {
                sessionId,
                latitude,
                longitude,
                webauthnResponse: authResp
            });

            setMarkingState('done');
            setMarkMsg(result.data.message);
            setMarkDistance(result.data.distance);
            loadDashboard();

        } catch (err) {
            setMarkingState('error');
            if (err.code === 1) {
                setMarkMsg('Location access denied. Please allow GPS.');
            } else if (err.code === 2 || err.code === 3) {
                setMarkMsg('Could not get location. Try again.');
            } else {
                setMarkMsg(err.response?.data?.message || err.message || 'Error marking attendance');
            }
        }
    };

    if (loading) return <div className="text-center mt-6"><div className="spinner" style={{ margin: '40px auto' }}></div></div>;

    return (
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px', minHeight: '100vh', background: 'var(--bg)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', marginBottom: '16px' }}>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {data?.name?.split(' ')[0]} 👋</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Student</div>
                </div>
                <div className="avatar" style={{ background: 'var(--brand-50)', color: 'var(--brand-600)' }}>
                    {data?.name?.charAt(0) || 'S'}
                </div>
            </div>

            {/* Device Registration Banner */}
            {!data?.hasDevice && (
                <div className="alert alert-warning mb-4" onClick={() => setShowRegister(true)} style={{ cursor: 'pointer' }}>
                    <span className="alert-icon"><FiSmartphone size={16} /></span>
                    <span>Register your biometric device to mark attendance. <strong>Tap here.</strong></span>
                </div>
            )}

            {showRegister && (
                <div className="card mb-4" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}><FiSmartphone size={32} /></div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '8px' }}>Register Your Device</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Your browser will prompt for fingerprint or Face ID. This device will be linked to your account.
                    </div>
                    <button className="btn btn-primary w-full" onClick={registerDevice}>Register Biometric Device</button>
                    {regMsg && <div className="mt-4" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{regMsg}</div>}
                </div>
            )}

            {/* Active Sessions */}
            {data?.activeSessions?.map(session => (
                <div key={session._id} className="attend-card">
                    <div className="attend-subject">{session.subjectId?.code} · Now Live</div>
                    <div className="attend-class">{session.subjectId?.name}</div>
                    <div className="attend-meta">{session.teacherId?.name} · {new Date(session.startTime).toLocaleTimeString()}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                        <div className="live-dot"></div>
                        <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 500 }}>Session Open</span>
                    </div>

                    {markingState === 'idle' && !session.alreadyMarked && data?.hasDevice && (
                        <button className="attend-btn-big" onClick={() => markAttendance(session._id)}>
                            <span style={{ fontSize: '20px' }}><FiSmartphone size={20} /></span>
                            Mark Attendance
                        </button>
                    )}

                    {session.alreadyMarked && (
                        <div className="success-card">
                            <div className="success-icon-ring"><FiCheckCircle size={20} /></div>
                            <div className="success-title">Already Marked!</div>
                            <div className="success-sub">Attendance recorded</div>
                        </div>
                    )}

                    {/* GPS Step */}
                    {markingState === 'gps' && (
                        <div className="step-list">
                            <div className="step-item done"><span className="step-icon"><FiCheckCircle size={14} /></span><span className="step-text">Session is open</span><span className="step-status" style={{ color: 'var(--success)' }}>OK</span></div>
                            <div className="step-item active"><span className="step-icon"><FiMapPin size={14} /></span><span className="step-text">Getting GPS location</span><span className="step-status" style={{ color: 'var(--info)' }}>...</span></div>
                            <div className="step-item waiting"><span className="step-icon"><FiSmartphone size={14} /></span><span className="step-text">Biometric check</span><span className="step-status">Waiting</span></div>
                        </div>
                    )}

                    {/* Biometric Step */}
                    {markingState === 'bio' && (
                        <div className="step-list">
                            <div className="step-item done"><span className="step-icon"><FiCheckCircle size={14} /></span><span className="step-text">Session is open</span><span className="step-status" style={{ color: 'var(--success)' }}>OK</span></div>
                            <div className="step-item done"><span className="step-icon"><FiCheckCircle size={14} /></span><span className="step-text">Inside campus</span><span className="step-status" style={{ color: 'var(--success)' }}>OK</span></div>
                            <div className="step-item active"><span className="step-icon"><FiSmartphone size={14} /></span><span className="step-text">Touch ID / Face ID</span><span className="step-status" style={{ color: 'var(--info)' }}>Waiting...</span></div>
                        </div>
                    )}

                    {/* Done */}
                    {markingState === 'done' && (
                        <div className="success-card">
                            <div className="success-icon-ring"><FiCheckCircle size={20} /></div>
                            <div className="success-title">Attendance Marked!</div>
                            <div className="success-sub">{session.subjectId?.code} · {new Date().toLocaleTimeString()}{markDistance ? ` · ${markDistance}m from campus` : ''}</div>
                        </div>
                    )}

                    {/* Error */}
                    {markingState === 'error' && (
                        <>
                            <div className="alert alert-danger"><span className="alert-icon"><FiXCircle size={14} /></span><span>{markMsg}</span></div>
                            <button className="btn btn-primary w-full mt-4" onClick={() => setMarkingState('idle')}>Try Again</button>
                        </>
                    )}
                </div>
            ))}

            {data?.activeSessions?.length === 0 && (
                <div className="card mb-4" style={{ textAlign: 'center', padding: '32px 20px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}><FiCalendar size={32} /></div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>No Active Sessions</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Your teacher will open a session when class begins.</div>
                </div>
            )}

            {/* Mini Stats */}
            <div className="grid-2 mb-4" style={{ gap: '8px' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--brand-500)' }}>{data?.overall?.percentage || 0}%</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall</div>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--success)' }}>{data?.todayPresent || 0}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</div>
                </div>
            </div>

            {/* Recent */}
            {data?.recentAttendance?.length > 0 && (
                <>
                    <div className="section-label">Recent</div>
                    <div className="history-list">
                        {data.recentAttendance.map(r => (
                            <div key={r._id} className="history-row">
                                <div>
                                    <div className="history-subj">{r.subjectId?.name || r.subjectId?.code}</div>
                                    <div className="history-time">{new Date(r.date).toLocaleDateString()}</div>
                                </div>
                                <span className={`badge ${r.status === 'present' ? 'badge-present' : 'badge-absent'}`}>
                                    {r.status === 'present' ? 'Present' : 'Absent'}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Attendance percentage alert */}
            {data?.overall?.percentage > 0 && data?.overall?.percentage < 75 && (
                <div className="alert alert-warning mt-4">
                    <span className="alert-icon"><FiAlertTriangle size={14} /></span>
                    <span>Your attendance is at {data.overall.percentage}% — below 75% minimum.</span>
                </div>
            )}

            {/* Logout */}
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { useAuthStore.getState().logout(); window.location.href = '/login'; }}>
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default StudentDashboard;
