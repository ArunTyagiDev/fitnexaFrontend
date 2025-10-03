import { useState } from 'react';

export default function Forgot() {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	function submit(e) { e.preventDefault(); setMessage('If your email exists, a reset link will be sent.'); }
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
			<form onSubmit={submit} className="bg-white p-6 rounded shadow w-full max-w-sm space-y-4">
				<h1 className="text-xl font-semibold">Forgot Password</h1>
				{message && <p className="text-green-600 text-sm">{message}</p>}
				<input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
				<button className="w-full bg-blue-600 text-white py-2 rounded">Send reset link</button>
			</form>
		</div>
	);
}
