const API = '/api';
let token = localStorage.getItem('ss_token') || null;
let currentUser = JSON.parse(localStorage.getItem('ss_user') || 'null');

function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API}${path}`, { ...options, headers }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  });
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  t.classList.toggle('toast-error', isError);
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.add('hidden'), 2500);
}

function initials(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ============ AUTH ============ */
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  });
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setSession(data.token, data.user);
  } catch (err) {
    errEl.textContent = err.message;
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const bio = document.getElementById('register-bio').value;
  const errEl = document.getElementById('register-error');
  errEl.textContent = '';
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, bio }),
    });
    setSession(data.token, data.user);
  } catch (err) {
    errEl.textContent = err.message;
  }
});

function setSession(t, user) {
  token = t;
  currentUser = user;
  localStorage.setItem('ss_token', token);
  localStorage.setItem('ss_user', JSON.stringify(user));
  showApp();
}

document.getElementById('logout-btn').addEventListener('click', () => {
  token = null;
  currentUser = null;
  localStorage.removeItem('ss_token');
  localStorage.removeItem('ss_user');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
});

/* ============ APP SHELL ============ */
function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  renderMiniProfile();
  loadFeed('all');
  loadSuggestions();
}

function renderMiniProfile() {
  const el = document.getElementById('mini-profile');
  el.innerHTML = `
    <div class="avatar">${initials(currentUser.username)}</div>
    <div>
      <div class="mp-name">${currentUser.username}</div>
      <div class="mp-handle">@${currentUser.username.toLowerCase()}</div>
    </div>`;
  document.getElementById('composer-avatar').textContent = initials(currentUser.username);
}

document.querySelectorAll('.nav-link').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));
    document.getElementById(`view-${view}`).classList.remove('hidden');
    if (view === 'profile') loadProfile(currentUser.id);
    if (view === 'people') loadPeople();
  });
});

/* ============ FEED ============ */
document.querySelectorAll('.feed-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.feed-tab').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    loadFeed(btn.dataset.feed);
  });
});

async function loadFeed(type) {
  const list = document.getElementById('posts-list');
  list.innerHTML = '<p class="empty">Loading…</p>';
  try {
    const qs = type === 'following' ? `?following=1&currentUserId=${currentUser.id}` : '';
    const posts = await api(`/posts${qs}`);
    renderPosts(posts, list);
  } catch (err) {
    list.innerHTML = `<p class="empty">Couldn't load posts.</p>`;
  }
}

function renderPosts(posts, container) {
  if (!posts.length) {
    container.innerHTML = '<p class="empty">Nothing here yet. Be the first to post.</p>';
    return;
  }
  container.innerHTML = '';
  posts.forEach((post) => container.appendChild(renderPost(post)));
}

