const express = require('express');
const { readDB, writeDB, nextId } = require('../utils/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function enrichPost(post, db) {
  const author = db.users.find((u) => u.id === post.userId);
  const commentsCount = db.comments.filter((c) => c.postId === post.id).length;
  return {
    ...post,
    author: author ? { id: author.id, username: author.username, avatar: author.avatar } : null,
    likesCount: post.likes.length,
    commentsCount,
  };
}

// GET /api/posts  (?userId=  or  ?following=1&currentUserId=)
router.get('/', (req, res) => {
  const db = readDB();
  let posts = [...db.posts];

  if (req.query.userId) {
    posts = posts.filter((p) => p.userId === parseInt(req.query.userId));
  }

  if (req.query.following && req.query.currentUserId) {
    const currentUserId = parseInt(req.query.currentUserId);
    const followingIds = db.follows.filter((f) => f.followerId === currentUserId).map((f) => f.followingId);
    posts = posts.filter((p) => followingIds.includes(p.userId) || p.userId === currentUserId);
  }

  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts.map((p) => enrichPost(p, db)));
});

// GET /api/posts/:id
router.get('/:id', (req, res) => {
  const db = readDB();
  const post = db.posts.find((p) => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(enrichPost(post, db));
});

// POST /api/posts
router.post('/', authMiddleware, (req, res) => {
  const { content, image } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });
  const db = readDB();
  const newPost = {
    id: nextId(db.posts),
    userId: req.userId,
    content,
    image: image || null,
    likes: [],
    createdAt: new Date().toISOString(),
  };
  db.posts.push(newPost);
  writeDB(db);
  res.status(201).json(enrichPost(newPost, db));
});

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const post = db.posts.find((p) => p.id === id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.userId !== req.userId) return res.status(403).json({ error: 'Not allowed' });
  db.posts = db.posts.filter((p) => p.id !== id);
  db.comments = db.comments.filter((c) => c.postId !== id);
  writeDB(db);
  res.json({ message: 'Post deleted' });
});

// POST /api/posts/:id/like
router.post('/:id/like', authMiddleware, (req, res) => {
  const db = readDB();
  const post = db.posts.find((p) => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!post.likes.includes(req.userId)) {
    post.likes.push(req.userId);
    writeDB(db);
  }
  res.json(enrichPost(post, db));
});

// POST /api/posts/:id/unlike
router.post('/:id/unlike', authMiddleware, (req, res) => {
  const db = readDB();
  const post = db.posts.find((p) => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.likes = post.likes.filter((uid) => uid !== req.userId);
  writeDB(db);
  res.json(enrichPost(post, db));
});

module.exports = router;
