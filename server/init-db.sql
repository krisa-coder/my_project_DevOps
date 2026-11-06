CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    meme_id INTEGER REFERENCES memes(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, meme_id)
);

CREATE INDEX IF NOT EXISTS idx_memes_created ON memes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_meme ON likes(meme_id);