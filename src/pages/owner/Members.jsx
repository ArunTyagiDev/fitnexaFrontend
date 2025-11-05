import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Modal from '../../components/Modal';
import QRScanner from '../../components/QRScanner';
import QRCodeGenerator from '../../components/QRCodeGenerator';
import PaymentForm from '../../components/PaymentForm';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
	
export default function Members() {
	const [members, setMembers] = useState(null);
	const [packages, setPackages] = useState([]);
	const [error, setError] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [selectedMember, setSelectedMember] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
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

	// Upgrade package states
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);
	const [selectedMemberForUpgrade, setSelectedMemberForUpgrade] = useState(null);
	const [selectedUpgradePackage, setSelectedUpgradePackage] = useState('');
	const [upgradeCalculations, setUpgradeCalculations] = useState(null);

	// QR Scanner states
	const [showQRScanner, setShowQRScanner] = useState(false);
	const [showQRGenerator, setShowQRGenerator] = useState(false);
	const [showPaymentForm, setShowPaymentForm] = useState(false);
	const [scannedMember, setScannedMember] = useState(null);
	const [selectedMemberForQR, setSelectedMemberForQR] = useState(null);

	async function load() {
		const [{ data: membersData }, { data: packagesData }] = await Promise.all([
			api.get('/owner/members'),
			api.get('/owner/packages'),
		]);
		setMembers(membersData);
		setPackages(packagesData);
		
		// Debug package data
		console.log('Packages loaded:', packagesData);
		if (packagesData && packagesData.length > 0) {
			console.log('First package structure:', packagesData[0]);
		}
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

	// Filter members based on search term
	function getFilteredMembers() {
		if (!members?.data) return [];
		if (!searchTerm.trim()) return members.data;
		
		const term = searchTerm.toLowerCase();
		return members.data.filter(member => 
			member.user.name.toLowerCase().includes(term) ||
			(member.user.email && member.user.email.toLowerCase().includes(term)) ||
			member.user.phone.toLowerCase().includes(term)
		);
	}

	function formatDate(d) {
		if (!d) return '-';
		try {
			const [y,m,day] = String(d).split('-');
			if (y && m && day) return `${day}/${m}/${y}`;
			const dd = new Date(d);
			if (Number.isNaN(dd.getTime())) return d;
			return dd.toLocaleDateString('en-GB');
		} catch { return d; }
	}

	async function addMember(e) {
		e?.preventDefault?.();
		setError('');
		setSuccessMessage('');
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
			setSuccessMessage(`Member ${form.name} added successfully! Welcome email has been sent.`);
			setTimeout(() => setSuccessMessage(''), 5000);
			await load();
		} catch (err) {
			setError(err?.response?.data?.message || 'Failed to add');
		}
	}

	async function reactivate(m) {
		try {
			await api.put(`/owner/memberships/${m.id}/reactivate`, {
				package_id: m.package?.id || undefined,
				start_date: new Date().toISOString().slice(0,10)
			});
			setSuccessMessage(`Member ${m.user?.name || ''} reactivated successfully`);
			setTimeout(() => setSuccessMessage(''), 4000);
			await load();
		} catch (err) {
			setError(err?.response?.data?.message || 'Failed to reactivate');
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

	// Upgrade package functions
	function openUpgradeModal(member) {
		setSelectedMemberForUpgrade(member);
		setSelectedUpgradePackage('');
		setUpgradeCalculations(null);
		setShowUpgradeModal(true);
	}

	function calculateUpgrade() {
		if (!selectedMemberForUpgrade || !selectedUpgradePackage) return;

		const currentPackage = selectedMemberForUpgrade.package;
		const newPackage = packages.find(p => p.id == selectedUpgradePackage);
		
		if (!newPackage) return;

		console.log('Current Package:', currentPackage);
		console.log('New Package:', newPackage);

		const currentStartDate = new Date(selectedMemberForUpgrade.start_date);
		const currentEndDate = new Date(selectedMemberForUpgrade.end_date);
		const today = new Date();
		
		// Calculate remaining days in current package
		const remainingDays = Math.max(0, Math.ceil((currentEndDate - today) / (1000 * 60 * 60 * 24)));
		
		// Calculate refund amount (proportional to remaining days)
		// Ensure we have valid fee and duration values
		const currentFee = parseFloat(currentPackage?.price || currentPackage?.fee || 0);
		const currentDuration = parseInt(currentPackage?.duration_days || (currentPackage?.duration_months ? currentPackage.duration_months * 30 : 30) || 30);
		const currentDailyRate = currentDuration > 0 ? (currentFee / currentDuration) : 0;
		const refundAmount = remainingDays * currentDailyRate;
		
		console.log('Refund Calculation Debug:', {
			currentFee,
			currentDuration,
			currentDailyRate: currentDailyRate.toFixed(2),
			remainingDays,
			refundAmount: refundAmount.toFixed(2),
			'Expected for ₹25000/365 days': (25000/365).toFixed(2)
		});
		
		// Calculate new package cost
		const newPackageCost = parseFloat(newPackage.price || newPackage.fee || 0);
		
		// Calculate amount to pay (new package cost - refund)
		const amountToPay = Math.max(0, newPackageCost - refundAmount);
		
		// Calculate new end date
		const newDuration = parseInt(newPackage.duration_days || (newPackage.duration_months ? newPackage.duration_months * 30 : 30) || 30);
		const newEndDate = new Date(today);
		newEndDate.setDate(newEndDate.getDate() + newDuration);

		console.log('Calculation Details:', {
			currentFee,
			currentDuration,
			currentDailyRate,
			remainingDays,
			refundAmount,
			newPackageCost,
			amountToPay,
			calculationBreakdown: {
				'Current Package Fee': currentFee,
				'Current Package Duration': currentDuration,
				'Daily Rate': currentDailyRate,
				'Remaining Days': remainingDays,
				'Refund Amount': refundAmount,
				'New Package Cost': newPackageCost,
				'Amount to Pay (New Cost - Refund)': `${newPackageCost} - ${refundAmount} = ${amountToPay}`
			}
		});

		setUpgradeCalculations({
			currentPackage: currentPackage?.name || 'No Package',
			newPackage: newPackage.name,
			remainingDays,
			refundAmount: Math.round(refundAmount * 100) / 100,
			newPackageCost,
			amountToPay: Math.round(amountToPay * 100) / 100,
			newEndDate: newEndDate.toISOString().split('T')[0]
		});
	}

	async function upgradePackage() {
		if (!selectedMemberForUpgrade || !selectedUpgradePackage || !upgradeCalculations) return;

		try {
			await api.put(`/owner/memberships/${selectedMemberForUpgrade.id}/upgrade`, {
				package_id: selectedUpgradePackage,
				amount_paid: upgradeCalculations.amountToPay
			});
			
			setShowUpgradeModal(false);
			setSuccessMessage(`Package upgraded successfully for ${selectedMemberForUpgrade.user.name}!`);
			setTimeout(() => setSuccessMessage(''), 5000);
			await load();
		} catch (error) {
			setError(error?.response?.data?.message || 'Failed to upgrade package');
		}
	}

	// QR Scanner functions
	function handleQRScan(qrData) {
		try {
			const memberData = JSON.parse(qrData);
			if (memberData.type === 'member_payment' && memberData.memberId) {
				setScannedMember({
					memberId: memberData.memberId,
					memberName: memberData.memberName
				});
				setShowQRScanner(false);
				setShowPaymentForm(true);
			} else {
				setError('Invalid QR code. Please scan a member QR code.');
			}
		} catch (err) {
			setError('Invalid QR code format. Please scan a valid member QR code.');
		}
	}

	async function processPayment(paymentData) {
		try {
			// Find the member's membership
			const member = members.data.find(m => m.user.id == paymentData.member_id);
			if (!member) {
				throw new Error('Member not found');
			}

			await api.post('/owner/payments', {
				membership_id: member.id,
				amount: paymentData.amount,
				payment_method: paymentData.payment_method,
				status: paymentData.status,
				description: paymentData.description || `Payment via QR scan for ${paymentData.member_name}`,
				paid_at: new Date().toISOString()
			});

			setShowPaymentForm(false);
			setScannedMember(null);
			setSuccessMessage(`Payment of ₹${paymentData.amount} processed successfully for ${paymentData.member_name}!`);
			setTimeout(() => setSuccessMessage(''), 5000);
			await load();
		} catch (error) {
			throw new Error(error?.response?.data?.message || 'Failed to process payment');
		}
	}

	function generateQRForMember(member) {
		setSelectedMemberForQR(member);
		setShowQRGenerator(true);
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
					<button 
						onClick={() => setShowQRScanner(true)} 
						className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer flex items-center gap-2"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
						</svg>
						Scan QR
					</button>
					<button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer">Add Member</button>
				</div>
			</div>

			{/* Search Bar */}
			<div className="mb-4">
				<div className="relative">
					<input
						type="text"
						placeholder="Search members by name, email, or phone..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					{searchTerm && (
						<button
							onClick={() => setSearchTerm('')}
							className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
						>
							<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					)}
				</div>
			</div>

			{error && <div className="text-red-600 text-sm">{error}</div>}
			{successMessage && <div className="text-green-600 text-sm bg-green-50 p-3 rounded border border-green-200">{successMessage}</div>}

				<div className="bg-white rounded shadow">
				{/* Table Header - Fixed */}
					<div className="bg-gray-50 px-4 py-3 border-b">
						<div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-700">
							<div>Name</div>
							<div className="truncate">Email</div>
							<div className="truncate">Phone</div>
						<div>Package</div>
						<div>Status</div>
						<div>Start Date</div>
						<div>End Date</div>
						<div>Actions</div>
					</div>
				</div>

				{/* Table Body - Scrollable */}
					<div className="max-h-96 overflow-y-auto">
					{getFilteredMembers().length > 0 ? (
						getFilteredMembers().map(m => (
							<div key={m.id} className="border-b hover:bg-gray-50 px-4 py-3">
								<div className="grid grid-cols-8 gap-4 text-sm items-center">
									<div className="font-medium">{m.user?.name}</div>
									<div className="text-gray-600 truncate" title={m.user?.email || ''}>
										{m.user?.email || '-'}
									</div>
									<div className="text-gray-600 truncate" title={m.user?.phone || ''}>
										{m.user?.phone || '-'}
									</div>
									<div className="text-gray-600">{m.package?.name || 'No Package'}</div>
									<div>
										<span className={`px-2 py-1 rounded text-xs ${
											m.status === 'active' ? 'bg-green-100 text-green-800' :
											m.status === 'expired' ? 'bg-red-100 text-red-800' :
											'bg-yellow-100 text-yellow-800'
										}`}>
											{m.status}
										</span>
									</div>
									<div className="text-gray-600">{formatDate(m.start_date)}</div>
									<div className="text-gray-600">{formatDate(m.end_date)}</div>
									<div>
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
										{m.status === 'expired' && (
											<button
												onClick={() => reactivate(m)}
												className="text-green-700 hover:text-green-900 p-1 rounded hover:bg-green-50 cursor-pointer"
												title="Reactivate Member"
											>
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.41 9A7 7 0 0119 12m0 0a7 7 0 01-13.59 3" />
												</svg>
											</button>
										)}
											{m.status === 'active' && (
												<button
													onClick={() => openUpgradeModal(m)}
													className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50 cursor-pointer"
													title="Upgrade Package"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
													</svg>
												</button>
											)}
											<button
												onClick={() => generateQRForMember(m)}
												className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 cursor-pointer"
												title="Generate QR Code"
											>
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
												</svg>
											</button>
										</div>
									</div>
								</div>
							</div>
						))
					) : (
						<div className="p-8 text-center text-gray-500">
							{searchTerm ? 'No members found matching your search.' : 'No members found. Use Add Member to get started.'}
						</div>
					)}
				</div>

				{/* Search Results Info */}
				{searchTerm && getFilteredMembers().length > 0 && (
					<div className="px-4 py-2 bg-blue-50 border-t text-sm text-blue-700">
						Showing {getFilteredMembers().length} of {members?.data?.length || 0} members
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
							{successMessage && <div className="text-green-600 text-sm bg-green-50 p-3 rounded border border-green-200 md:col-span-3">{successMessage}</div>}
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
							{successMessage && <div className="text-green-600 text-sm bg-green-50 p-3 rounded border border-green-200">{successMessage}</div>}
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
									<input className="w-full border px-3 py-2 rounded" value={form.phone} onChange={e=>setField('phone', e.target.value)} required maxLength={10} pattern="\d{10}" title="Enter 10 digit mobile number" />
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
									minLength={8}
									pattern="(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
									title="At least 8 chars, include a number and a special symbol"
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
							{successMessage && <div className="text-green-600 text-sm bg-green-50 p-3 rounded border border-green-200 md:col-span-2">{successMessage}</div>}
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

			{/* Upgrade Package Modal */}
			{showUpgradeModal && selectedMemberForUpgrade && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
						<div className="p-6 border-b">
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-semibold">
									Upgrade Package for {selectedMemberForUpgrade.user?.name}
								</h2>
								<button
									onClick={() => setShowUpgradeModal(false)}
									className="text-gray-500 hover:text-gray-700 cursor-pointer"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
						
						<div className="p-6 space-y-6">
							{/* Current Package Info */}
							<div className="bg-gray-50 p-4 rounded-lg">
								<h3 className="font-semibold text-gray-700 mb-2">Current Package</h3>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="text-gray-600">Package:</span>
										<span className="ml-2 font-medium">{selectedMemberForUpgrade.package?.name || 'No Package'}</span>
									</div>
									<div>
										<span className="text-gray-600">Fee:</span>
										<span className="ml-2 font-medium">₹{selectedMemberForUpgrade.package?.price || selectedMemberForUpgrade.package?.fee || 0}</span>
									</div>
									<div>
										<span className="text-gray-600">Duration:</span>
										<span className="ml-2 font-medium">{selectedMemberForUpgrade.package?.duration_days || selectedMemberForUpgrade.package?.duration_months * 30 || 30} days</span>
									</div>
									<div>
										<span className="text-gray-600">End Date:</span>
										<span className="ml-2 font-medium">{selectedMemberForUpgrade.end_date}</span>
									</div>
								</div>
							</div>

							{/* Package Selection */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Select New Package
								</label>
								<select
									value={selectedUpgradePackage}
									onChange={(e) => {
										setSelectedUpgradePackage(e.target.value);
										setUpgradeCalculations(null);
									}}
									className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									<option value="">Choose a package...</option>
									{packages.map(pkg => {
										const fee = pkg.price || pkg.fee || 0;
										const duration = pkg.duration_days || (pkg.duration_months ? pkg.duration_months * 30 : 30);
										return (
											<option key={pkg.id} value={pkg.id}>
												{pkg.name} - ₹{fee} ({duration} days)
											</option>
										);
									})}
								</select>
							</div>

							{/* Calculate Button */}
							{selectedUpgradePackage && (
								<button
									onClick={calculateUpgrade}
									className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 cursor-pointer"
								>
									Calculate Upgrade Cost
								</button>
							)}

							{/* Upgrade Calculations */}
							{upgradeCalculations && (
								<div className="bg-blue-50 p-4 rounded-lg">
									<h3 className="font-semibold text-blue-800 mb-3">Upgrade Calculation</h3>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span>Current Package:</span>
											<span className="font-medium">{upgradeCalculations.currentPackage}</span>
										</div>
										<div className="flex justify-between">
											<span>New Package:</span>
											<span className="font-medium">{upgradeCalculations.newPackage}</span>
										</div>
										<div className="flex justify-between">
											<span>Remaining Days:</span>
											<span className="font-medium">{upgradeCalculations.remainingDays} days</span>
										</div>
										<div className="flex justify-between">
											<span>Refund Amount:</span>
											<span className="font-medium text-green-600">₹{upgradeCalculations.refundAmount}</span>
										</div>
										<div className="flex justify-between">
											<span>New Package Cost:</span>
											<span className="font-medium">₹{upgradeCalculations.newPackageCost}</span>
										</div>
										<hr className="my-2" />
										<div className="flex justify-between text-lg font-bold">
											<span>Amount to Pay:</span>
											<span className="text-blue-600">₹{upgradeCalculations.amountToPay}</span>
										</div>
										<div className="flex justify-between">
											<span>New End Date:</span>
											<span className="font-medium">{upgradeCalculations.newEndDate}</span>
										</div>
										<div className="text-xs text-gray-600 mt-2 p-2 bg-blue-100 rounded">
											<strong>Note:</strong> Refund amount is the same for all packages because it's based on your current package's remaining value. Amount to pay changes based on the new package cost.
										</div>
									</div>
								</div>
							)}

							{/* Action Buttons */}
							<div className="flex justify-end gap-3 pt-4 border-t">
								<button
									onClick={() => setShowUpgradeModal(false)}
									className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
								>
									Cancel
								</button>
								{upgradeCalculations && (
									<button
										onClick={upgradePackage}
										className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer"
									>
										Upgrade Package
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* QR Scanner Modal */}
			<QRScanner
				isOpen={showQRScanner}
				onScan={handleQRScan}
				onClose={() => setShowQRScanner(false)}
			/>

			{/* QR Code Generator Modal */}
			<QRCodeGenerator
				isOpen={showQRGenerator}
				memberId={selectedMemberForQR?.user?.id}
				memberName={selectedMemberForQR?.user?.name}
				onClose={() => {
					setShowQRGenerator(false);
					setSelectedMemberForQR(null);
				}}
			/>

			{/* Payment Form Modal */}
			<PaymentForm
				isOpen={showPaymentForm}
				member={scannedMember}
				onProcessPayment={processPayment}
				onClose={() => {
					setShowPaymentForm(false);
					setScannedMember(null);
				}}
			/>
		</div>
	);
}
