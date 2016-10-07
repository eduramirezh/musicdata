var ctx = document.getElementById("myChart");
var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: sample.tracks.map(function(d){return d.track_name}),
        datasets: [{
            label: 'Songs duration',
            data: sample.tracks.map(function(d){return d.duration}),
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
    }
});
