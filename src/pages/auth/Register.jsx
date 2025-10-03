import { useState } from 'react';
import api from '../../lib/api';

export default function Register() {
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }
	async function submit(e) {
		e.preventDefault();
		setError('');
		try {
			await api.post('/auth/register', form);
			setMessage('Account created. You can login now.');
		} catch (err) {
			setError(err?.response?.data?.message || 'Registration failed');
		}
	}
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
			<form onSubmit={submit} className="bg-white p-6 rounded shadow w-full max-w-sm space-y-4">
				<h1 className="text-xl font-semibold">Register</h1>
				{message && <p className="text-green-600 text-sm">{message}</p>}
				{error && <p className="text-red-600 text-sm">{error}</p>}
				<input className="w-full border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={e=>setField('name', e.target.value)} />
				<input className="w-full border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e=>setField('email', e.target.value)} />
				<input type="password" className="w-full border rounded px-3 py-2" placeholder="Password" value={form.password} onChange={e=>setField('password', e.target.value)} />
				<button className="w-full bg-blue-600 text-white py-2 rounded">Create account</button>
			</form>
		</div>
	);
}
