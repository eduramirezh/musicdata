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
  $('#resultsContainer').append('<div id="results"><h4>Tracks sorted by <span id="attributeTitle"></span></h4><div id="chartContainer"><canvas id="myChart" height="500"></canvas></div></div>');
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
    error: function(xhr, status, errorThrown){
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
