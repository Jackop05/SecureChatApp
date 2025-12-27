import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState, User } from '../types/auth';
import axiosClient from '../api/axiosClient';

interface AuthContextType extends AuthState {
    login: (token: string, username: string, privateKey: string, isTwoFactorEnabled: boolean) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        privateKey: null,
        token: localStorage.getItem('token'),
        isAuthenticated: !!localStorage.getItem('token'),
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !state.privateKey) {
            logout();
        }
    }, []); 

    const login = (token: string, username: string, privateKey: string, isTwoFactorEnabled: boolean) => {
        localStorage.setItem('token', token);
        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setState({
            user: { username, email: '', publicKey: '', isTwoFactorEnabled }, 
            privateKey,
            token,
            isAuthenticated: true,
        });
    };

    const updateUser = (user: User) => {
        setState(prev => ({ ...prev, user }));
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axiosClient.defaults.headers.common['Authorization'];
        setState({
            user: null,
            privateKey: null,
            token: null,
            isAuthenticated: false,
        });
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};