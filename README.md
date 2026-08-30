# Libertalia

**Libertalia** is a community-driven purchase review platform where users share honest feedback on the products they buy — from fashion and home goods to beauty, electronics, and more. Named after the legendary pirate utopia and inspired by the adventurous spirit of *Uncharted 4*, Libertalia reimagines shopping as a shared journey: a place to discover what others are buying, understand emerging trends, and connect with the personalities behind each purchase.

---

## Inspiration

Libertalia draws its name and visual identity from the mythical pirate colony of Libertalia — a society built on shared resources, mutual trust, and collective discovery. The aesthetic is influenced by *Uncharted 4: A Thief's End*, with rich earthy tones, lush greens, and weathered browns evoking tropical landscapes and hidden settlements reclaimed by nature.

Beyond aesthetics, Libertalia addresses a practical community need: in an age where technology can isolate us, honest product sharing brings people closer together. By surfacing real purchases from real people, the platform helps users:

- **Discover shopping trends** across categories and communities
- **Learn from others' experiences** before making their own purchases
- **Express personality** through the items they choose to share and review
- **Build genuine connection** through follows, feeds, and shared interests

The platform also supports accessibility goals from the SYNCS HACK 2026 brief — helping users with varying levels of digital literacy find better deals, more variety, and community-curated recommendations without navigating fragmented review sites alone.

---

## Features

| Feature | Description |
|---------|-------------|
| **Registration & Login** | Secure email/password authentication with strong password validation (10+ characters, uppercase, number, symbol) |
| **Home Feed** | Scrollable feed of community posts with sticky category filters (Fashion, Home, Beauty & Skincare, Electronics & Tech) |
| **Profile** | Upload a profile picture, view follower/following counts, and manage posts in a 3-column grid |
| **Create Posts** | Share purchases with category, star rating, product image, description, favorite things, purchase link, and location |
| **Follow System** | Follow other users directly from their posts on the home feed |
| **Search** | Search posts by item name with dedicated results page |
| **Shuffle** | Discover a random post from the entire community for inspiration |
| **Location Integration** | Location autocomplete via OpenStreetMap, displayed on posts with Google Maps links |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js |
| **Web Framework** | Express.js |
| **Database** | SQLite (via `better-sqlite3`) |
| **Templating** | EJS |
| **Authentication** | `bcryptjs` + `express-session` |
| **File Uploads** | `multer` |
| **Geocoding** | OpenStreetMap Nominatim API |
| **Frontend** | HTML, CSS, vanilla JavaScript |
| **Typography** | TheBoldFont (headings), Tropikal Bold (body) |

---

## Implementation

### Architecture

Libertalia follows a classic server-rendered MVC pattern:

```
Libertalia/
├── server.js          # Express routes, auth, business logic
├── database.js        # SQLite schema & migrations
├── views/             # EJS templates
│   ├── partials/      # Reusable layout components
│   ├── home.ejs       # Home feed
│   ├── profile.ejs    # User profile & post creation
│   ├── search.ejs     # Search results
│   └── shuffle.ejs    # Random post discovery
├── public/
│   ├── css/style.css  # Earthy theme & responsive layout
│   ├── js/app.js      # Sidebar toggle, modals, location autocomplete
│   └── uploads/       # User-uploaded images
├── icons/             # Category & navigation icons
└── fonts/             # Custom typography
```

### Database Schema

- **users** — email, hashed password, display name, profile picture
- **posts** — category, title, rating, description, product image, purchase link, location
- **followers** — follower/following relationships between users

### Key Design Decisions

- **SQLite** for zero-config persistence suitable for hackathon deployment
- **Server-side rendering** for fast development and accessible, semantic HTML
- **Session-based auth** for straightforward login state management
- **Instagram-inspired sidebar** with collapsible icon navigation
- **Sticky header** with category filters on the home feed for persistent navigation while scrolling

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

```bash
git clone <repository-url>
cd Libertalia
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

1. **Register** with your name, email, and a strong password
2. **Create a post** from your profile using the + button
3. **Browse the home feed** and filter by category
4. **Search** for items by name using the sidebar search link
5. **Follow users** whose taste you admire
6. **Try Shuffle** for random inspiration

---

## Future Development

- **User profiles for others** — view any user's public profile and posts
- **Comments & likes** on posts for deeper community engagement
- **Trending page** — aggregate popular categories and highly-rated items
- **Price tracking** — optional price fields with deal alerts
- **Accessibility improvements** — screen reader optimization, high-contrast mode, simplified UI tier
- **Mobile app** — React Native or PWA wrapper for on-the-go posting
- **Recommendation engine** — suggest products based on follows and category preferences
- **Moderation tools** — report inappropriate content, admin dashboard

---

## Color Palette

| Element | Hex |
|---------|-----|
| Sidebar | `#3C280D` |
| Page background | `#2E8B57` |
| Header | `#41421C` |
| Text | `#FFFFFF` |

---

## License

Built for SYNCS HACK 2026.
