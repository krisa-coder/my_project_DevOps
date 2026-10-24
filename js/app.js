import { api } from './api.js';
import * as auth from './auth.js';

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', async () => {
    await auth.initAuth();
    await renderFeed();
    bindEvents();
});

// --- Рендер ленты ---
async function renderFeed() {
    const feed = document.getElementById('feed');
    const memes = await api.getMemes();
    const user = auth.getUser();

    if (memes.length === 0) {
        feed.innerHTML = '<p style="text-align:center;color:#888;padding:40px">Мемов пока нет. Будьте первым!</p>';
        return;
    }

    feed.innerHTML = memes.map(m => {
        const liked = user && m.likes && m.likes.includes(user.userId);
        const likeCount = m.likes ? m.likes.length : 0;
        return `
            <article class="meme-card" data-id="${m.id}">
                <div class="meme-header">
                    <span class="meme-author">@${m.author}</span>
                    <span class="meme-date">${new Date(m.createdAt).toLocaleString('ru-RU')}</span>
                </div>
                <div class="meme-image-wrap">
                    ${m.caption ? `<div class="meme-caption-top">${escapeHtml(m.caption)}</div>` : ''}
                    <img src="${escapeHtml(m.imageUrl)}" alt="${escapeHtml(m.title)}" onerror="this.src='https://via.placeholder.com/600x400?text=Ошибка+загрузки'">
                </div>
                <div class="meme-actions">
                    <button class="action-btn like-btn ${liked ? 'liked' : ''}" data-id="${m.id}">
                        ${liked ? '❤️' : '🤍'} <span>${likeCount}</span>
                    </button>
                    <button class="action-btn">💬 <span>0</span></button>
                    <button class="action-btn">🔗 Поделиться</button>
                </div>
            </article>
        `;
    }).join('');
}

// --- События ---
function bindEvents() {
    // Форма мема
    document.getElementById('memeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.getUser();
        if (!user) {
            alert('Войдите, чтобы публиковать мемы');
            openAuthModal();
            return;
        }

        const meme = {
            id: 'm_' + Date.now(),
            title: document.getElementById('memeTitle').value.trim(),
            imageUrl: document.getElementById('memeImage').value.trim(),
            caption: document.getElementById('memeCaption').value.trim(),
            author: user.username,
            authorId: user.userId,
            createdAt: Date.now(),
            likes: []
        };

        await api.createMeme(meme);
        e.target.reset();
        await renderFeed();
    });

    // Лайки (делегирование)
    document.getElementById('feed').addEventListener('click', async (e) => {
        const btn = e.target.closest('.like-btn');
        if (!btn) return;
        const user = auth.getUser();
        if (!user) {
            openAuthModal();
            return;
        }
        await api.likeMeme(btn.dataset.id, user.userId);
        await renderFeed();
    });

    // Авторизация
    document.getElementById('authBtn').addEventListener('click', openAuthModal);
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await auth.logout();
        await renderFeed();
    });
    document.getElementById('closeModal').addEventListener('click', closeAuthModal);

    let authMode = 'login';
    document.getElementById('toggleAuthMode').addEventListener('click', () => {
        authMode = authMode === 'login' ? 'register' : 'login';
        document.getElementById('authTitle').textContent =
            authMode === 'login' ? 'Вход' : 'Регистрация';
        document.getElementById('toggleAuthMode').textContent =
            authMode === 'login' ? 'Регистрация' : 'Вход';
    });

    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('authUsername').value.trim();
        const password = document.getElementById('authPassword').value;
        try {
            if (authMode === 'login') await auth.login(username, password);
            else await auth.register(username, password);
            closeAuthModal();
            await renderFeed();
        } catch (err) {
            alert(err.message);
        }
    });
}

function openAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
}
function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('authForm').reset();
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}