import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function AssignPackage() {
	const [gyms, setGyms] = useState([]);
	const [packages, setPackages] = useState([]);
	const [users, setUsers] = useState([]);
	const [userSearch, setUserSearch] = useState('');
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [form, setForm] = useState({ user_id: '', gym_id: '', package_id: '', start_date: '', end_date: '', status: 'active' });
	const [message, setMessage] = useState('');

	useEffect(() => {
		async function init() {
			const { data } = await api.get('/owner/gyms');
			setGyms(data);
		}
		init();
	}, []);

	useEffect(() => {
		async function loadPackages() {
			if (!form.gym_id) return setPackages([]);
			const { data } = await api.get(`/owner/gyms/${form.gym_id}/packages`);
			setPackages(data);
		}
		loadPackages();
	}, [form.gym_id]);

	useEffect(() => {
		async function loadUsers() {
			if (!form.gym_id) return setUsers([]);
			const { data } = await api.get(`/owner/gyms/${form.gym_id}/users?search=${userSearch}`);
			setUsers(data);
		}
		loadUsers();
	}, [form.gym_id, userSearch]);

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
		setForm(prev => ({ ...prev, user_id: user.id }));
		setUserSearch(user.name);
		setShowUserDropdown(false);
	}

	function handleUserSearchChange(e) {
		setUserSearch(e.target.value);
		setShowUserDropdown(true);
		if (!e.target.value) {
			setForm(prev => ({ ...prev, user_id: '' }));
		}
	}

	async function submit(e) {
		e.preventDefault();
		await api.post('/owner/assign-package', form);
		setMessage('Assigned successfully');
		setForm({ user_id: '', gym_id: '', package_id: '', start_date: '', end_date: '', status: 'active' });
		setUserSearch('');
	}

	return (
		<div className="p-6 space-y-4">
			<h1 className="text-xl font-semibold">Assign Package</h1>
			{message && <div className="text-green-600">{message}</div>}
			<form onSubmit={submit} className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
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
					<label className="block text-sm mb-1">Gym</label>
					<select className="w-full border px-3 py-2 rounded" value={form.gym_id} onChange={e=>setField('gym_id', e.target.value)} required>
						<option value="">Select Gym</option>
						{gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
					</select>
				</div>
				<div>
					<label className="block text-sm mb-1">Package</label>
					<select className="w-full border px-3 py-2 rounded" value={form.package_id} onChange={e=>setField('package_id', e.target.value)} required>
						<option value="">Select Package</option>
						{packages.map(p => <option key={p.id} value={p.id}>{p.name} - ${p.fee}</option>)}
					</select>
				</div>
				<div>
					<label className="block text-sm mb-1">Start Date</label>
					<input type="date" className="w-full border px-3 py-2 rounded" value={form.start_date} onChange={e=>setField('start_date', e.target.value)} required />
				</div>
				<div>
					<label className="block text-sm mb-1">End Date</label>
					<input type="date" className="w-full border px-3 py-2 rounded" value={form.end_date} onChange={e=>setField('end_date', e.target.value)} required />
				</div>
				<div>
					<label className="block text-sm mb-1">Status</label>
					<select className="w-full border px-3 py-2 rounded" value={form.status} onChange={e=>setField('status', e.target.value)}>
						<option value="active">Active</option>
						<option value="expired">Expired</option>
						<option value="pending">Pending</option>
					</select>
				</div>
				<button className="bg-blue-600 text-white px-4 py-2 rounded col-span-full">Assign Package</button>
			</form>
		</div>
	);
}
