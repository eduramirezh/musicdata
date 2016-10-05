from chalice import Chalice
import spotipy
import boto3
from boto3.dynamodb.conditions import Key, Attr

app = Chalice(app_name='tempo_analysis')
app.debug = True
spotify = spotipy.Spotify()
dynamodb = boto3.resource('dynamodb')

def refresh_token():
    pass

def load_from_db(artist_id):
    table = dynamodb.Table('CheckedArtists')
    db_results = table.query(
        KeyConditionExpression=Key('artist_id').eq(artist_id)
        )
    if db_results['Count'] == 0:
        return False
    else:
        table = dynamodb.Table('Tracks')
        db_results = table.query(
            KeyConditionExpression=Key('artist_id').eq(artist_id)
            )
        return db_results['Items']

def parse_tracks(tracks):
    response = []
    for track in tracks:
        response.append({
            'artist_id': track['artists'][0]['id'],
            'track_id': track['id'],
            'track_name': track['name'],
            'artist_name': track['artists'][0]['name'],
            'duration': track['duration_ms']
            })
    return response

def load_from_spotify(artist_id):
    artist_uri = 'spotify:artist:' + artist_id
    results = spotify.artist_albums(artist_uri)
    albums = results['items']
    response = []
    while results['next']:
        results = spotify.next(results)
        albums.extend(results['items'])
    for album in albums:
        results = spotify.album_tracks(album['id'])
        tracks = results['items']
        while results['next']:
            results = spotify.next(results)
            tracks.extend(results['items'])
    response = parse_tracks(tracks)
    return response


def save(tracks):
    table = dynamodb.Table('Tracks')
    with table.batch_writer() as batch:
        for track in tracks:
            batch.put_item(Item=track)
    #tableputitemchecked

@app.route('/artist/{artist_id}')
def index(artist_id):
    tracks = load_from_db(artist_id)
    if not tracks:
        tracks = load_from_spotify(artist_id)
        save(tracks)
    return {'tracks': tracks}

