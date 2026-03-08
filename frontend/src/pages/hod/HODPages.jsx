import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { getHodDashboard, getClasses, createClass, deleteClass, getSubjects, createSubject, deleteSubject, getUsers, addUser, deleteUser, getMappings, createMapping, deleteMapping, getEnrollments, createEnrollment, deleteEnrollment, hodStartSession, hodCloseSession, getAttendanceReport } from '../../utils/api';
import { FiHome, FiCalendar, FiGrid, FiBook, FiUsers, FiUserCheck, FiLink, FiClipboard, FiBarChart2, FiPlay } from 'react-icons/fi';

const hodNavItems = [
    {
        label: 'Main',
        links: [
            { to: '/hod', icon: <FiHome size={16} />, text: 'Dashboard', end: true },
            { to: '/hod/sessions', icon: <FiCalendar size={16} />, text: 'Sessions' },
        ]
    },
    {
        label: 'Manage',
        links: [
            { to: '/hod/classes', icon: <FiGrid size={16} />, text: 'Classes' },
            { to: '/hod/subjects', icon: <FiBook size={16} />, text: 'Subjects' },
            { to: '/hod/teachers', icon: <FiUsers size={16} />, text: 'Teachers' },
            { to: '/hod/students', icon: <FiUserCheck size={16} />, text: 'Students' },
            { to: '/hod/mappings', icon: <FiLink size={16} />, text: 'Mappings' },
            { to: '/hod/enrollments', icon: <FiClipboard size={16} />, text: 'Enrollments' },
        ]
    },
    {
        label: 'Reports',
        links: [
            { to: '/hod/reports', icon: <FiBarChart2 size={16} />, text: 'Attendance' },
        ]
    }
];

const HODLayout = () => {
    return (
        <div className="app-shell">
            <Sidebar items={hodNavItems} portalLabel="HOD Portal" />
            <div className="main-content">
                <Outlet />
            </div>
        </div>
    );
};

// ─── HOD DASHBOARD ──────────────────────────────────────────────────────────
export const HODDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHodDashboard().then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
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

            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-label">Students</div>
                    <div className="stat-value" style={{ fontSize: '28px' }}>{stats?.totalStudents || 0}</div>
                    <div className="stat-sub">Across {stats?.totalClasses || 0} classes</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Present Today</div>
                    <div className="stat-value" style={{ fontSize: '28px', color: 'var(--success)' }}>{stats?.presentToday || 0}</div>
                    <div className="stat-sub" style={{ color: 'var(--success)' }}>
                        {stats?.totalToday > 0 ? `${Math.round((stats.presentToday / stats.totalToday) * 100)}% rate` : 'No sessions today'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Live Sessions</div>
                    <div className="stat-value" style={{ fontSize: '28px', color: 'var(--info)' }}>{stats?.liveSessions || 0}</div>
                    <div className="stat-sub">Active now</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Low Attendance</div>
                    <div className="stat-value" style={{ fontSize: '28px', color: 'var(--warning)' }}>{stats?.lowAttendanceCount || 0}</div>
                    <div className="stat-sub" style={{ color: 'var(--warning)' }}>Below 75%</div>
                </div>
            </div>
        </div>
    );
};

