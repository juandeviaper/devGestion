import axios from 'axios';
import type { User, AuthResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';
const TOKEN_KEY = 'devgestion_access_token';
const REFRESH_TOKEN_KEY = 'devgestion_refresh_token';
const USER_KEY = 'devgestion_user_data';

export const authService = {
    // Authenticate user and store tokens
    login: async (username: string, password: string): Promise<AuthResponse> => {
        const response = await axios.post<AuthResponse>(`${API_BASE_URL}/token/`, { username, password });
        const { access, refresh } = response.data;

        // Fetch full user data after login
        const userRes = await axios.get<User>(`${API_BASE_URL}/me/`, {
            headers: { Authorization: `Bearer ${access}` }
        });

        authService.setSession(access, refresh, userRes.data);
        return response.data;
    },

    // Register a new user
    register: async (userData: Partial<User> & { password?: string }): Promise<User> => {
        const response = await axios.post<User>(`${API_BASE_URL}/register/`, userData);
        return response.data;
    },

    // Check if a username is already taken
    checkUsername: async (username: string): Promise<boolean> => {
        const response = await axios.get<{ available: boolean }>(`${API_BASE_URL}/check-username/`, {
            params: { username }
        });
        return response.data.available;
    },

    // Check if an email is already taken
    checkEmail: async (email: string): Promise<boolean> => {
        const response = await axios.get<{ available: boolean }>(`${API_BASE_URL}/check-email/`, {
            params: { email }
        });
        return response.data.available;
    },

    // Store tokens and user info after successful login/register
    setSession: (accessToken: string, refreshToken: string, userData: User): void => {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
    },

    // Remove all session data (Logout)
    clearSession: (): void => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    logout: (): void => {
        authService.clearSession();
    },

    // Check if user is currently authenticated
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem(TOKEN_KEY);
    },

    // Get current user data
    getUser: (): User | null => {
        const data = localStorage.getItem(USER_KEY);
        try {
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error parsing user data', e);
            return null;
        }
    },

    // Get tokens
    getAccessToken: (): string | null => localStorage.getItem(TOKEN_KEY),
    getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY)
};
