import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(() => localStorage.getItem('token'));
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadMe() {
			if (!token) return setLoading(false);
			try {
				const { data } = await api.get('/me');
				setUser(data);
			} catch {
				localStorage.removeItem('token');
				setToken(null);
			} finally {
				setLoading(false);
			}
		}
		loadMe();
	}, [token]);

	const value = useMemo(() => ({
		user,
		token,
		loading,
		async login(email, password) {
			const { data } = await api.post('/auth/login', { email, password });
			localStorage.setItem('token', data.token);
			setToken(data.token);
			setUser(data.user);
		},
		logout() {
			localStorage.removeItem('token');
			setToken(null);
			setUser(null);
		},
	}), [user, token, loading]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}
