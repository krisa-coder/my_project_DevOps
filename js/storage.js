// Абстракция над хранилищем. Сейчас localStorage,
// позже можно заменить на IndexedDB или оставить только для кэша.

const MEMES_KEY = 'memehub_memes';
const USERS_KEY = 'memehub_users';
const SESSION_KEY = 'memehub_session';

// --- Мемы ---
export function getMemes() {
    return JSON.parse(localStorage.getItem(MEMES_KEY) || '[]');
}

export function addMeme(meme) {
    const memes = getMemes();
    memes.unshift(meme);
    localStorage.setItem(MEMES_KEY, JSON.stringify(memes));
    return meme;
}

export function toggleLike(memeId, userId) {
    const memes = getMemes();
    const meme = memes.find(m => m.id === memeId);
    if (!meme) return null;

    if (!meme.likes) meme.likes = [];
    const idx = meme.likes.indexOf(userId);
    if (idx === -1) meme.likes.push(userId);
    else meme.likes.splice(idx, 1);

    localStorage.setItem(MEMES_KEY, JSON.stringify(memes));
    return meme;
}

// --- Пользователи ---
export function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

export function registerUser(username, password) {
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        throw new Error('Пользователь уже существует');
    }
    const user = {
        id: 'u_' + Date.now(),
        username,
        // ⚠️ В реальном backend — хэширование на сервере!
        passwordHash: btoa(password),
        createdAt: Date.now()
    };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return user;
}

export function loginUser(username, password) {
    const users = getUsers();
    const user = users.find(u =>
        u.username === username && u.passwordHash === btoa(password)
    );
    if (!user) throw new Error('Неверный логин или пароль');

    // Простая "сессия"
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: user.id,
        username: user.username,
        loginAt: Date.now()
    }));
    return user;
}

export function getCurrentUser() {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

export function logout() {
    localStorage.removeItem(SESSION_KEY);
}