/* ============================================
   CineVerse — App Logic
   TMDB API + Embedded Movie Player
   ============================================ */
// Global Firebase variables are provided by firebase.js

const CONFIG = {
    // TMDB API requests are now routed securely through our Vercel Serverless Function (/api/tmdb)
    TMDB_BASE: 'https://api.tmdb.org/3',
    IMG_BASE: 'https://image.tmdb.org/t/p',
    EMBED_SERVERS: [
        // Primary: AutoEmbed (Highly reliable, bypasses ISP/Defender blocks)
        (id) => `https://autoembed.co/movie/tmdb/${id}`,
        // Secondary: Vidsrc.pm (Unblocked regional mirror)
        (id) => `https://vidsrc.pm/embed/movie?tmdb=${id}`,
        // Tertiary: Vidsrc.me 
        (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
        // Quaternary: SuperEmbed Stream
        (id) => `https://superembed.stream/movie?tmdb=${id}`,
        // Fifth: Vidsrc.to 
        (id) => `https://vidsrc.to/embed/movie/${id}`,
        // Sixth: Vidsrc Pro
        (id) => `https://vidsrc.pro/embed/movie/${id}`,
        // Seventh: Embed.su
        (id) => `https://embed.su/embed/movie/${id}`
    ]
};

// Genre map with icons and gradients
const GENRE_MAP = {
    28: { name: 'Action', icon: '💥', gradient: 'linear-gradient(135deg, #ff416c, #ff4b2b)' },
    12: { name: 'Adventure', icon: '🗺️', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
    16: { name: 'Animation', icon: '🎨', gradient: 'linear-gradient(135deg, #a8ff78, #78ffd6)' },
    35: { name: 'Comedy', icon: '😂', gradient: 'linear-gradient(135deg, #ffd700, #ff6b35)' },
    80: { name: 'Crime', icon: '🔫', gradient: 'linear-gradient(135deg, #434343, #000000)' },
    99: { name: 'Documentary', icon: '📹', gradient: 'linear-gradient(135deg, #2193b0, #6dd5ed)' },
    18: { name: 'Drama', icon: '🎭', gradient: 'linear-gradient(135deg, #e44d26, #f16529)' },
    10751: { name: 'Family', icon: '👨‍👩‍👧‍👦', gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
    14: { name: 'Fantasy', icon: '🧙', gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)' },
    36: { name: 'History', icon: '📜', gradient: 'linear-gradient(135deg, #c79081, #dfa579)' },
    27: { name: 'Horror', icon: '👻', gradient: 'linear-gradient(135deg, #1a1a2e, #e94560)' },
    10402: { name: 'Music', icon: '🎵', gradient: 'linear-gradient(135deg, #fc466b, #3f5efb)' },
    9648: { name: 'Mystery', icon: '🔍', gradient: 'linear-gradient(135deg, #0f0c29, #302b63)' },
    10749: { name: 'Romance', icon: '❤️', gradient: 'linear-gradient(135deg, #ff3cac, #784ba0)' },
    878: { name: 'Sci-Fi', icon: '🚀', gradient: 'linear-gradient(135deg, #00f5d4, #2b86c5)' },
    53: { name: 'Thriller', icon: '😱', gradient: 'linear-gradient(135deg, #141e30, #243b55)' },
    10752: { name: 'War', icon: '⚔️', gradient: 'linear-gradient(135deg, #3e5151, #decba4)' },
    37: { name: 'Western', icon: '🤠', gradient: 'linear-gradient(135deg, #c79081, #734b20)' },
};

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
];

// =============================================================
// Generate an SVG poster placeholder that looks like a real poster
// =============================================================
function escapeXml(unsafe) {
    return (unsafe || 'Movie').replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function generatePosterSvg(title, color1, color2) {
    const c1 = color1 || '#ff3cac';
    const c2 = color2 || '#784ba0';
    const escaped = escapeXml(title);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='750' viewBox='0 0 500 750'>
      <defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='${c1}'/><stop offset='100%' stop-color='${c2}'/></linearGradient></defs>
      <rect width='500' height='750' fill='url(#g)'/>
      <text x='250' y='340' font-family='Arial,sans-serif' font-size='36' fill='white' text-anchor='middle' font-weight='bold'>${escaped}</text>
      <text x='250' y='400' font-family='Arial,sans-serif' font-size='50' fill='rgba(255,255,255,0.3)' text-anchor='middle'>🎬</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function generateBackdropSvg(title, color1, color2) {
    const c1 = color1 || '#0a0a1a';
    const c2 = color2 || '#1a1a3e';
    const escaped = escapeXml(title);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'>
      <defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='${c1}'/><stop offset='100%' stop-color='${c2}'/></linearGradient></defs>
      <rect width='1920' height='1080' fill='url(#g)'/>
      <text x='960' y='540' font-family='Arial,sans-serif' font-size='60' fill='rgba(255,255,255,0.15)' text-anchor='middle' font-weight='bold'>${escaped}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// === Sample Data with gradient colors for posters ===
const SAMPLE_MOVIES_RAW = [
    { id: 912649, title: "Venom: The Last Dance", overview: "Eddie and Venom are on the run. Hunted by both of their worlds and with the net closing in, the duo are forced into a devastating decision that will bring the curtains down on Venom and Eddie's last dance.", vote_average: 6.4, release_date: "2024-10-22", original_language: "en", genre_ids: [878, 28, 12], popularity: 5800, vote_count: 2100, original_title: "Venom: The Last Dance", colors: ['#1a1a2e', '#e94560'] },
    { id: 1184918, title: "The Wild Robot", overview: "After a shipwreck, an intelligent robot called Roz is stranded on an uninhabited island. To survive the harsh environment, Roz bonds with the island's animals and cares for an orphaned baby goose.", vote_average: 8.5, release_date: "2024-09-12", original_language: "en", genre_ids: [16, 878, 10751], popularity: 4200, vote_count: 3500, original_title: "The Wild Robot", colors: ['#a8ff78', '#78ffd6'] },
    { id: 533535, title: "Deadpool & Wolverine", overview: "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit up again.", vote_average: 7.7, release_date: "2024-07-24", original_language: "en", genre_ids: [28, 35, 878], popularity: 5500, vote_count: 5200, original_title: "Deadpool & Wolverine", colors: ['#e74c3c', '#c0392b'] },
    { id: 698687, title: "Transformers One", overview: "The untold origin story of Optimus Prime and Megatron, better known as sworn enemies, but once were friends bonded like brothers who changed the fate of Cybertron forever.", vote_average: 8.1, release_date: "2024-09-11", original_language: "en", genre_ids: [16, 878, 28, 12], popularity: 3100, vote_count: 1200, original_title: "Transformers One", colors: ['#2b86c5', '#00f5d4'] },
    { id: 1100782, title: "Smile 2", overview: "About to embark on a new world tour, global pop sensation Skye Riley begins experiencing increasingly terrifying and inexplicable events.", vote_average: 6.8, release_date: "2024-10-16", original_language: "en", genre_ids: [27, 53], popularity: 2900, vote_count: 900, original_title: "Smile 2", colors: ['#f72585', '#b5179e'] },
    { id: 945961, title: "Alien: Romulus", overview: "While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.", vote_average: 7.2, release_date: "2024-08-13", original_language: "en", genre_ids: [27, 878], popularity: 3500, vote_count: 2800, original_title: "Alien: Romulus", colors: ['#141e30', '#243b55'] },
    { id: 823464, title: "Godzilla x Kong", overview: "Following their fight against Mechagodzilla, Godzilla and Kong are faced with a colossal undiscovered threat hidden within our world, challenging their very existence.", vote_average: 7.1, release_date: "2024-03-27", original_language: "en", genre_ids: [28, 878, 12], popularity: 4800, vote_count: 4100, original_title: "Godzilla x Kong: The New Empire", colors: ['#ff6b35', '#f72585'] },
    { id: 786892, title: "Furiosa: A Mad Max Saga", overview: "As the world fell, young Furiosa is snatched from the Green Place of Many Mothers and falls into the hands of a great Biker Horde led by the Warlord Dementus.", vote_average: 7.6, release_date: "2024-05-22", original_language: "en", genre_ids: [28, 12, 878], popularity: 2600, vote_count: 3200, original_title: "Furiosa: A Mad Max Saga", colors: ['#c79081', '#734b20'] },
    { id: 573435, title: "Bad Boys: Ride or Die", overview: "After their late captain is accused of being dirty, detectives Mike Lowrey and Marcus Burnett set out to investigate and clear his name.", vote_average: 7.2, release_date: "2024-06-05", original_language: "en", genre_ids: [28, 35, 80], popularity: 3200, vote_count: 2100, original_title: "Bad Boys: Ride or Die", colors: ['#0f0c29', '#302b63'] },
    { id: 1011985, title: "Kung Fu Panda 4", overview: "Po is gearing up to become the spiritual leader of his Valley of Peace, but also needs someone to take his place as Dragon Warrior.", vote_average: 7.1, release_date: "2024-03-02", original_language: "en", genre_ids: [16, 28, 35, 10751], popularity: 2800, vote_count: 2900, original_title: "Kung Fu Panda 4", colors: ['#ffd700', '#ff6b35'] },
    { id: 693134, title: "Dune: Part Two", overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.", vote_average: 8.2, release_date: "2024-02-27", original_language: "en", genre_ids: [878, 12], popularity: 5100, vote_count: 5800, original_title: "Dune: Part Two", colors: ['#c79081', '#dfa579'] },
    { id: 1022789, title: "Inside Out 2", overview: "Teenager Riley's mind headquarters is undergoing a sudden demolition to make room for new emotions: Anxiety, Envy, Ennui and Embarrassment.", vote_average: 7.6, release_date: "2024-06-11", original_language: "en", genre_ids: [16, 10751, 12, 35], popularity: 6200, vote_count: 4500, original_title: "Inside Out 2", colors: ['#8b5cf6', '#a855f7'] },
    { id: 929590, title: "Civil War", overview: "In the near future, a group of war journalists attempt to survive while reporting the truth as the United States stands on the brink of civil war.", vote_average: 7.0, release_date: "2024-04-10", original_language: "en", genre_ids: [28, 18, 53], popularity: 2400, vote_count: 1600, original_title: "Civil War", colors: ['#3e5151', '#decba4'] },
    { id: 653346, title: "Kingdom of the Planet of the Apes", overview: "Several generations in the future following Caesar's reign, apes are now the dominant species and live harmoniously while humans have been reduced to living in the shadows.", vote_average: 7.1, release_date: "2024-05-08", original_language: "en", genre_ids: [878, 12, 28], popularity: 3600, vote_count: 2700, original_title: "Kingdom of the Planet of the Apes", colors: ['#2193b0', '#6dd5ed'] },
    { id: 519182, title: "Despicable Me 4", overview: "Gru and Lucy welcome a new member to the family, Gru Jr. However, their peaceful existence is soon threatened when criminal mastermind Maxime Le Mal emerges.", vote_average: 7.0, release_date: "2024-06-20", original_language: "en", genre_ids: [16, 35, 10751, 28], popularity: 4100, vote_count: 2300, original_title: "Despicable Me 4", colors: ['#ffd700', '#ff3cac'] },
    { id: 838209, title: "Moana 2", overview: "After receiving an unexpected call from her wayfinding ancestors, Moana journeys alongside Maui and a new crew to the far seas of Oceania.", vote_average: 7.0, release_date: "2024-11-21", original_language: "en", genre_ids: [16, 12, 10751, 35], popularity: 5400, vote_count: 1800, original_title: "Moana 2", colors: ['#00f5d4', '#2b86c5'] },
    { id: 614933, title: "Atlas", overview: "A brilliant counterterrorism analyst with a deep distrust of AI discovers it might be her only hope when a mission to capture a renegade robot goes awry.", vote_average: 6.7, release_date: "2024-05-23", original_language: "en", genre_ids: [878, 28], popularity: 2000, vote_count: 1400, original_title: "Atlas", colors: ['#434343', '#000000'] },
    { id: 748783, title: "The Garfield Movie", overview: "Garfield, the world-famous Monday-hating, lasagna-loving indoor cat, is about to have a wild outdoor adventure!", vote_average: 7.1, release_date: "2024-04-30", original_language: "en", genre_ids: [16, 35, 10751, 12], popularity: 2500, vote_count: 1100, original_title: "The Garfield Movie", colors: ['#ff6b35', '#ffd700'] },
    { id: 940551, title: "Migration", overview: "After a family of ducks decides to leave their New England pond for an adventurous trip to Jamaica, their well-laid plans quickly go awry.", vote_average: 7.4, release_date: "2023-12-06", original_language: "en", genre_ids: [16, 35, 10751, 12], popularity: 2100, vote_count: 1800, original_title: "Migration", colors: ['#f7971e', '#ffd200'] },
    { id: 1064028, title: "Abigail", overview: "A group of criminals kidnap the twelve-year-old ballerina daughter of a powerful underworld figure, only to discover the girl is not what she seems.", vote_average: 6.8, release_date: "2024-04-18", original_language: "en", genre_ids: [27, 53, 28], popularity: 1800, vote_count: 900, original_title: "Abigail", colors: ['#e94560', '#1a1a2e'] },
];

const SAMPLE_HINDI = [
    { id: 1159311, title: "Stree 2", overview: "The residents of Chanderi face a new supernatural threat as the terrifying entity Sarkata terrorizes the town. Vicky and his friends must rise to protect their community.", vote_average: 7.2, release_date: "2024-08-15", original_language: "hi", genre_ids: [27, 35], popularity: 1800, vote_count: 400, original_title: "Stree 2", colors: ['#1a1a2e', '#e94560'] },
    { id: 961268, title: "Kalki 2898 AD", overview: "In the year 2898 AD, as the world faces extinction, Ashwatthama must protect an unborn child who holds the key to humanity's salvation.", vote_average: 6.5, release_date: "2024-06-27", original_language: "hi", genre_ids: [878, 28, 14], popularity: 2100, vote_count: 300, original_title: "Kalki 2898 AD", colors: ['#8b5cf6', '#a855f7'] },
    { id: 1046090, title: "Fighter", overview: "Top-tier Indian Air Force pilots engage in high-octane aerial combat while navigating the complexities of duty, sacrifice, and camaraderie.", vote_average: 6.8, release_date: "2024-01-25", original_language: "hi", genre_ids: [28, 18], popularity: 1500, vote_count: 250, original_title: "Fighter", colors: ['#ff416c', '#ff4b2b'] },
    { id: 978796, title: "Animal", overview: "A father-son relationship tested by the harsh realities of the outside world as the son transforms into a violent, unpredictable force.", vote_average: 6.8, release_date: "2023-12-01", original_language: "hi", genre_ids: [28, 80, 18, 53], popularity: 1900, vote_count: 350, original_title: "Animal", colors: ['#141e30', '#243b55'] },
    { id: 1203236, title: "Bhool Bhulaiyaa 3", overview: "A haunted mansion, mysterious occurrences, and a witty protagonist who must unravel supernatural secrets in this spectacular horror-comedy.", vote_average: 6.3, release_date: "2024-11-01", original_language: "hi", genre_ids: [27, 35], popularity: 1200, vote_count: 200, original_title: "Bhool Bhulaiyaa 3", colors: ['#f72585', '#7209b7'] },
    { id: 1114513, title: "Crew", overview: "Three airline crew members find stolen gold and decide to sell it to pay off their debts. But things take a dangerous turn.", vote_average: 6.5, release_date: "2024-03-29", original_language: "hi", genre_ids: [35, 28], popularity: 800, vote_count: 150, original_title: "Crew", colors: ['#00f5d4', '#2b86c5'] },
    { id: 1147710, title: "Shaitaan", overview: "A family's weekend trip to the countryside takes a dark turn when a mysterious stranger enters their home and takes control using dark forces.", vote_average: 7.0, release_date: "2024-03-08", original_language: "hi", genre_ids: [27, 53], popularity: 900, vote_count: 180, original_title: "Shaitaan", colors: ['#434343', '#000000'] },
    { id: 1088004, title: "Teri Baaton Mein Aisa Uljha Jiya", overview: "A robotics engineer falls in love with a sophisticated humanoid robot in this heartfelt romantic comedy about love and technology.", vote_average: 6.0, release_date: "2024-02-09", original_language: "hi", genre_ids: [35, 10749, 878], popularity: 700, vote_count: 120, original_title: "TBMAUJ", colors: ['#ff3cac', '#784ba0'] },
];

const SAMPLE_KOREAN = [
    { id: 1034541, title: "Exhuma", overview: "A famous feng shui master and a young shaman are hired to exhume a grave. But as they dig deeper, they unearth something far more sinister.", vote_average: 7.4, release_date: "2024-02-22", original_language: "ko", genre_ids: [27, 9648], popularity: 1600, vote_count: 500, original_title: "파묘", colors: ['#0f0c29', '#302b63'] },
    { id: 496243, title: "Parasite", overview: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.", vote_average: 8.5, release_date: "2019-05-30", original_language: "ko", genre_ids: [35, 53, 18], popularity: 3200, vote_count: 16000, original_title: "기생충", colors: ['#3e5151', '#decba4'] },
    { id: 396535, title: "Train to Busan", overview: "Martial law is declared when a mysterious viral outbreak pushes Korea into a state of emergency. Those on an express train must fight for survival.", vote_average: 7.8, release_date: "2016-07-20", original_language: "ko", genre_ids: [28, 27, 53], popularity: 2800, vote_count: 8000, original_title: "부산행", colors: ['#e74c3c', '#c0392b'] },
    { id: 587996, title: "Concrete Utopia", overview: "When an earthquake devastates Seoul, a single apartment complex remains standing. The survivors form their own community under strict rules.", vote_average: 7.0, release_date: "2023-08-09", original_language: "ko", genre_ids: [18, 53], popularity: 1100, vote_count: 400, original_title: "콘크리트 유토피아", colors: ['#2193b0', '#6dd5ed'] },
];

const SAMPLE_JAPANESE = [
    { id: 372058, title: "Your Name", overview: "High schoolers Mitsuha and Taki are complete strangers living separate lives. But one night, they suddenly switch places.", vote_average: 8.5, release_date: "2016-08-26", original_language: "ja", genre_ids: [16, 10749, 18], popularity: 3000, vote_count: 10500, original_title: "君の名は。", colors: ['#2b86c5', '#00f5d4'] },
    { id: 129, title: "Spirited Away", overview: "A young girl finds herself in a mysterious world of spirits after her parents are transformed into pigs by a witch.", vote_average: 8.5, release_date: "2001-07-20", original_language: "ja", genre_ids: [16, 10751, 14], popularity: 2900, vote_count: 15000, original_title: "千と千尋の神隠し", colors: ['#8b5cf6', '#a855f7'] },
    { id: 508883, title: "Suzume", overview: "A modern-day Japanese girl embarks on a journey across the country to close mysterious doors that are unleashing destruction upon Japan.", vote_average: 7.8, release_date: "2022-11-11", original_language: "ja", genre_ids: [16, 12, 14], popularity: 2500, vote_count: 2100, original_title: "すずめの戸締まり", colors: ['#ff3cac', '#784ba0'] },
    { id: 4935, title: "Howl's Moving Castle", overview: "When an unconfident young woman is cursed with an old body by a spiteful witch, her only chance of breaking the spell lies with a self-indulgent wizard.", vote_average: 8.4, release_date: "2004-11-19", original_language: "ja", genre_ids: [16, 14, 12], popularity: 2600, vote_count: 8500, original_title: "ハウルの動く城", colors: ['#f7971e', '#ffd200'] },
];

// Process sample movies to add poster/backdrop data URIs
function processSampleMovies(movies) {
    return movies.map(m => ({
        ...m,
        poster_path: null,           // We won't use TMDB image paths
        backdrop_path: null,
        _posterUrl: generatePosterSvg(m.title, m.colors?.[0], m.colors?.[1]),
        _backdropUrl: generateBackdropSvg(m.title, m.colors?.[0], m.colors?.[1]),
    }));
}

const SAMPLE_MOVIES = {
    popular: processSampleMovies(SAMPLE_MOVIES_RAW),
    hindi: processSampleMovies(SAMPLE_HINDI),
    korean: processSampleMovies(SAMPLE_KOREAN),
    japanese: processSampleMovies(SAMPLE_JAPANESE),
};

function getSampleMovies(category) {
    const movies = SAMPLE_MOVIES.popular;
    switch (category) {
        case 'popular': return movies;
        case 'now_playing': return movies.slice(0, 10);
        case 'trending': return [...movies].sort(() => Math.random() - 0.5).slice(0, 12);
        case 'top_rated': return [...movies].sort((a, b) => b.vote_average - a.vote_average).slice(0, 12);
        case 'upcoming': return movies.slice(10, 20);
        default: return movies;
    }
}

// === State ===
let currentServer = 0;
let currentMovieId = null;
let currentLang = '';
let heroMovies = [];
let heroIndex = 0;
let heroInterval = null;
let isUsingFallback = false;

// === DOM Elements ===
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

async function tmdbFetch(endpoint, params = {}) {
    const url = new URL(window.location.origin + '/api/tmdb');
    url.searchParams.set('endpoint', endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.ok}`);
        const data = await resp.json();
        clearTimeout(timeout);
        return data;
    } catch (e) {
        clearTimeout(timeout);
        console.warn(`TMDB fetch failed for ${endpoint}:`, e);
        return null;
    }
}

// Image URL helpers — handles both TMDB paths (from API) and our generated SVGs (from sample data)
function imgUrl(movie, size = 'w500') {
    // If movie has a custom poster URL (sample data), use it
    if (movie && movie._posterUrl) return movie._posterUrl;
    // If it's a TMDB path string
    if (typeof movie === 'string') {
        if (!movie) return generatePosterSvg('Movie');
        return `${CONFIG.IMG_BASE}/${size}${movie}`;
    }
    return generatePosterSvg('Movie');
}

function backdropUrl(movie) {
    if (movie && movie._backdropUrl) return movie._backdropUrl;
    if (typeof movie === 'string') {
        if (!movie) return generateBackdropSvg('CineVerse');
        return `${CONFIG.IMG_BASE}/original${movie}`;
    }
    return generateBackdropSvg('CineVerse');
}

// Resolve the proper image source for a movie object
function getMoviePoster(movie) {
    if (movie._posterUrl) return movie._posterUrl;
    if (movie.poster_path) return `${CONFIG.IMG_BASE}/w500${movie.poster_path}`;
    return generatePosterSvg(movie.title, '#ff3cac', '#784ba0');
}

function getMovieBackdrop(movie) {
    if (movie._backdropUrl) return movie._backdropUrl;
    if (movie.backdrop_path) return `${CONFIG.IMG_BASE}/original${movie.backdrop_path}`;
    return generateBackdropSvg(movie.title);
}


// === Create Movie Card ===
function createMovieCard(movie, index = 0) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.style.animationDelay = `${index * 0.08}s`;

    const year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const lang = movie.original_language ? movie.original_language.toUpperCase() : '';
    const posterSrc = getMoviePoster(movie);

    card.innerHTML = `
        <div class="movie-card-poster">
            <div class="glare-container"><div class="glare"></div></div>
            <img src="${posterSrc}" alt="${movie.title}" loading="lazy">
            <div class="movie-card-overlay">
                <button class="card-play-btn" data-id="${movie.id}" data-title="${movie.title}" data-year="${year}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="card-badges">
                <span class="card-rating"><i class="fas fa-star"></i> ${rating}</span>
                <span class="card-lang-badge">${lang}</span>
            </div>
        </div>
        <div class="movie-card-info">
            <h3 class="movie-card-title">${movie.title}</h3>
            <div class="movie-card-meta">
                <span class="movie-card-year">${year}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (e.target.closest('.card-play-btn')) {
            e.stopPropagation();
            openPlayer(movie.id, movie.title, year);
        } else {
            showMovieDetail(movie);
        }
    });

    // 3D Parallax Apple TV Effect
    card.addEventListener('mouseenter', () => {
        card.style.transition = 'none'; // Remove transition for instant tracking
    });

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element
        const y = e.clientY - rect.top;  // y position within the element

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -15; // Max 15deg rotation
        const rotateY = ((x - centerX) / centerX) * 15;

        // Apply 3D rotation
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        
        // Move glare opposite to mouse
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        const glare = card.querySelector('.glare');
        if (glare) {
            glare.style.transform = `translate(${glareX}%, ${glareY}%)`;
            glare.style.opacity = '1';
        }
    });

    card.addEventListener('mouseleave', () => {
        // Restore smooth transition for reset
        card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        
        const glare = card.querySelector('.glare');
        if (glare) {
            glare.style.opacity = '0';
        }
        
        // Remove inline transition after it finishes so CSS hover works again
        setTimeout(() => {
            card.style.transition = '';
        }, 500);
    });

    return card;
}

// === Skeleton Loading ===
function createSkeletons(container, count = 8) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'skeleton-card';
        container.appendChild(s);
    }
}

// === Load Movie Rows ===
async function loadNowPlaying() {
    const c = $('#nowPlayingRow');
    createSkeletons(c);
    const data = await tmdbFetch('/movie/now_playing', { page: 1 });
    const movies = data?.results || getSampleMovies('now_playing');
    c.innerHTML = '';
    movies.forEach((m, i) => c.appendChild(createMovieCard(m, i)));
}

async function loadTrending() {
    const c = $('#trendingRow');
    createSkeletons(c);
    const data = await tmdbFetch('/trending/movie/week');
    const movies = data?.results || getSampleMovies('trending');
    c.innerHTML = '';
    movies.forEach((m, i) => c.appendChild(createMovieCard(m, i)));
}

async function loadTopRated() {
    const c = $('#topRatedRow');
    createSkeletons(c);
    const data = await tmdbFetch('/movie/top_rated', { page: 1 });
    const movies = data?.results || getSampleMovies('top_rated');
    c.innerHTML = '';
    movies.forEach((m, i) => c.appendChild(createMovieCard(m, i)));
}

async function loadUpcoming() {
    const c = $('#upcomingRow');
    createSkeletons(c);
    const data = await tmdbFetch('/movie/upcoming', { page: 1 });
    const movies = data?.results || getSampleMovies('upcoming');
    c.innerHTML = '';
    movies.forEach((m, i) => c.appendChild(createMovieCard(m, i)));
}

async function loadHero(shouldScroll = true) {
    let movies = [];
    if (isUsingFallback) {
        movies = getSampleMovies('popular');
    } else {
        const data = await tmdbFetch('/movie/popular');
        movies = data?.results || getSampleMovies('popular');
    }
    
    if (movies.length > 0) {
        heroMovies = movies.slice(0, 5);
        renderHero();
        startHeroSlider();
        if (shouldScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function renderHero() {
    const slider = $('#heroSlider');
    if (!slider) return;
    slider.innerHTML = '';

    heroMovies.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = `hero-dot${i === 0 ? ' active' : ''}`;
        dot.addEventListener('click', () => {
            setHeroIndex(i);
            startHeroSlider(); // Reset timer on manual click
        });
        slider.appendChild(dot);
    });

    setHeroIndex(0);
}

function setHeroIndex(index) {
    if (!heroMovies || heroMovies.length === 0) return;
    heroIndex = index;
    const movie = heroMovies[index];
    if (!movie) return;

    const bg = getMovieBackdrop(movie);
    $('#heroBackdrop').style.backgroundImage = `url(${bg})`;
    $('#heroTitle').textContent = movie.title;
    $('#heroDescription').textContent = movie.overview
        ? movie.overview.substring(0, 200) + (movie.overview.length > 200 ? '...' : '') : '';
    
    // Safety check for meta elements
    const ratingEl = $('#heroRating');
    const yearEl = $('#heroYear');
    const langEl = $('#heroLang');
    if (ratingEl) ratingEl.textContent = movie.vote_average?.toFixed(1) || '--';
    if (yearEl) yearEl.textContent = movie.release_date?.substring(0, 4) || '----';
    if (langEl) langEl.textContent = movie.original_language?.toUpperCase() || '--';

    $$('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === index));

    const watchBtn = $('#heroWatchBtn');
    const infoBtn = $('#heroInfoBtn');
    if (watchBtn) watchBtn.onclick = () => openPlayer(movie.id, movie.title, movie.release_date?.substring(0, 4) || '');
    if (infoBtn) infoBtn.onclick = () => showMovieDetail(movie);
}

function startHeroSlider() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        heroIndex = (heroIndex + 1) % heroMovies.length;
        setHeroIndex(heroIndex);
    }, 6000);
}

