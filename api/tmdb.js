export default async function handler(req, res) {
    const { endpoint, ...params } = req.query;

    if (!endpoint) {
        return res.status(400).json({ error: "Missing 'endpoint' parameter" });
    }

    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_API_KEY_HERE') {
        return res.status(500).json({ error: "TMDB API key not configured on server. Please set the TMDB_API_KEY environment variable in Vercel." });
    }

    const TMDB_BASE = 'https://api.themoviedb.org/3';
    const url = new URL(`${TMDB_BASE}${endpoint}`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    
    // Pass along any other query parameters (e.g., page, sort_by, with_genres)
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            console.error(`TMDB API Error: ${response.status} for ${endpoint}`);
            return res.status(response.status).json({ error: "TMDB API request failed" });
        }
        
        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error("Serverless Function Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
