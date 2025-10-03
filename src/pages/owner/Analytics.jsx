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

export default function OwnerAnalytics() {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('monthly');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalyticsData();
    }, [selectedPeriod, selectedYear, selectedMonth]);

    async function loadAnalyticsData() {
        try {
            setLoading(true);
            const params = {
                period: selectedPeriod,
                year: selectedYear,
                month: selectedMonth
            };
            
            const { data } = await api.get('/owner/analytics', { params });
            
            // Handle error response from backend
            if (data.error) {
                console.error('Analytics error:', data.message);
                setAnalyticsData(null);
                return;
            }
            
            setAnalyticsData(data);
        } catch (error) {
            console.error('Failed to load analytics data:', error);
            setAnalyticsData(null);
        } finally {
            setLoading(false);
        }
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="text-lg">Loading analytics...</div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-600 text-lg mb-4">Failed to load analytics data</div>
                <button 
                    onClick={loadAnalyticsData}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Gym Analytics</h1>
                <div className="flex gap-4">
                    <select 
                        value={selectedPeriod} 
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="compare">Compare Months</option>
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

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard 
                    title="Total Revenue" 
                    value={`₹${analyticsData.totalRevenue?.toLocaleString() || 0}`}
                    change={analyticsData.revenueChange}
                    type="revenue"
                />
                <MetricCard 
                    title="Active Members" 
                    value={analyticsData.activeMembers || 0}
                    change={analyticsData.membersChange}
                    type="members"
                />
                <MetricCard 
                    title="New Members" 
                    value={analyticsData.newMembers || 0}
                    change={analyticsData.newMembersChange}
                    type="newMembers"
                />
                <MetricCard 
                    title="Average Revenue/Member" 
                    value={`₹${analyticsData.avgRevenuePerMember?.toFixed(2) || 0}`}
                    change={analyticsData.avgRevenueChange}
                    type="avgRevenue"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white rounded shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={Array.isArray(analyticsData.revenueData) ? analyticsData.revenueData : []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                                <Line 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#2563eb" 
                                    strokeWidth={2}
                                    name="Revenue" 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Members Chart */}
                <div className="bg-white rounded shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Members Trend</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Array.isArray(analyticsData.membersData) ? analyticsData.membersData : []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="members" fill="#10b981" name="Members" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Package Distribution */}
                <div className="bg-white rounded shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Package Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={Array.isArray(analyticsData.packageDistribution) ? analyticsData.packageDistribution : []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {Array.isArray(analyticsData.packageDistribution) ? analyticsData.packageDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    )) : []}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Status */}
                <div className="bg-white rounded shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={Array.isArray(analyticsData.paymentStatus) ? analyticsData.paymentStatus : []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {Array.isArray(analyticsData.paymentStatus) ? analyticsData.paymentStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    )) : []}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Monthly Comparison Chart */}
            {selectedPeriod === 'compare' && (
                <div className="bg-white rounded shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Monthly Comparison</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Array.isArray(analyticsData.monthlyComparison) ? analyticsData.monthlyComparison : []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value, name) => [
                                    name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                                    name === 'revenue' ? 'Revenue' : 'Members'
                                ]} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#2563eb" name="Revenue" />
                                <Bar dataKey="members" fill="#10b981" name="Members" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Detailed Statistics Table */}
            <div className="bg-white rounded shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Detailed Statistics</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Metric
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Current Period
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Previous Period
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Change
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Total Revenue
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ₹{analyticsData.totalRevenue?.toLocaleString() || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ₹{analyticsData.previousRevenue?.toLocaleString() || 0}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                                    analyticsData.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {analyticsData.revenueChange >= 0 ? '+' : ''}{analyticsData.revenueChange?.toFixed(1) || 0}%
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Active Members
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {analyticsData.activeMembers || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {analyticsData.previousMembers || 0}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                                    analyticsData.membersChange >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {analyticsData.membersChange >= 0 ? '+' : ''}{analyticsData.membersChange?.toFixed(1) || 0}%
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    New Members
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {analyticsData.newMembers || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {analyticsData.previousNewMembers || 0}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                                    analyticsData.newMembersChange >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {analyticsData.newMembersChange >= 0 ? '+' : ''}{analyticsData.newMembersChange?.toFixed(1) || 0}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, change, type }) {
    const getChangeColor = (change) => {
        if (change > 0) return 'text-green-600';
        if (change < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getChangeIcon = (change) => {
        if (change > 0) return '↗';
        if (change < 0) return '↘';
        return '→';
    };

    return (
        <div className="bg-white rounded shadow p-6">
            <div className="text-sm text-gray-500 mb-2">{title}</div>
            <div className="text-2xl font-semibold mb-2">{value}</div>
            <div className={`text-sm flex items-center ${getChangeColor(change)}`}>
                <span className="mr-1">{getChangeIcon(change)}</span>
                {change !== undefined ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` : 'N/A'}
            </div>
        </div>
    );
}
