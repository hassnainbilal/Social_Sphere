const express = require('express');
const { readDB, writeDB, nextId } = require('../utils/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/comments/post/:postId
router.get('/post/:postId', (req, res) => {
  const db = readDB();
  const postId = parseInt(req.params.postId);
  const comments = db.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((c) => {
      const author = db.users.find((u) => u.id === c.userId);
      return { ...c, author: author ? { id: author.id, username: author.username, avatar: author.avatar } : null };
    });
  res.json(comments);
});

// POST /api/comments/post/:postId
router.post('/post/:postId', authMiddleware, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text is required' });
  const db = readDB();
  const postId = parseInt(req.params.postId);
  const post = db.posts.find((p) => p.id === postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const newComment = {
    id: nextId(db.comments),
    postId,
    userId: req.userId,
    text,
    createdAt: new Date().toISOString(),
  };
  db.comments.push(newComment);
  writeDB(db);

  const author = db.users.find((u) => u.id === req.userId);
  res.status(201).json({
    ...newComment,
    author: { id: author.id, username: author.username, avatar: author.avatar },
  });
});

// DELETE /api/comments/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const comment = db.comments.find((c) => c.id === id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.userId !== req.userId) return res.status(403).json({ error: 'Not allowed' });
  db.comments = db.comments.filter((c) => c.id !== id);
  writeDB(db);
  res.json({ message: 'Comment deleted' });
});

module.exports = router;
