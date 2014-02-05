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

function heatmapData(deserializedJson, newSettings) {
    this.data = null;
    this.settings = null;

    this.initializeObject = function(deserializedJson, newSettings) {

        this.settings = new Object();

        this.settings["rowFeature"] = "row";
        this.settings["columnFeature"] = "column";
        this.settings["valueFeature"] = "value";
        this.settings["nameFeature"] = "value";
        this.setQuantileColorMapper();

        this.setSettings(newSettings);
        this.setData(deserializedJson);
    };

    this.setData = function(newData) {
        this.data = new Array();
        for (var i in deserializedJson) {
            this.data.push(new cellData({
                "row" : deserializedJson[i][this.settings["rowFeature"]],
                "column" : deserializedJson[i][this.settings["columnFeature"]],
                "value" : deserializedJson[i][this.settings["valueFeature"]],
                "name" : deserializedJson[i][this.settings["nameFeature"]]
            }));
        }
    };

    this.getData = function() {
        return this.data;
    };

    this.setSettings = function(settings) {
        if (settings != null) {
            for (var i in settings) {
                this.settings[i] = settings[i];
            }
        }
    };

    this.getSetting = function(settingName) {
        return this.settings[settingName];
    };

    this.getRowClickback = function() {
        return this.getSetting("rowClickback");
    };

    this.getColumnClickback = function() {
        return this.getSetting("columnClickback");
    };

    this.getCellClickback = function() {
        return this.getSetting("cellClickback");
    };

    this.getRowRightClickback = function() {
        return this.getSetting("rowRightClickback");
    };

    this.getColumnRightClickback = function() {
        return this.getSetting("columnRightClickback");
    };

    this.getCellRightClickback = function() {
        return this.getSetting("cellRightClickback");
    };

    this.getColorMapper = function() {
        return this.getSetting("colorMapper");
    };

    this.setColorMapper = function(mapper) {
        return this.settings["colorMapper"] = mapper;
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
        this.setColorMapper(colorScale);
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

    this.initializeObject(deserializedJson, newSettings);
}

function lengthOfLongestString(arrayOfStrings) {
    var lengths = new Array();
    for (var i in arrayOfStrings) {
        lengths.push(arrayOfStrings[i].length);
    }
    var maxLength = Math.max.apply(null, lengths);
    return maxLength;
}
