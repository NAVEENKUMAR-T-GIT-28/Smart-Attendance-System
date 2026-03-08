import { create } from 'zustand';

const useAuthStore = create((set) => ({
    token: localStorage.getItem('ag_token') || null,
    user: JSON.parse(localStorage.getItem('ag_user') || 'null'),

    login: (token, user) => {
        localStorage.setItem('ag_token', token);
        localStorage.setItem('ag_user', JSON.stringify(user));
        set({ token, user });
    },

    logout: () => {
        localStorage.removeItem('ag_token');
        localStorage.removeItem('ag_user');
        set({ token: null, user: null });
    },

    isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!state.token && !!state.user;
    }
}));

export default useAuthStore;
