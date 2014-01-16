/**
 * chrisw@soe.ucsc.edu
 * 15JAN14
 * Draw heatmaps via d3.js.
 */

var dataUrl = "heatmap/data/data.tsv";

function example() {
    var margin = {
        top : 50,
        right : 0,
        bottom : 100,
        left : 30
    };
    var width = 960 - margin.left - margin.right;
    var height = 430 - margin.top - margin.bottom;
    var gridSize = Math.floor(width / 24);
    console.log("gridsize:" + gridSize);
    var legendElementWidth = gridSize * 2;
    var buckets = 9;
    var colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];
    // alternatively colorbrewer.YlGnBu[9];
    var days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    var times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];

    d3.tsv("heatmap/data/data.tsv", function(d) {
        return {
            day : +d.day,
            hour : +d.hour,
            value : +d.value
        };
    }, function(error, data) {
        // color scale
        var colorScale = d3.scale.quantile().domain([0, buckets - 1, d3.max(data, function(d) {
            return d.value;
        })]).range(colors);

        // SVG canvas
        var svg = d3.select("#example").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // row labels
        var dayLabels = svg.selectAll(".dayLabel").data(days).enter().append("text").text(function(d) {
            return d;
        }).attr("x", 0).attr("y", function(d, i) {
            return i * gridSize;
        }).style("text-anchor", "end").attr("transform", "translate(-6," + gridSize / 1.5 + ")").attr("class", function(d, i) {
            return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-row" : "dayLabel mono axis");
        });

        // col labels
        var timeLabels = svg.selectAll(".timeLabel").data(times).enter().append("text").text(function(d) {
            return d;
        }).attr("x", function(d, i) {
            return i * gridSize;
        }).attr("y", 0).style("text-anchor", "middle").attr("transform", "translate(" + gridSize / 2 + ", -6)").attr("class", function(d, i) {
            return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis");
        });

        // heatmap SVG elements
        var heatMap = svg.selectAll(".hour").data(data).enter().append("rect").attr("x", function(d) {
            return (d.hour - 1) * gridSize;
        }).attr("y", function(d) {
            return (d.day - 1) * gridSize;
        }).attr("rx", 4).attr("ry", 4).attr("class", "hour bordered").attr("width", gridSize).attr("height", gridSize).style("fill", colors[0]);

        // heatmap transition/animation
        heatMap.transition().duration(1000).style("fill", function(d) {
            return colorScale(d.value);
        });

        // heatmap titles
        heatMap.append("title").text(function(d) {
            return d.value;
        });

        // legend SVG element
        var legend = svg.selectAll(".legend").data([0].concat(colorScale.quantiles()), function(d) {
            return d;
        }).enter().append("g").attr("class", "legend");

        // legend rectangles
        legend.append("rect").attr("x", function(d, i) {
            return legendElementWidth * i;
        }).attr("y", height).attr("width", legendElementWidth).attr("height", gridSize / 2).style("fill", function(d, i) {
            return colors[i];
        });

        // legend text
        legend.append("text").attr("class", "mono").text(function(d) {
            return "≥ " + Math.round(d);
        }).attr("x", function(d, i) {
            return legendElementWidth * i;
        }).attr("y", height + gridSize);
    });
}

/**
 * get the JSON data to create a heatmapData object.
 */
