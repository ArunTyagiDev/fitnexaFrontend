import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Modal from '../../components/Modal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
	
export default function Members() {
	const [members, setMembers] = useState(null);
	const [packages, setPackages] = useState([]);
	const [error, setError] = useState('');
	const [selectedMember, setSelectedMember] = useState(null);
	const [memberHistory, setMemberHistory] = useState(null);
	const [showHistoryModal, setShowHistoryModal] = useState(false);

	const [showCreateModal, setShowCreateModal] = useState(false);
	const [selectedPackageId, setSelectedPackageId] = useState('');
	const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', age: '', gender: '', address: '', start_date: new Date().toISOString().slice(0,10) });
	const [computedExpiry, setComputedExpiry] = useState('');
	const [phoneInput, setPhoneInput] = useState('');
	const [lookup, setLookup] = useState(null); // {exists: bool, user?: {...}}
	const [step, setStep] = useState('lookup'); // lookup | new | map
	const [gyms, setGyms] = useState([]);

	// Progress tracking states
	const [showProgressModal, setShowProgressModal] = useState(false);
	const [selectedMemberForProgress, setSelectedMemberForProgress] = useState(null);
	const [progressData, setProgressData] = useState([]);
	const [progressForm, setProgressForm] = useState({
		weight_kg: '',
		height_cm: '',
		body_fat_percentage: '',
		chest_cm: '',
		waist_cm: '',
		arms_cm: '',
		thighs_cm: ''
	});

	async function load() {
		const [{ data: membersData }, { data: packagesData }] = await Promise.all([
			api.get('/owner/members'),
			api.get('/owner/packages'),
		]);
		setMembers(membersData);
		setPackages(packagesData);
	}

	useEffect(() => { 
		load();
	}, []);

	useEffect(() => {
		// compute expiry when start date or package changes
		const pkg = packages.find(p => String(p.id) === String(selectedPackageId));
		if (!pkg || !form.start_date) { setComputedExpiry(''); return; }
		const start = new Date(form.start_date);
		if (Number.isNaN(start.getTime())) { setComputedExpiry(''); return; }
		const days = (pkg.duration_months || 0) * 30;
		const end = new Date(start);
		end.setDate(end.getDate() + days);
		const yyyy = end.getFullYear();
		const mm = String(end.getMonth()+1).padStart(2,'0');
		const dd = String(end.getDate()).padStart(2,'0');
		setComputedExpiry(`${yyyy}-${mm}-${dd}`);
	}, [packages, selectedPackageId, form.start_date]);

	function openCreate() {
		setError('');
		setForm({ name: '', email: '', phone: '', password: '', age: '', gender: '', address: '', start_date: new Date().toISOString().slice(0,10) });
		setSelectedPackageId('');
		setPhoneInput('');
		setLookup(null);
		setStep('lookup');
		setShowCreateModal(true);
		// load gyms for mapping flow
		api.get('/owner/gyms').then(({ data }) => setGyms(data)).catch(() => setGyms([]));
	}

	function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

	async function addMember(e) {
		e?.preventDefault?.();
		setError('');
		try {
			await api.post('/owner/members', { 
				name: form.name, 
				email: form.email, 
				phone: form.phone, 
				password: form.password,
				age: form.age ? Number(form.age) : undefined,
				gender: form.gender || undefined,
				address: form.address || undefined,
				package_id: selectedPackageId || null,
				start_date: form.start_date,
			});
			setShowCreateModal(false);
			await load();
		} catch (err) {
			setError(err?.response?.data?.message || 'Failed to add');
		}
	}

	async function viewMemberHistory(member) {
		try {
			const { data } = await api.get(`/owner/members/${member.user.id}/history`);
			setSelectedMember(member);
			setMemberHistory(data);
			setShowHistoryModal(true);
		} catch (err) {
			setError('Failed to load member history');
		}
	}

	function closeHistoryModal() {
		setShowHistoryModal(false);
		setSelectedMember(null);
		setMemberHistory(null);
	}

	async function openProgressModal(member) {
		setSelectedMemberForProgress(member);
		try {
			const { data } = await api.get(`/owner/members/${member.user.id}/progress`);
			setProgressData(data);
		} catch (err) {
			setError('Failed to load progress data');
		}
		setShowProgressModal(true);
	}

	function closeProgressModal() {
		setShowProgressModal(false);
		setSelectedMemberForProgress(null);
		setProgressData([]);
		setProgressForm({
			weight_kg: '',
			height_cm: '',
			body_fat_percentage: '',
			chest_cm: '',
			waist_cm: '',
			arms_cm: '',
			thighs_cm: ''
		});
	}

	function setProgressField(k, v) { 
		setProgressForm(prev => ({ ...prev, [k]: v })); 
	}

	async function submitProgress(e) {
		e.preventDefault();
		try {
			const bmi = progressForm.weight_kg && progressForm.height_cm 
				? (parseFloat(progressForm.weight_kg) / Math.pow(parseFloat(progressForm.height_cm) / 100, 2)).toFixed(1)
				: null;

			await api.post(`/owner/members/${selectedMemberForProgress.user.id}/progress`, {
				...progressForm,
				weight_kg: progressForm.weight_kg ? parseFloat(progressForm.weight_kg) : null,
				height_cm: progressForm.height_cm ? parseFloat(progressForm.height_cm) : null,
				body_fat_percentage: progressForm.body_fat_percentage ? parseFloat(progressForm.body_fat_percentage) : null,
				chest_cm: progressForm.chest_cm ? parseFloat(progressForm.chest_cm) : null,
				waist_cm: progressForm.waist_cm ? parseFloat(progressForm.waist_cm) : null,
				arms_cm: progressForm.arms_cm ? parseFloat(progressForm.arms_cm) : null,
				thighs_cm: progressForm.thighs_cm ? parseFloat(progressForm.thighs_cm) : null,
				bmi: bmi
			});
			
			// Reload progress data
			const { data } = await api.get(`/owner/members/${selectedMemberForProgress.user.id}/progress`);
			setProgressData(data);
			
			setProgressForm({
				weight_kg: '',
				height_cm: '',
				body_fat_percentage: '',
				chest_cm: '',
				waist_cm: '',
				arms_cm: '',
				thighs_cm: ''
			});
		} catch (err) {
			setError('Failed to save progress data');
		}
	}

	function getProgressChartData() {
		return progressData.map(record => ({
			date: new Date(record.recorded_at).toLocaleDateString(),
			weight: record.weight_kg,
			bodyFat: record.body_fat_percentage,
			bmi: record.bmi
		})).sort((a, b) => new Date(a.date) - new Date(b.date));
	}

	async function deactivateMember(member) {
		if (!confirm(`Are you sure you want to deactivate ${member.user?.name}?`)) {
			return;
		}
		
		try {
			await api.put(`/owner/members/${member.id}/deactivate`);
			setError('');
			await load();
		} catch (err) {
			setError('Failed to deactivate member');
		}
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Members</h1>
				<div className="flex items-center gap-3">
					<button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer">Add Member</button>
				</div>
			</div>

			{error && <div className="text-red-600 text-sm">{error}</div>}

			<div className="bg-white rounded shadow">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-gray-50 text-left">
							<th className="p-2">Name</th>
							<th className="p-2">Email</th>
							<th className="p-2">Phone</th>
							<th className="p-2">Package</th>
							<th className="p-2">Status</th>
							<th className="p-2">Start Date</th>
							<th className="p-2">End Date</th>
							<th className="p-2">Actions</th>
						</tr>
					</thead>
					<tbody>
						{members?.data?.map(m => (
							<tr key={m.id} className="border-t hover:bg-gray-50">
								<td className="p-2 font-medium">{m.user?.name}</td>
								<td className="p-2">{m.user?.email || '-'}</td>
								<td className="p-2">{m.user?.phone || '-'}</td>
								<td className="p-2">{m.package?.name || 'No Package'}</td>
								<td className="p-2">
									<span className={`px-2 py-1 rounded text-xs ${
										m.status === 'active' ? 'bg-green-100 text-green-800' :
										m.status === 'expired' ? 'bg-red-100 text-red-800' :
										'bg-yellow-100 text-yellow-800'
									}` }>
										{m.status}
									</span>
								</td>
								<td className="p-2">{m.start_date}</td>
								<td className="p-2">{m.end_date}</td>
								<td className="p-2">
									<div className="flex items-center gap-2">
										<button
											onClick={() => viewMemberHistory(m)}
											className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 cursor-pointer"
											title="View Member History"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
										</button>
										<button
											onClick={() => openProgressModal(m)}
											className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 cursor-pointer"
											title="Progress Report"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
											</svg>
										</button>
										{m.status === 'active' && (
											<button
												onClick={() => deactivateMember(m)}
												className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 cursor-pointer"
												title="Deactivate Member"
											>
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
												</svg>
											</button>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{members?.data?.length === 0 && (
					<div className="p-8 text-center text-gray-500">
						No members found. Use Add Member to get started.
					</div>
				)}
			</div>

			{/* Create Member Modal */}
			<Modal title="Add Member" open={showCreateModal} onClose={() => setShowCreateModal(false)}
				footer={(
					<div className="flex items-center justify-end gap-2">
						<button className="px-4 py-2 rounded border hover:bg-gray-50 cursor-pointer" onClick={() => setShowCreateModal(false)}>Close</button>
						{step === 'new' && (
							<button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer" onClick={addMember} disabled={!selectedPackageId}>Create</button>
						)}
					</div>
				)}
			>
				<div className="space-y-4">
					{/* Step 1: Phone lookup */}
					{step === 'lookup' && (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<div className="md:col-span-2">
								<label className="block text-sm mb-1">Mobile Number</label>
								<input className="w-full border px-3 py-2 rounded" value={phoneInput} onChange={e=>setPhoneInput(e.target.value)} placeholder="Enter mobile number" />
							</div>
							<div className="flex items-end">
								<button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer" onClick={async ()=>{
									setError('');
									try {
										const { data } = await api.get(`/owner/users/lookup?phone=${encodeURIComponent(phoneInput)}`);
										setLookup(data);
										if (data.exists) {
											setStep('map');
										} else {
											setForm(prev => ({ ...prev, phone: phoneInput }));
											setStep('new');
										}
									} catch (e) {
										setError('Lookup failed');
									}
								}}>Check</button>
							</div>
							{error && <div className="text-red-600 text-sm md:col-span-3">{error}</div>}
						</div>
					)}

					{/* Step 2: Map existing user to gym */}
					{step === 'map' && lookup?.exists && (
						<div className="space-y-3">
							<div className="bg-gray-50 p-3 rounded">
								<div className="font-semibold">Existing User</div>
								<div className="text-sm">{lookup.user.name} • {lookup.user.phone} • {lookup.user.email || 'No email'}</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div>
									<label className="block text-sm mb-1">Gym</label>
									<select className="w-full border px-3 py-2 rounded" onChange={e=>setField('gym_id', e.target.value)}>
										<option value="">Select Gym</option>
										{gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
									</select>
								</div>
								<div>
									<label className="block text-sm mb-1">Package</label>
									<select className="w-full border px-3 py-2 rounded" value={selectedPackageId} onChange={e=>setSelectedPackageId(e.target.value)}>
										<option value="">Select Package</option>
										{packages.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.price} ({p.duration_months} mo)</option>)}
									</select>
								</div>
								<div>
									<label className="block text-sm mb-1">Start Date</label>
									<input type="date" className="w-full border px-3 py-2 rounded" value={form.start_date} onChange={e=>setField('start_date', e.target.value)} />
								</div>
								<div>
									<label className="block text-sm mb-1">Expiry Date</label>
									<input className="w-full border px-3 py-2 rounded bg-gray-50" value={computedExpiry} readOnly />
								</div>
							</div>
							<div className="flex justify-end">
								<button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer" onClick={async()=>{
									setError('');
									try {
										await api.post('/owner/assign-package', {
											user_id: lookup.user.id,
											gym_id: form.gym_id,
											package_id: selectedPackageId,
											start_date: form.start_date,
											end_date: computedExpiry,
											status: 'active',
										});
										setShowCreateModal(false);
										await load();
									} catch (e) {
										setError(e?.response?.data?.message || 'Failed to map');
									}
								}}>Map to Gym</button>
							</div>
							{error && <div className="text-red-600 text-sm">{error}</div>}
						</div>
					)}

					{/* Step 3: New user creation */}
					{step === 'new' && (
						<form onSubmit={addMember} className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="md:col-span-2">
								<label className="block text-sm mb-1">Package</label>
								<select className="w-full border px-3 py-2 rounded" value={selectedPackageId} onChange={e=>setSelectedPackageId(e.target.value)} required>
									<option value="">Select Package</option>
									{packages.map(p => (
										<option key={p.id} value={p.id}>{p.name} - ₹{p.price} ({p.duration_months} mo)</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm mb-1">Mobile Number</label>
								<input className="w-full border px-3 py-2 rounded" value={form.phone} onChange={e=>setField('phone', e.target.value)} required />
							</div>
							<div>
								<label className="block text-sm mb-1">Name</label>
								<input className="w-full border px-3 py-2 rounded" value={form.name} onChange={e=>setField('name', e.target.value)} required />
							</div>
							<div>
								<label className="block text-sm mb-1">Email</label>
								<input type="email" className="w-full border px-3 py-2 rounded" value={form.email} onChange={e=>setField('email', e.target.value)} />
							</div>
							<div>
								<label className="block text-sm mb-1">Age</label>
								<input type="number" min="1" max="120" className="w-full border px-3 py-2 rounded" value={form.age} onChange={e=>setField('age', e.target.value)} />
							</div>
							<div>
								<label className="block text-sm mb-1">Gender</label>
								<select className="w-full border px-3 py-2 rounded" value={form.gender} onChange={e=>setField('gender', e.target.value)}>
									<option value="">Select</option>
									<option value="male">Male</option>
									<option value="female">Female</option>
									<option value="other">Other</option>
								</select>
							</div>
							<div className="md:col-span-2">
								<label className="block text-sm mb-1">Address</label>
								<textarea rows={3} className="w-full border px-3 py-2 rounded" value={form.address} onChange={e=>setField('address', e.target.value)} />
							</div>
							<div>
								<label className="block text-sm mb-1">Password</label>
								<input 
									type="password" 
									className="w-full border px-3 py-2 rounded" 
									value={form.password} 
									onChange={e=>setField('password', e.target.value)} 
									placeholder="Set member password"
									required 
								/>
							</div>
							<div>
								<label className="block text-sm mb-1">Start Date</label>
								<input type="date" className="w-full border px-3 py-2 rounded" value={form.start_date} onChange={e=>setField('start_date', e.target.value)} required />
							</div>
							<div>
								<label className="block text-sm mb-1">Expiry Date</label>
								<input className="w-full border px-3 py-2 rounded bg-gray-50" value={computedExpiry} readOnly placeholder="Auto-calculated" />
							</div>
							{error && <div className="text-red-600 text-sm md:col-span-2">{error}</div>}
						</form>
					)}
				</div>
			</Modal>

			{/* Member History Modal */}
			{showHistoryModal && selectedMember && memberHistory && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
						<div className="p-6 border-b">
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-semibold">
									{selectedMember.user?.name}'s History
								</h2>
								<button
									onClick={closeHistoryModal}
									className="text-gray-500 hover:text-gray-700"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
						
						<div className="p-6 space-y-6">
							{/* Member Info */}
							<div className="bg-gray-50 p-4 rounded">
								<h3 className="font-semibold mb-2">Member Information</h3>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div><strong>Name:</strong> {memberHistory.user?.name}</div>
									<div><strong>Email:</strong> {memberHistory.user?.email || 'Not provided'}</div>
									<div><strong>Phone:</strong> {memberHistory.user?.phone || 'Not provided'}</div>
									<div><strong>Role:</strong> {memberHistory.user?.role}</div>
								</div>
							</div>

							{/* Memberships */}
							<div>
								<h3 className="font-semibold mb-3">Membership History</h3>
								<div className="space-y-2">
									{memberHistory.memberships?.map((membership, index) => (
										<div key={index} className="border p-3 rounded">
											<div className="flex justify-between items-start">
												<div>
													<div className="font-medium">{membership.gym?.name}</div>
													<div className="text-sm text-gray-600">
														{membership.package?.name || 'No Package'} - 
														<span className={`ml-1 px-2 py-1 rounded text-xs ${
															membership.status === 'active' ? 'bg-green-100 text-green-800' :
															membership.status === 'expired' ? 'bg-red-100 text-red-800' :
															'bg-yellow-100 text-yellow-800'
														}` }>
															{membership.status}
														</span>
													</div>
													<div className="text-sm text-gray-500">
														{membership.start_date} to {membership.end_date}
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Payments */}
							<div>
								<h3 className="font-semibold mb-3">Payment History</h3>
								<div className="space-y-2">
									{memberHistory.payments?.map((payment, index) => (
										<div key={index} className="border p-3 rounded">
											<div className="flex justify-between items-center">
												<div>
													<div className="font-medium">₹{payment.amount}</div>
													<div className="text-sm text-gray-600">
														Status: <span className={`px-2 py-1 rounded text-xs ${
															payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
														}` }>
															{payment.status}
														</span>
													</div>
													{payment.paid_at && (
														<div className="text-sm text-gray-500">
															Paid: {payment.paid_at}
														</div>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Diet Plans */}
							<div>
								<h3 className="font-semibold mb-3">Diet Plans</h3>
								<div className="space-y-2">
									{memberHistory.diet_plans?.map((diet, index) => (
										<div key={index} className="border p-3 rounded">
											<div className="text-sm text-gray-500 mb-2">
												{diet.created_at}
											</div>
											<div className="text-sm">{diet.plan}</div>
										</div>
									))}
								</div>
							</div>

							{/* Progress Records */}
							<div>
								<h3 className="font-semibold mb-3">Progress Records</h3>
								<div className="space-y-2">
									{memberHistory.progress_records?.map((record, index) => (
										<div key={index} className="border p-3 rounded">
											<div className="flex justify-between items-center">
												<div>
													<div className="text-sm text-gray-500">{record.recorded_at}</div>
													<div className="text-sm">
														{record.height_cm && `Height: ${record.height_cm}cm`}
														{record.weight_kg && ` | Weight: ${record.weight_kg}kg`}
														{record.bmi && ` | BMI: ${record.bmi}`}
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Progress Report Modal */}
			{showProgressModal && selectedMemberForProgress && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
						<div className="p-6 border-b">
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-semibold">
									{selectedMemberForProgress.user?.name}'s Progress Report
								</h2>
								<button
									onClick={closeProgressModal}
									className="text-gray-500 hover:text-gray-700 cursor-pointer"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
						
						<div className="p-6 space-y-6">
							{/* Progress Charts */}
							{progressData.length > 0 && (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<div className="bg-gray-50 p-4 rounded">
										<h3 className="text-lg font-semibold mb-4">Weight & BMI Progress</h3>
										<ResponsiveContainer width="100%" height={300}>
											<LineChart data={getProgressChartData()}>
												<CartesianGrid strokeDasharray="3 3" />
												<XAxis dataKey="date" />
												<YAxis yAxisId="left" />
												<YAxis yAxisId="right" orientation="right" />
												<Tooltip />
												<Legend />
												<Line yAxisId="left" type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={2} />
												<Line yAxisId="right" type="monotone" dataKey="bmi" stroke="#82ca9d" strokeWidth={2} />
											</LineChart>
										</ResponsiveContainer>
									</div>
									
									<div className="bg-gray-50 p-4 rounded">
										<h3 className="text-lg font-semibold mb-4">Body Fat Percentage</h3>
										<ResponsiveContainer width="100%" height={300}>
											<LineChart data={getProgressChartData()}>
												<CartesianGrid strokeDasharray="3 3" />
												<XAxis dataKey="date" />
												<YAxis />
												<Tooltip />
												<Legend />
												<Line type="monotone" dataKey="bodyFat" stroke="#ff7300" strokeWidth={2} />
											</LineChart>
										</ResponsiveContainer>
									</div>
								</div>
							)}

							{/* Latest Progress Summary */}
							{progressData.length > 0 && (
								<div className="bg-white border rounded p-4">
									<h3 className="text-lg font-semibold mb-4">Latest Progress Summary</h3>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										{(() => {
											const latest = progressData[progressData.length - 1];
											return (
												<>
													<div className="text-center">
														<div className="text-2xl font-bold text-blue-600">{latest.weight_kg || 'N/A'} kg</div>
														<div className="text-sm text-gray-500">Weight</div>
													</div>
													<div className="text-center">
														<div className="text-2xl font-bold text-green-600">{latest.bmi || 'N/A'}</div>
														<div className="text-sm text-gray-500">BMI</div>
													</div>
													<div className="text-center">
														<div className="text-2xl font-bold text-orange-600">{latest.body_fat_percentage || 'N/A'}%</div>
														<div className="text-sm text-gray-500">Body Fat</div>
													</div>
													<div className="text-center">
														<div className="text-2xl font-bold text-purple-600">{latest.height_cm || 'N/A'} cm</div>
														<div className="text-sm text-gray-500">Height</div>
													</div>
												</>
											);
										})()}
									</div>
								</div>
							)}

							{/* Add Progress Form */}
							<div className="bg-white border rounded p-4">
								<h3 className="text-lg font-semibold mb-4">Add Progress Record</h3>
								<form onSubmit={submitProgress} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
									<div>
										<label className="block text-sm mb-1">Weight (kg)</label>
										<input 
											type="number" 
											step="0.1"
											className="w-full border px-3 py-2 rounded"
											value={progressForm.weight_kg}
											onChange={e => setProgressField('weight_kg', e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm mb-1">Height (cm)</label>
										<input 
											type="number" 
											step="0.1"
											className="w-full border px-3 py-2 rounded"
											value={progressForm.height_cm}
											onChange={e => setProgressField('height_cm', e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm mb-1">Body Fat (%)</label>
										<input 
											type="number" 
											step="0.1"
											className="w-full border px-3 py-2 rounded"
											value={progressForm.body_fat_percentage}
											onChange={e => setProgressField('body_fat_percentage', e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm mb-1">Chest (cm)</label>
										<input 
											type="number" 
											step="0.1"
											className="w-full border px-3 py-2 rounded"
											value={progressForm.chest_cm}
											onChange={e => setProgressField('chest_cm', e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm mb-1">Waist (cm)</label>
										<input 
											type="number" 
											step="0.1"
											className="w-full border px-3 py-2 rounded"
											value={progressForm.waist_cm}
											onChange={e => setProgressField('waist_cm', e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm mb-1">Arms (cm)</label>
										<input 
											type="number" 
											step="0.1"
											className="w-full border px-3 py-2 rounded"
											value={progressForm.arms_cm}
											onChange={e => setProgressField('arms_cm', e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm mb-1">Thighs (cm)</label>
										<input 
											type="number" 
											step="0.1"
											className="w-full border px-3 py-2 rounded"
											value={progressForm.thighs_cm}
											onChange={e => setProgressField('thighs_cm', e.target.value)}
										/>
									</div>
									<div className="flex items-end">
										<button 
											type="submit"
											className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
										>
											Add Record
										</button>
									</div>
								</form>
							</div>

							{/* Progress History Table */}
							{progressData.length > 0 && (
								<div className="bg-white border rounded overflow-hidden">
									<div className="p-4 border-b">
										<h3 className="text-lg font-semibold">Progress History</h3>
									</div>
									<div className="overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="bg-gray-50 text-left">
													<th className="p-3">Date</th>
													<th className="p-3">Weight</th>
													<th className="p-3">BMI</th>
													<th className="p-3">Body Fat</th>
													<th className="p-3">Chest</th>
													<th className="p-3">Waist</th>
													<th className="p-3">Arms</th>
													<th className="p-3">Thighs</th>
												</tr>
											</thead>
											<tbody>
												{progressData.map((record, index) => (
													<tr key={index} className="border-t">
														<td className="p-3">{new Date(record.recorded_at).toLocaleDateString()}</td>
														<td className="p-3">{record.weight_kg || 'N/A'}</td>
														<td className="p-3">{record.bmi || 'N/A'}</td>
														<td className="p-3">{record.body_fat_percentage || 'N/A'}%</td>
														<td className="p-3">{record.chest_cm || 'N/A'}</td>
														<td className="p-3">{record.waist_cm || 'N/A'}</td>
														<td className="p-3">{record.arms_cm || 'N/A'}</td>
														<td className="p-3">{record.thighs_cm || 'N/A'}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
