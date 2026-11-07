const API_BASE = '/api';

function getToken() { return localStorage.getItem('memehub_token'); }
function setToken(token) { localStorage.setItem('memehub_token', token); }
function clearToken() { localStorage.removeItem('memehub_token'); }

async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_BASE + path, { ...options, headers: { ...headers, ...options.headers } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
}

export const api = {
    async getMemes() { return request('/memes'); },
    
    async createMeme(meme) {
        return request('/memes', {
            method: 'POST',
            body: JSON.stringify({ title: meme.title, imageUrl: meme.imageUrl, caption: meme.caption })
        });
    },
    
    async updateMeme(memeId, data) {
        return request(`/memes/${memeId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async deleteMeme(memeId) {
        return request(`/memes/${memeId}`, { method: 'DELETE' });
    },
    
    async likeMeme(memeId) { return request(`/memes/${memeId}/like`, { method: 'POST' }); },
    
    async register(username, password) {
        const data = await request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });
        setToken(data.token); return data.user;
    },
    
    async login(username, password) {
        const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
        setToken(data.token); return data.user;
    },
    
    async getCurrentUser() {
        const token = getToken();
        if (!token) return null;
        try {
            await request('/memes');
            const payload = JSON.parse(atob(token.split('.')[1]));
            return { id: payload.id, username: payload.username };
        } catch {
            clearToken(); return null;
        }
    },
    
    async logout() { clearToken(); }
};