import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HODLayout, {
  HODDashboard, ManageClasses, ManageSubjects, ManageTeachers,
  ManageStudents, Mappings, Enrollments, Sessions, Reports
} from './pages/hod/HODPages';
import TeacherLayout, {
  TeacherDashboard, MyClasses, LiveSession, TeacherReports
} from './pages/teacher/TeacherPages';
import StudentDashboard from './pages/student/StudentPages';

const App = () => {
  const { user } = useAuthStore();

  const getDefaultRoute = () => {
    if (!user) return '/login';
    if (user.role === 'hod') return '/hod';
    if (user.role === 'teacher') return '/teacher';
    return '/student';
  };

  return (
    <BrowserRouter basename="/Smart-Attendance-System">
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* HOD Routes */}
        <Route path="/hod" element={
          <ProtectedRoute allowedRoles={['hod']}>
            <HODLayout />
          </ProtectedRoute>
        }>
          <Route index element={<HODDashboard />} />
          <Route path="classes" element={<ManageClasses />} />
          <Route path="subjects" element={<ManageSubjects />} />
          <Route path="teachers" element={<ManageTeachers />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="mappings" element={<Mappings />} />
          <Route path="enrollments" element={<Enrollments />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherLayout />
          </ProtectedRoute>
        }>
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<MyClasses />} />
          <Route path="session" element={<LiveSession />} />
          <Route path="reports" element={<TeacherReports />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
