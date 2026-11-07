import { api } from './api.js';
import * as auth from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    await auth.initAuth();
    await renderFeed();
    bindEvents();
});

async function renderFeed() {
    const feed = document.getElementById('feed');
    const user = auth.getUser();
    
    try {
        const memes = await api.getMemes();
        if (memes.length === 0) {
            feed.innerHTML = '<p style="text-align:center;color:#888;padding:40px">Мемов пока нет. Будьте первым!</p>';
            return;
        }

        feed.innerHTML = memes.map(m => {
            const liked = m.likedByMe;
            const likeCount = m.likesCount || 0;
            const isAuthor = user && Number(user.id) === Number(m.authorId);
            
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
                        ${isAuthor ? `
                            <button class="action-btn edit-btn" data-id="${m.id}">✏️ Изменить</button>
                            <button class="action-btn delete-btn" data-id="${m.id}">🗑️ Удалить</button>
                        ` : ''}
                    </div>
                </article>
            `;
        }).join('');
    } catch (err) {
        console.error('Ошибка загрузки мемов:', err);
        feed.innerHTML = '<p style="text-align:center;color:red;padding:40px">Ошибка загрузки. Проверьте сервер.</p>';
    }
}

function bindEvents() {
    // Форма создания мема
    document.getElementById('memeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.getUser();
        if (!user) { alert('Войдите, чтобы публиковать мемы'); openAuthModal(); return; }

        const meme = {
            title: document.getElementById('memeTitle').value.trim(),
            imageUrl: document.getElementById('memeImage').value.trim(),
            caption: document.getElementById('memeCaption').value.trim()
        };

        try {
            await api.createMeme(meme);
            e.target.reset();
            await renderFeed();
        } catch (err) {
            alert(err.message);
        }
    });

    // Делегирование событий для ленты (лайки, редактирование, удаление)
    document.getElementById('feed').addEventListener('click', async (e) => {
        // Лайк
        const likeBtn = e.target.closest('.like-btn');
        if (likeBtn) {
            if (!auth.getUser()) { openAuthModal(); return; }
            try {
                await api.likeMeme(likeBtn.dataset.id);
                await renderFeed();
            } catch (err) { alert(err.message); }
            return;
        }

        // Редактирование
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const memeId = editBtn.dataset.id;
            const memes = await api.getMemes();
            const target = memes.find(m => m.id == memeId);
            if (target) {
                document.getElementById('editMemeId').value = target.id;
                document.getElementById('editMemeTitle').value = target.title;
                document.getElementById('editMemeImage').value = target.imageUrl;
                document.getElementById('editMemeCaption').value = target.caption || '';
                document.getElementById('editModal').classList.remove('hidden');
            }
            return;
        }

        // Удаление
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            if (confirm('Точно удалить этот мем?')) {
                try {
                    await api.deleteMeme(deleteBtn.dataset.id);
                    await renderFeed();
                } catch (err) { alert(err.message); }
            }
            return;
        }
    });

    // Кнопки авторизации
    document.getElementById('authBtn').addEventListener('click', openAuthModal);
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await auth.logout();
        await renderFeed();
    });
    document.getElementById('closeModal').addEventListener('click', closeAuthModal);

    // Переключение режимов входа/регистрации
    let authMode = 'login';
    document.getElementById('toggleAuthMode').addEventListener('click', () => {
        authMode = authMode === 'login' ? 'register' : 'login';
        document.getElementById('authTitle').textContent = authMode === 'login' ? 'Вход' : 'Регистрация';
        document.getElementById('toggleAuthMode').textContent = authMode === 'login' ? 'Регистрация' : 'Вход';
    });

    // Обработка формы авторизации
    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('authUsername').value.trim();
        const password = document.getElementById('authPassword').value;
        try {
            if (authMode === 'login') await auth.login(username, password);
            else await auth.register(username, password);
            closeAuthModal();
            await renderFeed();
        } catch (err) { alert(err.message); }
    });

    // Обработка формы редактирования мема
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const memeId = document.getElementById('editMemeId').value;
        const data = {
            title: document.getElementById('editMemeTitle').value.trim(),
            imageUrl: document.getElementById('editMemeImage').value.trim(),
            caption: document.getElementById('editMemeCaption').value.trim()
        };
        
        try {
            await api.updateMeme(memeId, data);
            closeEditModal();
            await renderFeed();
        } catch (err) { alert(err.message); }
    });

    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
}

function openAuthModal() { document.getElementById('authModal').classList.remove('hidden'); }
function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('authForm').reset();
}
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editForm').reset();
}
function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}