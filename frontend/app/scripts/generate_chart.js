function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

function getAlbumsHash(items) {
  var albumsHash = {};
  var album_name;
  var counter = 0;
  for(var i = 0; i < items.length;i++){
    album_name = items[i].album_name;
    if(!(album_name in albumsHash)) {
      counter++;
      albumsHash[album_name] = '';
    }
  }
  var index = 0;
  for(key in albumsHash){
    albumsHash[key] = 'hsl(' + (360 * index / counter) + ', 100%, 50%)';
    index++;
  }
  return albumsHash;
}


function getBarColorsByAlbum(items) {
  var albumsHash = getAlbumsHash(items);
  var colors = [];
  for(var i = 0; i < items.length; i++){
    colors.push(albumsHash[items[i].album_name]);
  }
  return colors;
}


function resetCanvas() {
  $('#myChart').remove();
  $('#chartContainer').append('<canvas id="myChart"><canvas>');
}

function getData(artistId) {
  $.ajax({
    type: 'GET',
    url: 'https://5wnsefqb0a.execute-api.us-east-1.amazonaws.com/dev/artist/' + artistId,
    headers: {
      'Content-Type': 'application/json'
    },
    success: function(data) {
      loadChart(data);
    }
  });
}

function loadChart(tracks) {
  resetCanvas();
  var ctx = document.getElementById('myChart');
  var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: tracks.tracks.map(function(d) {
        return d.track_name;
      }),
      datasets: [{
        label: 'Songs duration',
        backgroundColor: getBarColorsByAlbum(tracks.tracks),
        data: tracks.tracks.map(function(d) {
          return d.duration;
        }),
        borderWidth: 1
      }]
    },
    options: {
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            return millisToMinutesAndSeconds(tooltipItem.yLabel);
          }
        }
      },
      scales: {
        xAxes: [{
          display: false
        }],
        yAxes: [{
          ticks: {
            beginAtZero:true
          }
        }]
      }
    }
  });
}

$(document).ready(function() {
  $('#artist-input').autocomplete({
    source: function(request, response) {
      $.ajax({
        type: 'GET',
        url: 'https://api.spotify.com/v1/search',
        dataType: 'json',
        data: {
          type: 'artist',
          q: request.term
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
});
