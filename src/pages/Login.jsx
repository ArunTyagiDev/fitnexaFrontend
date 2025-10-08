import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = useState('admin@fitnexa.test');
	const [password, setPassword] = useState('password123');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	async function onSubmit(e) {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			await login(email, password);
			navigate('/');
		} catch (err) {
			setError(err?.response?.data?.message || 'Login failed');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
			<form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm space-y-4">
				<h1 className="text-xl font-semibold">Sign in</h1>
				{error && <p className="text-red-600 text-sm">{error}</p>}
				<div>
					<label className="block text-sm mb-1">Email</label>
					<input className="w-full border rounded px-3 py-2"  onChange={e=>setEmail(e.target.value)} />
				</div>
				<div>
					<label className="block text-sm mb-1">Password</label>
					<input type="password" className="w-full border rounded px-3 py-2"  onChange={e=>setPassword(e.target.value)} />
				</div>
				<button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">
					{loading ? 'Signing in...' : 'Sign in'}
				</button>
			</form>
		</div>
	);
}
