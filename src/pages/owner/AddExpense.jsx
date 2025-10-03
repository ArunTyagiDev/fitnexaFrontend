import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Modal from '../../components/Modal';

export default function AddExpense() {
    const [formData, setFormData] = useState({
        gym_id: '',
        category: '',
        subcategory: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        vendor: '',
        invoice_number: '',
        metadata: {}
    });
    const [gyms, setGyms] = useState([]);
    const [constants, setConstants] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        loadGyms();
        loadConstants();
    }, []);

    async function loadGyms() {
        try {
            const { data } = await api.get('/owner/gyms');
            setGyms(data);
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, gym_id: data[0].id }));
            }
        } catch (error) {
            console.error('Failed to load gyms:', error);
        }
    }

    async function loadConstants() {
        try {
            const { data } = await api.get('/owner/financial/constants');
            setConstants(data);
        } catch (error) {
            console.error('Failed to load constants:', error);
        }
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Reset subcategory when category changes
            ...(name === 'category' && { subcategory: '' })
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/owner/financial/expenses', formData);
            setShowSuccessModal(true);
            resetForm();
        } catch (error) {
            console.error('Failed to add expense:', error);
            alert('Failed to add expense. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setFormData({
            gym_id: gyms.length > 0 ? gyms[0].id : '',
            category: '',
            subcategory: '',
            amount: '',
            description: '',
            expense_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            vendor: '',
            invoice_number: '',
            metadata: {}
        });
    }

    const getSubcategories = () => {
        if (!formData.category || !constants.expense_subcategories) return [];
        return constants.expense_subcategories[formData.category] || [];
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="bg-white rounded shadow p-6">
                <h1 className="text-2xl font-semibold mb-6">Add Expense Entry</h1>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Gym Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gym *
                        </label>
                        <select
                            name="gym_id"
                            value={formData.gym_id}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {gyms.map(gym => (
                                <option key={gym.id} value={gym.id}>
                                    {gym.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Expense Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expense Category *
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Category</option>
                            {Object.entries(constants.expense_categories || {}).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory */}
                    {formData.category && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subcategory
                            </label>
                            <select
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Subcategory</option>
                                {Object.entries(getSubcategories()).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount (₹) *
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            required
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter amount"
                        />
                    </div>

                    {/* Expense Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expense Date *
                        </label>
                        <input
                            type="date"
                            name="expense_date"
                            value={formData.expense_date}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method *
                        </label>
                        <select
                            name="payment_method"
                            value={formData.payment_method}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.entries(constants.expense_payment_methods || {}).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Vendor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vendor/Supplier
                        </label>
                        <input
                            type="text"
                            name="vendor"
                            value={formData.vendor}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Vendor or supplier name"
                        />
                    </div>

                    {/* Invoice Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Invoice Number
                        </label>
                        <input
                            type="text"
                            name="invoice_number"
                            value={formData.invoice_number}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Invoice or receipt number"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional details about this expense"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Adding...' : 'Add Expense'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {/* Success Modal */}
            <Modal 
                title="Success"
                open={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" 
                            onClick={() => setShowSuccessModal(false)}
                        >
                            OK
                        </button>
                    </div>
                }
            >
                <div className="text-center py-4">
                    <div className="text-red-600 text-4xl mb-4">✅</div>
                    <div className="text-lg font-semibold mb-2">Expense Added Successfully!</div>
                    <div className="text-gray-600">
                        Your expense entry has been recorded and will appear in your financial dashboard.
                    </div>
                </div>
            </Modal>
        </div>
    );
}
