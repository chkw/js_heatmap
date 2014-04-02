/**
 * chrisw@soe.ucsc.edu
 * 15JAN14
 * heatmapData.js contains objects meant to facilitate the drawing of heatmaps via d3.js.
 */

/**
 * Keep track of sorting.
 */
function sortingSteps(arrayOfSteps) {
    this.steps = new Array();
    if (arrayOfSteps != null) {
        this.steps = arrayOfSteps;
    }

    this.getSteps = function() {
        return this.steps;
    };

    this.getIndex = function(name) {
        var result = -1;
        for (var i = 0; i < this.steps.length; i++) {
            if (this.steps[i]["name"] == name) {
                return i;
            }
        }
        return result;
    };

    this.addStep = function(name) {
        var index = this.getIndex(name);
        if (index >= 0) {
            var c = this.steps.splice(index, 1)[0];
            c["reverse"] = !c["reverse"];
            this.steps.push(c);
        } else {
            this.steps.push({
                "name" : name,
                "reverse" : false
            });
        }
    };

    this.removeStep = function(name) {
        var index = this.getIndex(name);
        if (index >= 0) {
            this.steps.splice(index, 1);
        }
    };

    this.clearSteps = function() {
        this.steps.splice(0, this.steps.length);
    };
}

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
    this.getDatatype = function() {
        return this.data["datatype"];
    };
    this.transpose = function() {
        var newRow = this.data["column"];
        this.data["column"] = this.data["row"];
        this.data["row"] = newRow;
    };
}