function setHeatmapData(url) {
    d3.tsv(url, function(d) {
        return {
            day : "" + d.day,
            hour : "" + d.hour,
            value : "" + d.value
        };
    }, function(error, data) {
        var dataObj = new heatmapData(data);

        var colNames = dataObj.getColumnNames();
        console.log("colNames->" + JSON.stringify(colNames));

        var colNameMapping = new Object();
        for (var i in colNames) {
            var name = colNames[i] + "QQ";
            colNameMapping[name] = i;
        }
        console.log("colNameMapping->" + JSON.stringify(colNameMapping));

        var rowNames = dataObj.getRowNames();
        console.log("rowNames->" + JSON.stringify(rowNames));

        var rowNameMapping = new Object();
        for (var i in rowNames) {
            var name = rowNames[i] + "QQ";
            rowNameMapping[name] = i;
        }
        console.log("rowNameMapping->" + JSON.stringify(rowNameMapping));

        var valNames = dataObj.getAllValues();
        console.log("valNames->" + JSON.stringify(valNames));

        // color scale
        var colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];
        var buckets = colors.length;
        var colorScale = d3.scale.quantile().domain([0, buckets - 1, d3.max(dataObj.getAllValues(), function(d) {
            return parseFloat(d);
        })]).range(colors);
        console.log(colors);

        var margin = {
            top : 50,
            right : 0,
            bottom : 100,
            left : 30
        };
        // document.documentElement.clientWidth
        var fullWidth = 480;
        // document.documentElement.clientHeight
        var fullHeight = 400;
        var width = fullWidth - margin.left - margin.right;
        var height = fullHeight - margin.top - margin.bottom;
        var gridSize = Math.floor(width / colNames.length);
        var legendElementWidth = gridSize * 2;

        // SVG canvas
        var svg = d3.select("#chart").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // row labels
        var rowLabels = svg.selectAll(".rowLabel").data(rowNames).enter().append("text").text(function(d) {
            return d;
        }).attr("x", 0).attr("y", function(d, i) {
            return i * gridSize;
        }).style("text-anchor", "end").attr("transform", "translate(-6," + gridSize / 1.5 + ")").attr("class", function(d, i) {
            return "rowLabel mono axis axis-row";
        });

        // col labels
        var colLabels = svg.selectAll(".colLabel").data(colNames).enter().append("text").text(function(d) {
            return d;
        }).attr("x", function(d, i) {
            return i * gridSize;
        }).attr("y", 0).style("text-anchor", "middle").attr("transform", "translate(" + gridSize / 2 + ", -6)").attr("class", function(d, i) {
            return "colLabel mono axis axis-col";
        });

        // heatmap SVG elements
        var heatMap = svg.selectAll(".hour").data(dataObj.getData()).enter().append("rect").attr("x", function(d) {
            var colName = d.getColumn();
            var colNum = colNameMapping[d.getColumn() + "QQ"];
            var val = colNum * gridSize;
            return val;
        }).attr("y", function(d) {
            return (rowNameMapping[d.getRow() + "QQ"]) * gridSize;
        }).attr("rx", 4).attr("ry", 4).attr("class", "hour bordered").attr("width", gridSize).attr("height", gridSize).style("fill", colors[0]);

        // TODO heatmap click event
        heatMap.on("click", function(d, i) {
            console.log("clicked cell: r" + d.getRow() + " c" + d.getColumn());
        });

        // heatmap transition/animation
        heatMap.transition().duration(1000).style("fill", function(d) {
            return colorScale(d.getValue());
        });

        // heatmap titles
        heatMap.append("title").text(function(d) {
            return d.getName();
        });

        // legend SVG element
        var legend = svg.selectAll(".legend").data([0].concat(colorScale.quantiles()), function(d) {
            return d;
        }).enter().append("g").attr("class", "legend");

        // legend rectangles
        legend.append("rect").attr("x", function(d, i) {
            return legendElementWidth * i;
        }).attr("y", height).attr("width", legendElementWidth).attr("height", gridSize / 2).style("fill", function(d, i) {
            return colors[i];
        });

        // legend text
        legend.append("text").attr("class", "mono").text(function(d) {
            return "≥ " + Math.round(d);
        }).attr("x", function(d, i) {
            return legendElementWidth * i;
        }).attr("y", height + gridSize);
    });
}

// TODO onload
window.onload = function() {
    console.log("Page loaded. Start onload.");
    example();

    setHeatmapData(dataUrl);
};
