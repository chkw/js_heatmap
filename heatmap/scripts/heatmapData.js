/**
 * chrisw@soe.ucsc.edu
 * 15JAN14
 * heatmapData.js contains objects meant to facilitate the drawing of heatmaps via d3.js.
 */
function cellData(newCellData) {
    this.data = newCellData;
    this.getRow = function() {
        return this.data["row"];
    };
    this.getColumn = function() {
        return this.data["column"];
    };
    this.getValue = function() {
        return this.data["value"];
    };
    this.getName = function() {
        return this.data["name"];
    };
}

function heatmapData(deserializedJson, settings) {

    this.rowFeature = "row";
    this.columnFeature = "column";
    this.valueFeature = "value";
    this.nameFeature = "value";
    this.colorMapper = function(d, i) {
        return null;
    };
    this.rowClickback = function(d, i) {
        return null;
    };
    this.columnClickback = function(d, i) {
        return null;
    };
    this.cellClickback = function(d, i) {
        return null;
    };

    if (settings != null) {
        if ("rowFeature" in settings) {
            this.rowFeature = settings["rowFeature"];
        }
        if ("columnFeature" in settings) {
            this.columnFeature = settings["columnFeature"];
        }
        if ("valueFeature" in settings) {
            this.valueFeature = settings["valueFeature"];
        }
        if ("nameFeature" in settings) {
            this.nameFeature = settings["nameFeature"];
        }
        if ("colorMapper" in settings) {
            this.colorMapper = settings["colorMapper"];
        }
        if ("rowClickback" in settings) {
            this.rowClickback = settings["rowClickback"];
        }
        if ("columnClickback" in settings) {
            this.columnClickback = settings["columnClickback"];
        }
        if ("cellClickback" in settings) {
            this.cellClickback = settings["cellClickback"];
        }
    }

    this.data = new Array();
    for (var i in deserializedJson) {
        this.data.push(new cellData({
            "row" : deserializedJson[i][this.rowFeature],
            "column" : deserializedJson[i][this.columnFeature],
            "value" : deserializedJson[i][this.valueFeature],
            "name" : deserializedJson[i][this.nameFeature]
        }));
    }

    this.getData = function() {
        return this.data;
    };

    this.getRowClickback = function() {
        return this.rowClickback;
    };

    this.getColumnClickback = function() {
        return this.columnClickback;
    };

    this.getCellClickback = function() {
        return this.cellClickback;
    };

    this.getColorMapper = function() {
        return this.colorMapper;
    };

    this.setColorMapper = function(mapper) {
        this.colorMapper = mapper;
    };

    /**
     * If palette not provided, a default palette is used.
     */
    this.setQuantileColorMapper = function(palette) {
        // color scale
        var colors = palette;
        if (colors == null) {
            colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];
        }
        var buckets = colors.length;
        var colorScale = d3.scale.quantile().domain([0, buckets - 1, d3.max(this.getAllValues(), function(d) {
            return parseFloat(d);
        })]).range(colors);
        this.colorMapper = colorScale;
    };

    this.getColumnNames = function() {
        var values = new Object();
        for (var i in this.data) {
            var val = this.data[i].getColumn() + "QQ";
            if (!val in values) {
                values[val] = 0;
            }
            values[val]++;
        }
        var result = new Array();
        for (var val in values) {
            result.push(val.replace(/QQ/, ""));
        }
        return result;
    };

    this.getRowNames = function() {
        var values = new Object();
        for (var i in this.data) {
            var val = this.data[i].getRow() + "QQ";
            if (!val in values) {
                values[val] = 0;
            }
            values[val]++;
        }
        var result = new Array();
        for (var val in values) {
            result.push(val.replace(/QQ/, ""));
        }
        return result;
    };

    this.getAllValues = function() {
        var values = new Object();
        for (var i in this.data) {
            var val = this.data[i].getValue() + "QQ";
            if (!val in values) {
                values[val] = 0;
            }
            values[val]++;
        }
        var result = new Array();
        for (var val in values) {
            result.push(val.replace(/QQ/, ""));
        }
        return result;
    };
}

function lengthOfLongestString(arrayOfStrings) {
    var lengths = new Array();
    for (var i in arrayOfStrings) {
        lengths.push(arrayOfStrings[i].length);
    }
    var maxLength = Math.max.apply(null, lengths);
    return maxLength;
}
