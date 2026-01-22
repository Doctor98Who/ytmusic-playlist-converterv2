#!/usr/bin/env python3
import sys
import json
import os
from ytmusicapi import YTMusic

def fetch_playlist(playlist_id):
    try:
        # Try authenticated mode first (if oauth.json exists), otherwise use base YTMusic
        oauth_path = os.path.join(os.path.dirname(__file__), 'oauth.json')
        if os.path.exists(oauth_path):
            ytmusic = YTMusic(oauth_path)
        else:
            ytmusic = YTMusic()

        playlist = ytmusic.get_playlist(playlist_id, limit=None)

        tracks = []
        for track in playlist.get('tracks', []):
            video_id = track.get('videoId')
            if not video_id:
                continue

            # Get artist name(s)
            artists = track.get('artists', [])
            artist_name = ', '.join(a.get('name', '') for a in artists if a.get('name'))

            # Get thumbnail (prefer largest)
            thumbnails = track.get('thumbnails', [])
            thumbnail = thumbnails[-1]['url'] if thumbnails else f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"

            tracks.append({
                'title': track.get('title', 'Unknown Title'),
                'artist': artist_name or 'Unknown Artist',
                'videoId': video_id,
                'thumbnail': thumbnail
            })

        result = {
            'name': playlist.get('title', 'Unknown Playlist'),
            'trackCount': len(tracks),
            'tracks': tracks
        }

        print(json.dumps(result))

    except Exception as e:
        import traceback
        error_details = {
            'error': str(e),
            'type': type(e).__name__,
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error_details), file=sys.stderr)
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Playlist ID required'}))
        sys.exit(1)

    playlist_id = sys.argv[1]
    fetch_playlist(playlist_id)
