import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { getTeacherDashboard, getTeacherClasses, teacherStartSession, teacherCloseSession, getSessionAttendance, getTeacherReports } from '../../utils/api';
import { FiHome, FiZap, FiBook, FiBarChart2, FiPlay } from 'react-icons/fi';

const teacherNavItems = [
    {
        label: 'Main',
        links: [
            { to: '/teacher', icon: <FiHome size={16} />, text: 'Dashboard', end: true },
            { to: '/teacher/session', icon: <FiZap size={16} />, text: 'Live Session' },
        ]
    },
    {
        label: 'My Classes',
        links: [
            { to: '/teacher/classes', icon: <FiBook size={16} />, text: 'My Classes' },
        ]
    },
    {
        label: 'Reports',
        links: [
            { to: '/teacher/reports', icon: <FiBarChart2 size={16} />, text: 'My Reports' },
        ]
    }
];

const TeacherLayout = () => {
    return (
        <div className="app-shell">
            <Sidebar items={teacherNavItems} portalLabel="Teacher Portal" logoColor="var(--success)" />
            <div className="main-content">
                <Outlet />
            </div>
        </div>
    );
};

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
export const TeacherDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTeacherDashboard().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center mt-6"><div className="spinner" style={{ margin: '40px auto' }}></div></div>;

    return (
        <div className="animate">
            <div className="topbar">
                <div>
                    <div className="page-title">Dashboard</div>
                    <div className="page-sub">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>

            <div className="stats-row stats-row-3">
                <div className="stat-card">
                    <div className="stat-label">Assigned Classes</div>
                    <div className="stat-value" style={{ fontSize: '28px' }}>{data?.assignedClasses || 0}</div>
                    <div className="stat-sub">Class-subject mappings</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Active Sessions</div>
                    <div className="stat-value" style={{ fontSize: '28px', color: 'var(--success)' }}>{data?.activeSessions?.length || 0}</div>
                    <div className="stat-sub">Open right now</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Today's Sessions</div>
                    <div className="stat-value" style={{ fontSize: '28px', color: 'var(--info)' }}>{data?.todaySessionCount || 0}</div>
                    <div className="stat-sub">Total today</div>
                </div>
            </div>

            {data?.activeSessions?.length > 0 && (
                <>
                    <div className="section-label">Active Sessions</div>
                    {data.activeSessions.map(s => (
                        <div key={s._id} className="session-row">
                            <div className="live-dot"></div>
                            <div>
                                <div className="session-subject">{s.subjectId?.name}</div>
                                <div className="session-meta">{s.classId?.label} · Opened {new Date(s.startTime).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    ))}
                </>
            )}

            {data?.mappings?.length > 0 && (
                <>
                    <div className="section-label mt-6">My Assignments</div>
                    <div className="card">
                        <table className="data-table">
                            <thead><tr><th>Class</th><th>Subject</th></tr></thead>
                            <tbody>
                                {data.mappings.map(m => (
                                    <tr key={m._id}>
                                        <td>{m.classId?.label}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--brand-600)' }}>{m.subjectId?.code} — {m.subjectId?.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

// ─── MY CLASSES ─────────────────────────────────────────────────────────────
export const MyClasses = () => {
    const [mappings, setMappings] = useState([]);

    useEffect(() => {
        getTeacherClasses().then(r => setMappings(r.data));
    }, []);

    return (
        <div className="animate">
            <div className="topbar">
                <div><div className="page-title">My Classes</div><div className="page-sub">{mappings.length} assignments</div></div>
            </div>
            <div className="card">
                <table className="data-table">
                    <thead><tr><th>Class</th><th>Subject</th><th>Code</th></tr></thead>
                    <tbody>
                        {mappings.map(m => (
                            <tr key={m._id}>
                                <td style={{ fontWeight: 600 }}>{m.classId?.label}</td>
                                <td>{m.subjectId?.name}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--brand-600)' }}>{m.subjectId?.code}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── LIVE SESSION ───────────────────────────────────────────────────────────
export const LiveSession = () => {
    const [mappings, setMappings] = useState([]);
    const [form, setForm] = useState({ classId: '', subjectId: '' });
    const [session, setSession] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        getTeacherClasses().then(r => setMappings(r.data));
        getTeacherDashboard().then(r => {
            const active = r.data.activeSessions;
            if (active && active.length > 0) {
                setSession(active[0]);
                loadAttendance(active[0]._id);
            }
        });
    }, []);

    const startSession = async (e) => {
        e.preventDefault();
        try {
            const res = await teacherStartSession(form);
            setSession(res.data.session);
            setMsg(`Session opened! ${res.data.studentsEnrolled} students.`);
            loadAttendance(res.data.session._id);
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    const loadAttendance = async (sessionId) => {
        const res = await getSessionAttendance(sessionId);
        setAttendance(res.data);
    };

    const closeSession = async () => {
        try {
            await teacherCloseSession(session._id);
            setSession(null);
            setMsg('Session closed.');
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;

    return (
        <div className="animate">
            <div className="topbar">
                <div>
                    <div className="page-title">Live Session</div>
                    <div className="page-sub">{session ? 'Session active' : 'Start a new session'}</div>
                </div>
                {session && (
                    <div className="topbar-actions">
                        <button className="btn btn-danger btn-sm" onClick={closeSession}>⏹ Close Session</button>
                    </div>
                )}
            </div>

            {!session && (
                <div className="card mb-4">
                    <form onSubmit={startSession} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                            <label className="input-label">Class + Subject</label>
                            <select className="input" onChange={e => {
                                const m = mappings[e.target.value];
                                if (m) setForm({ classId: m.classId?._id || m.classId, subjectId: m.subjectId?._id || m.subjectId });
                            }} required>
                                <option value="">Select</option>
                                {mappings.map((m, i) => (
                                    <option key={m._id} value={i}>{m.classId?.label} — {m.subjectId?.name}</option>
                                ))}
                            </select>
                        </div>
                        <button className="btn btn-success" type="submit"><FiPlay size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Start Session</button>
                    </form>
                    {msg && <div className="alert alert-info mt-4"><span>{msg}</span></div>}
                </div>
            )}

            {session && (
                <>
                    <div className="live-session-banner">
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div className="live-dot"></div>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>LIVE · OPEN</span>
                            </div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
                                {mappings.find(m => (m.subjectId?._id || m.subjectId) === form.subjectId)?.subjectId?.name || 'Session'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                                Opened {new Date(session.startTime).toLocaleTimeString()}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', lineHeight: 1, color: 'var(--brand-500)' }}>{presentCount}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Present so far</div>
                        </div>
                    </div>

                    <div className="stats-row stats-row-3" style={{ marginBottom: '20px' }}>
                        <div className="stat-card">
                            <div className="stat-label">Present</div>
                            <div className="stat-value" style={{ fontSize: '28px', color: 'var(--success)' }}>{presentCount}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Absent</div>
                            <div className="stat-value" style={{ fontSize: '28px', color: 'var(--danger)' }}>{absentCount}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Rate</div>
                            <div className="stat-value" style={{ fontSize: '28px' }}>
                                {attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0}%
                            </div>
                        </div>
                    </div>

                    <div className="section-label">Student Roll</div>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => loadAttendance(session._id)}>↻ Refresh</button>
                        </div>
                        <table className="data-table">
                            <thead><tr><th>Student</th><th>Roll No.</th><th>Marked At</th><th>Status</th></tr></thead>
                            <tbody>
                                {attendance.map(a => (
                                    <tr key={a._id}>
                                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="avatar" style={{ width: '28px', height: '28px', background: a.status === 'present' ? 'var(--success-bg)' : 'var(--danger-bg)', color: a.status === 'present' ? 'var(--success)' : 'var(--danger)', fontSize: '11px' }}>{a.studentId?.name?.charAt(0)}</div>{a.studentId?.name}</div></td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{a.studentId?.registerNumber || '—'}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{a.markedAt ? new Date(a.markedAt).toLocaleTimeString() : '—'}</td>
                                        <td><span className={`badge ${a.status === 'present' ? 'badge-present' : 'badge-absent'}`}>● {a.status === 'present' ? 'Present' : 'Absent'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

// ─── REPORTS ────────────────────────────────────────────────────────────────
export const TeacherReports = () => {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        getTeacherReports().then(r => setReports(r.data));
    }, []);

    return (
        <div className="animate">
            <div className="topbar">
                <div><div className="page-title">My Reports</div><div className="page-sub">Attendance statistics for your subjects</div></div>
            </div>

            <div className="grid-2">
                {reports.map((r, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-label">{r.subjectId?.code || 'Subject'}</div>
                        <div className="stat-value" style={{ fontSize: '28px', color: r.percentage >= 75 ? 'var(--success)' : 'var(--warning)' }}>{r.percentage}%</div>
                        <div className="stat-sub">{r.presentRecords} present out of {r.totalRecords} · {r.totalSessions} sessions</div>
                        <div className="progress-wrap mt-2" style={{ marginTop: '8px' }}>
                            <div className="progress-fill" style={{ width: `${r.percentage}%`, background: r.percentage >= 75 ? 'linear-gradient(90deg, var(--success), #4ADE80)' : 'linear-gradient(90deg, var(--warning), #FCD34D)' }}></div>
                        </div>
                    </div>
                ))}
                {reports.length === 0 && <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px' }}>No data yet. Start sessions and let students mark attendance.</div>}
            </div>
        </div>
    );
};

export default TeacherLayout;
