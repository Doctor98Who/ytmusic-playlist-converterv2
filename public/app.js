const playlistInput = document.getElementById('playlistUrl');
const extractBtn = document.getElementById('extractBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const results = document.getElementById('results');
const playlistName = document.getElementById('playlistName');
const trackCount = document.getElementById('trackCount');
const trackList = document.getElementById('trackList');
const copyAllBtn = document.getElementById('copyAllBtn');
const toast = document.getElementById('toast');

let currentTracks = [];

playlistInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') extractBtn.click();
});

extractBtn.addEventListener('click', async () => {
    const url = playlistInput.value.trim();
    if (!url) {
        showError('Please enter a playlist URL');
        return;
    }

    hideAll();
    loading.classList.remove('hidden');
    extractBtn.disabled = true;

    try {
        const res = await fetch('/api/playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Something went wrong');
        }

        currentTracks = data.tracks;
        displayResults(data);

    } catch (err) {
        showError(err.message);
    } finally {
        loading.classList.add('hidden');
        extractBtn.disabled = false;
    }
});

function displayResults(data) {
    playlistName.textContent = data.name || 'Playlist';
    trackCount.textContent = `${data.trackCount} tracks`;

    trackList.replaceChildren();

    data.tracks.forEach((track, i) => {
        const li = document.createElement('li');
        li.className = 'track';

        const thumb = document.createElement('img');
        thumb.className = 'track-thumb';
        thumb.src = track.thumbnail;
        thumb.alt = track.title;
        thumb.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'track-info';

        const title = document.createElement('div');
        title.className = 'track-title';
        title.textContent = track.title;

        const artist = document.createElement('div');
        artist.className = 'track-artist';
        artist.textContent = track.artist;

        info.appendChild(title);
        info.appendChild(artist);

        const linkDiv = document.createElement('div');
        linkDiv.className = 'track-link';

        const link = document.createElement('a');
        link.href = track.link;
        link.target = '_blank';
        link.textContent = 'Open';

        linkDiv.appendChild(link);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', () => copyLink(track.link));

        li.appendChild(thumb);
        li.appendChild(info);
        li.appendChild(linkDiv);
        li.appendChild(copyBtn);

        trackList.appendChild(li);
    });

    results.classList.remove('hidden');
}

copyAllBtn.addEventListener('click', () => {
    const allLinks = currentTracks.map(t => t.link).join('\n');
    copyToClipboard(allLinks);
});

function copyLink(link) {
    copyToClipboard(link);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy');
    });
}

function showError(msg) {
    error.textContent = msg;
    error.classList.remove('hidden');
}

function hideAll() {
    error.classList.add('hidden');
    results.classList.add('hidden');
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2000);
}
