import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { token, user } = useAuthStore();

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
