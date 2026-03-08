import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ─── Auth ────────────────────────────────────────────
export const loginUser = (data) => api.post('/auth/login', data);

// ─── HOD ─────────────────────────────────────────────
export const getHodDashboard = () => api.get('/hod/dashboard');

// Classes
export const getClasses = () => api.get('/hod/classes');
export const createClass = (data) => api.post('/hod/classes', data);
export const deleteClass = (id) => api.delete(`/hod/classes/${id}`);

// Subjects
export const getSubjects = () => api.get('/hod/subjects');
export const createSubject = (data) => api.post('/hod/subjects', data);
export const deleteSubject = (id) => api.delete(`/hod/subjects/${id}`);

// Users
export const getUsers = (role) => api.get(`/hod/users${role ? `?role=${role}` : ''}`);
export const addUser = (data) => api.post('/hod/users', data);
export const deleteUser = (id) => api.delete(`/hod/users/${id}`);

// Mappings
export const getMappings = () => api.get('/hod/mappings');
export const createMapping = (data) => api.post('/hod/mappings', data);
export const deleteMapping = (id) => api.delete(`/hod/mappings/${id}`);

// Enrollments
export const getEnrollments = () => api.get('/hod/enrollments');
export const createEnrollment = (data) => api.post('/hod/enrollments', data);
export const deleteEnrollment = (id) => api.delete(`/hod/enrollments/${id}`);

// HOD Sessions
export const hodStartSession = (data) => api.post('/hod/session/start', data);
export const hodCloseSession = (id) => api.put(`/hod/session/${id}/close`);

// HOD Reports
export const getAttendanceReport = () => api.get('/hod/attendance/report');

// ─── Teacher ─────────────────────────────────────────
export const getTeacherDashboard = () => api.get('/teacher/dashboard');
export const getTeacherClasses = () => api.get('/teacher/classes');
export const teacherStartSession = (data) => api.post('/teacher/session/start', data);
export const teacherCloseSession = (id) => api.put(`/teacher/session/${id}/close`);
export const getSessionAttendance = (id) => api.get(`/teacher/session/${id}/attendance`);
export const getTeacherReports = () => api.get('/teacher/reports');

// ─── Student ─────────────────────────────────────────
export const getStudentDashboard = () => api.get('/student/dashboard');
export const markStudentAttendance = (data) => api.post('/student/attendance/mark', data);

// ─── WebAuthn ────────────────────────────────────────
export const webauthnRegisterOptions = () => api.post('/webauthn/register-options');
export const webauthnRegisterVerify = (data) => api.post('/webauthn/register-verify', data);
export const webauthnAuthOptions = () => api.post('/webauthn/auth-options');

export default api;
