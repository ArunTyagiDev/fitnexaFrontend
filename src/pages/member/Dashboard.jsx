import { useEffect, useState } from 'react';
import api from '../../lib/api';
import GymQRScanner from '../../components/GymQRScanner';

export default function MemberDashboard() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [showGymScanner, setShowGymScanner] = useState(false);

	useEffect(() => {
		loadDashboardData();
	}, []);

	async function loadDashboardData() {
		try {
			const { data } = await api.get('/member/dashboard');
			setData(data);
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
		}
	}

	async function markAttendance() {
		setLoading(true);
		try {
			const { data } = await api.post('/member/attendance');
			setMessage(data.message);
			// Reload dashboard data to update attendance status
			await loadDashboardData();
			setTimeout(() => setMessage(''), 3000);
		} catch (error) {
			setMessage(error.response?.data?.message || 'Failed to mark attendance');
			setTimeout(() => setMessage(''), 3000);
		} finally {
			setLoading(false);
		}
	}

	async function handleGymScan(scanData) {
		setLoading(true);
		try {
			console.log('Sending attendance data:', {
				gym_id: scanData.gymId,
				location: scanData.location
			});
			
			const { data } = await api.post('/member/attendance', {
				gym_id: scanData.gymId,
				location: scanData.location
			});
			
			console.log('Attendance response:', data);
			setMessage(data.message);
			await loadDashboardData();
			setTimeout(() => setMessage(''), 3000);
		} catch (error) {
			console.error('Attendance error:', error);
			console.error('Error response:', error.response?.data);
			setMessage(error.response?.data?.message || 'Failed to mark attendance');
			setTimeout(() => setMessage(''), 3000);
		} finally {
			setLoading(false);
		}
	}

	if (!data) return <div className="p-6">Loading...</div>;
	
	const { membership, diet, paymentReminders, todayAttendance, recentAttendance } = data;

	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-semibold">Member Dashboard</h1>
				<button
					onClick={() => setShowGymScanner(true)}
					className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer flex items-center gap-2"
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
					</svg>
					Scan Gym QR
				</button>
			</div>

			{/* Quick QR Code Access */}
			<div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-green-800 mb-2">Quick Payment Access</h2>
						<p className="text-green-700 mb-4">Show your QR code to the gym owner for easy payment processing</p>
						<a
							href="/member/qr-code"
							className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
							</svg>
							Show QR Code
						</a>
					</div>
					<div className="text-green-600">
						<svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
						</svg>
					</div>
				</div>
			</div>

			{/* Payment Reminders */}
			{paymentReminders && paymentReminders.length > 0 && (
				<div className="space-y-3">
					<h2 className="text-lg font-semibold text-orange-600">Payment Reminders</h2>
					{paymentReminders.map((reminder, index) => (
						<div key={index} className={`border rounded p-4 ${
							reminder.type === 'overdue' 
								? 'bg-red-50 border-red-200' 
								: 'bg-yellow-50 border-yellow-200'
						}`}>
							<div className="flex justify-between items-start">
								<div>
									<div className="font-medium text-gray-900">{reminder.title}</div>
									<div className="text-sm text-gray-600 mt-1">{reminder.message}</div>
									<div className="text-xs text-gray-500 mt-2">
										{reminder.gym_name} - {reminder.package_name}
									</div>
								</div>
								<div className="text-right">
									<div className="font-semibold text-lg">₹{reminder.amount}</div>
									{reminder.type === 'overdue' ? (
										<div className="text-red-600 text-sm">{reminder.days_overdue} days overdue</div>
									) : (
										<div className="text-yellow-600 text-sm">{reminder.days_remaining} days left</div>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Attendance Section */}
			<div className="bg-white rounded shadow p-6">
				<h2 className="text-lg font-semibold mb-4">Today's Attendance</h2>
				
			{todayAttendance.has_attended ? (
				<div className="space-y-4">
					<div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded">
						<div>
							<div className="font-medium text-green-900">✅ Checked In</div>
							<div className="text-sm text-green-700">
								{todayAttendance.gym_name} at {todayAttendance.check_in_time}
							</div>
							{todayAttendance.check_out_time && (
								<div className="text-sm text-green-700">
									Checked out at {todayAttendance.check_out_time}
								</div>
							)}
						</div>
						<span className="text-green-600 font-medium">Attendance recorded via Gym QR</span>
					</div>
				</div>
			) : (
				<div className="text-center py-8">
					<div className="text-gray-500 mb-4">Use Scan Gym QR to mark attendance</div>
					<button
						onClick={() => setShowGymScanner(true)}
						disabled={loading}
						className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Open Scanner
					</button>
				</div>
			)}

				{/* Recent Attendance History */}
				{recentAttendance && recentAttendance.length > 0 && (
					<div className="mt-6">
						<h3 className="font-medium mb-3">Recent Attendance (Last 7 Days)</h3>
						<div className="space-y-2">
							{recentAttendance.map((attendance, index) => (
								<div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
									<div>
										<div className="font-medium">{new Date(attendance.date).toLocaleDateString()}</div>
										<div className="text-sm text-gray-600">{attendance.gym_name}</div>
									</div>
									<div className="text-right">
										<div className="text-sm">{attendance.check_in_time}</div>
										{attendance.check_out_time && (
											<>
												<div className="text-sm">- {attendance.check_out_time}</div>
												<div className="text-xs text-gray-500">{attendance.duration} duration</div>
											</>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Membership Info */}
			{membership ? (
				<div className="bg-white rounded shadow p-4">
					<h2 className="font-medium mb-2">Membership Details</h2>
					<div className="font-medium">Package: {membership?.package?.name}</div>
					<div>Gym: {membership?.gym?.name}</div>
					<div>Ends: {membership?.end_date}</div>
					<div>Status: <span className="text-green-600">{membership?.status}</span></div>
				</div>
			) : (
				<div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded">No active membership</div>
			)}

			{/* Diet Plan */}
			<div className="bg-white rounded shadow p-4">
				<h2 className="font-medium mb-2">Diet Plan</h2>
				{diet?.plan ? (
					<div className="text-sm" dangerouslySetInnerHTML={{ __html: diet.plan }}></div>
				) : (
					<div className="text-gray-500">No diet plan assigned yet</div>
				)}
			</div>

			{/* Quick Actions */}
			<div className="bg-white rounded shadow p-4">
				<h2 className="font-medium mb-4">Quick Actions</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<a 
						href="/member/feed" 
						className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 cursor-pointer text-center"
					>
						📱 Gym Feed
					</a>
					<a 
						href="/member/progress" 
						className="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 cursor-pointer text-center"
					>
						📊 Progress
					</a>
					<a 
						href="/member/profile" 
						className="bg-purple-600 text-white px-4 py-3 rounded hover:bg-purple-700 cursor-pointer text-center"
					>
						👤 Profile
					</a>
				</div>
			</div>

			{/* Message */}
			{message && (
				<div className={`fixed top-4 right-4 p-4 rounded shadow-lg z-50 ${
					message.includes('successfully') 
						? 'bg-green-100 border border-green-400 text-green-700' 
						: 'bg-red-100 border border-red-400 text-red-700'
				}`}>
					{message}
				</div>
			)}

			{/* Gym QR Scanner Modal */}
			<GymQRScanner
				isOpen={showGymScanner}
				onScan={handleGymScan}
				onClose={() => setShowGymScanner(false)}
			/>
		</div>
	);
}
