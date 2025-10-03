export default function StatCard({ title, value, icon }) {
	return (
		<div className="bg-white rounded shadow p-4 flex items-center gap-3">
			{icon}
			<div>
				<div className="text-sm text-gray-500">{title}</div>
				<div className="text-xl font-semibold">{value}</div>
			</div>
		</div>
	);
}