// === Genre Section ===
function loadGenres() {
    const grid = $('#genreGrid');
    grid.innerHTML = '';
    Object.entries(GENRE_MAP).forEach(([id, genre]) => {
        const card = document.createElement('div');
        card.className = 'genre-card';
        card.style.setProperty('--genre-gradient', genre.gradient);
        card.innerHTML = `<span class="genre-icon">${genre.icon}</span><span class="genre-name">${genre.name}</span>`;
        card.addEventListener('click', () => loadGenreMovies(parseInt(id), genre.name));
        grid.appendChild(card);
    });
}

async function loadGenreMovies(genreId, genreName) {
    const section = $('#genreResultsSection');
    const grid = $('#genreResultsGrid');
    $('#genreResultsTitle').innerHTML = `<i class="fas fa-masks-theater"></i> ${genreName} Movies`;
    section.classList.remove('hidden');
    grid.innerHTML = '';
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const data = await tmdbFetch('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc', page: 1 });
    let movies = data?.results;
    if (!movies || movies.length === 0) {
        movies = SAMPLE_MOVIES.popular.filter(m => m.genre_ids?.includes(genreId));
        if (!movies || movies.length === 0) movies = SAMPLE_MOVIES.popular.slice(0, 8);
    }
    movies.forEach((m, i) => grid.appendChild(createMovieCard(m, i)));
}

