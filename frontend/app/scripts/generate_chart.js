function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

var defaultDataParser = function(tracks, attribute) {
  return tracks.tracks.map(function(track) {
    return Number(track[attribute]);
  });
};

function defaultSorter(tracks, attributeName){
  tracks.sort(function(a, b){
    var numberA = Number(a[attributeName]);
    var numberB = Number(b[attributeName]);
    if (numberA < numberB)
      return -1;
    if (numberA > numberB)
      return 1;
    return 0;
  })
  return tracks;
}

var defaultTooltipLabel = function(tooltipItem) {
  return tooltipItem.yLabel;
};

var generators = {
  duration: {
    data: function(tracks) {
      return defaultDataParser(tracks, 'duration');
    },
    tooltipLabel: function(tooltipItem) {
      var value = tooltipItem.yLabel || tooltipItem;
      return millisToMinutesAndSeconds(value);
    }
  },
  energy: {
    data: function(tracks) {
      return defaultDataParser(tracks, 'energy');
    },
    tooltipLabel: defaultTooltipLabel,
    fixedStepSize: 0.1
  },
  danceability: {
    data: function(tracks) {
      return defaultDataParser(tracks, 'danceability');
    },
    label: defaultTooltipLabel
  },
  tempo: {
    data: function(tracks) {
      return defaultDataParser(tracks, 'tempo');
    },
    label: defaultTooltipLabel
  },
  acousticness: {
    data: function(tracks) {
      return defaultDataParser(tracks, 'acousticness');
    },
    label: defaultTooltipLabel
  }
};

var artistData = {};
var currentArtistId = '';

function getFeatures(artistId, selectedAttribute) {
  $('#search h2').append('<div class="big-spinner"></div>');
  $.ajax({
    type: 'GET',
    url: 'https://5wnsefqb0a.execute-api.us-east-1.amazonaws.com/dev/artist/' + artistId + '/audio-features',
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
  $('#resultsContainer').append('<div id="results"><h2>Tracks sorted by duration</h2><div id="chartContainer"><canvas id="myChart"></canvas></div></div>');
}

function getData(artistId) {
  $('#search h2').append('<div class="big-spinner"></div>');
  $.ajax({
    type: 'GET',
    url: 'https://5wnsefqb0a.execute-api.us-east-1.amazonaws.com/dev/artist/' + artistId,
    headers: {
      'Content-Type': 'application/json'
    },
    success: function(data) {
      artistData = data
      currentArtistId = artistId;
      loadChart(artistData, 'duration');
      $('.big-spinner').remove();
    }
  });
}

function loadAttributesChart(attributeName) {
  if(artistData && artistData.tracks && artistData.tracks[0][attributeName]) {
    loadChart(artistData, attributeName);
  } else {
    getFeatures(currentArtistId, attributeName);
  }
}

function loadChart(tracks, attributeName) {
  resetCanvas();
  tracks.tracks = defaultSorter(tracks.tracks, attributeName);
  $('#chartContainer').css('width', tracks.tracks.length * 20 + 'px');
  var ctx = document.getElementById('myChart');
  var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: tracks.tracks.map(function(d) {
        return d.track_name;
      }),
      datasets: [{
        label: 'Songs' + attributeName,
        backgroundColor: getBarColorsByAlbum(tracks.tracks),
        data: generators[attributeName].data(tracks)
      }]
    },
    options: {
      maintainAspectRatio: false,
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
            fixedStepSize: generators[attributeName].fixedStepSize,
            callback: generators[attributeName].tooltipLabel
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

  $('.attribute').click(function(){
    loadAttributesChart($(this).attr('id'));
  });
});
