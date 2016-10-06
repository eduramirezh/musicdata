from chalice import Chalice
from chalice import BadRequestError
import spotipy
import boto3
from boto3.dynamodb.conditions import Key, Attr

app = Chalice(app_name='tempo_analysis')
spotify = spotipy.Spotify()
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Tracks')

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
        results = spotify.artist_albums(artist_uri)
    except spotipy.client.SpotifyException:
        raise BadRequestError("Invalid artist_id: %s" % (artist_id))
    albums = results['items']
    response = []
    while results['next']:
        results = spotify.next(results)
        albums.extend(results['items'])
    tracks = []
    for album in albums:
        results = spotify.album_tracks(album['id'])
        for i in range(len(results['items'])):
            results['items'][i]['album_name'] = album['name']
            results['items'][i]['album_art'] = album['images'][-1]['url']
        tracks.extend(results['items'])
        while results['next']:
            results = spotify.next(results)
            for i in range(len(results['items'])):
                results['items'][i]['album_name'] = album['name']
                results['items'][i]['album_art'] = album['images'][-1]['url']
            tracks.extend(results['items'])
    response = parse_tracks(tracks, artist_id)
    return response


def save(tracks):
    with table.batch_writer() as batch:
        for track in tracks:
            batch.put_item(Item=track)

@app.route('/artist/{artist_id}')
def index(artist_id):
    tracks = load_from_db(artist_id)
    if not tracks:
        tracks_to_save = load_from_spotify(artist_id)
        save(tracks_to_save)
        tracks = load_from_db(artist_id)
    return {'tracks': tracks}

