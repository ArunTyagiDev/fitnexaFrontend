import { useEffect, useState } from 'react';
import api from '../../lib/api';
import RevenueChart from './RevenueChart';

export default function SuperDashboard() {
	const [data, setData] = useState(null);
	useEffect(() => {
		api.get('/super/analytics').then(({ data }) => setData(data));
	}, []);
	if (!data) return <div className="p-6">Loading...</div>;
	return (
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			<h1 className="text-3xl font-bold">Super Admin</h1>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Stat title="Total Gyms" value={data.totalGyms} />
				<Stat title="Revenue" value={`₹${Number(data.revenue).toFixed(2)}`} />
				<Stat title="Total Users" value={data.totalUsers} />
			</div>
			<RevenueChart />
		</div>
	);
}

function Stat({ title, value }) {
	return (
		<div className="bg-white rounded-lg shadow p-5">
			<div className="text-sm text-gray-500">{title}</div>
			<div className="text-2xl font-semibold">{value}</div>
		</div>
	);
}