// === Language Section ===
function loadLanguages() {
    const pills = $('#languagePills');
    pills.innerHTML = '';

    LANGUAGES.forEach((lang, i) => {
        const pill = document.createElement('button');
        pill.className = `lang-pill${i === 0 ? ' active' : ''}`;
        pill.innerHTML = `<span class="lang-flag">${lang.flag}</span> ${lang.name}`;
        pill.addEventListener('click', () => {
            $$('.lang-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            loadLanguageMovies(lang.code);
        });
        pills.appendChild(pill);
    });
    loadLanguageMovies(LANGUAGES[0].code);
}

async function loadLanguageMovies(langCode) {
    const c = $('#languageMovieRow');
    createSkeletons(c);

    const data = await tmdbFetch('/discover/movie', { with_original_language: langCode, sort_by: 'popularity.desc', page: 1 });

    let movies = data?.results;
    if (!movies || movies.length === 0) {
        const langKey = { hi: 'hindi', ko: 'korean', ja: 'japanese' }[langCode];
        movies = SAMPLE_MOVIES[langKey] || SAMPLE_MOVIES.popular.filter(m => m.original_language === langCode);
        if (!movies || movies.length === 0) movies = SAMPLE_MOVIES.popular.slice(0, 8);
    }
    c.innerHTML = '';
    movies.forEach((m, i) => c.appendChild(createMovieCard(m, i)));
}

// === Search ===
async function searchMovies(query) {
    if (!query.trim()) return;

    const section = $('#searchResultsSection');
    const grid = $('#searchResultsGrid');
    $('#searchResultsTitle').innerHTML = `<i class="fas fa-search"></i> Results for "${query}"`;
    section.classList.remove('hidden');
    grid.innerHTML = '';
    toggleMainSections(false);

    const data = await tmdbFetch('/search/movie', { query, page: 1 });

    if (data?.results?.length) {
        data.results.forEach((m, i) => grid.appendChild(createMovieCard(m, i)));
    } else if (!data) {
        const q = query.toLowerCase();
        const all = [...SAMPLE_MOVIES.popular, ...SAMPLE_MOVIES.hindi, ...SAMPLE_MOVIES.korean, ...SAMPLE_MOVIES.japanese];
        const results = all.filter(m => m.title.toLowerCase().includes(q) || m.overview.toLowerCase().includes(q));
        if (results.length) {
            results.forEach((m, i) => grid.appendChild(createMovieCard(m, i)));
        } else {
            grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px">No movies found in demo data. Try: "Venom", "Deadpool", "Dune", "Stree", "Parasite"</p>';
        }
    } else {
        grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px">No movies found. Try a different search term.</p>';
    }
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleMainSections(show) {
    ['#nowPlayingSection', '#trendingSection', '#topRatedSection', '#upcomingSection', '#genreSection', '#languageSection']
        .forEach(s => { const el = $(s); if (el) el.classList.toggle('hidden', !show); });
}

// === Movie Detail Modal ===
async function showMovieDetail(movie) {
    const modal = $('#detailModal');

    $('#detailBackdrop').style.backgroundImage = `url(${getMovieBackdrop(movie)})`;
    $('#detailPoster').src = getMoviePoster(movie);
    $('#detailPoster').alt = movie.title;
    $('#detailTitle').textContent = movie.title;
    $('#detailRating').innerHTML = `<i class="fas fa-star"></i> ${movie.vote_average?.toFixed(1) || 'N/A'}`;
    $('#detailYear').textContent = movie.release_date?.substring(0, 4) || 'N/A';
    $('#detailLang').textContent = movie.original_language?.toUpperCase() || '--';
    $('#detailOverview').textContent = movie.overview || 'No overview available.';
    $('#detailPopularity').textContent = movie.popularity?.toFixed(0) || '--';
    $('#detailVotes').textContent = movie.vote_count?.toLocaleString() || '--';
    $('#detailOrigTitle').textContent = movie.original_title || movie.title;

    const details = await tmdbFetch(`/movie/${movie.id}`);
    const genresContainer = $('#detailGenres');
    genresContainer.innerHTML = '';

    if (details) {
        $('#detailRuntime').textContent = details.runtime ? `${details.runtime} min` : 'N/A';
        (details.genres || []).forEach(g => {
            const tag = document.createElement('span');
            tag.className = 'detail-genre-tag'; tag.textContent = g.name;
            genresContainer.appendChild(tag);
        });
    } else {
        $('#detailRuntime').textContent = 'N/A';
        (movie.genre_ids || []).forEach(id => {
            if (GENRE_MAP[id]) {
                const tag = document.createElement('span');
                tag.className = 'detail-genre-tag'; tag.textContent = GENRE_MAP[id].name;
                genresContainer.appendChild(tag);
            }
        });
    }

    $('#detailWatchBtn').onclick = () => {
        modal.classList.remove('active');
        addToRecentlyWatched(movie);
        openPlayer(movie.id, movie.title, movie.release_date?.substring(0, 4) || '');
    };

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// === Movie Player ===
function openPlayer(movieId, title, year) {
    // Show ad-blocker tip (only once)
    const adTipShown = localStorage.getItem('cineverse_adtip');
    if (!adTipShown) {
        showAdBlockerTip(() => {
            localStorage.setItem('cineverse_adtip', 'true');
            launchPlayer(movieId, title, year);
        });
    } else {
        launchPlayer(movieId, title, year);
    }
}

function showAdBlockerTip(onContinue) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'adTipOverlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000;
        background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    overlay.innerHTML = `
        <div style="
            background: rgba(18,18,42,0.95); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px; padding: 32px; max-width: 420px; width: 90%;
            text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        ">
            <div style="font-size: 2.5rem; margin-bottom: 12px;">🛡️</div>
            <h3 style="font-family: 'Outfit',sans-serif; font-size: 1.3rem; margin-bottom: 8px; color: #fff;">
                Ad Blocker Recommended
            </h3>
            <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">
                The video player may show ads from third-party servers.
                For the best experience, install <strong style="color: #00f5d4;">uBlock Origin</strong> extension in your browser.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <a href="https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm"
                   target="_blank" style="
                    padding: 10px 20px; border-radius: 10px; font-size: 0.85rem; font-weight: 600;
                    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
                    color: #00f5d4; text-decoration: none; transition: all 0.3s;
                ">
                    <i class="fab fa-chrome" style="margin-right: 6px;"></i>Get uBlock
                </a>
                <button id="adTipContinue" style="
                    padding: 10px 24px; border-radius: 10px; font-size: 0.85rem; font-weight: 600;
                    background: linear-gradient(135deg, #ff3cac, #784ba0); border: none;
                    color: white; cursor: pointer; transition: all 0.3s;
                ">
                    Continue to Movie ▶
                </button>
            </div>
            <p style="color: rgba(255,255,255,0.3); font-size: 0.75rem; margin-top: 14px;">
                This message won't appear again
            </p>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#adTipContinue').addEventListener('click', () => {
        overlay.remove();
        onContinue();
    });
}

async function launchPlayer(movieId, title, year) {
    currentMovieId = movieId;
    currentServer = 0;
    currentLang = '';

    $('#playerTitle').textContent = title;
    $('#playerYear').textContent = year;
    $('#playerLoading').classList.remove('hidden');

    $$('.server-btn[data-server]').forEach((b, i) => b.classList.toggle('active', i === 0));
    
    const audioContainer = $('#audioTrackContainer');
    if (audioContainer) {
        audioContainer.innerHTML = '<button type="button" class="server-btn active highlight" data-lang="">Original (Auto)</button>';
        
        audioContainer.firstElementChild.addEventListener('click', function() {
            if (currentLang === '') return;
            $$('#audioTrackContainer .server-btn').forEach(b => b.classList.remove('active', 'highlight'));
            this.classList.add('active', 'highlight');
            currentLang = '';
            loadMovieStream(currentMovieId, currentServer);
            showToast('Audio set to Original');
        });
        // If we are not using fallback, load full TMDB details
        if (!isUsingFallback) {
            tmdbFetch(`/movie/${movieId}`).then(details => {
                if (details && details.spoken_languages && details.spoken_languages.length > 0) {
                    details.spoken_languages.forEach(lang => {
                        if (!lang.iso_639_1) return;
                        const btn = document.createElement('button');
                        btn.className = 'server-btn';
                        btn.dataset.lang = lang.iso_639_1;
                        btn.textContent = lang.english_name || lang.name;
                        btn.addEventListener('click', function() {
                            if (currentLang === this.dataset.lang) return;
                            $$('#audioTrackContainer .server-btn').forEach(b => b.classList.remove('active', 'highlight'));
                            this.classList.add('active', 'highlight');
                            currentLang = this.dataset.lang;
                            loadMovieStream(currentMovieId, currentServer);
                            showToast(`Audio set to ${this.textContent}`);
                        });
                        audioContainer.appendChild(btn);
                    });
                }
            });
        }
    }

    loadMovieStream(movieId, 0);

    $('#playerModal').classList.add('active');
    // Removed scroll lock to allow reaching server buttons on mobile
    // document.body.style.overflow = 'hidden';

    showToast(`Loading "${title}"...`);
}

function loadMovieStream(movieId, serverIndex) {
    const iframe = $('#moviePlayer');
    const loading = $('#playerLoading');

    loading.classList.remove('hidden');

    let embedUrl = CONFIG.EMBED_SERVERS[serverIndex](movieId);
    
    // Append language parameters for servers that support it
    if (currentLang) {
        embedUrl += embedUrl.includes('?') ? `&lang=${currentLang}&audio=${currentLang}` : `?lang=${currentLang}&audio=${currentLang}`;
    }

    iframe.src = embedUrl;
    
    // Update the "Open in New Window" link directly
    const externalBtn = $('#externalPlayBtn');
    if (externalBtn) externalBtn.href = embedUrl;

    // Show a message inside loading overlay after some time
    let loadTimeout = setTimeout(() => {
        loading.innerHTML = `
            <div class="spinner"></div>
            <p>Loading movie...</p>
            <p style="font-size:0.8rem;color:var(--text-muted);margin-top:10px">If the movie doesn't load, try switching servers below.</p>
        `;
    }, 3000);

    iframe.onload = () => {
        clearTimeout(loadTimeout);
        setTimeout(() => {
            loading.classList.add('hidden');
            loading.style.pointerEvents = 'none'; // Ensure it doesn't block clicks
        }, 1000);
    };

    iframe.onerror = () => {
        clearTimeout(loadTimeout);
        loading.style.pointerEvents = 'all'; // Re-enable for the error message
        loading.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size:2rem;color:var(--accent-gold)"></i>
            <p>Server not responding</p>
            <p style="font-size:0.8rem;color:var(--text-muted)">Try switching to a different server below</p>
        `;
    };

    // Fallback: hide loading after 8 seconds regardless
    setTimeout(() => {
        loading.classList.add('hidden');
        loading.style.pointerEvents = 'none';
    }, 8000);
}

function closePlayer() {
    const iframe = $('#moviePlayer');
    iframe.src = '';
    // Reset loading state
    const loading = $('#playerLoading');
    loading.innerHTML = '<div class="spinner"></div><p>Loading movie...</p>';

    $('#playerModal').classList.remove('active');
    document.body.style.overflow = '';
    currentMovieId = null;
}

// === Toast ===
function showToast(message) {
    const toast = $('#toast');
    $('#toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// === Navigation ===
function setupNavigation() {
    window.addEventListener('scroll', () => {
        $('#navbar').classList.toggle('scrolled', window.scrollY > 50);
        $('#scrollTopBtn').classList.toggle('visible', window.scrollY > 400);
    });

    $('#scrollTopBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    $('#mobileMenuBtn').addEventListener('click', () => $('#navLinks').classList.toggle('active'));

    $$('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            $$('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            $('#navLinks').classList.remove('active');
            handleNavSection(link.dataset.section);
        });
    });

    const searchBtn = $('#searchBtn');
    const searchContainer = $('#searchContainer');
    const searchInput = $('#searchInput');

    searchBtn.addEventListener('click', () => {
        if (searchContainer.classList.contains('active')) {
            if (searchInput.value.trim()) searchMovies(searchInput.value);
            else searchContainer.classList.remove('active');
        } else {
            searchContainer.classList.add('active');
            searchInput.focus();
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) searchMovies(searchInput.value);
    });

    $('#clearSearchBtn').addEventListener('click', () => {
        $('#searchResultsSection').classList.add('hidden');
        toggleMainSections(true);
        $('#searchInput').value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('#clearGenreBtn').addEventListener('click', () => $('#genreResultsSection').classList.add('hidden'));

    $('#playerClose').addEventListener('click', closePlayer);

    $('#detailClose').addEventListener('click', () => {
        $('#detailModal').classList.remove('active');
        document.body.style.overflow = '';
    });

    $$('.server-btn[data-server]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (currentMovieId) {
                const serverIdx = parseInt(btn.dataset.server) - 1;
                $$('.server-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentServer = serverIdx;
                loadMovieStream(currentMovieId, serverIdx);
                showToast(`Switched to Server ${serverIdx + 1}`);
            }
        });
    });

    // External link is now handled directly by the <a> tag in HTML for 100% reliability.

    $('#playerModal').addEventListener('click', (e) => { if (e.target === $('#playerModal')) closePlayer(); });

    $('#detailModal').addEventListener('click', (e) => {
        if (e.target === $('#detailModal')) {
            $('#detailModal').classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if ($('#playerModal').classList.contains('active')) closePlayer();
            if ($('#detailModal').classList.contains('active')) {
                $('#detailModal').classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });

    $$('.see-all-btn').forEach(btn => {
        btn.addEventListener('click', () => loadSeeAll(btn.dataset.category));
    });
}

function handleNavSection(section) {
    switch (section) {
        case 'home':
            window.scrollTo({ top: 0, behavior: 'smooth' });
            toggleMainSections(true);
            $('#searchResultsSection').classList.add('hidden');
            $('#genreResultsSection').classList.add('hidden');
            break;
        case 'trending': $('#trendingSection').scrollIntoView({ behavior: 'smooth' }); break;
        case 'top-rated': $('#topRatedSection').scrollIntoView({ behavior: 'smooth' }); break;
        case 'genres': $('#genreSection').scrollIntoView({ behavior: 'smooth' }); break;
        case 'languages': $('#languageSection').scrollIntoView({ behavior: 'smooth' }); break;
    }
}

async function loadSeeAll(category) {
    let endpoint = '', title = '';
    switch (category) {
        case 'now_playing': endpoint = '/movie/now_playing'; title = 'Now Playing'; break;
        case 'trending': endpoint = '/trending/movie/week'; title = 'Trending This Week'; break;
        case 'top_rated': endpoint = '/movie/top_rated'; title = 'Top Rated'; break;
        case 'upcoming': endpoint = '/movie/upcoming'; title = 'Coming Soon'; break;
    }

    const section = $('#searchResultsSection');
    const grid = $('#searchResultsGrid');
    $('#searchResultsTitle').innerHTML = `<i class="fas fa-film"></i> ${title}`;
    section.classList.remove('hidden');
    toggleMainSections(false);
    grid.innerHTML = '';

    let hasData = false;
    for (let page = 1; page <= 3; page++) {
        const data = await tmdbFetch(endpoint, { page });
        if (data?.results) {
            hasData = true;
            data.results.forEach((m, i) => grid.appendChild(createMovieCard(m, i + (page - 1) * 20)));
        }
    }
    if (!hasData) {
        getSampleMovies(category).forEach((m, i) => grid.appendChild(createMovieCard(m, i)));
    }

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// User Menu and Auth logic moved below init.

// === User Menu (Auth) ===
function setupUserMenu() {
    const loginBtn = $('#loginNavBtn');
    const userProfile = $('#userProfile');
    const userAvatarBtn = $('#userAvatarBtn');
    const userDropdown = $('#userDropdown');

    // Toggle dropdown
    if (userAvatarBtn) {
        userAvatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.contains(e.target) && !userAvatarBtn.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });

    // Logout
    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                showToast('Logged out successfully');
                setTimeout(() => window.location.reload(), 800);
            });
        });
    }

    // Firebase Auth Observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Logged in — reveal website, show avatar, hide login button
            document.body.style.opacity = '1';
            loadRecentlyWatched();
            if (loginBtn) loginBtn.style.display = 'none';
            if (userProfile) {
                userProfile.style.display = 'block';
                const nameStr = user.displayName || user.email?.split('@')[0] || 'User';
                const init = nameStr.charAt(0).toUpperCase();
                $('#userAvatar').textContent = init;
                $('#dropdownAvatar').textContent = init;
                $('#dropdownName').textContent = nameStr;
                $('#dropdownEmail').textContent = user.email || '';
            }
        } else {
            // Not logged in — redirect to login page immediately to lock the website
            window.location.replace('login.html');
        }
    });
}

