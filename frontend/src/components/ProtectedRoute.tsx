import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
}

/**
 * Guard component to protect routes based on authentication status.
 * @param requireAuth If true, redirects to login if not authenticated.
 *                    If false, redirects to dashboard if already authenticated (for Login/Register).
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAuth = true }) => {
    const isAuth = authService.isAuthenticated();
    const location = useLocation();

    if (requireAuth && !isAuth) {
        // User is not authenticated but trying to access a private route
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!requireAuth && isAuth) {
        // User is authenticated but trying to access Login/Register
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
