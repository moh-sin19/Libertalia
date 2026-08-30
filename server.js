const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const imageFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  cb(null, ext && mime);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const CATEGORIES = [
  'Fashion',
  'Home',
  'Beauty and Skincare',
  'Electronics and Tech',
];

const CATEGORY_ICONS = {
  Fashion: 'clothes-hanger.png',
  Home: 'furniture.png',
  'Beauty and Skincare': 'makeup.png',
  'Electronics and Tech': 'cpu.png',
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: 'libertalia-hackathon-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function redirectIfAuth(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/');
  }
  next();
}

function validatePassword(password) {
  const errors = [];
  if (password.length <= 9) {
    errors.push('Password must be more than 9 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase character');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least 1 symbol');
  }
  return errors;
}

function getFollowerCount(userId) {
  return db.prepare('SELECT COUNT(*) as count FROM followers WHERE following_id = ?').get(userId).count;
}

function getFollowingCount(userId) {
  return db.prepare('SELECT COUNT(*) as count FROM followers WHERE follower_id = ?').get(userId).count;
}

function getUserById(userId) {
  return db
    .prepare('SELECT id, email, name, profile_picture, created_at FROM users WHERE id = ?')
    .get(userId);
}

function getFollowingSet(userId) {
  const rows = db.prepare('SELECT following_id FROM followers WHERE follower_id = ?').all(userId);
  return new Set(rows.map((r) => r.following_id));
}

function deletePostImage(imagePath) {
  if (!imagePath) return;
  const fullPath = path.join(__dirname, 'public', imagePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
}

function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= rating ? '★' : '☆';
  }
  return html;
}

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || 'home.png';
}

function mapsUrl(location) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

app.locals.categories = CATEGORIES;
app.locals.categoryIcons = CATEGORY_ICONS;
app.locals.renderStars = renderStars;
app.locals.getCategoryIcon = getCategoryIcon;
app.locals.mapsUrl = mapsUrl;

app.get('/', requireAuth, (req, res) => {
  const { category } = req.query;
  let posts;
  let activeFilter = category || 'all';

  if (category && CATEGORIES.includes(category)) {
    posts = db
      .prepare(
        `SELECT p.*, u.id as author_id, u.name, u.profile_picture
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE p.category = ?
         ORDER BY p.created_at DESC`
      )
      .all(category);
  } else {
    activeFilter = 'all';
    posts = db
      .prepare(
        `SELECT p.*, u.id as author_id, u.name, u.profile_picture
         FROM posts p
         JOIN users u ON p.user_id = u.id
         ORDER BY p.created_at DESC`
      )
      .all();
  }

  const followingSet = getFollowingSet(req.session.userId);
  posts = posts.map((post) => ({
    ...post,
    isFollowing: followingSet.has(post.author_id),
    isOwnPost: post.author_id === req.session.userId,
  }));

  res.render('home', {
    user: getUserById(req.session.userId),
    posts,
    title: 'Home',
    activeFilter,
    currentUserId: req.session.userId,
    showFeedFilters: true,
  });
});

app.get('/search', requireAuth, (req, res) => {
  const query = (req.query.q || '').trim();
  let posts = [];

  if (query) {
    posts = db
      .prepare(
        `SELECT p.*, u.id as author_id, u.name, u.profile_picture
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE LOWER(p.title) LIKE LOWER(?)
         ORDER BY p.created_at DESC`
      )
      .all(`%${query}%`);
  }

  const followingSet = getFollowingSet(req.session.userId);
  posts = posts.map((post) => ({
    ...post,
    isFollowing: followingSet.has(post.author_id),
    isOwnPost: post.author_id === req.session.userId,
  }));

  res.render('search', {
    user: getUserById(req.session.userId),
    posts,
    query,
    title: 'Search',
    currentUserId: req.session.userId,
  });
});

app.get('/shuffle', requireAuth, (req, res) => {
  const post = db
    .prepare(
      `SELECT p.*, u.id as author_id, u.name, u.profile_picture
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY RANDOM()
       LIMIT 1`
    )
    .get();

  const followingSet = getFollowingSet(req.session.userId);
  const enrichedPost = post
    ? {
        ...post,
        isFollowing: followingSet.has(post.author_id),
        isOwnPost: post.author_id === req.session.userId,
      }
    : null;

  res.render('shuffle', {
    user: getUserById(req.session.userId),
    post: enrichedPost,
    title: 'Shuffle',
    currentUserId: req.session.userId,
  });
});

app.get('/register', redirectIfAuth, (_req, res) => {
  res.render('register', { title: 'Register', errors: [], email: '', name: '' });
});

