import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { 
    LineChart, 
    Line, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

export default function FinancialReport() {
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReportData();
    }, [startDate, endDate]);

    async function loadReportData() {
        try {
            setLoading(true);
            const params = {
                start_date: startDate,
                end_date: endDate
            };
            
            const { data } = await api.get('/owner/financial/profit-loss-report', { params });
            setReportData(data);
        } catch (error) {
            console.error('Failed to load report data:', error);
        } finally {
            setLoading(false);
        }
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4'];

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="text-lg">Loading report data...</div>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-600 text-lg mb-4">Failed to load report data</div>
                <button 
                    onClick={loadReportData}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const { summary, revenue_breakdown, expense_breakdown } = reportData;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Financial Report</h1>
                <div className="flex gap-4">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 border rounded"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-2 border rounded"
                    />
                    <button
                        onClick={loadReportData}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ReportCard 
                    title="Total Revenue" 
                    value={`₹${summary.total_revenue?.toLocaleString() || 0}`}
                    color="green"
                    icon="💰"
                />
                <ReportCard 
                    title="Total Expenses" 
                    value={`₹${summary.total_expenses?.toLocaleString() || 0}`}
                    color="red"
                    icon="💸"
                />
                <ReportCard 
                    title="Net Profit/Loss" 
                    value={`₹${summary.net_profit?.toLocaleString() || 0}`}
                    color={summary.net_profit >= 0 ? "green" : "red"}
                    icon={summary.net_profit >= 0 ? "📈" : "📉"}
                />
                <ReportCard 
                    title="Profit Margin" 
                    value={`${summary.profit_margin?.toFixed(1) || 0}%`}
                    color={summary.profit_margin >= 0 ? "green" : "red"}
                    icon="📊"
                />
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white rounded shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Source
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Percentage
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transactions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {revenue_breakdown.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.source}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                        ₹{item.total.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {summary.total_revenue > 0 ? ((item.total / summary.total_revenue) * 100).toFixed(1) : 0}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.count}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white rounded shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subcategory
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Percentage
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transactions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expense_breakdown.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.category}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.subcategory}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                                        ₹{item.total.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {summary.total_expenses > 0 ? ((item.total / summary.total_expenses) * 100).toFixed(1) : 0}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.count}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Source Chart */}
                <div className="bg-white rounded shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Revenue by Source</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenue_breakdown.map(item => ({
                                        name: item.source,
                                        value: item.total
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(1)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {revenue_breakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expenses by Category Chart */}
                <div className="bg-white rounded shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expense_breakdown.reduce((acc, item) => {
                                        const existing = acc.find(x => x.name === item.category);
                                        if (existing) {
                                            existing.value += item.total;
                                        } else {
                                            acc.push({ name: item.category, value: item.total });
                                        }
                                        return acc;
                                    }, [])}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(1)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {expense_breakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReportCard({ title, value, color, icon }) {
    const colorClasses = {
        green: 'text-green-600 bg-green-50 border-green-200',
        red: 'text-red-600 bg-red-50 border-red-200',
        blue: 'text-blue-600 bg-blue-50 border-blue-200',
    };

    return (
        <div className={`bg-white rounded shadow p-6 border-l-4 ${colorClasses[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 mb-2">{title}</div>
                    <div className="text-2xl font-semibold">{value}</div>
                </div>
                <div className="text-3xl">{icon}</div>
            </div>
        </div>
    );
}
