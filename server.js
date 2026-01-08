const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const INVIDIOUS_INSTANCES = [
    'https://inv.nadeko.net',
    'https://vid.puffyan.us',
    'https://invidious.nerdvpn.de',
    'https://yt.artemislena.eu'
];

function generateShareId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function extractPlaylistId(input) {
    if (input.includes('list=')) {
        const match = input.match(/list=([^&]+)/);
        return match ? match[1] : null;
    }
    return input;
}

async function fetchFromInvidious(playlistId) {
    let lastError;

    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const url = `${instance}/api/v1/playlists/${playlistId}`;
            console.log('[invidious] Trying:', url);

            const resp = await axios.get(url, {
                timeout: 20000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                }
            });

            const data = resp.data;

            if (!data.videos || data.videos.length === 0) {
                throw new Error('No videos found');
            }

            console.log('[invidious] Got', data.videos.length, 'tracks from', instance);

            const tracks = data.videos.map(v => ({
                title: v.title,
                artist: v.author,
                videoId: v.videoId,
                link: `https://music.youtube.com/watch?v=${v.videoId}&si=${generateShareId()}`,
                thumbnail: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`
            }));

            return {
                name: data.title || data.subtitle || 'Playlist',
                trackCount: tracks.length,
                tracks
            };
        } catch (err) {
            console.log('[invidious] Failed:', instance, '-', err.message);
            lastError = err;
        }
    }

    throw lastError || new Error('All instances failed');
}

app.post('/api/playlist', async (req, res) => {
    try {
        const { url } = req.body;
        console.log('\n[request] URL:', url);

        if (!url) return res.status(400).json({ error: 'No URL provided' });

        const playlistId = extractPlaylistId(url);
        console.log('[request] playlistId:', playlistId);

        if (!playlistId) return res.status(400).json({ error: 'Invalid URL' });

        const playlist = await fetchFromInvidious(playlistId);
        res.json(playlist);

    } catch (err) {
        console.error('[error]', err.message);
        res.status(500).json({ error: 'Failed to fetch playlist. Try again.' });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
