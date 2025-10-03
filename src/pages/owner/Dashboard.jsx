import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Modal from '../../components/Modal';

export default function OwnerDashboard() {
	const [data, setData] = useState(null);
	const [paymentStatus, setPaymentStatus] = useState({
		pending: [],
		upcoming: [],
		clear: [],
		notifications: []
	});
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [selectedPaymentType, setSelectedPaymentType] = useState('');
	const [selectedPaymentData, setSelectedPaymentData] = useState([]);

	useEffect(() => {
		loadDashboardData();
		loadPaymentStatus();
	}, []);

	async function loadDashboardData() {
		const { data } = await api.get('/owner/dashboard');
		setData(data);
	}

	async function loadPaymentStatus() {
		try {
			const { data } = await api.get('/owner/payment-status');
			setPaymentStatus(data);
		} catch (error) {
			console.error('Failed to load payment status:', error);
		}
	}

	function openPaymentModal(type, data) {
		setSelectedPaymentType(type);
		setSelectedPaymentData(data);
		setShowPaymentModal(true);
	}

	function closePaymentModal() {
		setShowPaymentModal(false);
		setSelectedPaymentType('');
		setSelectedPaymentData([]);
	}

	async function markNotificationRead(notificationId) {
		try {
			await api.put(`/owner/notifications/${notificationId}/read`);
			// Reload payment status to get updated notifications
			loadPaymentStatus();
		} catch (error) {
			console.error('Failed to mark notification as read:', error);
		}
	}

	if (!data) return <div className="p-6">Loading...</div>;

	return (
		<div className="p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Gym Owner Dashboard</h1>
			
			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Stat title="Revenue" value={`₹${Number(data.revenue).toFixed(2)}`} />
				<Stat title="Total Users" value={data.totalUsers} />
				<Stat title="Pending Payments" value={data.pendingPayments} />
				<Stat title="Upcoming Renewals" value={data.upcomingRenewals} />
			</div>

			{/* Payment Status Badges */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Pending Payments */}
				<div 
					className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
					onClick={() => openPaymentModal('Pending', paymentStatus.pending)}
				>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-red-600">Pending Payments</h2>
						<span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
							{paymentStatus.pending.length}
						</span>
					</div>
					<div className="space-y-2">
						{paymentStatus.pending.length === 0 ? (
							<p className="text-gray-500 text-sm">No pending payments</p>
						) : (
							paymentStatus.pending.slice(0, 3).map((member, index) => (
								<div key={index} className="bg-red-50 border border-red-200 rounded p-3">
									<div className="font-medium text-red-900">{member.name}</div>
									<div className="text-sm text-red-600">
										₹{member.amount} - Due: {member.due_date}
									</div>
									{member.package && (
										<div className="text-xs text-red-500">{member.package}</div>
									)}
								</div>
							))
						)}
						{paymentStatus.pending.length > 3 && (
							<p className="text-xs text-red-600 text-center cursor-pointer hover:underline">
								Click to view all {paymentStatus.pending.length} pending payments
							</p>
						)}
					</div>
				</div>

				{/* Upcoming Payments */}
				<div 
					className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
					onClick={() => openPaymentModal('Upcoming', paymentStatus.upcoming)}
				>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-yellow-600">Upcoming Payments</h2>
						<span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
							{paymentStatus.upcoming.length}
						</span>
					</div>
					<div className="space-y-2">
						{paymentStatus.upcoming.length === 0 ? (
							<p className="text-gray-500 text-sm">No upcoming payments</p>
						) : (
							paymentStatus.upcoming.slice(0, 3).map((member, index) => (
								<div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
									<div className="font-medium text-yellow-900">{member.name}</div>
									<div className="text-sm text-yellow-600">
										₹{member.amount} - Due: {member.due_date}
									</div>
									{member.package && (
										<div className="text-xs text-yellow-500">{member.package}</div>
									)}
								</div>
							))
						)}
						{paymentStatus.upcoming.length > 3 && (
							<p className="text-xs text-yellow-600 text-center cursor-pointer hover:underline">
								Click to view all {paymentStatus.upcoming.length} upcoming payments
							</p>
						)}
					</div>
				</div>

				{/* All Clear */}
				<div className="bg-white rounded shadow p-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-green-600">All Clear</h2>
						<span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
							{paymentStatus.clear.length}
						</span>
					</div>
					<div className="space-y-2">
						{paymentStatus.clear.length === 0 ? (
							<p className="text-gray-500 text-sm">No members with clear payment status</p>
						) : (
							paymentStatus.clear.slice(0, 5).map((member, index) => (
								<div key={index} className="bg-green-50 border border-green-200 rounded p-3">
									<div className="font-medium text-green-900">{member.name}</div>
									<div className="text-sm text-green-600">
										Last paid: {member.last_payment_date}
									</div>
									{member.package && (
										<div className="text-xs text-green-500">{member.package}</div>
									)}
								</div>
							))
						)}
						{paymentStatus.clear.length > 5 && (
							<p className="text-xs text-gray-500 text-center">
								+{paymentStatus.clear.length - 5} more members
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Notifications */}
			{paymentStatus.notifications && paymentStatus.notifications.length > 0 && (
				<div className="bg-white rounded shadow p-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-orange-600">Notifications</h2>
						<span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
							{paymentStatus.notifications.length}
						</span>
					</div>
					<div className="space-y-3">
						{paymentStatus.notifications.map((notification, index) => (
							<div key={index} className="bg-orange-50 border border-orange-200 rounded p-3 cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => markNotificationRead(notification.id)}>
								<div className="font-medium text-orange-900">{notification.title}</div>
								<div className="text-sm text-orange-700 mt-1">{notification.message}</div>
								<div className="text-xs text-orange-500 mt-2">
									{new Date(notification.created_at).toLocaleDateString()}
								</div>
								<div className="text-xs text-orange-600 mt-1 cursor-pointer hover:underline">
									Click to mark as read
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Quick Actions */}
			<div className="bg-white rounded shadow p-6">
				<h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
				<div className="grid grid-cols-1 md:grid-cols-6 gap-4">
					<a 
						href="/owner/analytics" 
						className="bg-indigo-600 text-white px-4 py-3 rounded hover:bg-indigo-700 cursor-pointer text-center"
					>
						📊 Analytics
					</a>
					<a 
						href="/owner/financial" 
						className="bg-emerald-600 text-white px-4 py-3 rounded hover:bg-emerald-700 cursor-pointer text-center"
					>
						💰 Financial
					</a>
					<a 
						href="/owner/payment" 
						className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 cursor-pointer text-center"
					>
						Manage Payments
					</a>
					<a 
						href="/owner/members" 
						className="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 cursor-pointer text-center"
					>
						View Members
					</a>
					<a 
						href="/owner/diet" 
						className="bg-purple-600 text-white px-4 py-3 rounded hover:bg-purple-700 cursor-pointer text-center"
					>
						Diet Master
					</a>
					<a 
						href="/owner/feed" 
						className="bg-orange-600 text-white px-4 py-3 rounded hover:bg-orange-700 cursor-pointer text-center"
					>
						📱 Gym Feed
					</a>
				</div>
			</div>

			{/* Payment Details Modal */}
			<Modal 
				title={`${selectedPaymentType} Payments`}
				open={showPaymentModal} 
				onClose={closePaymentModal}
				footer={
					<div className="flex items-center justify-end gap-2">
						<button 
							className="px-4 py-2 rounded border hover:bg-gray-50 cursor-pointer" 
							onClick={closePaymentModal}
						>
							Close
						</button>
					</div>
				}
			>
				<div className="space-y-4">
					{selectedPaymentData.length === 0 ? (
						<p className="text-gray-500 text-center py-4">No {selectedPaymentType.toLowerCase()} payments found</p>
					) : (
						<div className="space-y-3">
							{selectedPaymentData.map((member, index) => (
								<div key={index} className={`border rounded p-4 ${
									selectedPaymentType === 'Pending' 
										? 'bg-red-50 border-red-200' 
										: 'bg-yellow-50 border-yellow-200'
								}`}>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<div className="font-medium text-gray-900">{member.name}</div>
											<div className="text-sm text-gray-600 mt-1">
												₹{member.amount} - Due: {member.due_date}
											</div>
											{member.package && (
												<div className="text-xs text-gray-500 mt-1">{member.package}</div>
											)}
											{member.email && (
												<div className="text-xs text-gray-500">{member.email}</div>
											)}
											{member.phone && (
												<div className="text-xs text-gray-500">{member.phone}</div>
											)}
										</div>
										<div className="flex gap-2">
											<button 
												className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 cursor-pointer"
												onClick={() => {
													// Navigate to payment page or open payment modal
													window.location.href = `/owner/payment?user=${member.user_id || member.id}`;
												}}
											>
												View Details
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</Modal>
		</div>
	);
}

function Stat({ title, value }) {
	return (
		<div className="bg-white rounded shadow p-4">
			<div className="text-sm text-gray-500">{title}</div>
			<div className="text-xl font-semibold">{value}</div>
		</div>
	);
}