// === Website Feedback System ===
function setupFeedbackUI() {
    const openBtn = $('#openFeedbackBtn');
    const modal = $('#feedbackModal');
    const closeBtn = $('#closeFeedbackBtn');
    const successView = $('#feedbackSuccess');
    const contentView = $('.feedback-content');
    const closeSuccessBtn = $('#closeFeedbackSuccessBtn');
    const stars = $$('#starRatingContainer i');
    const submitBtn = $('#submitFeedbackBtn');
    const commentBox = $('#feedbackComment');

    let currentRating = 0;

    // Open/Close Modal
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            if (!user) {
                showToast("Please login first to rate the website.");
                return;
            }
            modal.classList.add('active');
            contentView.classList.remove('hidden');
            successView.classList.add('hidden');
            commentBox.value = '';
            currentRating = 0;
            stars.forEach(s => {
                s.classList.remove('fas', 'selected');
                s.classList.add('far');
            });
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', () => modal.classList.remove('active'));

    // Star Selection Logic
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const val = parseInt(this.getAttribute('data-value'));
            stars.forEach(s => {
                const sVal = parseInt(s.getAttribute('data-value'));
                if (sVal <= val) {
                    s.classList.replace('far', 'fas');
                    s.classList.add('hovered');
                } else {
                    s.classList.replace('fas', 'far');
                    s.classList.remove('hovered');
                }
            });
        });

        star.addEventListener('mouseout', function() {
            stars.forEach(s => {
                s.classList.remove('hovered');
                const sVal = parseInt(s.getAttribute('data-value'));
                if (sVal <= currentRating) {
                    s.classList.replace('far', 'fas');
                } else {
                    s.classList.replace('fas', 'far');
                }
            });
        });

        star.addEventListener('click', function() {
            currentRating = parseInt(this.getAttribute('data-value'));
            stars.forEach(s => {
                const sVal = parseInt(s.getAttribute('data-value'));
                if (sVal <= currentRating) {
                    s.classList.replace('far', 'fas');
                    s.classList.add('selected');
                } else {
                    s.classList.replace('fas', 'far');
                    s.classList.remove('selected');
                }
            });
        });
    });

    // Submitting Feedback
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            if (currentRating === 0) {
                showToast("Please select a star rating first.");
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                showToast("You must be logged in.");
                return;
            }

            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            try {
                if (!window.db) throw new Error("Database connection is not ready. Please refresh the page.");

                // Using standard .add() with explicit user data for security rules compatibility
                await window.db.collection("feedback").add({
                    userId: String(user.uid),
                    userName: String(user.displayName || user.email || 'Anonymous Member'),
                    rating: Number(currentRating),
                    comment: String(commentBox.value.trim()),
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                contentView.classList.add('hidden');
                successView.classList.remove('hidden');
                showToast("Perfect! Your review has been saved.");
            } catch (error) {
                console.error("Firebase Review Error: ", error);
                
                // If it's a permission error, give the user specific advice
                if (error.code === 'permission-denied') {
                    showToast("Database Locked: Please update your Firebase Rules.");
                    alert("SECURITY ALERT: Your Firebase Database rules are currently blocking reviews. \n\nPlease go to Firebase Console > Firestore > Rules and set them to 'allow write: if request.auth != null;'");
                } else {
                    showToast("Error: " + error.message);
                }
            } finally {
                submitBtn.textContent = 'Submit Feedback';
                submitBtn.disabled = false;
            }
        });
    }
}

