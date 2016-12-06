'use strict';
import * as vscode from 'vscode';
import { Resultset } from './query'
export class HoffQueryTextDocumentContentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _resultsets: Resultset[];
    private resultset: Resultset;
    constructor() {
    }

    public provideTextDocumentContent(uri: vscode.Uri): string {
        return this.snippet();
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    public update(uri: vscode.Uri, resultsets: Resultset[]) {
        this._resultsets = resultsets;
        this.resultset = resultsets[0];
        this._onDidChange.fire(uri);
    }

    private snippet2(document: vscode.TextDocument): string {
        if (!this.resultset) {
            return 'no resultset';
        }
        return '<div>' + this.resultset.rows.length + Math.random() + '</div>';
    }
    private snippet(): string {
        
        if (!this._resultsets || this._resultsets.length == 0) {
            return 'no resultset';
        }
        console.log('resultsets', this._resultsets);
        let resultsetHtmls: string[] = [];
        let resultsetJsons: Object[] = [];

        this._resultsets.forEach((resultset, index) => {
            console.log('RESULTSET', resultset);
            let resultsetHtml: string = '';
            if (resultset.executing) {
                resultsetHtml += 'Executing...';
            }
            if (this.resultset.notices != null) {
                let notices = this.resultset.notices.map((n) => {
                    return '<div>Notice: ' + n + '</div>'; 
                }).join('');
                resultsetHtml += notices;
            }
            if (resultset.error) {
                resultsetHtml = `<div style="font-weight: bold;font-size: 13px;margin-bottom: 5px;">` + (resultset.statusmessage || 'Error') + `</div>
                        <div>` + resultset.error + `</div>`;
                resultsetHtmls.push(resultsetHtml);
                resultsetJsons.push({});
                console.log('error', resultset.error);

                return;
            }
            resultsetHtml += `
                <div style="font-weight: bold;font-size: 13px;margin-bottom: 5px;">` + (resultset.statusmessage || '---') + `</div>
                <div style="margin-bottom: 10px;" id="table` + (index + 1) + `"></div>`;
            resultsetHtmls.push(resultsetHtml);

            let columns = (resultset.columns || []).map((column) => {
                return {
                    name: column.name
                }
            });

            let rows = (resultset.rows || []).map((row: Object[]) => {
                if (row != null) {
                    return row.map((column: string) => {
                        return column;
                    });
                } else {
                    return [];
                }
            });
            resultsetJsons.push({ "columns": columns, "rows": rows });
        });
        
        console.log(resultsetHtmls);
        console.log(resultsetJsons);

        let total = `<html>
<head>
    <style>
        table.cellery {
  cursor: default;
  font-family: Menlo;
  border-width: 1px;
  font-size: 12px;
  border-collapse: collapse;
  user-select: none;
  -o-user-select: none;
  -moz-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none; }

table.cellery td.marked {
  background: rgba(71, 179, 255, 0.2); }

table.cellery td.air {
  border: none;
  width: 1px; }

table.cellery td, table th {
  padding: 5px 7px; }

table.cellery td.number {
  color: #333;
  border: 1px solid #f0f0f0; }

table.cellery td {
  border-width: 1px;
  border-style: solid;
  border-color: #efefef; }

table.cellery td.header {
  border-width: 1px;
  border-style: solid;
  border-color: #e0e0e0;
  background-color: #efefef;
  cursor: pointer; }
  table.cellery td.header:hover {
    font-weight: bold; }
    </style>
</head>
<br/> ` + resultsetHtmls.join('') + `
<script>
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
function Cellery(selector, data, options) {
    var tableData = new tableData_1.TableData();
    tableData.columns = data['columns'].map(function (column) {
        var c = new tableData_1.TableColumn();
        c.name = column.name;
        if (column.sort) {
            c.sort = column.sort;
        }
        return c;
    });
    tableData.rows = data['rows'];
    var tableElement = document.getElementById(selector);
    var t = new table_1.Table(tableElement, tableData, options);
    if (options && options.onCopy) {
        document.body.oncopy = function () {
            var selection = t.getSelection();
            options.onCopy(selection);
            return false;
        };
    }
}
exports.Cellery = Cellery;
window['Cellery'] = Cellery;
var table_1 = require('./table');
var tableData_1 = require('./tableData');

},{"./table":4,"./tableData":6}],2:[function(require,module,exports){
"use strict";
var Grip = (function () {
    function Grip(_targetElement) {
        var _this = this;
        this._targetElement = _targetElement;
        this._grip = document.createElement('div');
        this._grip.innerHTML = "&nbsp;";
        this._grip.style.top = '0';
        this._grip.style.right = '0';
        this._grip.style.bottom = '0';
        this._grip.style.width = '10px';
        this._grip.style.position = 'absolute';
        this._grip.style.cursor = 'col-resize';
        this._grip.addEventListener('mousedown', function (e) {
            _this._mouseDown = true;
            _this._offset = _targetElement.offsetWidth - e.pageX;
        });
        this.attach();
    }
    Grip.prototype.attach = function () {
        var _this = this;
        this._targetElement.appendChild(this._grip);
        document.addEventListener('mousemove', function (e) {
            if (_this._mouseDown) {
                _this._targetElement.style.width = _this._offset + e.pageX + 'px';
            }
        });
        document.addEventListener('mouseup', function (e) {
            _this._mouseDown = false;
        });
    };
    return Grip;
}());
exports.Grip = Grip;

},{}],3:[function(require,module,exports){
"use strict";
var Selection = (function () {
    function Selection() {
        var _this = this;
        this._selectables = [];
        this._selection = [];
        this._startSelection = null;
        this._endSelection = null;
        this._mouseupListeners = [];
        this._positionMap = {};
        document.addEventListener('mouseup', function (e) {
            _this.mouseup();
            _this._mouseupListeners.forEach(function (listener) {
                if (listener)
                    listener();
            });
        });
    }
    Selection.prototype.getSelection = function () {
        return this._selection.map(function (selection) {
            var x = {
                "column": selection.column,
                "row": selection.row,
                "value": selection.value
            };
            return x;
        });
    };
    Selection.prototype.clearAreaSelection = function () {
        this._selection = [];
        this._startSelection = null;
        this._endSelection = null;
    };
    Selection.prototype.redrawSelection = function () {
        var _this = this;
        this._selectables.forEach(function (selectable) {
            _this.deselectCell(selectable);
        });
        this._selection.forEach(function (selection) {
            _this.selectCell(selection);
        });
        this.getAreaSelection().forEach(function (selection) {
            _this.selectCell(selection);
        });
    };
    Selection.prototype.selectCell = function (cell) {
        cell.selected = true;
        cell.element.classList.add('marked');
    };
    Selection.prototype.deselectCell = function (cell) {
        cell.selected = false;
        cell.element.classList.remove('marked');
    };
    Selection.prototype.attachSelectable = function (selectable) {
        var _this = this;
        this._selectables.push(selectable);
        this._positionMap[selectable.column + '_' + selectable.row] = selectable;
        selectable.element.addEventListener('mousedown', function (e) {
            _this.selectableMousedown(selectable, e.metaKey, e.shiftKey);
        });
        selectable.element.addEventListener('mousemove', function (e) {
            _this.selectableMousemove(selectable, e.ctrlKey, e.shiftKey);
        });
    };
    Selection.prototype.selectableMousedown = function (selectable, ctrlKey, shiftKey) {
        if (selectable.selected) {
            if (this._selection.length == 1) {
                this.clearAreaSelection();
                this.redrawSelection();
                return;
            }
            else if (ctrlKey) {
                if (this._endSelection == null && this._startSelection != null) {
                    this._selection.splice(this._selection.indexOf(selectable), 1);
                    this.deselectCell(selectable);
                    return;
                }
            }
        }
        if (!ctrlKey && !shiftKey) {
            this.clearAreaSelection();
        }
        if (shiftKey && this._startSelection) {
            this._endSelection = selectable;
        }
        else {
            this._startSelection = selectable;
            this._endSelection = selectable;
        }
        this.redrawSelection();
    };
    Selection.prototype.selectableMousemove = function (selectable, ctrlKey, shiftKey) {
        if (this._endSelection) {
            this._endSelection = selectable;
        }
        this.redrawSelection();
    };
    Selection.prototype.mouseup = function () {
        var _this = this;
        this.getAreaSelection().forEach(function (selection) {
            _this._selection.push(selection);
        });
        this._endSelection = null;
    };
    Selection.prototype.getAreaSelection = function () {
        var selection = [];
        if (this._startSelection && this._endSelection) {
            var startX = Math.min(this._startSelection.column, this._endSelection.column);
            var endX = Math.max(this._startSelection.column, this._endSelection.column);
            var startY = Math.min(this._startSelection.row, this._endSelection.row);
            var endY = Math.max(this._startSelection.row, this._endSelection.row);
            for (var x = startX; x <= endX; x++) {
                for (var y = startY; y <= endY; y++) {
                    if (this._positionMap[x + '_' + y]) {
                        selection.push(this._positionMap[x + '_' + y]);
                    }
                }
            }
        }
        return selection;
    };
    return Selection;
}());
exports.Selection = Selection;

},{}],4:[function(require,module,exports){
"use strict";
var Table = (function () {
    function Table(element, _data, options) {
        this.element = element;
        this._data = _data;
        this.options = options;
        this._selection = new selection_1.Selection();
        this._table = document.createElement('table');
        this._table.classList.add('cellery');
        element.appendChild(this._table);
        this._table.appendChild(this.createColumns());
        this.createRows();
    }
    Table.prototype.getSelection = function () {
        return this._selection.getSelection();
    };
    Table.prototype.createColumns = function () {
        var _this = this;
        var thead = document.createElement('thead');
        var tr = thead.appendChild(document.createElement('tr'));
        this._data.columns.forEach(function (column, colIndex) {
            var th = document.createElement('td');
            th.classList.add('header');
            th.style.position = 'relative';
            th.textContent = column.name;
            th.addEventListener('mousedown', function (e) {
                _this._data.SortColumn(colIndex);
                _this.createRows();
            });
            var grip = new grip_1.Grip(th);
            tr.appendChild(th);
        });
        return thead;
    };
    Table.prototype.createRows = function () {
        var _this = this;
        if (this._tbody) {
            this._table.removeChild(this._tbody);
        }
        this._tbody = document.createElement('tbody');
        this._table.appendChild(this._tbody);
        this._data.rows.forEach(function (row, rowIndex) {
            var tr = _this._tbody.appendChild(document.createElement('tr'));
            row.forEach(function (column, columnIndex) {
                var td = document.createElement('td');
                td.style.position = 'relative';
                td.textContent = (column || 'NULL').toString();
                var tc = new tableCell_1.TableCell();
                tc.column = columnIndex;
                tc.value = (column || 'NULL').toString();
                tc.row = rowIndex;
                tc.element = td;
                _this._selection.attachSelectable(tc);
                tr.appendChild(td);
                _this._tbody.appendChild(tr);
            });
        });
        return this._tbody;
    };
    return Table;
}());
exports.Table = Table;
var tableCell_1 = require('./tableCell');
var grip_1 = require('./grip');
var selection_1 = require('./selection');

},{"./grip":2,"./selection":3,"./tableCell":5}],5:[function(require,module,exports){
"use strict";
var TableCell = (function () {
    function TableCell() {
    }
    return TableCell;
}());
exports.TableCell = TableCell;

},{}],6:[function(require,module,exports){
"use strict";
var TableColumn = (function () {
    function TableColumn() {
        this.sort = function (a, b) {
            var n = a > b ? 1 : a == b ? 0 : -1;
            return n;
        };
    }
    return TableColumn;
}());
exports.TableColumn = TableColumn;
var TableData = (function () {
    function TableData() {
    }
    TableData.prototype.SortColumn = function (index) {
        var _this = this;
        var asc = this.columns[index].ascending = !this.columns[index].ascending;
        this.rows.sort(function (a, b) {
            return _this.columns[index].sort(a[index], b[index]) * (asc ? 1 : -1);
        });
    };
    return TableData;
}());
exports.TableData = TableData;

},{}]},{},[1])</script>
<script>
         var cellery = window['Cellery'];
         ` + resultsetJsons.map((x, index) => {
             return `cellery('table` + (index + 1) + `', ` + JSON.stringify(x) + `, {
                onCopy: function(cells) {
                    console.log('on copy', 'boom', cells);
                }
            });`;
         }).join('') + `
    </script>
</script>
</html>
        `;
                                                                          
        return total;
    }
}