// ─── MANAGE CLASSES ─────────────────────────────────────────────────────────
export const ManageClasses = () => {
    const [classes, setClasses] = useState([]);
    const [year, setYear] = useState(1);
    const [section, setSection] = useState('A');
    const [msg, setMsg] = useState('');

    const load = () => getClasses().then(r => setClasses(r.data));
    useEffect(() => { load(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await createClass({ year: Number(year), section });
            setMsg('Class created!');
            load();
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this class?')) {
            await deleteClass(id);
            load();
        }
    };

    return (
        <div className="animate">
            <div className="topbar">
                <div><div className="page-title">Manage Classes</div><div className="page-sub">Create and manage class sections</div></div>
            </div>

            <div className="card mb-4">
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ marginBottom: 0, width: '80px' }}>
                        <label className="input-label">Dept</label>
                        <input className="input" value="CCE" disabled style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '100px' }}>
                        <label className="input-label">Year</label>
                        <select className="input" value={year} onChange={e => setYear(e.target.value)}>
                            <option value={1}>Year 1</option><option value={2}>Year 2</option>
                            <option value={3}>Year 3</option><option value={4}>Year 4</option>
                        </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Section</label>
                        <input className="input" value={section} onChange={e => setSection(e.target.value.toUpperCase())} maxLength={2} />
                    </div>
                    <button className="btn btn-primary" type="submit">+ Add Class</button>
                </form>
                {msg && <div className="alert alert-info mt-4"><span>{msg}</span></div>}
            </div>

            <div className="card">
                <table className="data-table">
                    <thead><tr><th>Label</th><th>Year</th><th>Section</th><th>Actions</th></tr></thead>
                    <tbody>
                        {classes.map(c => (
                            <tr key={c._id}>
                                <td style={{ fontWeight: 600 }}>{c.label}</td>
                                <td>Year {c.year}</td>
                                <td>Section {c.section}</td>
                                <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>Delete</button></td>
                            </tr>
                        ))}
                        {classes.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No classes yet. Create one above.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── MANAGE SUBJECTS ────────────────────────────────────────────────────────
export const ManageSubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [msg, setMsg] = useState('');

    const load = () => getSubjects().then(r => setSubjects(r.data));
    useEffect(() => { load(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await createSubject({ name, code });
            setMsg('Subject created!'); setName(''); setCode('');
            load();
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    return (
        <div className="animate">
            <div className="topbar">
                <div><div className="page-title">Manage Subjects</div><div className="page-sub">Create and manage department subjects</div></div>
            </div>

            <div className="card mb-4">
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label className="input-label">Subject Name</label>
                        <input className="input" placeholder="Data Structures & Algorithms" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Code</label>
                        <input className="input" placeholder="CS301" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required />
                    </div>
                    <button className="btn btn-primary" type="submit">+ Add Subject</button>
                </form>
                {msg && <div className="alert alert-info mt-4"><span>{msg}</span></div>}
            </div>

            <div className="card">
                <table className="data-table">
                    <thead><tr><th>Code</th><th>Name</th><th>Actions</th></tr></thead>
                    <tbody>
                        {subjects.map(s => (
                            <tr key={s._id}>
                                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-600)' }}>{s.code}</td>
                                <td style={{ fontWeight: 600 }}>{s.name}</td>
                                <td><button className="btn btn-danger btn-sm" onClick={async () => { await deleteSubject(s._id); load(); }}>Delete</button></td>
                            </tr>
                        ))}
                        {subjects.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No subjects yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── MANAGE TEACHERS ────────────────────────────────────────────────────────
export const ManageTeachers = () => {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', password: '', staffId: '' });
    const [msg, setMsg] = useState('');
    const [showForm, setShowForm] = useState(false);

    const load = () => getUsers('teacher').then(r => setUsers(r.data));
    useEffect(() => { load(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await addUser({ ...form, role: 'teacher' });
            setMsg('Teacher added!'); setForm({ name: '', email: '', password: '', staffId: '' }); setShowForm(false);
            load();
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    return (
        <div className="animate">
            <div className="topbar">
                <div><div className="page-title">Manage Teachers</div><div className="page-sub">{users.length} teachers in department</div></div>
                <div className="topbar-actions"><button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Add Teacher</button></div>
            </div>

            {showForm && (
                <div className="card mb-4">
                    <form onSubmit={handleAdd}>
                        <div className="grid-2">
                            <div className="input-group"><label className="input-label">Full Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                            <div className="input-group"><label className="input-label">Staff ID</label><input className="input" value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                            <div className="input-group"><label className="input-label">Password</label><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button className="btn btn-primary" type="submit">Save Teacher</button>
                            <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
            {msg && <div className="alert alert-info mb-4"><span>{msg}</span></div>}

            <div className="card">
                <table className="data-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Staff ID</th><th>Actions</th></tr></thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id}>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="avatar" style={{ width: '28px', height: '28px', background: 'var(--brand-50)', color: 'var(--brand-600)', fontSize: '11px' }}>{u.name?.charAt(0)}</div>{u.name}</div></td>
                                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{u.staffId || '—'}</td>
                                <td><button className="btn btn-danger btn-sm" onClick={async () => { await deleteUser(u._id); load(); }}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── MANAGE STUDENTS ────────────────────────────────────────────────────────
export const ManageStudents = () => {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', password: '', registerNumber: '' });
    const [msg, setMsg] = useState('');
    const [showForm, setShowForm] = useState(false);

    const load = () => getUsers('student').then(r => setUsers(r.data));
    useEffect(() => { load(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await addUser({ ...form, role: 'student' });
            setMsg('Student added!'); setForm({ name: '', email: '', password: '', registerNumber: '' }); setShowForm(false);
            load();
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    return (
        <div className="animate">
            <div className="topbar">
                <div><div className="page-title">Manage Students</div><div className="page-sub">{users.length} students in department</div></div>
                <div className="topbar-actions"><button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Add Student</button></div>
            </div>

            {showForm && (
                <div className="card mb-4">
                    <form onSubmit={handleAdd}>
                        <div className="grid-2">
                            <div className="input-group"><label className="input-label">Full Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                            <div className="input-group"><label className="input-label">Register Number</label><input className="input" value={form.registerNumber} onChange={e => setForm({ ...form, registerNumber: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                            <div className="input-group"><label className="input-label">Password</label><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button className="btn btn-primary" type="submit">Save Student</button>
                            <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
            {msg && <div className="alert alert-info mb-4"><span>{msg}</span></div>}

            <div className="card">
                <table className="data-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Register No.</th><th>Actions</th></tr></thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id}>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="avatar" style={{ width: '28px', height: '28px', background: 'var(--brand-50)', color: 'var(--brand-600)', fontSize: '11px' }}>{u.name?.charAt(0)}</div>{u.name}</div></td>
                                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{u.registerNumber || '—'}</td>
                                <td><button className="btn btn-danger btn-sm" onClick={async () => { await deleteUser(u._id); load(); }}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── MAPPINGS ───────────────────────────────────────────────────────────────
export const Mappings = () => {
    const [mappings, setMappings] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [form, setForm] = useState({ teacherId: '', classId: '', subjectId: '' });
    const [msg, setMsg] = useState('');

    const load = () => {
        getMappings().then(r => setMappings(r.data));
        getUsers('teacher').then(r => setTeachers(r.data));
        getClasses().then(r => setClasses(r.data));
        getSubjects().then(r => setSubjects(r.data));
    };
    useEffect(() => { load(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await createMapping(form);
            setMsg('Mapping created!'); load();
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    return (
        <div className="animate">
            <div className="topbar">
                <div><div className="page-title">Teacher Mappings</div><div className="page-sub">Assign teacher → class → subject</div></div>
            </div>

            <div className="card mb-4">
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                        <label className="input-label">Teacher</label>
                        <select className="input" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })} required>
                            <option value="">Select teacher</option>
                            {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                        <label className="input-label">Class</label>
                        <select className="input" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} required>
                            <option value="">Select class</option>
                            {classes.map(c => <option key={c._id} value={c._id}>{c.label}</option>)}
                        </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                        <label className="input-label">Subject</label>
                        <select className="input" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} required>
                            <option value="">Select subject</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.code} — {s.name}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" type="submit">+ Assign</button>
                </form>
                {msg && <div className="alert alert-info mt-4"><span>{msg}</span></div>}
            </div>

            <div className="card">
                <table className="data-table">
                    <thead><tr><th>Teacher</th><th>Class</th><th>Subject</th><th>Actions</th></tr></thead>
                    <tbody>
                        {mappings.map(m => (
                            <tr key={m._id}>
                                <td style={{ fontWeight: 600 }}>{m.teacherId?.name}</td>
                                <td>{m.classId?.label}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--brand-600)' }}>{m.subjectId?.code} — {m.subjectId?.name}</td>
                                <td><button className="btn btn-danger btn-sm" onClick={async () => { await deleteMapping(m._id); load(); }}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── ENROLLMENTS ────────────────────────────────────────────────────────────
export const Enrollments = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [form, setForm] = useState({ studentId: '', classId: '', subjectIds: [] });
    const [msg, setMsg] = useState('');

    const load = () => {
        getEnrollments().then(r => setEnrollments(r.data));
        getUsers('student').then(r => setStudents(r.data));
        getClasses().then(r => setClasses(r.data));
        getSubjects().then(r => setSubjects(r.data));
    };
    useEffect(() => { load(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await createEnrollment(form);
            setMsg('Enrolled!'); load();
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    const toggleSubject = (subId) => {
        setForm(prev => ({
            ...prev,
            subjectIds: prev.subjectIds.includes(subId)
                ? prev.subjectIds.filter(id => id !== subId)
                : [...prev.subjectIds, subId]
        }));
    };

    return (
        <div className="animate">
            <div className="topbar">
                <div><div className="page-title">Student Enrollments</div><div className="page-sub">Enroll students in class subjects</div></div>
            </div>

            <div className="card mb-4">
                <form onSubmit={handleAdd}>
                    <div className="grid-2 mb-4">
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Student</label>
                            <select className="input" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} required>
                                <option value="">Select student</option>
                                {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.registerNumber})</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Class</label>
                            <select className="input" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} required>
                                <option value="">Select class</option>
                                {classes.map(c => <option key={c._id} value={c._id}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Subjects (select multiple)</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {subjects.map(s => (
                                <button type="button" key={s._id}
                                    className={`btn btn-sm ${form.subjectIds.includes(s._id) ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => toggleSubject(s._id)}
                                >{s.code} — {s.name}</button>
                            ))}
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={form.subjectIds.length === 0}>Enroll Student</button>
                </form>
                {msg && <div className="alert alert-info mt-4"><span>{msg}</span></div>}
            </div>

            <div className="card">
                <table className="data-table">
                    <thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Actions</th></tr></thead>
                    <tbody>
                        {enrollments.map(e => (
                            <tr key={e._id}>
                                <td style={{ fontWeight: 600 }}>{e.studentId?.name}</td>
                                <td>{e.classId?.label}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--brand-600)' }}>{e.subjectId?.code}</td>
                                <td><button className="btn btn-danger btn-sm" onClick={async () => { await deleteEnrollment(e._id); load(); }}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── SESSIONS ───────────────────────────────────────────────────────────────
export const Sessions = () => {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [form, setForm] = useState({ classId: '', subjectId: '', teacherId: '' });
    const [msg, setMsg] = useState('');
    const [activeSessions, setActiveSessions] = useState([]);

    const loadSessions = () => {
        getHodDashboard().then(r => setActiveSessions(r.data.liveSessionDetails || []));
    };

    useEffect(() => {
        getClasses().then(r => setClasses(r.data));
        getSubjects().then(r => setSubjects(r.data));
        getUsers('teacher').then(r => setTeachers(r.data));
        loadSessions();
    }, []);

    const startSession = async (e) => {
        e.preventDefault();
        try {
            const res = await hodStartSession(form);
            setMsg(`Session opened! ${res.data.studentsEnrolled} students enrolled.`);
            loadSessions();
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    const closeSession = async (id) => {
        try {
            await hodCloseSession(id);
            setMsg('Session closed.');
            loadSessions();
        } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
    };

    return (
        <div className="animate">
            <div className="topbar">
                <div><div className="page-title">Sessions</div><div className="page-sub">Open and manage attendance sessions</div></div>
            </div>

            <div className="card mb-4">
                <form onSubmit={startSession} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                        <label className="input-label">Class</label>
                        <select className="input" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} required>
                            <option value="">Select</option>
                            {classes.map(c => <option key={c._id} value={c._id}>{c.label}</option>)}
                        </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                        <label className="input-label">Subject</label>
                        <select className="input" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} required>
                            <option value="">Select</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.code} — {s.name}</option>)}
                        </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                        <label className="input-label">Teacher</label>
                        <select className="input" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })} required>
                            <option value="">Select</option>
                            {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-success" type="submit"><FiPlay size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Open Session</button>
                </form>
                {msg && <div className="alert alert-info mt-4"><span>{msg}</span></div>}
            </div>

            {activeSessions.length > 0 && (
                <div className="card">
                    <div className="section-label mb-4" style={{ marginTop: 0 }}>Active Live Sessions</div>
                    <table className="data-table">
                        <thead><tr><th>Class</th><th>Subject</th><th>Teacher</th><th>Opened</th><th>Action</th></tr></thead>
                        <tbody>
                            {activeSessions.map(s => (
                                <tr key={s._id}>
                                    <td style={{ fontWeight: 600 }}>{s.classId?.label}</td>
                                    <td>{s.subjectId?.name}</td>
                                    <td>{s.teacherId?.name}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(s.startTime).toLocaleTimeString()}</td>
                                    <td><button className="btn btn-danger btn-sm" onClick={() => closeSession(s._id)}>Close</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ─── REPORTS ────────────────────────────────────────────────────────────────
export const Reports = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAttendanceReport().then(r => { setRecords(r.data); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center mt-6"><div className="spinner" style={{ margin: '40px auto' }}></div></div>;

    return (
        <div className="animate">
            <div className="topbar">
                <div><div className="page-title">Attendance Reports</div><div className="page-sub">{records.length} records</div></div>
            </div>
            <div className="card">
                <table className="data-table">
                    <thead><tr><th>Student</th><th>Subject</th><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                        {records.slice(0, 100).map(r => (
                            <tr key={r._id}>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="avatar" style={{ width: '28px', height: '28px', background: r.status === 'present' ? 'var(--success-bg)' : 'var(--danger-bg)', color: r.status === 'present' ? 'var(--success)' : 'var(--danger)', fontSize: '11px' }}>{r.studentId?.name?.charAt(0)}</div>{r.studentId?.name}</div></td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{r.subjectId?.code}</td>
                                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(r.date).toLocaleDateString()}</td>
                                <td><span className={`badge ${r.status === 'present' ? 'badge-present' : 'badge-absent'}`}>● {r.status === 'present' ? 'Present' : 'Absent'}</span></td>
                            </tr>
                        ))}
                        {records.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No attendance records yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HODLayout;