// === Initialization ===
// === UI Helpers ===
function toggleMainSections(show) {
    const mainSections = ['#heroSection', '#nowPlayingSection', '#trendingSection', '#topRatedSection', '#upcomingSection', '#genreSection', '#languageSection'];
    mainSections.forEach(s => {
        const el = $(s);
        if (el) el.style.display = show ? 'block' : 'none';
    });
}

function handleNavSection(section) {
    section = section.toLowerCase();
    
    // Close mobile menu if open
    const sidebar = $('#sidebar');
    if (sidebar) sidebar.classList.remove('active');
    
    // Hide search results when navigating to a section
    $('#searchResultsSection').classList.add('hidden');
    toggleMainSections(true);

    switch (section) {
        case 'home': window.scrollTo({ top: 0, behavior: 'smooth' }); break;
        case 'trending': $('#trendingSection').scrollIntoView({ behavior: 'smooth' }); break;
        case 'toprated': $('#topRatedSection').scrollIntoView({ behavior: 'smooth' }); break;
        case 'genres': $('#genreSection').scrollIntoView({ behavior: 'smooth' }); break;
        case 'languages': $('#languageSection').scrollIntoView({ behavior: 'smooth' }); break;
    }
}

// === Event Listeners ===
function setupEventListeners() {
    // Search
    const searchInput = $('#searchInput');
    const searchBtn = $('#searchBtn');
    if (searchBtn && searchInput) {
        searchBtn.onclick = () => handleSearch(searchInput.value);
        searchInput.onkeypress = (e) => { if (e.key === 'Enter') handleSearch(searchInput.value); };
    }

    // Modal Close
    const closePlayerBtn = $('#closePlayerBtn');
    if (closePlayerBtn) closePlayerBtn.onclick = closePlayer;

    const closeDetailBtn = $('#closeDetailBtn');
    if (closeDetailBtn) closeDetailBtn.onclick = closeDetail;

    // Scroll to Top
    const scrollTopBtn = $('#scrollTopBtn');
    if (scrollTopBtn) {
        scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // See All Buttons
    $$('.see-all-btn').forEach(btn => {
        btn.onclick = () => {
            const cat = btn.getAttribute('data-category');
            loadSeeAll(cat);
        };
    });

    // Navigation Links
    $$('.nav-link').forEach(link => {
        link.onclick = (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = href.substring(1);
                handleNavSection(target);
            }
        };
    });

    // 3D Parallax Banner & Glassmorphism Navbar Logic
    const heroBackdrop = $('#heroBackdrop');
    const navBar = $('#navbar');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Parallax effect: move background slower than the foreground
        if (heroBackdrop && scrollY < window.innerHeight) {
            heroBackdrop.style.transform = `translateY(${scrollY * 0.4}px)`;
        }
        
        // Glassmorphism Navbar toggle
        if (navBar) {
            if (scrollY > 50) {
                navBar.classList.add('scrolled');
            } else {
                navBar.classList.remove('scrolled');
            }
        }
    }, { passive: true });
}

