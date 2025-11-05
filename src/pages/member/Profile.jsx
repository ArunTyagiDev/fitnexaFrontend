import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function Profile() {
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [height, setHeight] = useState('');
	const [weight, setWeight] = useState('');
	const [message, setMessage] = useState('');

	useEffect(() => {
		(async () => {
			try {
				const { data } = await api.get('/member/profile');
				setName(data.name || '');
				setPhone(data.phone || '');
				setHeight(data.height_cm ? String(data.height_cm) : '');
				setWeight(data.weight_kg ? String(data.weight_kg) : '');
			} catch (e) {
				// ignore
			}
		})();
	}, []);

	async function submit(e) {
		e.preventDefault();
		await api.post('/member/profile', { name, phone, height_cm: Number(height), weight_kg: Number(weight) });
		setMessage('Profile updated');
	}

	return (
		<div className="p-6 space-y-4">
			<h1 className="text-xl font-semibold">Profile</h1>
			{message && <div className="text-green-600">{message}</div>}
			<form onSubmit={submit} className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-3">
				<input className="border px-3 py-2 rounded" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
				<input className="border px-3 py-2 rounded" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} maxLength={10} pattern="\d{10}" title="Enter 10 digit mobile number" />
				<input className="border px-3 py-2 rounded" placeholder="Height (cm)" value={height} onChange={e=>setHeight(e.target.value)} />
				<input className="border px-3 py-2 rounded" placeholder="Weight (kg)" value={weight} onChange={e=>setWeight(e.target.value)} />
				<button className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
			</form>
		</div>
	);
}
