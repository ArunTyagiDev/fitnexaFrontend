import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Modal from '../../components/Modal';

export default function AddRevenue() {
    const [formData, setFormData] = useState({
        gym_id: '',
        source: '',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference_number: '',
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
            [name]: value
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/owner/financial/revenues', formData);
            setShowSuccessModal(true);
            resetForm();
        } catch (error) {
            console.error('Failed to add revenue:', error);
            alert('Failed to add revenue. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setFormData({
            gym_id: gyms.length > 0 ? gyms[0].id : '',
            source: '',
            amount: '',
            description: '',
            transaction_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            reference_number: '',
            metadata: {}
        });
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="bg-white rounded shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold">Add Revenue Entry</h1>
                    <a href="/owner/financial" className="px-4 py-2 rounded border hover:bg-gray-50 cursor-pointer">Back to Financial Dashboard</a>
                </div>
                
                {/* Auto-generated Revenue Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Auto-Generated Revenue
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>
                                    Revenue from <strong>Membership Fees</strong> and <strong>Package Sales</strong> 
                                    is automatically generated when payments are marked as paid. 
                                    Use this form only for other revenue sources like personal training, 
                                    equipment rental, supplements, etc.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
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

                    {/* Revenue Source */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Revenue Source *
                        </label>
                        <select
                            name="source"
                            value={formData.source}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Source</option>
                            {Object.entries(constants.revenue_sources || {}).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </div>

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

                    {/* Transaction Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transaction Date *
                        </label>
                        <input
                            type="date"
                            name="transaction_date"
                            value={formData.transaction_date}
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
                            {Object.entries(constants.revenue_payment_methods || {}).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reference Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reference Number
                        </label>
                        <input
                            type="text"
                            name="reference_number"
                            value={formData.reference_number}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Invoice number, receipt number, etc."
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
                            placeholder="Additional details about this revenue"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Adding...' : 'Add Revenue'}
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
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" 
                            onClick={() => setShowSuccessModal(false)}
                        >
                            OK
                        </button>
                    </div>
                }
            >
                <div className="text-center py-4">
                    <div className="text-green-600 text-4xl mb-4">✅</div>
                    <div className="text-lg font-semibold mb-2">Revenue Added Successfully!</div>
                    <div className="text-gray-600">
                        Your revenue entry has been recorded and will appear in your financial dashboard.
                    </div>
                </div>
            </Modal>
        </div>
    );
}
