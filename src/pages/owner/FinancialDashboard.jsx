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

export default function FinancialDashboard() {
    const [financialData, setFinancialData] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('monthly');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFinancialData();
    }, [selectedPeriod, selectedYear, selectedMonth]);

    async function loadFinancialData() {
        try {
            setLoading(true);
            const params = {
                period: selectedPeriod,
                year: selectedYear,
                month: selectedMonth
            };
            
            const { data } = await api.get('/owner/financial/dashboard', { params });
            setFinancialData(data);
        } catch (error) {
            console.error('Failed to load financial data:', error);
        } finally {
            setLoading(false);
        }
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4'];

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="text-lg">Loading financial data...</div>
            </div>
        );
    }

    if (!financialData) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-600 text-lg mb-4">Failed to load financial data</div>
                <button 
                    onClick={loadFinancialData}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const { summary, revenue_by_source, expenses_by_category, trend_data } = financialData;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Financial Dashboard</h1>
                <div className="flex gap-4">
                    <select 
                        value={selectedPeriod} 
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                    
                    {selectedPeriod === 'monthly' && (
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="px-3 py-2 border rounded"
                        >
                            {Array.from({length: 12}, (_, i) => (
                                <option key={i+1} value={i+1}>
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    )}
                    
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-3 py-2 border rounded"
                    >
                        {Array.from({length: 5}, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return <option key={year} value={year}>{year}</option>;
                        })}
                    </select>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <a 
                        href="/owner/financial/revenue" 
                        className="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 text-center"
                    >
                        ➕ Add Revenue
                    </a>
                    <a 
                        href="/owner/financial/expense" 
                        className="bg-red-600 text-white px-4 py-3 rounded hover:bg-red-700 text-center"
                    >
                        ➕ Add Expense
                    </a>
                    <a 
                        href="/owner/financial/report" 
                        className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 text-center"
                    >
                        📊 View Reports
                    </a>
                    <a 
                        href="/owner/financial/transactions" 
                        className="bg-purple-600 text-white px-4 py-3 rounded hover:bg-purple-700 text-center"
                    >
                        📋 All Transactions
                    </a>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FinancialCard 
                    title="Total Revenue" 
                    value={`₹${summary.total_revenue?.toLocaleString() || 0}`}
                    color="green"
                    icon="💰"
                />
                <FinancialCard 
                    title="Total Expenses" 
                    value={`₹${summary.total_expenses?.toLocaleString() || 0}`}
                    color="red"
                    icon="💸"
                />
                <FinancialCard 
                    title="Net Profit" 
                    value={`₹${summary.net_profit?.toLocaleString() || 0}`}
                    color={summary.net_profit >= 0 ? "green" : "red"}
                    icon={summary.net_profit >= 0 ? "📈" : "📉"}
                />
                <FinancialCard 
                    title="Profit Margin" 
                    value={`${summary.profit_margin?.toFixed(1) || 0}%`}
                    color={summary.profit_margin >= 0 ? "green" : "red"}
                    icon="📊"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Expenses Trend */}
                <div className="bg-white rounded shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses Trend</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend_data || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value, name) => [
                                    `₹${value.toLocaleString()}`,
                                    name === 'revenue' ? 'Revenue' : name === 'expenses' ? 'Expenses' : 'Profit'
                                ]} />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#10b981" 
                                    strokeWidth={2}
                                    name="Revenue" 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="expenses" 
                                    stroke="#ef4444" 
                                    strokeWidth={2}
                                    name="Expenses" 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="profit" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2}
                                    name="Profit" 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue by Source */}
                <div className="bg-white rounded shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Revenue by Source</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenue_by_source || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({source, percentage}) => `${source} ${percentage.toFixed(1)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="amount"
                                >
                                    {(revenue_by_source || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expenses by Category */}
                <div className="bg-white rounded shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expenses_by_category || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({category, percentage}) => `${category} ${percentage.toFixed(1)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="amount"
                                >
                                    {(expenses_by_category || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Profit/Loss Bar Chart */}
                <div className="bg-white rounded shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Profit/Loss Overview</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trend_data || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value, name) => [
                                    `₹${value.toLocaleString()}`,
                                    name === 'revenue' ? 'Revenue' : name === 'expenses' ? 'Expenses' : 'Profit'
                                ]} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                                <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FinancialCard({ title, value, color, icon }) {
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
