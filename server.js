const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

async function fetchFromYTMusic(playlistId) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'fetch_playlist.py');
        const python = spawn('python', [scriptPath, playlistId]);

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        python.on('close', (code) => {
            if (code !== 0) {
                console.log('[ytmusic] Python error:', stderr);
                reject(new Error(stderr || 'Python script failed'));
                return;
            }

            try {
                const data = JSON.parse(stdout);

                if (data.error) {
                    reject(new Error(data.error));
                    return;
                }

                console.log('[ytmusic] Got', data.trackCount, 'tracks');

                // Add share links to tracks
                data.tracks = data.tracks.map(track => ({
                    ...track,
                    link: `https://music.youtube.com/watch?v=${track.videoId}&si=${generateShareId()}`
                }));

                resolve(data);
            } catch (parseErr) {
                reject(new Error('Failed to parse playlist data'));
            }
        });

        python.on('error', (err) => {
            reject(new Error(`Failed to start Python: ${err.message}`));
        });
    });
}

app.post('/api/playlist', async (req, res) => {
    try {
        const { url } = req.body;
        console.log('\n[request] URL:', url);

        if (!url) return res.status(400).json({ error: 'No URL provided' });

        const playlistId = extractPlaylistId(url);
        console.log('[request] playlistId:', playlistId);

        if (!playlistId) return res.status(400).json({ error: 'Invalid URL' });

        const playlist = await fetchFromYTMusic(playlistId);
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