async function handleSearch(query) {
    if (!query.trim()) return;
    const section = $('#searchResultsSection');
    const grid = $('#searchResultsGrid');
    $('#searchResultsTitle').innerHTML = `<i class="fas fa-search"></i> Search Results for "${query}"`;
    
    section.classList.remove('hidden');
    toggleMainSections(false);
    grid.innerHTML = '';
    
    createSkeletons(grid);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const data = await tmdbFetch('/search/movie', { query: query.trim() });
    const movies = data?.results || [];
    
    grid.innerHTML = '';
    if (movies.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No movies found. Try another search!</p>';
    } else {
        movies.forEach((m, i) => grid.appendChild(createMovieCard(m, i)));
    }
}

// === Initialization ===
async function init() {
    console.log('🎬 CineVerse initializing...');
    
    // Core setups
    setupNavigation();
    setupEventListeners();
    setupUserMenu();
    setupFeedbackUI();
    
    // Check if the backend is configured with an API key
    try {
        // Verify API key with a small request to our backend
        const test = await tmdbFetch('/configuration');
        if (!test) {
            isUsingFallback = true;
        }
    } catch (e) {
        isUsingFallback = true;
    }
    loadMainContent(false); // Pass false to prevent scrolling

    if (isUsingFallback) {
        console.log('⚠️ Running locally or backend failed. Using offline sample data.');
    }

    // Dismiss cinematic loading screen after animation completes
    const cinemaLoader = document.getElementById('cinemaLoader');
    if (cinemaLoader) {
        setTimeout(() => {
            cinemaLoader.classList.add('fade-out');
            setTimeout(() => {
                cinemaLoader.remove();
            }, 600);
        }, 3500); // Give enough time for the pulsing animation to play
    }
}

