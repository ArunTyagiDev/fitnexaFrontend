import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Modal from '../../components/Modal';

export default function PaymentForm() {
	const [payments, setPayments] = useState([]);
	const [filteredPayments, setFilteredPayments] = useState([]);
	const [gyms, setGyms] = useState([]);
	const [users, setUsers] = useState([]);
	const [memberships, setMemberships] = useState([]);
	const [packages, setPackages] = useState([]);
	const [userSearch, setUserSearch] = useState('');
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [form, setForm] = useState({ membership_id: '', amount: '', status: 'paid', due_date: '', paid_at: '' });
	const [message, setMessage] = useState('');
	
	// Filters
	const [filters, setFilters] = useState({
		dateFrom: '',
		dateTo: '',
		status: '',
		package: ''
	});
	const [showAddModal, setShowAddModal] = useState(false);

	useEffect(() => {
		loadPayments();
		loadGyms();
		loadPackages();
	}, []);

	useEffect(() => {
		filterPayments();
	}, [payments, filters]);

	async function loadPayments() {
		try {
			const { data } = await api.get('/owner/payments');
			setPayments(data);
		} catch (error) {
			console.error('Failed to load payments:', error);
		}
	}

	async function loadGyms() {
		const { data } = await api.get('/owner/gyms');
		setGyms(data);
	}

	async function loadPackages() {
		const { data } = await api.get('/owner/packages');
		setPackages(data);
	}

	function filterPayments() {
		let filtered = [...payments];
		
		if (filters.dateFrom) {
			filtered = filtered.filter(p => p.paid_at >= filters.dateFrom);
		}
		if (filters.dateTo) {
			filtered = filtered.filter(p => p.paid_at <= filters.dateTo);
		}
		if (filters.status) {
			filtered = filtered.filter(p => p.status === filters.status);
		}
		if (filters.package) {
			filtered = filtered.filter(p => p.membership?.package?.id === parseInt(filters.package));
		}
		
		setFilteredPayments(filtered);
	}

	useEffect(() => {
		async function loadUsers() {
			if (gyms.length === 0) return;
			// Get users from all gyms
			const allUsers = [];
			for (const gym of gyms) {
				const { data } = await api.get(`/owner/gyms/${gym.id}/users?search=${userSearch}`);
				allUsers.push(...data);
			}
			// Remove duplicates based on user ID
			const uniqueUsers = allUsers.filter((user, index, self) => 
				index === self.findIndex(u => u.id === user.id)
			);
			setUsers(uniqueUsers);
		}
		loadUsers();
	}, [gyms, userSearch]);

	useEffect(() => {
		function handleClickOutside(event) {
			if (showUserDropdown && !event.target.closest('.user-dropdown')) {
				setShowUserDropdown(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [showUserDropdown]);

	function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

	function selectUser(user) {
		setForm(prev => ({ ...prev, membership_id: '' }));
		setUserSearch(user.name);
		setShowUserDropdown(false);
		loadUserMemberships(user.id);
	}

	function handleUserSearchChange(e) {
		setUserSearch(e.target.value);
		setShowUserDropdown(true);
		if (!e.target.value) {
			setForm(prev => ({ ...prev, membership_id: '' }));
			setMemberships([]);
		}
	}

	async function loadUserMemberships(userId) {
		const { data } = await api.get(`/owner/users/${userId}/memberships`);
		setMemberships(data);
	}

	async function submit(e) {
		e.preventDefault();
		await api.post('/owner/payments', { ...form, amount: Number(form.amount) });
		setMessage('Payment recorded');
		setForm({ membership_id: '', amount: '', status: 'paid', due_date: '', paid_at: '' });
		setUserSearch('');
		setMemberships([]);
		setShowAddModal(false);
		loadPayments();
	}
	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Payments Management</h1>
				<button 
					onClick={() => setShowAddModal(true)}
					className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
				>
					Add Payment
				</button>
			</div>

			{message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{message}</div>}

			{/* Filters */}
			<div className="bg-white p-4 rounded shadow">
				<h3 className="text-lg font-medium mb-4">Filters</h3>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div>
						<label className="block text-sm mb-1">Date From</label>
						<input 
							type="date" 
							className="w-full border px-3 py-2 rounded"
							value={filters.dateFrom}
							onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1">Date To</label>
						<input 
							type="date" 
							className="w-full border px-3 py-2 rounded"
							value={filters.dateTo}
							onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1">Status</label>
						<select 
							className="w-full border px-3 py-2 rounded"
							value={filters.status}
							onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
						>
							<option value="">All Status</option>
							<option value="paid">Paid</option>
							<option value="pending">Pending</option>
						</select>
					</div>
					<div>
						<label className="block text-sm mb-1">Package</label>
						<select 
							className="w-full border px-3 py-2 rounded"
							value={filters.package}
							onChange={e => setFilters(prev => ({ ...prev, package: e.target.value }))}
						>
							<option value="">All Packages</option>
							{packages.map(pkg => (
								<option key={pkg.id} value={pkg.id}>{pkg.name}</option>
							))}
						</select>
					</div>
				</div>
				<div className="mt-4">
					<button 
						onClick={() => setFilters({ dateFrom: '', dateTo: '', status: '', package: '' })}
						className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 cursor-pointer"
					>
						Clear Filters
					</button>
				</div>
			</div>

			{/* Payments Table */}
			<div className="bg-white rounded shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-gray-50 text-left">
								<th className="p-4 font-medium">User Name</th>
								<th className="p-4 font-medium">Package</th>
								<th className="p-4 font-medium">Amount (₹)</th>
								<th className="p-4 font-medium">Payment Date</th>
								<th className="p-4 font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{filteredPayments.map(payment => (
								<tr key={payment.id} className="border-t hover:bg-gray-50">
									<td className="p-4 font-medium">{payment.membership?.user?.name || 'N/A'}</td>
									<td className="p-4">{payment.membership?.package?.name || 'No Package'}</td>
									<td className="p-4 font-medium">₹{payment.amount}</td>
									<td className="p-4">{payment.paid_at || payment.due_date || 'N/A'}</td>
									<td className="p-4">
										<span className={`px-3 py-1 rounded-full text-xs font-medium ${
											payment.status === 'paid' 
												? 'bg-green-100 text-green-800' 
												: 'bg-yellow-100 text-yellow-800'
										}`}>
											{payment.status === 'paid' ? 'Paid' : 'Pending'}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{filteredPayments.length === 0 && (
					<div className="p-8 text-center text-gray-500">
						No payments found matching your criteria.
					</div>
				)}
			</div>

			{/* Add Payment Modal */}
			<Modal 
				title="Record Payment" 
				open={showAddModal} 
				onClose={() => setShowAddModal(false)}
				footer={
					<div className="flex items-center justify-end gap-2">
						<button 
							className="px-4 py-2 rounded border hover:bg-gray-50 cursor-pointer" 
							onClick={() => setShowAddModal(false)}
						>
							Cancel
						</button>
						<button 
							className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer" 
							onClick={submit}
						>
							Record Payment
						</button>
					</div>
				}
			>
				<form onSubmit={submit} className="space-y-4">
					<div className="relative user-dropdown">
						<label className="block text-sm mb-1">User</label>
						<input 
							className="w-full border px-3 py-2 rounded" 
							placeholder="Search user..." 
							value={userSearch} 
							onChange={handleUserSearchChange}
							onFocus={() => setShowUserDropdown(true)}
							required
						/>
						{showUserDropdown && users.length > 0 && (
							<div className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
								{users.map(user => (
									<div 
										key={user.id} 
										className="p-2 hover:bg-gray-100 cursor-pointer border-b"
										onClick={() => selectUser(user)}
									>
										<div className="font-medium">{user.name}</div>
										{user.email && <div className="text-sm text-gray-500">{user.email}</div>}
										{user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
									</div>
								))}
							</div>
						)}
					</div>
					<div>
						<label className="block text-sm mb-1">Membership</label>
						<select className="w-full border px-3 py-2 rounded" value={form.membership_id} onChange={e=>setField('membership_id', e.target.value)} required>
							<option value="">Select Membership</option>
							{memberships.map(membership => (
								<option key={membership.id} value={membership.id}>
									{membership.gym?.name} - {membership.package?.name || 'No Package'} ({membership.status})
								</option>
							))}
						</select>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm mb-1">Amount</label>
							<input 
								type="number" 
								step="0.01" 
								className="w-full border px-3 py-2 rounded" 
								placeholder="0.00" 
								value={form.amount} 
								onChange={e=>setField('amount', e.target.value)} 
								required 
							/>
						</div>
						<div>
							<label className="block text-sm mb-1">Status</label>
							<select className="w-full border px-3 py-2 rounded" value={form.status} onChange={e=>setField('status', e.target.value)}>
								<option value="paid">Paid</option>
								<option value="pending">Pending</option>
							</select>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm mb-1">Due Date</label>
							<input type="date" className="w-full border px-3 py-2 rounded" value={form.due_date} onChange={e=>setField('due_date', e.target.value)} />
						</div>
						<div>
							<label className="block text-sm mb-1">Paid At</label>
							<input type="date" className="w-full border px-3 py-2 rounded" value={form.paid_at} onChange={e=>setField('paid_at', e.target.value)} />
						</div>
					</div>
				</form>
			</Modal>
		</div>
	);
}
