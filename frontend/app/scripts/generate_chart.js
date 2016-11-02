function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

var pitchClass = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

var defaultDataParser = function(tracks, attribute) {
  return tracks.tracks.map(function(track) {
    if (!track[attribute]) {
      return 0;
    }
    return Number(track[attribute]);
  });
};

var keyDataParser = function(tracks) {
  return tracks.tracks.map(function(track) {
    return Number(track.key) + 1;
  });
};

var modeDataParser = function(tracks) {
  return tracks.tracks.map(function(track) {
    return Number(track.mode) + 1;
  });
};

function defaultSorter(tracks, attributeName) {
  tracks.sort(function(a, b) {
    var numberA = a[attributeName] ? Number(a[attributeName]) : 0;
    var numberB = b[attributeName] ? Number(b[attributeName]) : 0;
    if (numberA < numberB) {
      return -1;
    }
    if (numberA > numberB) {
      return 1;
    }
    return 0;
  });
  return tracks;
}

var defaultTooltipLabel = function(tooltipItem) {
  return (Math.round(tooltipItem.yLabel * 10000) / 100) + '%';
};

var generators = {
  duration: {
    description: 'The duration of the track in milliseconds.',
    data: function(tracks) {
      return defaultDataParser(tracks, 'duration');
    },
    tooltipLabel: function(tooltipItem) {
      return millisToMinutesAndSeconds(tooltipItem.yLabel);
    },
    ticksCallback: function(value) {
      return millisToMinutesAndSeconds(value);
    },
    fixedStepSize: 60000,
    min: 0,
    max: undefined
  },
  energy: {
    description: 'Energy is a measure from 0.0 to 1.0 and represents a perceptual measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy. For example, death metal has high energy, while a Bach prelude scores low on the scale. Perceptual features contributing to this attribute include dynamic range, perceived loudness, timbre, onset rate, and general entropy.',
    data: function(tracks) {
      return defaultDataParser(tracks, 'energy');
    },
    tooltipLabel: defaultTooltipLabel,
    ticksCallback: function(a) {
      return (Math.round(a * 1000) / 10) + '%';
    },
    fixedStepSize: 0.1,
    min: 0,
    max: 1
  },
  speechiness: {
    description: 'Speechiness detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 1.0 the attribute value. Values above 0.66 describe tracks that are probably made entirely of spoken words. Values between 0.33 and 0.66 describe tracks that may contain both music and speech, either in sections or layered, including such cases as rap music. Values below 0.33 most likely represent music and other non-speech-like tracks.',
    data: function(tracks) {
      return defaultDataParser(tracks, 'speechiness');
    },
    tooltipLabel: defaultTooltipLabel,
    ticksCallback: function(a) {
      return (Math.round(a * 1000) / 10) + '%';
    },
    fixedStepSize: 0.1,
    min: 0,
    max: 1
  },
  acousticness: {
    description: 'A confidence measure from 0.0 to 1.0 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic.',
    data: function(tracks) {
      return defaultDataParser(tracks, 'acousticness');
    },
    tooltipLabel: defaultTooltipLabel,
    ticksCallback: function(a) {
      return (Math.round(a * 1000) / 10) + '%';
    },
    fixedStepSize: 0.1,
    min: 0,
    max: 1
  },
  danceability: {
    description: 'Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. A value of 0.0 is least danceable and 1.0 is most danceable.',
    data: function(tracks) {
      return defaultDataParser(tracks, 'danceability');
    },
    tooltipLabel: defaultTooltipLabel,
    ticksCallback: function(a) {
      return (Math.round(a * 1000) / 10) + '%';
    },
    fixedStepSize: 0.1,
    min: 0,
    max: 1
  },
  tempo: {
    description: 'The overall estimated tempo of a track in beats per minute (BPM). In musical terminology, tempo is the speed or pace of a given piece and derives directly from the average beat duration.',
    data: function(tracks) {
      return defaultDataParser(tracks, 'tempo');
    },
    tooltipLabel: function(tooltipItem) {
      return (Math.round(tooltipItem.yLabel * 10) / 10) + 'bpm';
    },
    ticksCallback: function(a) {
      return a;
    },
    fixedStepSize: 10,
    min: 0,
    max: 210
  },
  instrumentalness: {
    description: 'Predicts whether a track contains no vocals. "Ooh" and "aah" sounds are treated as instrumental in this context. Rap or spoken word tracks are clearly "vocal". The closer the instrumentalness value is to 1.0, the greater likelihood the track contains no vocal content. Values above 0.5 are intended to represent instrumental tracks, but confidence is higher as the value approaches 1.0.',
    data: function(tracks) {
      return defaultDataParser(tracks, 'instrumentalness');
    },
    tooltipLabel: defaultTooltipLabel,
    ticksCallback: function(a) {
      return (Math.round(a * 1000) / 10) + '%';
    },
    fixedStepSize: 0.1,
    min: 0,
    max: 1
  },
  key: {
    description: 'The key the track is in. Integers map to pitches using standard Pitch Class notation. E.g. 0 = C, 1 = C♯/D♭, 2 = D, and so on.',
    data: function(tracks) {
      return keyDataParser(tracks);
    },
    tooltipLabel: function(tooltipItem) {
      return pitchClass[tooltipItem.yLabel - 1];
    },
    ticksCallback: function(a) {
      return pitchClass[a - 1];
    },
    fixedStepSize: 1
  },
  liveness: {
    description: 'Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live. A value above 0.8 provides strong likelihood that the track is live.',
    data: function(tracks) {
      return defaultDataParser(tracks, 'liveness');
    },
    tooltipLabel: defaultTooltipLabel,
    ticksCallback: function(a) {
      return (Math.round(a * 1000) / 10) + '%';
    },
    fixedStepSize: 0.1,
    min: 0,
    max: 1
  },
  mode: {
    description: 'Mode indicates the modality (major or minor) of a track, the type of scale from which its melodic content is derived. Major is represented by 1 and minor is 0.',
    data: function(tracks) {
      return modeDataParser(tracks);
    },
    tooltipLabel: defaultTooltipLabel,
    ticksCallback: function(a) {
      return a === 1 ? 'Minor' : 'Major';
    },
    fixedStepSize: 1
  },
  time_signature: {
    description: 'An estimated overall time signature of a track. The time signature (meter) is a notational convention to specify how many beats are in each bar (or measure).',
    data: function(tracks) {
      return defaultDataParser(tracks, 'time_signature');
    },
    tooltipLabel: defaultTooltipLabel,
    ticksCallback: function(a) {
      return a + '/4';
    },
    fixedStepSize: 1
  },
  loudness: {
    description: 'The overall loudness of a track in decibels (dB). Loudness values are averaged across the entire track and are useful for comparing relative loudness of tracks. Loudness is the quality of a sound that is the primary psychological correlate of physical strength (amplitude). Values typical range between -60 and 0 db.',
    data: function(tracks) {
      return defaultDataParser(tracks, 'loudness');
    },
    tooltipLabel: function(tooltipItem) {
      return (Math.round(tooltipItem.yLabel * 10) / 10) + 'db';
    },
    ticksCallback: function(a) {
      return a;
    },
    fixedStepSize: 10
  },
  valence: {
    description: 'A measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry).',
    data: function(tracks) {
      return defaultDataParser(tracks, 'valence');
    },
    tooltipLabel: defaultTooltipLabel,
    ticksCallback: function(a) {
      return (Math.round(a * 1000) / 10) + '%';
    },
    fixedStepSize: 0.1,
    min: 0,
    max: 1
  }
};

