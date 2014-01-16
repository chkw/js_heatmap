/**
 * chrisw@soe.ucsc.edu
 * 15JAN14
 * Draw heatmaps via d3.js.
 */

var dataUrl = "heatmap/data/data.tsv";

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
        var discreteColorMapper = d3.scale.category20();
        var settings = {
            "rowFeature" : "day",
            "columnFeature" : "hour",
            "valueFeature" : "value",
            "nameFeature" : "value",
            "colorMapper" : discreteColorMapper
        };

        var dataObj = new heatmapData(data, settings);

        var colNames = dataObj.getColumnNames();

        var colNameMapping = new Object();
        for (var i in colNames) {
            var name = colNames[i] + "QQ";
            colNameMapping[name] = i;
        }

        var rowNames = dataObj.getRowNames();

        var rowNameMapping = new Object();
        for (var i in rowNames) {
            var name = rowNames[i] + "QQ";
            rowNameMapping[name] = i;
        }

        var valNames = dataObj.getAllValues();

        // color scale
        var colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];
        var buckets = colors.length;
        var colorScale = d3.scale.quantile().domain([0, buckets - 1, d3.max(dataObj.getAllValues(), function(d) {
            return parseFloat(d);
        })]).range(colors);

        // dataObj.setColorMapper(colorScale);

        var margin = {
            top : 50,
            right : 0,
            bottom : 100,
            left : 30
        };
        // document.documentElement.clientWidth
        var fullWidth = document.documentElement.clientWidth;
        // document.documentElement.clientHeight
        var fullHeight = document.documentElement.clientHeight;
        var width = fullWidth - margin.left - margin.right;
        var height = fullHeight - margin.top - margin.bottom;
        var gridSize = Math.floor(width / colNames.length);
        var legendElementWidth = gridSize * 2;

        // SVG canvas
        var svg = d3.select("#chart").append("svg").attr("width", fullWidth).attr("height", fullHeight).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
            console.log("clicked cell: r" + d.getRow() + " c" + d.getColumn() + " name" + d.getName() + " val" + d.getValue());
        });

        // heatmap transition/animation
        heatMap.transition().duration(1000).style("fill", function(d) {
            return dataObj.getColorMapper()(d.getValue());
        });

        // heatmap titles
        heatMap.append("title").text(function(d) {
            return d.getName();
        });

        // legend SVG element
        var quantiles = [0].concat(colorScale.quantiles());
        var legend = svg.selectAll(".legend").data(quantiles, function(d) {
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

    setHeatmapData(dataUrl);
};
