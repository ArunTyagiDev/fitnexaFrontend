import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function RevenueChart() {
	const [data, setData] = useState([]);
	useEffect(() => { api.get('/super/revenue-trend').then(({ data }) => setData(data)); }, []);
	return (
		<div className="bg-white rounded shadow p-4 h-80">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="month" />
					<YAxis />
					<Tooltip />
					<Line type="monotone" dataKey="total" stroke="#2563eb" name="Revenue" />
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
