import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/auth/Register';
import Forgot from './pages/auth/Forgot';
import SuperDashboard from './pages/super/Dashboard';
import Owners from './pages/super/Owners.jsx';
import OwnerView from './pages/super/OwnerView.jsx';
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerMembers from './pages/owner/Members';
import Analytics from './pages/owner/Analytics';
import FinancialDashboard from './pages/owner/FinancialDashboard';
import AddRevenue from './pages/owner/AddRevenue';
import AddExpense from './pages/owner/AddExpense';
import Transactions from './pages/owner/Transactions';
import FinancialReport from './pages/owner/FinancialReport';
// Removed AssignPackage route per new flow
import Packages from './pages/owner/Packages';
import PaymentForm from './pages/owner/Payment';
import DietForm from './pages/owner/Diet';
import OwnerFeed from './pages/owner/Feed';
import MemberDashboard from './pages/member/Dashboard';
import Profile from './pages/member/Profile';
import Progress from './pages/member/Progress';
import Feed from './pages/member/Feed';
import './index.css';

function HomeRedirect() {
	const { user } = useAuth();
	if (!user) return <Navigate to="/login" replace />;
	if (user.role === 'super_admin') return <Navigate to="/super" replace />;
	if (user.role === 'gym_owner') return <Navigate to="/owner" replace />;
	return <Navigate to="/member" replace />;
}

export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<HomeRedirect />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/forgot" element={<Forgot />} />

					<Route element={<ProtectedRoute role="super_admin" />}> 
						<Route path="/super" element={<Layout><SuperDashboard /></Layout>} />
						<Route path="/super/owners" element={<Layout><Owners /></Layout>} />
						<Route path="/super/owners/:id" element={<Layout><OwnerView /></Layout>} />
					</Route>

					<Route element={<ProtectedRoute role="gym_owner" />}> 
						<Route path="/owner" element={<Layout><OwnerDashboard /></Layout>} />
						<Route path="/owner/analytics" element={<Layout><Analytics /></Layout>} />
						<Route path="/owner/financial" element={<Layout><FinancialDashboard /></Layout>} />
						<Route path="/owner/financial/revenue" element={<Layout><AddRevenue /></Layout>} />
						<Route path="/owner/financial/expense" element={<Layout><AddExpense /></Layout>} />
						<Route path="/owner/financial/transactions" element={<Layout><Transactions /></Layout>} />
						<Route path="/owner/financial/report" element={<Layout><FinancialReport /></Layout>} />
						<Route path="/owner/packages" element={<Layout><Packages /></Layout>} />
						<Route path="/owner/members" element={<Layout><OwnerMembers /></Layout>} />
						<Route path="/owner/payment" element={<Layout><PaymentForm /></Layout>} />
						<Route path="/owner/diet" element={<Layout><DietForm /></Layout>} />
						<Route path="/owner/feed" element={<Layout><OwnerFeed /></Layout>} />
					</Route>

					<Route element={<ProtectedRoute role="member" />}> 
						<Route path="/member" element={<Layout><MemberDashboard /></Layout>} />
						<Route path="/member/profile" element={<Layout><Profile /></Layout>} />
						<Route path="/member/progress" element={<Layout><Progress /></Layout>} />
						<Route path="/member/feed" element={<Layout><Feed /></Layout>} />
					</Route>
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}
