# 🎬 CineVerse — Movie Streaming Platform

A premium, feature-rich movie streaming website built with **HTML, CSS & JavaScript**. Browse trending, top-rated & upcoming movies across 18+ languages with real-time TMDB data, an embedded video player, and a glassmorphism login page.

🌐 **Live Demo:** [https://saisaran0070-source.github.io/cineverse/](https://saisaran0070-source.github.io/cineverse/)

---

## ✨ Features

### 🎥 Movie Browsing
- **Now Playing** — Currently in theaters
- **Trending** — Most popular this week
- **Top Rated** — Highest rated of all time
- **Coming Soon** — Upcoming releases
- **Genre Browsing** — 18 genres with custom icons & gradients
- **Language Filter** — Browse movies in 18+ languages (English, Hindi, Korean, Japanese, Tamil, Telugu & more)

### 🔍 Search
- Real-time movie search powered by TMDB API
- Instant results with poster art and ratings

### 🎬 Movie Player
- Built-in embedded video player
- **5 server options** — Switch servers if one doesn't work
- Subtitle language selection (14 languages)
- Fullscreen support

### 👤 User Authentication
- Beautiful glassmorphism **Login & Signup** page
- Password strength indicator
- Show/hide password toggle
- Form validation with inline errors
- User avatar & dropdown in navbar
- Logout functionality
- Data stored in localStorage (demo mode)

### 🎨 Design
- **Dark theme** with vibrant gradients
- Glassmorphism cards with backdrop blur
- Animated floating orbs background
- Hover effects & micro-animations
- Smooth scroll & page transitions
- Fully responsive (mobile, tablet, desktop)
- Google Fonts (Outfit + Inter)

---

## 🛠️ Tech Stack

| Technology | Usage |
|-----------|-------|
| **HTML5** | Page structure & semantics |
| **CSS3** | Styling, animations, glassmorphism |
| **JavaScript** | Logic, API calls, DOM manipulation |
| **TMDB API** | Movie data (posters, ratings, info) |
| **Font Awesome** | Icons |
| **Google Fonts** | Typography (Outfit, Inter) |

---

## 📁 Project Structure

```
cineverse/
├── index.html      # Main movie browsing page
├── styles.css       # Main page styles
├── app.js           # Movie logic, API, player, navigation
├── login.html       # Login & signup page
├── login.css        # Login page styles
├── login.js         # Authentication logic
└── README.md        # This file
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/saisaran0070-source/cineverse.git
cd cineverse
```

### 2. Get a TMDB API Key (Free)
1. Go to [themoviedb.org](https://www.themoviedb.org/)
2. Create a free account
3. Go to **Settings → API** and generate an API key
4. Open `app.js` and replace the API key on **line 9**:
```js
TMDB_API_KEY: 'YOUR_API_KEY_HERE',
```

### 3. Run the website
You can open `index.html` directly in a browser, or use a local server:
```bash
npx http-server . -p 8080 --cors -c-1
```
Then open **http://localhost:8080** in your browser.

---

## 📸 Screenshots

### Home Page
- Hero section with featured movie
- Horizontal scrolling movie rows
- Genre & language browsing

### Login Page
- Glassmorphism card design
- Login & signup toggle
- Password strength meter
- Social login buttons

### Movie Player
- Embedded video player
- Multiple server options
- Subtitle controls

---

## 🌐 Deployment

This project is deployed using **GitHub Pages**:

🔗 **[https://saisaran0070-source.github.io/cineverse/](https://saisaran0070-source.github.io/cineverse/)**

---

## 📄 API Reference

This project uses the **[TMDB API](https://developers.themoviedb.org/3)** for movie data:

| Endpoint | Purpose |
|----------|---------|
| `/movie/now_playing` | Currently in theaters |
| `/trending/movie/week` | Weekly trending movies |
| `/movie/top_rated` | Top rated movies |
| `/movie/upcoming` | Upcoming releases |
| `/movie/popular` | Popular movies (hero section) |
| `/discover/movie` | Filter by genre/language |
| `/search/movie` | Search movies by title |
| `/movie/{id}` | Movie details |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available for personal and educational use.

---

## 👨‍💻 Author

**Sai Saran**
- GitHub: [@saisaran0070-source](https://github.com/saisaran0070-source)

---

> ⭐ If you like this project, give it a star on GitHub!
