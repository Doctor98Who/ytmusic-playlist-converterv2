#!/usr/bin/env python3
import sys
import json
from ytmusicapi import YTMusic

def fetch_playlist(playlist_id):
    try:
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
        error_result = {'error': str(e)}
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Playlist ID required'}))
        sys.exit(1)

    playlist_id = sys.argv[1]
    fetch_playlist(playlist_id)
