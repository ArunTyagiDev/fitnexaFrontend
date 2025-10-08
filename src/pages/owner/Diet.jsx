import { useEffect, useState, lazy, Suspense } from 'react';
import api from '../../lib/api';
import Modal from '../../components/Modal';

// Lazy load CKEditor to reduce initial bundle size
const CKEditor = lazy(() => import('@ckeditor/ckeditor5-react').then(module => ({ default: module.CKEditor })));
const ClassicEditor = lazy(() => import('@ckeditor/ckeditor5-build-classic'));

const DIET_CATEGORIES = [
	'Weight Loss',
	'Weight Gain', 
	'Muscle Gain',
	'Abs Gain'
];

export default function DietForm() {
	const [dietPlans, setDietPlans] = useState([]);
	const [gyms, setGyms] = useState([]);
	const [users, setUsers] = useState([]);
	const [userSearch, setUserSearch] = useState('');
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [message, setMessage] = useState('');
	const [activeTab, setActiveTab] = useState('All');
	
	// Form states
	const [showAddModal, setShowAddModal] = useState(false);
	const [showAssignModal, setShowAssignModal] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState(null);
	const [form, setForm] = useState({ 
		category: '', 
		title: '', 
		description: '', 
		meals: '' 
	});
	const [assignForm, setAssignForm] = useState({ 
		user_id: '', 
		diet_plan_id: '' 
	});

	useEffect(() => {
		loadDietPlans();
		loadGyms();
	}, []);

	useEffect(() => {
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

	async function loadDietPlans() {
		try {
			const { data } = await api.get('/owner/diet-plans');
			setDietPlans(data);
		} catch (error) {
			console.error('Failed to load diet plans:', error);
		}
	}

	async function loadGyms() {
		const { data } = await api.get('/owner/gyms');
		setGyms(data);
	}

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

	function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }
	function setAssignField(k, v) { setAssignForm(prev => ({ ...prev, [k]: v })); }

	function selectUser(user) {
		setAssignForm(prev => ({ ...prev, user_id: user.id }));
		setUserSearch(user.name);
		setShowUserDropdown(false);
	}

	function handleUserSearchChange(e) {
		setUserSearch(e.target.value);
		setShowUserDropdown(true);
		if (!e.target.value) {
			setAssignForm(prev => ({ ...prev, user_id: '' }));
		}
	}

	async function submitDietPlan(e) {
		e.preventDefault();
		await api.post('/owner/diet-plans', form);
		setMessage('Diet plan created successfully');
		setForm({ category: '', title: '', description: '', meals: '' });
		setShowAddModal(false);
		loadDietPlans();
	}

	async function assignDietPlan(e) {
		e.preventDefault();
		try {
			// First, get the diet plan details
			const dietPlan = dietPlans.find(plan => plan.id === assignForm.diet_plan_id);
			
			// Create the diet assignment with the plan content
			await api.post('/owner/diets', {
				user_id: assignForm.user_id,
				plan: dietPlan ? `${dietPlan.title}\n\nCategory: ${dietPlan.category}\n\nDescription: ${dietPlan.description}\n\nMeal Plan:\n${dietPlan.meals}` : assignForm.plan
			});
			setMessage('Diet plan assigned successfully');
			setAssignForm({ user_id: '', diet_plan_id: '' });
			setUserSearch('');
			setShowAssignModal(false);
		} catch (error) {
			setMessage('Failed to assign diet plan');
			console.error('Error assigning diet plan:', error);
		}
	}

	function openAssignModal(plan) {
		setSelectedPlan(plan);
		setAssignForm(prev => ({ ...prev, diet_plan_id: plan.id }));
		setShowAssignModal(true);
	}

	function getFilteredPlans() {
		if (activeTab === 'All') return dietPlans;
		return dietPlans.filter(plan => plan.category === activeTab);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Diet Master</h1>
				<button 
					onClick={() => setShowAddModal(true)}
					className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
				>
					Add Diet Plan
				</button>
			</div>

			{message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{message}</div>}

			{/* Category Tabs */}
			<div className="bg-white rounded shadow">
				<div className="border-b border-gray-200">
					<nav className="-mb-px flex space-x-8 px-6">
						<button
							onClick={() => setActiveTab('All')}
							className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
								activeTab === 'All'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							All Plans
						</button>
						{DIET_CATEGORIES.map(category => (
							<button
								key={category}
								onClick={() => setActiveTab(category)}
								className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
									activeTab === category
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								{category}
							</button>
						))}
					</nav>
				</div>
			</div>

			{/* Diet Plans Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{getFilteredPlans().map(plan => (
					<div key={plan.id} className="bg-white rounded shadow p-6">
						<div className="flex items-start justify-between mb-4">
							<div>
								<h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
								<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									{plan.category}
								</span>
							</div>
						</div>
						
						<div className="mb-4">
							<div className="text-gray-600 text-sm mb-2" dangerouslySetInnerHTML={{ __html: plan.description }}></div>
							{plan.meals && (
								<div>
									<h4 className="font-medium text-gray-900 mb-2">Meal Plan:</h4>
									<div className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: plan.meals }}></div>
								</div>
							)}
						</div>

						<div className="flex justify-between items-center">
							<span className="text-xs text-gray-500">
								Created: {new Date(plan.created_at).toLocaleDateString()}
							</span>
							<button
								onClick={() => openAssignModal(plan)}
								className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 cursor-pointer"
							>
								Assign to User
							</button>
						</div>
					</div>
				))}
			</div>

			{getFilteredPlans().length === 0 && (
				<div className="bg-white rounded shadow p-8 text-center">
					<p className="text-gray-500">No diet plans found for this category.</p>
					<button 
						onClick={() => setShowAddModal(true)}
						className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
					>
						Create First Diet Plan
					</button>
				</div>
			)}

			{/* Add Diet Plan Modal */}
			<Modal 
				title="Add Diet Plan" 
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
							onClick={submitDietPlan}
						>
							Create Plan
						</button>
					</div>
				}
			>
				<form onSubmit={submitDietPlan} className="space-y-4">
					<div>
						<label className="block text-sm mb-1">Category</label>
						<select 
							className="w-full border px-3 py-2 rounded"
							value={form.category}
							onChange={e => setField('category', e.target.value)}
							required
						>
							<option value="">Select Category</option>
							{DIET_CATEGORIES.map(category => (
								<option key={category} value={category}>{category}</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm mb-1">Title</label>
						<input 
							type="text"
							className="w-full border px-3 py-2 rounded"
							placeholder="Enter diet plan title"
							value={form.title}
							onChange={e => setField('title', e.target.value)}
							required
						/>
					</div>
					<div>
						<label className="block text-sm mb-1">Description</label>
						<Suspense fallback={<div className="w-full h-32 border rounded bg-gray-100 flex items-center justify-center">Loading editor...</div>}>
							<CKEditor
								editor={ClassicEditor}
								data={form.description}
								onReady={editor => {
									// You can store the "editor" and use when it is needed.
									console.log('Editor is ready to use!', editor);
								}}
								onChange={(event, editor) => {
									const data = editor.getData();
									setField('description', data);
								}}
								config={{
									toolbar: ['heading', '|', 'bold', 'italic', 'bulletedList', 'numberedList', 'link', 'blockQuote']
								}}
							/>
						</Suspense>
					</div>
					<div>
						<label className="block text-sm mb-1">Meal Plan</label>
						<Suspense fallback={<div className="w-full h-32 border rounded bg-gray-100 flex items-center justify-center">Loading editor...</div>}>
							<CKEditor
								editor={ClassicEditor}
								data={form.meals}
								onReady={editor => {
									console.log('Meal Plan Editor is ready!', editor);
								}}
								onChange={(event, editor) => {
									const data = editor.getData();
									setField('meals', data);
								}}
								config={{
									toolbar: ['heading', '|', 'bold', 'italic', 'bulletedList', 'numberedList', 'link', 'blockQuote']
								}}
							/>
						</Suspense>
					</div>
				</form>
			</Modal>

			{/* Assign Diet Plan Modal */}
			<Modal 
				title={`Assign Diet Plan: ${selectedPlan?.title}`}
				open={showAssignModal} 
				onClose={() => setShowAssignModal(false)}
				footer={
					<div className="flex items-center justify-end gap-2">
						<button 
							className="px-4 py-2 rounded border hover:bg-gray-50 cursor-pointer" 
							onClick={() => setShowAssignModal(false)}
						>
							Cancel
						</button>
						<button 
							className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 cursor-pointer" 
							onClick={assignDietPlan}
							disabled={!assignForm.user_id}
						>
							Assign Plan
						</button>
					</div>
				}
			>
				<form onSubmit={assignDietPlan} className="space-y-4">
					<div className="relative user-dropdown">
						<label className="block text-sm mb-1">Select User</label>
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
					
					{selectedPlan && (
						<div className="bg-gray-50 p-4 rounded">
							<h4 className="font-medium mb-2">Selected Diet Plan:</h4>
							<p className="text-sm text-gray-600">{selectedPlan.title}</p>
							<p className="text-xs text-gray-500 mt-1">{selectedPlan.category}</p>
						</div>
					)}
				</form>
			</Modal>
		</div>
	);
}

