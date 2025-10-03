import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role }) {
	const { user, loading } = useAuth();
	if (loading) return <div className="p-6">Loading...</div>;
	if (!user) return <Navigate to="/login" replace />;
	if (role && user.role !== role) return <Navigate to="/" replace />;
	return <Outlet />;
}
