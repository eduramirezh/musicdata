from chalice import Chalice
from chalice import BadRequestError
from decimal import Decimal
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import boto3
from boto3.dynamodb.conditions import Key, Attr

app = Chalice(app_name='tempo_analysis')
# app.debug = True
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Tracks')
credentials_table = dynamodb.Table('Credentials')
spotify_credentials = credentials_table.get_item(Key={'service_name': 'Spotify'})['Item']
scc = SpotifyClientCredentials(client_id=spotify_credentials['client_id'],
                               client_secret=spotify_credentials['client_secret'])
spotify = spotipy.Spotify(client_credentials_manager=scc)

def batch_iteration(iterable, n=1):
    length = len(iterable)
    for ndx in range(0, length, n):
        yield iterable[ndx:min(ndx + n, length)]

def _sanitize(tracks):
    for i in range(len(tracks)):
        track = tracks[i]
        for key in track:
            if isinstance(track[key], (float, int, long, complex)):
                tracks[i][key] = str(track[key])
    return tracks


def load_from_db(artist_id):
    db_results = table.query(
        KeyConditionExpression=Key('artist_id').eq(artist_id)
        )
    if db_results['Count'] == 0:
        return False
    else:
        return db_results['Items']

def parse_tracks(tracks, artist_id):
    response = []
    durations = set()
    for track in tracks:
        artist_present = False
        artist_name = ''
        for artist in track['artists']:
            if artist['id'] == artist_id:
                artist_present = True
                artist_name = artist['name']
                break
        if not artist_present:
            continue
        duration = int(track['duration_ms'])
        if duration in durations:
            continue
        else:
            durations.add(duration)
        response.append({
            'artist_id': artist_id,
            'track_id': track['id'],
            'track_name': track['name'],
            'artist_name': artist_name,
            'duration': int(track['duration_ms']),
            'album_name': track['album_name'],
            'album_art': track['album_art']
            })
    return response

def load_from_spotify(artist_id):
    artist_uri = 'spotify:artist:' + artist_id
    try:
        results = spotify.artist_albums(artist_uri, country='US', limit=50)
    except spotipy.client.SpotifyException:
        raise BadRequestError("Invalid artist_id: %s" % (artist_id))
    albums = results['items']
    response = []
    while results['next']:
        results = spotify.next(results)
        albums.extend(results['items'])
    full_albums = []
    for albums_batch in batch_iteration(albums, 20):
        album_ids = [album['id'] for album in albums_batch]
        full_albums.extend(spotify.albums(album_ids)['albums'])
    tracks = []
    for i in range(len(full_albums)):
        album_tracks = []
        current_page = full_albums[i]['tracks']
        while len(current_page['items']) > 0:
            album_tracks.extend(current_page['items'])
            if current_page['next']:
                current_page = spotify.next(current_page)
            else:
                current_page['items'] = []
        for j in range(len(album_tracks)):
            album_tracks[j]['album_name'] = full_albums[i]['name']
            if len(full_albums[i]['images']) > 0:
                album_tracks[j]['album_art'] = full_albums[i]['images'][-1]['url']
            else:
                album_tracks[j]['album_art'] = ''
        tracks.extend(album_tracks)
    response = parse_tracks(tracks, artist_id)
    return response

def load_features_from_spotify(tracks):
    results = []
    for tracks_batch in batch_iteration(tracks, 100):
        ids = [track['track_id'] for track in tracks_batch]
        features = spotify.audio_features(ids)
        results.extend([feat for feat in features if feat is not None])
    return results


def save(tracks):
    with table.batch_writer() as batch:
        for track in tracks:
            batch.put_item(Item=track)

def update(tracks, features):
    for i in range(len(tracks)):
        track = tracks[i]
        feature = {}
        for feat in features:
            if feat['id'] == track['track_id']:
                feature = feat
                break
        track.update(feature)
        tracks[i] = track
    tracks = _sanitize(tracks)
    with table.batch_writer() as batch:
        for track in tracks:
            batch.put_item(Item=track)

@app.route('/artist/{artist_id}', cors=True)
def index(artist_id):
    tracks = load_from_db(artist_id)
    if not tracks:
        tracks_to_save = load_from_spotify(artist_id)
        save(tracks_to_save)
        tracks = load_from_db(artist_id)
    return {'tracks': tracks}

@app.route('/artist/{artist_id}/audio-features', cors=True)
def audio_features(artist_id):
    tracks = load_from_db(artist_id)
    if not tracks:
        return {'error': 'Artist not loaded'}
    #elif 'energy' not in tracks[0]:
    else:
        pending_tracks = [track for track in tracks if 'energy' not in track]
        if len(pending_tracks) > 0:
            features = load_features_from_spotify(pending_tracks)
            update(pending_tracks, features)
            tracks = load_from_db(artist_id)
    return {'tracks': tracks}
