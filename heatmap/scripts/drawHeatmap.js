/**
 * chrisw@soe.ucsc.edu
 * 15JAN14
 * Draw heatmaps via d3.js.
 */

var dataUrl = "heatmap/data/workflows.tsv";
// var dataUrl = "heatmap/data/data.tsv";

/**
 * get the JSON data to create a heatmapData object.
 */
function setHeatmapData(url) {
    d3.tsv(url, function(d) {
        return {
            "Group" : "" + d.Group,
            "Workflow" : "" + d.Workflow,
            "State" : "" + d.State
        };
    }, function(error, data) {
        var discreteColorMapper = d3.scale.category20();
        var settings = {
            "rowFeature" : "Workflow",
            "columnFeature" : "Group",
            "valueFeature" : "State",
            "nameFeature" : "State",
            "colorMapper" : function(d, i) {
                color = "darkgrey";
                if (d.toLowerCase() == "error") {
                    color = "red";
                } else if (d.toLowerCase() == "pending") {
                    color = "goldenrod";
                } else if (d.toLowerCase() == "ready") {
                    color = "green";
                }
                return color;
            },
            "rowClickback" : function(d, i) {
                console.log("rowClickback: " + d);
            },
            "columnClickback" : function(d, i) {
                console.log("columnClickback: " + d);
            },
            "cellClickback" : function(d, i) {
                console.log("cellClickback: r" + d.getRow() + " c" + d.getColumn() + " name" + d.getName() + " val" + d.getValue());
            }
        };

        var dataObj = new heatmapData();
        dataObj.addData(data, settings);

        var colNames = dataObj.getColumnNames().sort();

        var colNameMapping = new Object();
        for (var i in colNames) {
            var name = colNames[i] + "QQ";
            colNameMapping[name] = i;
        }

        var rowNames = dataObj.getRowNames().sort();

        var rowNameMapping = new Object();
        for (var i in rowNames) {
            var name = rowNames[i] + "QQ";
            rowNameMapping[name] = i;
        }

        // dataObj.setQuantileColorMapper();

        var longestColumnName = lengthOfLongestString(dataObj.getColumnNames());
        var longestRowName = lengthOfLongestString(dataObj.getRowNames());

        var top = (longestColumnName > 3) ? (9 * longestColumnName) : 30;
        var right = 0;
        var bottom = 0;
        var left = (longestRowName > 1) ? (8 * longestRowName) : 15;

        var margin = {
            "top" : top,
            "right" : right,
            "bottom" : bottom,
            "left" : left
        };

        // document.documentElement.clientWidth
        var fullWidth = document.documentElement.clientWidth;
        // document.documentElement.clientHeight
        var fullHeight = document.documentElement.clientHeight;
        var width = fullWidth - margin.left - margin.right;
        var height = fullHeight - margin.top - margin.bottom;
        var denom = (colNames.length > rowNames.length) ? colNames.length : rowNames.length;
        var gridSize = Math.floor(width / denom);
        var legendElementWidth = gridSize * 2;

        // SVG canvas
        var svg = d3.select("#chart").append("svg").attr({
            "width" : fullWidth,
            "height" : fullHeight
        }).append("g").attr({
            "transform" : "translate(" + margin.left + "," + margin.top + ")"
        });

        // row labels
        var rowLabels = svg.selectAll(".rowLabel").data(rowNames).enter().append("text").text(function(d) {
            return d;
        }).attr({
            "x" : 0,
            "y" : function(d, i) {
                return i * gridSize;
            },
            "transform" : "translate(-6," + gridSize / 1.5 + ")",
            "class" : function(d, i) {
                return "rowLabel mono axis axis-row";
            }
        }).style({
            "text-anchor" : "end",
            "cursor" : "pointer"
        }).on("click", dataObj.getRowClickback());

        // col labels
        var rotationDegrees = -90;
        var translateX = Math.floor(gridSize / 5);
        var translateY = -1 * Math.floor(gridSize / 3);
        var colLabels = svg.selectAll(".colLabel").data(colNames).enter().append("text").text(function(d) {
            return d;
        }).attr({
            "y" : function(d, i) {
                return (i + 1) * gridSize;
            },
            "x" : 0,
            "transform" : "rotate(" + rotationDegrees + ") translate(" + translateX + ", " + translateY + ")",
            "class" : function(d, i) {
                return "colLabel mono axis axis-col";
            }
        }).style({
            "text-anchor" : "start",
            "cursor" : "pointer"
        }).on("click", dataObj.getColumnClickback());

        // heatmap SVG elements
        var heatMap = svg.selectAll(".hour").data(dataObj.getData()).enter().append("rect").attr({
            "x" : function(d) {
                var colName = d.getColumn();
                var colNum = colNameMapping[d.getColumn() + "QQ"];
                var val = colNum * gridSize;
                return val;
            },
            "y" : function(d) {
                return (rowNameMapping[d.getRow() + "QQ"]) * gridSize;
            },
            "rx" : 4,
            "ry" : 4,
            "class" : "hour bordered",
            "width" : gridSize,
            "height" : gridSize
        }).style({
            "fill" : "#ffffd9",
            "cursor" : "pointer"
        });

        // TODO heatmap click event
        heatMap.on("click", dataObj.getCellClickback());

        // heatmap transition/animation
        heatMap.transition().duration(1000).style("fill", function(d) {
            var datatype = d.getDatatype();
            var colorMapper = dataObj.getColorMapper(datatype);
            return colorMapper(d.getValue());
        });

        // heatmap titles
        heatMap.append("title").text(function(d) {
            return d.getName();
        });

        // // legend SVG element
        // var quantiles = [0].concat(colorScale.quantiles());
        // var legend = svg.selectAll(".legend").data(quantiles, function(d) {
        // return d;
        // }).enter().append("g").attr({
        // "class" : "legend"
        // });
        //
        // // legend rectangles
        // legend.append("rect").attr("x", function(d, i) {
        // return legendElementWidth * i;
        // }).attr({
        // "y" : height,
        // "width" : legendElementWidth,
        // "height" : (gridSize / 2)
        // }).style("fill", function(d, i) {
        // return colors[i];
        // });
        //
        // // legend text
        // legend.append("text").attr("class", "mono").text(function(d) {
        // return "≥ " + Math.round(d);
        // }).attr({
        // "x" : function(d, i) {
        // return legendElementWidth * i;
        // },
        // "y" : (height + gridSize)
        // });
    });
}

// TODO onload
window.onload = function() {
    console.log("Page loaded. Start onload.");

    setHeatmapData(dataUrl);
};