function heatmapData() {
    this.data = new Array();
    this.clickBacks = new Object();
    this.colorMappers = new Object();

    this.addData = function(newDeserializedJson, newSettings) {
        var settings = {
            "rowFeature" : "row",
            "columnFeature" : "column",
            "valueFeature" : "value",
            "nameFeature" : "value",
            "datatype" : "unspecified"
        };

        if (newSettings != null) {
            for (var key in newSettings) {
                settings[key] = newSettings[key];
                if (endsWith(key, "Clickback")) {
                    this.clickBacks[key] = settings[key];
                }
            }
        }

        // for default quantile color mapper
        var allValues = new Array();

        for (var cell in newDeserializedJson) {
            this.data.push(new cellData({
                "row" : newDeserializedJson[cell][settings["rowFeature"]],
                "column" : newDeserializedJson[cell][settings["columnFeature"]],
                "value" : newDeserializedJson[cell][settings["valueFeature"]],
                "name" : newDeserializedJson[cell][settings["nameFeature"]],
                "datatype" : settings["datatype"]
            }));
            allValues.push(newDeserializedJson[cell][settings["valueFeature"]]);
        }

        if ((settings["colorMapper"] == null) || (settings["colorMapper"] == "quantile")) {
            var quantileColorMapper = this.setupQuantileColorMapper(allValues);
            this.setColorMapper(settings["datatype"], quantileColorMapper);
        } else if (settings["colorMapper"] == "centered") {
            this.setColorMapper(settings["datatype"], this.centeredRgbaColorMapper(true));
        } else {
            this.setColorMapper(settings["datatype"], settings["colorMapper"]);
        }

        if (settings["eventList"] != null) {
            this.setRows(settings["eventList"]);
        }

        return this;
    };

    this.transpose = function() {
        for (var i = 0; i < this.data.length; i++) {
            this.data[i].transpose();
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
        return this;
    };

    this.getSetting = function(settingName) {
        return this.settings[settingName];
    };

    this.setClickback = function(key, value) {
        this.clickBacks[key] = value;
        return this;
    };

    this.getRowClickback = function() {
        return this.clickBacks[("rowClickback")];
    };

    this.getColumnClickback = function() {
        return this.clickBacks[("columnClickback")];
    };

    this.getCellClickback = function() {
        return this.clickBacks[("cellClickback")];
    };

    this.getRowRightClickback = function() {
        return this.clickBacks[("rowRightClickback")];
    };

    this.getColumnRightClickback = function() {
        return this.clickBacks[("columnRightClickback")];
    };

    this.getCellRightClickback = function() {
        return this.clickBacks[("cellRightClickback")];
    };

    this.setColorMapper = function(datatype, colorMapper) {
        this.colorMappers[datatype] = colorMapper;
    };

    this.getColorMapper = function(datatype) {
        return this.colorMappers[datatype];
    };

    /**
     * If palette not provided, a default palette is used.
     */
    this.setupQuantileColorMapper = function(allDataValues, palette) {
        // color scale
        var colors = palette;
        if (colors == null) {
            // colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];
            colors = ["rgb(255,255,217)", "rgb(237,248,177)", "rgb(199,233,180)", "rgb(127,205,187)", "rgb(65,182,196)", "rgb(29,145,192)", "rgb(34,94,168)", "rgb(37,52,148)", "rgb(8,29,88)"];
        }
        var buckets = colors.length;
        var colorScale = d3.scale.quantile().domain([0, buckets - 1, d3.max(allDataValues, function(d) {
            return parseFloat(d);
        })]).range(colors);

        return colorScale;
    };

    /**
     * centered RGBa color mapper
     */
    this.centeredRgbaColorMapper = function(log, centerVal, minNegVal, maxPosVal) {
        var mapper = null;

        var centerV = (centerVal == null) ? 0 : centerVal;
        var minNegV = (minNegVal == null) ? -1.96 : minNegVal;
        var maxPosV = (maxPosVal == null) ? 1.96 : maxPosVal;

        mapper = function(val) {
            var a = 1;
            var r = 169;
            var g = 169;
            var b = 169;

            var v = parseFloat(val);

            if ((v == null) || (v != v)) {
                // null or NaN values
            } else if (v > centerV) {
                r = 255;
                g = 0;
                b = 0;
                if ((maxPosVal != null) && (v > maxPosV)) {
                    a = 1;
                } else {
                    a = (v - centerV) / (maxPosV - centerV);
                    a = Math.abs(a);
                    if (log) {
                        a = Math.log(a);
                    }
                }
            } else if (v < centerV) {
                r = 0;
                g = 0;
                b = 255;
                if ((minNegVal != null) && (v < minNegV)) {
                    a = 1;
                } else {
                    a = (v - centerV) / (minNegV - centerV);
                    a = Math.abs(a);
                    if (log) {
                        a = Math.log(a);
                    }
                }
            } else {
                r = 255;
                g = 255;
                b = 255;
                a = 1;
            }
            return "rgba(" + r + "," + g + "," + b + "," + a + ")";
        };

        return mapper;
    };

    this.getAxisNames = function(axis) {
        var result = new Array();
        for (var i in this.data) {
            var val = (axis === "column") ? this.data[i].getColumn() : this.data[i].getRow();
            if (result.indexOf(val) >= 0) {
                // don't add. already in list
            } else {
                result.push(val);
            }
        }
        return result;
    };

    this.getColumnNames = function() {
        return this.getAxisNames("column");
    };

    this.getRowNames = function() {
        return this.getAxisNames("row");
    };

    /**
     * Find/fill missing cells
     */
    this.fillMissingCells = function() {
        var colNames = this.getColumnNames();
        var rowNames = this.getRowNames();

        var blankCellData = [];
        for (var c = 0; c < colNames.length; c++) {
            var colName = colNames[c];
            for (var r = 0; r < rowNames.length; r++) {
                var rowName = rowNames[r];
                var cells = this.getCells(colName, rowName, null);

                if (cells.length <= 0) {
                    blankCellData.push({
                        'row' : rowName,
                        'column' : colName,
                        "value" : null
                    });
                }
            }
        }
        this.addData(blankCellData, null);
    };

    /**
     * Remove unselected rows.
     */
    this.filterRows = function(selectedRowNames) {
        var deleteList = new Array();
        var currentRowNames = this.getRowNames();
        for (var i in currentRowNames) {
            var currentRowName = currentRowNames[i];
            if (selectedRowNames.indexOf(currentRowName) > -1) {
                // keep row
            } else {
                //delete row
                deleteList.push(currentRowName);
            }
        }
        // iterate over cells from the end of the array
        for (var i = this.data.length - 1; i >= 0; i--) {
            var rowName = this.data[i].getRow();
            if (deleteList.indexOf(rowName) >= 0) {
                this.data.splice(i, 1);
            }
        }
        return this;
    };

    /**
     * Add one row of uniform values to all columns.
     */
    this.addUniformRow = function(rowName, value) {
        if (this.getRowNames().indexOf(rowName) >= 0) {
            return;
        }
        var columnNames = this.getColumnNames();
        for (var i in columnNames) {
            var columnName = columnNames[i];
            this.data.push(new cellData({
                "row" : rowName,
                "column" : columnName,
                "value" : value,
                "name" : "uniform values for row " + rowName
            }));
        }
        return this;
    };

    /**
     * Set the rows to display.  Unselected rows will be deleted.  Missing rows will be added.
     */
    this.setRows = function(selectedRowNames) {
        if (selectedRowNames == null) {
            return this;
        }

        // delete unselected rows
        this.filterRows(selectedRowNames);

        // add missing rows
        for (var i in selectedRowNames) {
            var selectedRowName = selectedRowNames[i];
            this.addUniformRow(selectedRowName, null);
        }
        return this;
    };

    /**
     * Get the cells that have the specified columnName, rowName, and/or datatype.
     * Assumes you're not looking for cells with a 'null' value.
     */
    this.getCells = function(columnName, rowName, datatype) {
        var cells = new Array();
        for (var i in this.data) {
            var cellData = this.data[i];
            if ((columnName == null) && (rowName == null) && (datatype == null)) {
                return this.data;
            }
            if ((rowName == null) && (datatype == null)) {
                if (cellData.getColumn() == columnName) {
                    cells.push(cellData);
                }
            } else if ((columnName == null) && (datatype == null)) {
                if (cellData.getRow() == rowName) {
                    cells.push(cellData);
                }
            } else if ((rowName == null) && (columnName == null)) {
                if (cellData.getDatatype() == datatype) {
                    cells.push(cellData);
                }
            } else if (datatype == null) {
                if ((cellData.getColumn() == columnName) && (cellData.getRow() == rowName)) {
                    cells.push(cellData);
                }
            } else if (rowName == null) {
                if ((cellData.getColumn() == columnName) && (cellData.getDatatype() == datatype)) {
                    cells.push(cellData);
                }
            } else if (columnName == null) {
                if ((cellData.getDatatype() == datatype) && (cellData.getRow() == rowName)) {
                    cells.push(cellData);
                }
            } else if ((cellData.getDatatype() == datatype) && (cellData.getRow() == rowName) && (cellData.getColumn() == columnName)) {
                cells.push(cellData);
            }
        }
        return cells;
    };

    // TODO multi-sort
    /**
     * Get a sorted list of row/column names from a list of cells.
     */
    this.multiSort = function(sortingSteps, axis) {
        var reorderRows = true;
        if ((axis != null) && (axis == "column")) {
            reorderRows = false;
        }

        var steps = sortingSteps.getSteps().reverse();
        // columns is one line of cells from the data

        var reorderingAxisNames = (reorderRows) ? this.getRowNames() : this.getColumnNames();

        var sortingData = new Array();

        // create array of sorting objects
        var dataHash = new Object();
        for (var a = 0; a < reorderingAxisNames.length; a++) {
            var reorderingAxisName = reorderingAxisNames[a];
            var data = null;

            if ( reorderingAxisName in dataHash) {
            } else {
                dataHash[reorderingAxisName] = new Object();
            }
            data = dataHash[reorderingAxisName];

            for (var b = 0; b < steps.length; b++) {
                var step = steps[b];
                var staticAxisName = step["name"];
                var datatype = null;

                var cellData = (reorderRows) ? this.getCells(staticAxisName, reorderingAxisName, datatype) : this.getCells(reorderingAxisName, staticAxisName, datatype);
                if (cellData.length == 1) {
                    data[staticAxisName] = cellData[0].getValue();
                } else {
                    var s = (reorderRows) ? staticAxisName + " " + reorderingAxisName : reorderingAxisName + " " + staticAxisName;
                    // console.log(cellData.length + " cellData objects for", s, datatype);
                    data[staticAxisName] = null;
                }
            }
        }

        // convert hash to array
        for (var name in dataHash) {
            var data = new Array();
            for (var b = 0; b < steps.length; b++) {
                data.push(dataHash[name][steps[b]["name"]]);
            }
            sortingData.push({
                "name" : name,
                "vector" : data
            });
        }

        // sort objects
        sortingData.sort(compareVectors);

        // return row names in sorted ordersortedNames = new Array();
        var sortedNames = new Array();
        for (var k = 0; k < sortingData.length; k++) {
            sortedNames.push(sortingData[k]["name"]);
        }

        return sortedNames;

        /**
         * comparison function
         */
        function compareVectors(a, b) {

            var aData = a["vector"];
            var bData = b["vector"];

            if (aData.length != aData.length) {
                console.log(a["name"] + " and " + b["name"] + " have different number of scores.");
                return 0;
            }

            for (var i = 0; i < aData.length; i++) {
                var sortingStep = steps[i];
                var multiplier = sortingStep["reverse"] ? -1 : 1;

                // convert to numbers
                var scoreA = parseFloat(aData[i]);
                var scoreB = parseFloat(bData[i]);

                // handle non-numericals
                // As per IEEE-754 spec, a nan checked for equality against itself will be unequal (in other words, nan != nan)
                // ref: http://kineme.net/Discussion/DevelopingCompositions/CheckifnumberNaNjavascriptpatch
                if (scoreA != scoreA || scoreB != scoreB) {
                    if (scoreA != scoreA && scoreB != scoreB) {
                        continue;
                    } else if (scoreA != scoreA) {
                        return -1 * multiplier;
                    } else if (scoreB != scoreB) {
                        return 1 * multiplier;
                    }
                }

                if (scoreA < scoreB) {
                    return -1 * multiplier;
                }
                if (scoreA > scoreB) {
                    return 1 * multiplier;
                } else {
                    continue;
                }
            }
            // Reach this if the score vectors are identical.
            return 0;
        }

    };

    /**
     * Get a sorted list of column names from a list of cells.
     */
    this.multiSortColumns = function(sortingSteps) {
        return this.multiSort(sortingSteps, "column");
    };

    /**
     * Get a sorted list of row names from a list of cells.
     */
    this.multiSortRows = function(sortingSteps) {
        return this.multiSort(sortingSteps, "row");
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

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
