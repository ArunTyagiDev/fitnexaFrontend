import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
	const { user, logout } = useAuth();
	return (
		<div className="min-h-screen">
			<nav className="bg-white border-b shadow-sm">
				<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
					<div className="font-semibold">Fitnexa</div>
					<div className="space-x-4 text-sm">
						{user?.role === 'super_admin' && <>
							<Link className="text-gray-700 hover:text-gray-900" to="/super">Dashboard</Link>
							<Link className="text-gray-700 hover:text-gray-900" to="/super/owners">Owners</Link>
						</>}
						{user?.role === 'gym_owner' && <>
							<Link className="text-gray-700 hover:text-gray-900" to="/owner">Dashboard</Link>
							<Link className="text-gray-700 hover:text-gray-900" to="/owner/members">Members</Link>
							<Link className="text-gray-700 hover:text-gray-900" to="/owner/packages">Packages</Link>
							<Link className="text-gray-700 hover:text-gray-900" to="/owner/payment">Payment</Link>
							<Link className="text-gray-700 hover:text-gray-900" to="/owner/diet">Diet</Link>
						</>}
						{user?.role === 'member' && <>
							<Link className="text-gray-700 hover:text-gray-900" to="/member">Dashboard</Link>
							<Link className="text-gray-700 hover:text-gray-900" to="/member/profile">Profile</Link>
							<Link className="text-gray-700 hover:text-gray-900" to="/member/progress">Progress</Link>
							<Link className="text-gray-700 hover:text-gray-900" to="/member/qr-code">QR Code</Link>
						</>}
						<button className="ml-4 text-red-600 hover:text-red-700" onClick={logout}>Logout</button>
					</div>
				</div>
			</nav>
			<main className="max-w-6xl mx-auto px-4">{children}</main>
		</div>
	);
}