function loadMainContent(shouldScroll = true) {
    loadHero(shouldScroll);
    loadNowPlaying();
    loadTrending();
    loadTopRated();
    loadUpcoming();
    loadGenres();
}

// === Notification Logic ===
function showToast(message, duration = 3000) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.style.cssText = `
            position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
            background: rgba(18, 18, 42, 0.95); color: white; padding: 12px 24px;
            border-radius: 50px; font-size: 0.9rem; font-weight: 600;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); z-index: 10000;
            border: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center;
            gap: 10px; animation: slideUpToast 0.3s ease forwards;
        `;
        document.body.appendChild(toast);

        // Add keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUpToast {
                from { bottom: 80px; opacity: 0; }
                to { bottom: 100px; opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    toast.innerHTML = `<span>✨</span> ${message}`;
    toast.style.display = 'flex';

    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}

document.addEventListener('DOMContentLoaded', init);

// === Fullscreen Logic (Surgical Addition) ===
function toggleFullscreen() {
    const container = document.querySelector('.player-container');
    if (!container) return;

    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
        if (container.requestFullscreen) container.requestFullscreen();
        else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
        else if (container.mozRequestFullScreen) container.mozRequestFullScreen();
        else if (container.msRequestFullscreen) container.msRequestFullscreen();
        
        document.getElementById('playerFullscreen').innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        
        document.getElementById('playerFullscreen').innerHTML = '<i class="fas fa-expand"></i>';
    }
}

