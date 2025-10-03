import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import Modal from '../../components/Modal';

export default function Packages() {
	const [packages, setPackages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showModal, setShowModal] = useState(false);
	const [editId, setEditId] = useState(null);
	const [form, setForm] = useState({ name: '', duration_months: '', price: '', benefits: '' });
	const [search, setSearch] = useState('');

	async function load() {
		setLoading(true);
		setError('');
		try {
			const { data } = await api.get('/owner/packages');
			setPackages(data);
		} catch (e) {
			setError('Failed to load packages');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { load(); }, []);

	function openCreate() {
		setEditId(null);
		setForm({ name: '', duration_months: '', price: '', benefits: '' });
		setShowModal(true);
	}

	function openEdit(pkg) {
		setEditId(pkg.id);
		setForm({
			name: pkg.name || '',
			duration_months: String(pkg.duration_months ?? ''),
			price: String(pkg.price ?? ''),
			benefits: (Array.isArray(pkg.benefits) ? pkg.benefits.join('\n') : (pkg.benefits || '')),
		});
		setShowModal(true);
	}

	function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

	async function save(e) {
		e?.preventDefault?.();
		setError('');
		const payload = {
			name: form.name.trim(),
			duration_months: Number(form.duration_months),
			price: Number(form.price),
			benefits: form.benefits
				.split(/\r?\n/)
				.map(s => s.trim())
				.filter(Boolean),
		};
		try {
			if (editId) await api.put(`/owner/packages/${editId}`, payload);
			else await api.post('/owner/packages', payload);
			setShowModal(false);
			await load();
		} catch (e) {
			setError(e?.response?.data?.message || 'Failed to save');
		}
	}

	async function remove(pkg) {
		if (!confirm(`Delete package "${pkg.name}"?`)) return;
		try {
			await api.delete(`/owner/packages/${pkg.id}`);
			await load();
		} catch (e) {
			setError('Failed to delete');
		}
	}

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return packages;
		return packages.filter(p =>
			(p.name || '').toLowerCase().includes(q) ||
			String(p.duration_months || '').includes(q)
		);
	}, [packages, search]);

	return (
		<div className="p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Packages</h1>
				<button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded">New Package</button>
			</div>
			<div className="bg-white p-4 rounded shadow">
				<div className="flex items-center gap-3 mb-3">
					<input className="border px-3 py-2 rounded w-full max-w-xs" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
					{error && <div className="text-red-600 text-sm">{error}</div>}
				</div>
				{loading ? (
					<div className="p-6 text-gray-500">Loading...</div>
				) : filtered.length === 0 ? (
					<div className="p-6 text-gray-500">No packages found.</div>
				) : (
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-gray-50 text-left">
								<th className="p-2">Name</th>
								<th className="p-2">Duration</th>
								<th className="p-2">Price</th>
								<th className="p-2">Benefits</th>
								<th className="p-2">Actions</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map(pkg => (
								<tr key={pkg.id} className="border-t hover:bg-gray-50">
									<td className="p-2 font-medium">{pkg.name}</td>
									<td className="p-2">{pkg.duration_months} mo</td>
									<td className="p-2">₹{pkg.price}</td>
									<td className="p-2">
										<div className="flex flex-wrap gap-1">
											{(pkg.benefits || []).map((b, i) => (
												<span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{b}</span>
											))}
										</div>
									</td>
									<td className="p-2">
										<button onClick={() => openEdit(pkg)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
										<button onClick={() => remove(pkg)} className="text-red-600 hover:text-red-800">Delete</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			<Modal title={editId ? 'Edit Package' : 'New Package'} open={showModal} onClose={() => setShowModal(false)}
				footer={(
					<div className="flex items-center justify-end gap-2">
						<button className="px-4 py-2 rounded border" onClick={() => setShowModal(false)}>Cancel</button>
						<button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={save}>{editId ? 'Save' : 'Create'}</button>
					</div>
				)}
			>
				<form onSubmit={save} className="grid grid-cols-1 gap-3">
					<div>
						<label className="block text-sm mb-1">Name</label>
						<input className="w-full border px-3 py-2 rounded" value={form.name} onChange={e=>setField('name', e.target.value)} required />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div>
							<label className="block text-sm mb-1">Duration (months)</label>
							<input type="number" min="1" className="w-full border px-3 py-2 rounded" value={form.duration_months} onChange={e=>setField('duration_months', e.target.value)} required />
						</div>
						<div>
							<label className="block text-sm mb-1">Price</label>
							<input type="number" step="0.01" min="0" className="w-full border px-3 py-2 rounded" value={form.price} onChange={e=>setField('price', e.target.value)} required />
						</div>
					</div>
					<div>
						<label className="block text-sm mb-1">Benefits / Features (one per line)</label>
						<textarea rows={5} className="w-full border px-3 py-2 rounded" value={form.benefits} onChange={e=>setField('benefits', e.target.value)} placeholder="Gym access\nPersonal training\nDiet plan" />
					</div>
				</form>
			</Modal>
		</div>
	);
}


