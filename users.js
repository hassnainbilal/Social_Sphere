const express = require('express');
const { readDB, writeDB } = require('../utils/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function publicUser(u, db) {
  const followers = db.follows.filter((f) => f.followingId === u.id).length;
  const following = db.follows.filter((f) => f.followerId === u.id).length;
  const postsCount = db.posts.filter((p) => p.userId === u.id).length;
  const { password, ...safe } = u;
  return { ...safe, followers, following, postsCount };
}

// GET /api/users/me
router.get('/me', authMiddleware, (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(publicUser(user, db));
});

// GET /api/users
router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.users.map((u) => publicUser(u, db)));
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(publicUser(user, db));
});

// PUT /api/users/:id
router.put('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  if (id !== req.userId) return res.status(403).json({ error: 'Not allowed' });
  const user = db.users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { bio, avatar } = req.body;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  writeDB(db);
  res.json(publicUser(user, db));
});

// POST /api/users/:id/follow
router.post('/:id/follow', authMiddleware, (req, res) => {
  const db = readDB();
  const targetId = parseInt(req.params.id);
  if (targetId === req.userId) return res.status(400).json({ error: "You can't follow yourself" });
  const target = db.users.find((u) => u.id === targetId);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const already = db.follows.find((f) => f.followerId === req.userId && f.followingId === targetId);
  if (already) return res.status(400).json({ error: 'Already following' });

  db.follows.push({ followerId: req.userId, followingId: targetId });
  writeDB(db);
  res.json({ message: 'Followed successfully' });
});

// POST /api/users/:id/unfollow
router.post('/:id/unfollow', authMiddleware, (req, res) => {
  const db = readDB();
  const targetId = parseInt(req.params.id);
  const before = db.follows.length;
  db.follows = db.follows.filter((f) => !(f.followerId === req.userId && f.followingId === targetId));
  if (db.follows.length === before) return res.status(400).json({ error: 'Not following this user' });
  writeDB(db);
  res.json({ message: 'Unfollowed successfully' });
});

// GET /api/users/:id/followers
router.get('/:id/followers', (req, res) => {
  const db = readDB();
  const targetId = parseInt(req.params.id);
  const followerIds = db.follows.filter((f) => f.followingId === targetId).map((f) => f.followerId);
  const followers = db.users.filter((u) => followerIds.includes(u.id)).map((u) => publicUser(u, db));
  res.json(followers);
});

// GET /api/users/:id/following
router.get('/:id/following', (req, res) => {
  const db = readDB();
  const targetId = parseInt(req.params.id);
  const followingIds = db.follows.filter((f) => f.followerId === targetId).map((f) => f.followingId);
  const following = db.users.filter((u) => followingIds.includes(u.id)).map((u) => publicUser(u, db));
  res.json(following);
});

// GET /api/users/:id/is-following
router.get('/:id/is-following', authMiddleware, (req, res) => {
  const db = readDB();
  const targetId = parseInt(req.params.id);
  const isFollowing = !!db.follows.find((f) => f.followerId === req.userId && f.followingId === targetId);
  res.json({ isFollowing });
});

module.exports = router;