// Add listener for the new button
document.addEventListener('click', (e) => {
    if (e.target.closest('#playerFullscreen')) {
        toggleFullscreen();
    }
});

// Update icon if fullscreen exited via ESC key
document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('playerFullscreen');
    if (btn) {
        btn.innerHTML = document.fullscreenElement ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
    }
});

// === Recently Watched Logic ===
function getRecentlyWatchedKey() {
    const uid = window.auth && window.auth.currentUser ? window.auth.currentUser.uid : 'guest';
    return `cineverse_recent_${uid}`;
}

function addToRecentlyWatched(movie) {
    if (!movie || !movie.id) return;
    const key = getRecentlyWatchedKey();
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        history = [];
    }

    // Remove if already exists (to move to front)
    history = history.filter(m => m.id !== movie.id);
    
    // Add to front
    history.unshift(movie);
    
    // Limit to 15 items
    if (history.length > 15) {
        history = history.slice(0, 15);
    }
    
    localStorage.setItem(key, JSON.stringify(history));
    loadRecentlyWatched(); // Refresh the row instantly
}

function loadRecentlyWatched() {
    const key = getRecentlyWatchedKey();
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        history = [];
    }

    const section = $('#recentlyWatchedSection');
    const row = $('#recentlyWatchedRow');
    if (!section || !row) return;

    if (history.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    row.innerHTML = '';
    history.forEach((m, i) => {
        row.appendChild(createMovieCard(m, i));
    });
}

// === App Download Banner ===
(function() {
    const banner = document.getElementById('appDownloadBanner');
    if (!banner) return;

    // Hide banner if user is already inside the installed PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || window.navigator.standalone === true;
    
    // Hide if user previously dismissed the banner
    const dismissed = localStorage.getItem('appBannerDismissed');

    if (isStandalone || dismissed) {
        banner.style.display = 'none';
        return;
    }

    // Close button
    const closeBtn = document.getElementById('closeAppBanner');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            banner.classList.add('hidden');
            localStorage.setItem('appBannerDismissed', 'true');
            setTimeout(() => banner.style.display = 'none', 300);
        });
    }
})();
