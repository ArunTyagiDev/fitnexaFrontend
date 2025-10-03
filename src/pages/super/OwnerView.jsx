import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';

export default function OwnerView() {
	const { id } = useParams();
	const [owner, setOwner] = useState(null);
	useEffect(() => { api.get(`/super/owners/${id}`).then(({ data }) => setOwner(data)); }, [id]);
	if (!owner) return <div className="p-6">Loading...</div>;
	return (
		<div className="p-6 space-y-4">
			<h1 className="text-2xl font-semibold">{owner.name}</h1>
			<div className="bg-white rounded shadow p-4">
				<div>Email: {owner.email}</div>
				<div>Plan: {owner.subscription_plan || '-'}</div>
				<div>Expires: {owner.subscription_expires_at || '-'}</div>
			</div>
			<div className="bg-white rounded shadow p-4">
				<h2 className="font-semibold mb-2">Gyms</h2>
				<ul className="list-disc pl-6">
					{owner.gyms_owned?.map(g => <li key={g.id}>{g.name}</li>)}
				</ul>
			</div>
		</div>
	);
}
