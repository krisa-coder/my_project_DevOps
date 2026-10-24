import { api } from './api.js';

let currentUser = null;

export async function initAuth() {
    currentUser = await api.getCurrentUser();
    updateAuthUI();
}

export function getUser() {
    return currentUser;
}

export async function login(username, password) {
    currentUser = await api.login(username, password);
    updateAuthUI();
    return currentUser;
}

export async function register(username, password) {
    await api.register(username, password);
    return login(username, password);
}

export async function logout() {
    await api.logout();
    currentUser = null;
    updateAuthUI();
}

function updateAuthUI() {
    const userInfo = document.getElementById('userInfo');
    const authBtn = document.getElementById('authBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (currentUser) {
        userInfo.textContent = `👤 ${currentUser.username}`;
        authBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        userInfo.textContent = '';
        authBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}