app.post('/register', redirectIfAuth, async (req, res) => {
  const { email, password, confirmPassword, name } = req.body;
  const errors = [];

  if (!name || !name.trim()) {
    errors.push('Please enter your name');
  }

  if (!email || !email.includes('@')) {
    errors.push('Please enter a valid email address');
  }

  const passwordErrors = validatePassword(password || '');
  errors.push(...passwordErrors);

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (errors.length === 0) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      errors.push('An account with this email already exists');
    }
  }

  if (errors.length > 0) {
    return res.render('register', {
      title: 'Register',
      errors,
      email: email || '',
      name: name || '',
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
    .run(email, passwordHash, name.trim());
  req.session.userId = result.lastInsertRowid;
  res.redirect('/');
});

app.get('/login', redirectIfAuth, (_req, res) => {
  res.render('login', { title: 'Login', error: null, email: '' });
});

app.post('/login', redirectIfAuth, async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.render('login', {
      title: 'Login',
      error: 'Invalid email or password',
      email: email || '',
    });
  }

  req.session.userId = user.id;
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/profile', requireAuth, (req, res) => {
  const user = getUserById(req.session.userId);
  const posts = db
    .prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.session.userId);

  res.render('profile', {
    user,
    posts,
    title: 'Profile',
    followerCount: getFollowerCount(req.session.userId),
    followingCount: getFollowingCount(req.session.userId),
    success: req.query.success || null,
    error: req.query.error || null,
    currentUserId: req.session.userId,
  });
});

app.post('/profile/picture', requireAuth, upload.single('profilePicture'), (req, res) => {
  if (!req.file) {
    return res.redirect('/profile?error=' + encodeURIComponent('Please select a valid image file'));
  }

  const user = getUserById(req.session.userId);
  if (user.profile_picture) {
    const oldPath = path.join(__dirname, 'public', user.profile_picture);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const picturePath = '/uploads/' + req.file.filename;
  db.prepare('UPDATE users SET profile_picture = ? WHERE id = ?').run(picturePath, req.session.userId);
  res.redirect('/profile?success=' + encodeURIComponent('Profile picture updated!'));
});

app.post('/posts', requireAuth, upload.single('productImage'), (req, res) => {
  const { category, title, description, favorite_things, rating, purchase_link, location } = req.body;

  if (!category || !title || !rating) {
    return res.redirect('/profile?error=' + encodeURIComponent('Category, item name, and rating are required'));
  }

  if (!req.file) {
    return res.redirect('/profile?error=' + encodeURIComponent('A product image is required'));
  }

  if (!CATEGORIES.includes(category)) {
    return res.redirect('/profile?error=' + encodeURIComponent('Invalid category selected'));
  }

  const ratingNum = parseInt(rating, 10);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.redirect('/profile?error=' + encodeURIComponent('Rating must be between 1 and 5'));
  }

  const productImage = '/uploads/' + req.file.filename;

  db.prepare(
    `INSERT INTO posts (user_id, category, title, description, favorite_things, rating, product_image, purchase_link, location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.session.userId,
    category,
    title,
    description || '',
    favorite_things || '',
    ratingNum,
    productImage,
    purchase_link || '',
    location || ''
  );

  res.redirect('/profile?success=' + encodeURIComponent('Post published successfully!'));
});

app.post('/follow/:userId', requireAuth, (req, res) => {
  const targetId = parseInt(req.params.userId, 10);
  const followerId = req.session.userId;

  if (isNaN(targetId) || targetId === followerId) {
    return res.redirect(req.get('Referer') || '/');
  }

  const target = getUserById(targetId);
  if (!target) {
    return res.redirect(req.get('Referer') || '/');
  }

  db.prepare('INSERT OR IGNORE INTO followers (follower_id, following_id) VALUES (?, ?)').run(
    followerId,
    targetId
  );

  res.redirect(req.get('Referer') || '/');
});

app.post('/unfollow/:userId', requireAuth, (req, res) => {
  const targetId = parseInt(req.params.userId, 10);
  const followerId = req.session.userId;

  if (isNaN(targetId) || targetId === followerId) {
    return res.redirect(req.get('Referer') || '/');
  }

  db.prepare('DELETE FROM followers WHERE follower_id = ? AND following_id = ?').run(
    followerId,
    targetId
  );

  res.redirect(req.get('Referer') || '/');
});

app.post('/posts/:id/delete', requireAuth, (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);

  if (!post || post.user_id !== req.session.userId) {
    return res.redirect('/profile?error=' + encodeURIComponent('Post not found or unauthorized'));
  }

  deletePostImage(post.product_image);
  db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

  res.redirect('/profile?success=' + encodeURIComponent('Post deleted successfully!'));
});

app.listen(PORT, () => {
  console.log(`Libertalia running at http://localhost:${PORT}`);
});