var artistData = {};
var currentArtistId = '';

function getFeatures(artistId, selectedAttribute) {
  $('#search h1').append('<div class="big-spinner"></div>');
  $.ajax({
    type: 'GET',
    url: 'https://pr7hy9rhqg.execute-api.us-east-1.amazonaws.com/dev/artist/' + artistId + '/audio-features',
    headers: {
      'Content-Type': 'application/json'
    },
    success: function(data) {
      artistData = data;
      currentArtistId = artistId;
      $('.big-spinner').remove();
      loadChart(artistData, selectedAttribute);
    }
  });
}

function getAlbumsHash(items) {
  var albumsHash = {};
  var albumName;
  var counter = 0;
  for (var i = 0; i < items.length; i++) {
    albumName = items[i].album_name;
    if (!(albumName in albumsHash)) {
      counter++;
      albumsHash[albumName] = '';
    }
  }
  var index = 0;
  for (var key in albumsHash) {
    if (albumsHash.hasOwnProperty(key)) {
      albumsHash[key] = 'hsl(' + Math.floor(360 * index / counter) + ', 100%, 50%)';
      index++;
    }
  }
  return albumsHash;
}

function getBarColorsByAlbum(items) {
  var albumsHash = getAlbumsHash(items);
  var colors = [];
  for (var i = 0; i < items.length; i++) {
    colors.push(albumsHash[items[i].album_name]);
  }
  return colors;
}

