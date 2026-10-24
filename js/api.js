// Этот файл — единственное место, где в будущем будут fetch-запросы.
// Сейчас он просто проксирует вызовы в storage.js.
// Когда появится backend — меняем ТОЛЬКО этот файл.

import * as storage from './storage.js';

export const api = {
    // === Мемы ===
    async getMemes() {
        return storage.getMemes();
    },
    async createMeme(meme) {
        return storage.addMeme(meme);
    },
    async likeMeme(id, userId) {
        return storage.toggleLike(id, userId);
    },

    // === Пользователи (будет заменено на API) ===
    async register(username, password) {
        return storage.registerUser(username, password);
    },
    async login(username, password) {
        return storage.loginUser(username, password);
    },
    async getCurrentUser() {
        return storage.getCurrentUser();
    },
    async logout() {
        return storage.logout();
    }
};