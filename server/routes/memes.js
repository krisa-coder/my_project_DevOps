import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Получить все мемы
router.get('/', async (req, res) => {
    try {
        const header = req.headers.authorization;
        let userId = null;
        if (header && header.startsWith('Bearer ')) {
            try {
                const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
                userId = payload.id;
            } catch {}
        }

        const result = await pool.query(`
            SELECT 
                m.id,
                m.title,
                m.image_url AS "imageUrl",
                m.caption,
                m.created_at AS "createdAt",
                u.username AS author,
                u.id AS "authorId",
                COUNT(l.user_id)::int AS "likesCount",
                COALESCE(bool_or(l.user_id = $1), false) AS "likedByMe"
            FROM memes m
            JOIN users u ON u.id = m.author_id
            LEFT JOIN likes l ON l.meme_id = m.id
            GROUP BY m.id, u.id
            ORDER BY m.created_at DESC
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('❌ Ошибка при получении мемов:', err);
        res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
    }
});

// Создать мем
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, imageUrl, caption } = req.body;
        if (!title || !imageUrl) {
            return res.status(400).json({ error: 'title и imageUrl обязательны' });
        }

        const result = await pool.query(
            `INSERT INTO memes (title, image_url, caption, author_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id, title, image_url AS "imageUrl", caption, created_at AS "createdAt"`,
            [title, imageUrl, caption || '', req.user.id]
        );

        res.status(201).json({
            ...result.rows[0],
            author: req.user.username,
            authorId: req.user.id,
            likesCount: 0,
            likedByMe: false
        });
    } catch (err) {
        console.error(' Ошибка при создании мема:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Поставить/снять лайк
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const memeId = parseInt(req.params.id);
        const userId = req.user.id;

        // Проверяем, что мем существует
        const meme = await pool.query('SELECT id FROM memes WHERE id = $1', [memeId]);
        if (meme.rows.length === 0) {
            return res.status(404).json({ error: 'Мем не найден' });
        }

        // Переключаем лайк
        const existing = await pool.query(
            'SELECT 1 FROM likes WHERE user_id = $1 AND meme_id = $2',
            [userId, memeId]
        );

        if (existing.rows.length > 0) {
            await pool.query('DELETE FROM likes WHERE user_id = $1 AND meme_id = $2', [userId, memeId]);
        } else {
            await pool.query('INSERT INTO likes (user_id, meme_id) VALUES ($1, $2)', [userId, memeId]);
        }

        // Возвращаем обновлённое число лайков
        const count = await pool.query(
            'SELECT COUNT(*)::int FROM likes WHERE meme_id = $1', [memeId]
        );
        const liked = await pool.query(
            'SELECT 1 FROM likes WHERE user_id = $1 AND meme_id = $2', [userId, memeId]
        );

        res.json({ likesCount: count.rows[0].count, liked: liked.rows.length > 0 });
    } catch (err) {
        console.error('❌ Ошибка при лайке:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

export default router;