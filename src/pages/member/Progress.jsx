import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

export default function Progress() {
	const [data, setData] = useState([]);
	useEffect(() => {
		api.get('/member/progress').then(({ data }) => setData(data));
	}, []);
	return (
		<div className="p-6 space-y-4">
			<h1 className="text-xl font-semibold">Progress</h1>
			<div className="bg-white p-4 rounded shadow h-80">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="recorded_at" />
						<YAxis domain={[0, 'auto']} />
						<Tooltip />
						<Line type="monotone" dataKey="weight_kg" stroke="#2563eb" name="Weight (kg)" />
						<Line type="monotone" dataKey="bmi" stroke="#16a34a" name="BMI" />
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