function renderPost(post) {
  const el = document.createElement('article');
  el.className = 'post-card';
  const liked = currentUser && post.likes.includes(currentUser.id);
  const isMine = currentUser && post.userId === currentUser.id;

  el.innerHTML = `
    <div class="post-head">
      <div class="avatar">${initials(post.author?.username)}</div>
      <div>
        <div class="post-author" data-user="${post.userId}">${post.author?.username || 'unknown'}</div>
        <div class="post-time">${timeAgo(post.createdAt)}</div>
      </div>
      ${isMine ? `<button class="post-delete" title="Delete post" type="button">&times;</button>` : ''}
    </div>
    <p class="post-content"></p>
    ${post.image ? `<img class="post-image" src="${post.image}" alt="">` : ''}
    <div class="post-actions">
      <button class="like-btn ${liked ? 'liked' : ''}" type="button">
        <span class="heart">&hearts;</span> <span class="like-count">${post.likesCount}</span>
      </button>
      <button class="comment-toggle" type="button">&#128172; <span>${post.commentsCount}</span></button>
    </div>
    <div class="comments-section hidden">
      <div class="comments-list"></div>
      <form class="comment-form">
        <input type="text" placeholder="Write a comment…" required>
        <button type="submit" class="btn btn-small btn-primary">Send</button>
      </form>
    </div>
  `;
  el.querySelector('.post-content').textContent = post.content;

  el.querySelector('.post-author').addEventListener('click', () => {
    document.querySelector('[data-view="profile"]').click();
    loadProfile(post.userId);
  });

  el.querySelector('.like-btn').addEventListener('click', async (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const currentlyLiked = btn.classList.contains('liked');
    try {
      const updated = currentlyLiked
        ? await api(`/posts/${post.id}/unlike`, { method: 'POST' })
        : await api(`/posts/${post.id}/like`, { method: 'POST' });
      btn.classList.toggle('liked');
      btn.querySelector('.like-count').textContent = updated.likesCount;
      post.likes = updated.likes;
    } catch (err) {
      showToast(err.message, true);
    }
  });

  const commentsSection = el.querySelector('.comments-section');
  el.querySelector('.comment-toggle').addEventListener('click', async () => {
    commentsSection.classList.toggle('hidden');
    if (!commentsSection.classList.contains('hidden')) {
      await loadComments(post.id, commentsSection.querySelector('.comments-list'));
    }
  });

  el.querySelector('.comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    try {
      await api(`/comments/post/${post.id}`, { method: 'POST', body: JSON.stringify({ text }) });
      input.value = '';
      await loadComments(post.id, commentsSection.querySelector('.comments-list'));
      const countEl = el.querySelector('.comment-toggle span');
      countEl.textContent = parseInt(countEl.textContent, 10) + 1;
    } catch (err) {
      showToast(err.message, true);
    }
  });

  const delBtn = el.querySelector('.post-delete');
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!confirm('Delete this post?')) return;
      try {
        await api(`/posts/${post.id}`, { method: 'DELETE' });
        el.remove();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  return el;
}

async function loadComments(postId, container) {
  container.innerHTML = '<p class="empty small">Loading…</p>';
  try {
    const comments = await api(`/comments/post/${postId}`);
    if (!comments.length) {
      container.innerHTML = '<p class="empty small">No comments yet.</p>';
      return;
    }
    container.innerHTML = '';
    comments.forEach((c) => {
      const cEl = document.createElement('div');
      cEl.className = 'comment';
      cEl.innerHTML = `<span class="comment-author">${c.author?.username || 'unknown'}</span><span class="comment-text"></span>`;
      cEl.querySelector('.comment-text').textContent = c.text;
      container.appendChild(cEl);
    });
  } catch (err) {
    container.innerHTML = `<p class="empty small">Couldn't load comments.</p>`;
  }
}

document.getElementById('post-submit').addEventListener('click', async () => {
  const contentEl = document.getElementById('post-content');
  const imageEl = document.getElementById('post-image');
  const content = contentEl.value.trim();
  if (!content) return showToast('Write something first', true);
  try {
    await api('/posts', { method: 'POST', body: JSON.stringify({ content, image: imageEl.value.trim() || null }) });
    contentEl.value = '';
    imageEl.value = '';
    document.querySelector('.feed-tab[data-feed="all"]').click();
  } catch (err) {
    showToast(err.message, true);
  }
});

