import { Navigate, Outlet, useLocation } from 'react-router-dom'

const ProtectedRoute = ({
    isAuthed,
    user,
    requiredRole,
    redirect = '/admin/login',
}) => {
    const location = useLocation()

    if (!isAuthed) {
        return <Navigate to={redirect} replace state={{ from: location }} />
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}

export default ProtectedRoute
