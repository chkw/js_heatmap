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

        if (settings["colorMapper"] == null) {
            var quantileColorMapper = this.setupQuantileColorMapper(allValues);
            this.setColorMapper(settings["datatype"], quantileColorMapper);
        } else {
            this.setColorMapper(settings["datatype"], settings["colorMapper"]);
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
            colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];
        }
        var buckets = colors.length;
        var colorScale = d3.scale.quantile().domain([0, buckets - 1, d3.max(allDataValues, function(d) {
            return parseFloat(d);
        })]).range(colors);

        return colorScale;
    };

    this.getColumnNames = function() {
        var result = new Array();
        for (var i in this.data) {
            var val = this.data[i].getColumn();
            if (result.indexOf(val) >= 0) {
                // don't add. already in list
            } else {
                result.push(val);
            }
        }
        return result;
    };

    this.getRowNames = function() {
        var result = new Array();
        for (var i in this.data) {
            var val = this.data[i].getRow();
            if (result.indexOf(val) >= 0) {
                // don't add. already in list
            } else {
                result.push(val);
            }
        }
        return result;
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
     * Get a sorted list of column names from a list of cells.
     */
    // this.multiSortColumns = function(rowName, datatype, cellList) {
    this.multiSortColumns = function(sortingSteps) {
        var steps = sortingSteps.getSteps().reverse();
        // columns is one row of cells from the data

        var allColNames = this.getColumnNames();
        var sortingData = new Array();

        // create array of sorting objects
        var dataHash = new Object();
        for (var a = 0; a < allColNames.length; a++) {
            var colName = allColNames[a];
            var data = null;

            if ( colName in dataHash) {
            } else {
                dataHash[colName] = new Object();
            }
            data = dataHash[colName];

            for (var b = 0; b < steps.length; b++) {
                var step = steps[b];
                var rowName = step["name"];
                var datatype = null;

                var cellData = this.getCells(colName, rowName, datatype);
                if (cellData.length == 1) {
                    data[rowName] = cellData[0].getValue();
                } else {
                    console.log(cellData.length + " cellData objects for", colName, rowName, datatype);
                    data[rowName] = null;
                }
            }
        }

        // convert hash to array
        for (var col in dataHash) {
            var data = new Array();
            for (var b = 0; b < steps.length; b++) {
                data.push(dataHash[col][steps[b]["name"]]);
            }
            sortingData.push({
                "column" : col,
                "data" : data
            });
        }

        // sort objects
        sortingData.sort(compareColumns);

        // return column names in sorted ordersortedNames = new Array();
        var sortedNames = new Array();
        for (var k = 0; k < sortingData.length; k++) {
            sortedNames.push(sortingData[k]["column"]);
        }

        return sortedNames;

        /**
         * comparison function
         */
        function compareColumns(a, b) {

            var aData = a["data"];
            var bData = b["data"];

            if (aData.length != aData.length) {
                console.log(a["column"] + " and " + b["column"] + " have different number of scores.");
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
    this.sortColumns = function(rowName, datatype, cellList) {
        var sortedNames = new Array();

        // columns is one row of cells from the data
        var columns = cellList;
        if (columns == null) {
            columns = this.getCells(null, rowName, null);
        }
        columns.sort(compareCells);

        /**
         * comparison function
         */
        function compareCells(a, b) {
            // check datatype
            var aType = a.getDatatype();
            var bType = b.getDatatype();
            if (datatype == null) {
                // TODO no datatype specified
            } else if ((aType != datatype) && (bType != datatype)) {
                return 0;
            } else if (aType != datatype) {
                return -1;
            } else if (bType != datatype) {
                return 1;
            }

            // check value
            var aVal = a.getValue();
            var bVal = b.getValue();
            if ((aVal == null) && (bVal == null)) {
                return 0;
            } else if (aVal == null) {
                return -1;
            } else if (bVal == null) {
                return 1;
            } else if (aVal > bVal) {
                return 1;
            } else if (aVal < bVal) {
                return -1;
            } else {
                return 0;
            }
        }

        for (var i in columns) {
            var cellData = columns[i];
            sortedNames.push(cellData.getColumn());
        }

        return sortedNames;
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