/* ============ PROFILE ============ */
async function loadProfile(userId) {
  const header = document.getElementById('profile-header');
  header.innerHTML = '<p class="empty">Loading…</p>';
  try {
    const user = await api(`/users/${userId}`);
    const isMine = currentUser.id === user.id;
    let followBtnHtml = '';
    if (!isMine) {
      const { isFollowing } = await api(`/users/${userId}/is-following`);
      followBtnHtml = `<button class="btn ${isFollowing ? 'btn-ghost' : 'btn-primary'}" id="follow-btn" data-following="${isFollowing}" type="button">${isFollowing ? 'Following' : 'Follow'}</button>`;
    }
    header.innerHTML = `
      <div class="avatar avatar-lg">${initials(user.username)}</div>
      <h2>${user.username}</h2>
      <p class="bio"></p>
      <div class="stats">
        <div><strong>${user.postsCount}</strong> posts</div>
        <div><strong>${user.followers}</strong> followers</div>
        <div><strong>${user.following}</strong> following</div>
      </div>
      ${followBtnHtml}
    `;
    header.querySelector('.bio').textContent = user.bio || 'No bio yet.';

    const followBtn = document.getElementById('follow-btn');
    if (followBtn) {
      followBtn.addEventListener('click', async () => {
        const isFollowing = followBtn.dataset.following === 'true';
        try {
          await api(`/users/${userId}/${isFollowing ? 'unfollow' : 'follow'}`, { method: 'POST' });
          loadProfile(userId);
        } catch (err) {
          showToast(err.message, true);
        }
      });
    }

    const posts = await api(`/posts?userId=${userId}`);
    renderPosts(posts, document.getElementById('profile-posts'));
  } catch (err) {
    header.innerHTML = `<p class="empty">Couldn't load profile.</p>`;
  }
}

/* ============ PEOPLE ============ */
async function loadPeople() {
  const list = document.getElementById('people-list');
  list.innerHTML = '<p class="empty">Loading…</p>';
  try {
    const users = await api('/users');
    list.innerHTML = '';
    users.filter((u) => u.id !== currentUser.id).forEach((u) => list.appendChild(renderPersonCard(u)));
    if (!list.children.length) list.innerHTML = '<p class="empty">No other users yet.</p>';
  } catch (err) {
    list.innerHTML = `<p class="empty">Couldn't load people.</p>`;
  }
}

function renderPersonCard(user) {
  const el = document.createElement('div');
  el.className = 'person-card';
  el.innerHTML = `
    <div class="avatar">${initials(user.username)}</div>
    <div class="person-info">
      <div class="person-name">${user.username}</div>
      <div class="person-meta">${user.followers} followers</div>
    </div>
    <button class="btn btn-small btn-primary follow-toggle" type="button">Follow</button>
  `;
  el.querySelector('.person-name').addEventListener('click', () => {
    document.querySelector('[data-view="profile"]').click();
    loadProfile(user.id);
  });

  const followBtn = el.querySelector('.follow-toggle');
  api(`/users/${user.id}/is-following`)
    .then(({ isFollowing }) => {
      followBtn.textContent = isFollowing ? 'Following' : 'Follow';
      followBtn.classList.toggle('btn-ghost', isFollowing);
      followBtn.classList.toggle('btn-primary', !isFollowing);
      followBtn.dataset.following = isFollowing;
    })
    .catch(() => {});

  followBtn.addEventListener('click', async () => {
    const isFollowing = followBtn.dataset.following === 'true';
    try {
      await api(`/users/${user.id}/${isFollowing ? 'unfollow' : 'follow'}`, { method: 'POST' });
      followBtn.textContent = isFollowing ? 'Follow' : 'Following';
      followBtn.classList.toggle('btn-ghost', !isFollowing);
      followBtn.classList.toggle('btn-primary', isFollowing);
      followBtn.dataset.following = String(!isFollowing);
    } catch (err) {
      showToast(err.message, true);
    }
  });

  return el;
}

/* ============ SUGGESTIONS ============ */
async function loadSuggestions() {
  const el = document.getElementById('suggestions');
  try {
    const users = await api('/users');
    const others = users.filter((u) => u.id !== currentUser.id).slice(0, 5);
    if (!others.length) {
      el.innerHTML = '<p class="empty small">No suggestions yet.</p>';
      return;
    }
    el.innerHTML = '';
    others.forEach((u) => el.appendChild(renderPersonCard(u)));
  } catch (err) {
    el.innerHTML = '<p class="empty small">—</p>';
  }
}

/* ============ INIT ============ */
if (token && currentUser) {
  showApp();
}
