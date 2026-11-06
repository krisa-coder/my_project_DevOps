import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = Router();

// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Логин и пароль обязательны' });
        }
        if (username.length < 3 || password.length < 4) {
            return res.status(400).json({ error: 'Логин ≥ 3, пароль ≥ 4 символов' });
        }

        const hash = await bcrypt.hash(password, 10);
        
        // ВАЖНО: здесь нет лишних запятых
        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
            [username, hash]
        );
        
        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }
        console.error('❌ Ошибка регистрации:', err);
        res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
    }
});

// Вход
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const result = await pool.query(
            'SELECT id, username, password_hash FROM users WHERE username = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        
        if (!valid) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        console.error('❌ Ошибка входа:', err);
        res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
    }
});

export default router;