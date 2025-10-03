import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('revenue');
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        gym_id: '',
        source: '',
        category: ''
    });
    const [constants, setConstants] = useState({});

    useEffect(() => {
        loadConstants();
        loadTransactions();
    }, [activeTab, filters]);

    async function loadConstants() {
        try {
            const { data } = await api.get('/owner/financial/constants');
            setConstants(data);
        } catch (error) {
            console.error('Failed to load constants:', error);
        }
    }

    async function loadTransactions() {
        try {
            setLoading(true);
            const params = { ...filters };
            const endpoint = activeTab === 'revenue' ? '/owner/financial/revenues' : '/owner/financial/expenses';
            
            const { data } = await api.get(endpoint, { params });
            setTransactions(data.data || []);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleFilterChange(e) {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    }

    function clearFilters() {
        setFilters({
            start_date: '',
            end_date: '',
            gym_id: '',
            source: '',
            category: ''
        });
    }

    async function deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        try {
            const endpoint = activeTab === 'revenue' ? `/owner/financial/revenues/${id}` : `/owner/financial/expenses/${id}`;
            await api.delete(endpoint);
            loadTransactions();
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            alert('Failed to delete transaction. Please try again.');
        }
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-4">Financial Transactions</h1>
                
                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'revenue'
                                ? 'bg-white text-green-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Revenue ({transactions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('expense')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'expense'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Expenses ({transactions.length})
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            name="start_date"
                            value={filters.start_date}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            name="end_date"
                            value={filters.end_date}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    {activeTab === 'revenue' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                            <select
                                name="source"
                                value={filters.source}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">All Sources</option>
                                {Object.entries(constants.revenue_sources || {}).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">All Categories</option>
                                {Object.entries(constants.expense_categories || {}).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Actions</label>
                        <button
                            onClick={clearFilters}
                            className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="text-gray-500">Loading transactions...</div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-gray-500">No transactions found</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {activeTab === 'revenue' ? 'Source' : 'Category'}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment Method
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(transaction.transaction_date || transaction.expense_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                {activeTab === 'revenue' 
                                                    ? (constants.revenue_sources?.[transaction.source] || 
                                                       constants.auto_generated_sources?.[transaction.source] || 
                                                       transaction.source)
                                                    : (constants.expense_categories?.[transaction.category] || transaction.category)
                                                }
                                                {activeTab === 'revenue' && transaction.metadata?.auto_generated && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Auto
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                            {transaction.description || '-'}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                            activeTab === 'revenue' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            ₹{transaction.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {constants.revenue_payment_methods?.[transaction.payment_method] || 
                                             constants.expense_payment_methods?.[transaction.payment_method] || 
                                             transaction.payment_method}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {activeTab === 'revenue' && transaction.metadata?.auto_generated ? (
                                                <span className="text-gray-400 text-sm">Auto-generated</span>
                                            ) : (
                                                <button
                                                    onClick={() => deleteTransaction(transaction.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
