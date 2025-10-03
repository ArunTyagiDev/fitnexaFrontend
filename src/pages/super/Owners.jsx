import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function Owners() {
	const [items, setItems] = useState(null);
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const [editing, setEditing] = useState(null);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [showAdd, setShowAdd] = useState(false);
	const [addForm, setAddForm] = useState({ name: '', email: '', password: 'password123', subscription_plan: 'Pro', subscription_expires_at: '' });

	async function load(p = 1) {
		const { data } = await api.get('/super/owners', { params: { page: p, search } });
		setItems(data);
		setPage(p);
	}
	useEffect(() => { load(); }, []);

	function onSearch(e) { e.preventDefault(); load(1); }

	function startEdit(o) { setEditing(o.id); setName(o.name); setEmail(o.email); }
	async function saveEdit() {
		await api.put(`/super/owners/${editing}`, { name, email });
		setEditing(null); load(page);
	}
	async function remove(id) { await api.delete(`/super/owners/${id}`); load(page); }

	function setAdd(k, v) { setAddForm(prev => ({ ...prev, [k]: v })); }
	async function addOwner(e) {
		e.preventDefault();
		await api.post('/super/register-owner', addForm);
		setShowAdd(false);
		setAddForm({ name: '', email: '', password: 'password123', subscription_plan: 'Pro', subscription_expires_at: '' });
		load(1);
	}

	return (
		<div className="p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Gym Owners</h1>
				<button onClick={()=>setShowAdd(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Add Owner</button>
			</div>
			<form onSubmit={onSearch} className="flex gap-2">
				<input className="border px-3 py-2 rounded" placeholder="Search by name or email" value={search} onChange={e=>setSearch(e.target.value)} />
				<button className="bg-gray-800 text-white px-4 py-2 rounded">Search</button>
			</form>
			<div className="bg-white rounded shadow overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-gray-50 text-left">
							<th className="p-2">Name</th>
							<th className="p-2">Email</th>
							<th className="p-2 w-56">Actions</th>
						</tr>
					</thead>
					<tbody>
						{items?.data?.map(o => (
							<tr key={o.id} className="border-t">
								<td className="p-2">{o.name}</td>
								<td className="p-2">{o.email}</td>
								<td className="p-2 space-x-3">
									<Link className="text-gray-700 underline" to={`/super/owners/${o.id}`}>View</Link>
									<button className="text-blue-600" onClick={()=>startEdit(o)}>Edit</button>
									<button className="text-red-600" onClick={()=>remove(o.id)}>Delete</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{items && (
				<div className="flex items-center gap-2">
					<button disabled={!items?.prev_page_url} onClick={()=>load(page-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
					<div>Page {items.current_page} of {items.last_page}</div>
					<button disabled={!items?.next_page_url} onClick={()=>load(page+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
				</div>
			)}
			{editing && (
				<div className="bg-white p-4 rounded shadow space-y-3 max-w-md">
					<h2 className="font-semibold">Edit Owner</h2>
					<input className="border px-3 py-2 rounded w-full" value={name} onChange={e=>setName(e.target.value)} />
					<input className="border px-3 py-2 rounded w-full" value={email} onChange={e=>setEmail(e.target.value)} />
					<div className="space-x-2">
						<button onClick={saveEdit} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
						<button onClick={()=>setEditing(null)} className="px-4 py-2 border rounded">Cancel</button>
					</div>
				</div>
			)}
			{showAdd && (
				<form onSubmit={addOwner} className="bg-white p-4 rounded shadow space-y-3 max-w-md">
					<h2 className="font-semibold">Add Gym Owner</h2>
					<input className="border px-3 py-2 rounded w-full" placeholder="Name" value={addForm.name} onChange={e=>setAdd('name', e.target.value)} />
					<input className="border px-3 py-2 rounded w-full" placeholder="Email" value={addForm.email} onChange={e=>setAdd('email', e.target.value)} />
					<input type="password" className="border px-3 py-2 rounded w-full" placeholder="Password" value={addForm.password} onChange={e=>setAdd('password', e.target.value)} />
					<input type="date" className="border px-3 py-2 rounded w-full" placeholder="Subscription Expires" value={addForm.subscription_expires_at} onChange={e=>setAdd('subscription_expires_at', e.target.value)} />
					<select className="border px-3 py-2 rounded w-full" value={addForm.subscription_plan} onChange={e=>setAdd('subscription_plan', e.target.value)}>
						<option>Pro</option>
						<option>Basic</option>
					</select>
					<div className="space-x-2">
						<button className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
						<button type="button" onClick={()=>setShowAdd(false)} className="px-4 py-2 border rounded">Cancel</button>
					</div>
				</form>
			)}
		</div>
	);
}