function resetCanvas() {
  $('#results').remove();
  $('#resultsContainer').append('<div id="results"><h4>Tracks sorted by <span id="attributeTitle"></span></h4><p id="attributeDescription"></p><div id="chartContainer"><canvas id="myChart" height="500"></canvas></div></div>');
  $('#attributeSelection').css('display', 'block');
}

function getData(artistId) {
  $('#search h1').append('<div class="big-spinner"></div>');
  $.ajax({
    type: 'GET',
    url: 'https://5wnsefqb0a.execute-api.us-east-1.amazonaws.com/dev/artist/' + artistId,
    headers: {
      'Content-Type': 'application/json'
    },
    success: function(data) {
      artistData = data;
      currentArtistId = artistId;
      loadChart(artistData, 'duration');
      $('.big-spinner').remove();
    },
    error: function() {
      console.error('Something happened. Refresh and try again');
      $('.big-spinner').remove();
    }
  });
}

function loadAttributesChart(attributeName) {
  if (artistData && artistData.tracks) {
    var missing = false;
    for (var i = 0; i < artistData.tracks.length; i++) {
      if (!(attributeName in artistData.tracks[i])) {
        missing = true;
        break;
      }
    }
    if (missing) {
      getFeatures(currentArtistId, attributeName);
    } else {
      loadChart(artistData, attributeName);
    }
  } else {
    getFeatures(currentArtistId, attributeName);
  }
}

function loadChart(tracks, attributeName) {
  resetCanvas();
  tracks.tracks = defaultSorter(tracks.tracks, attributeName);
  $('#chartContainer').css('width', Math.max(tracks.tracks.length * 17, 200) + 'px');
  $('canvas').attr('width', Math.max(tracks.tracks.length * 17, 200) + 'px');
  $('#attributeTitle').text(attributeName);
  $('#attributeDescription').text(generators[attributeName].description);
  var ctx = document.getElementById('myChart');
  var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: tracks.tracks.map(function(d) {
        return [d.track_name, '(' + d.album_name + ')'];
      }),
      datasets: [{
        label: 'Songs' + attributeName,
        backgroundColor: getBarColorsByAlbum(tracks.tracks),
        data: generators[attributeName].data(tracks)
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: false,
      legend: {
        display: false
      },
      tooltips: {
        callbacks: {
          label: generators[attributeName].tooltipLabel
        }
      },
      scales: {
        xAxes: [{
          display: false
        }],
        yAxes: [{
          display: true,
          ticks: {
            beginAtZero: true,
            min: generators[attributeName].min,
            max: generators[attributeName].max,
            fixedStepSize: generators[attributeName].fixedStepSize,
            callback: generators[attributeName].ticksCallback
          }
        }]
      }
    }
  });
  return myChart;
}

$(document).ready(function() {
  $('#artist-input').autocomplete({
    source: function(request, response) {
      var query = request.term;
      if (request.term.indexOf('-') < 0) {
        query += '*';
      }
      $.ajax({
        type: 'GET',
        url: 'https://api.spotify.com/v1/search',
        dataType: 'json',
        data: {
          type: 'artist',
          q: query
        },
        success: function(data) {
          response($.map(data.artists.items, function(item) {
            return {
              label: item.name,
              value: item.name,
              id: item.id
            };
          }));
        }
      });
    },
    minLength: 1,
    select: function(event, ui) {
      getData(ui.item.id);
    }
  });

  $('.attribute').click(function() {
    loadAttributesChart($(this).attr('id'));
  });
});
