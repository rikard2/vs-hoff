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
        console.log('resultsets', resultsets);
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
        if (!this.resultset) {
            return 'no resultset';
        }
        if (this.resultset.executing) {
            return 'executing...';
        }
        let html = '<table>';

        if (this.resultset.error) {
            return '<div>Error: ' + this.resultset.error + '</div>';
        }

        if (this.resultset.notices != null) {
            let notices = this.resultset.notices.map((n) => {
                return '<div>Notice: ' + n + '</div>'; 
            }).join('');
        } else
        {
            console.log('wtf!', this.resultset);
        }

        let columns = {};
        this.resultset.columns.forEach((column) => {
            columns[column.name] = {};
        });

        this.resultset.rows = this.resultset.rows || [];
        let rows = this.resultset.rows.map((row: Object[]) => {
            if (row != null) {
                return row.map((column: string) => {
                    return column;
                });
            } else {
                return [];
            }
        });
        let obj = { "columns": columns, "rows": rows };
        let json = JSON.stringify(obj);

        let total = `<html>
<head>
    <style>
        table {
            cursor: default;
            font-family: Menlo;
            border-width: 1px;
            font-size: 11px;
            border-collapse: collapse;

             user-select: none;
            -o-user-select:none;
            -moz-user-select: none;
            -khtml-user-select: none;
            -webkit-user-select: none;
        }
        table td.marked {
            background: rgba(71, 179, 255, 0.2);

        }
        table td.air {
            border: none;
            width: 1px;
        }
        table td, table th {
            padding: 5px 7px;
        }
        table td.number {
            color: #333;
            border: 1px solid #f0f0f0;
        }
        table td {
            border-width: 1px;
            border-style: solid;
            border-color: #efefef;
        }
        table td.header {
            border-width: 1px;
            border-style: solid;
            border-color: #e0e0e0;
            background-color: #efefef;
        }
    </style>
</head>
<div style="font-family: Menlo;font-size: 13px;margin-bottom: 10px;font-weight: bold;">
    ` + this.resultset.statusmessage + `
</div>
<div id="demo"></div>
<script type="text/javascript">
var demo = document.getElementById("demo");
var excelling = { _resize: {} };

document.body.oncopy = function() {
    if (excelling._onCopy) {
        excelling._onCopy(excelling._clipboard);
        console.log(excelling._clipboard);
        return false;
    }
}
excelling._createGrip = function(th) {
    var grip = document.createElement('div');
    grip.innerHTML = "&nbsp;";
    grip.style.top = 0;
    grip.style.right = 0;
    grip.style.bottom = 0;
    grip.style.width = '10px';
    grip.style.position = 'absolute';
    grip.style.cursor = 'col-resize';
    grip.addEventListener('mousedown', function(e) {
        excelling._resize.thMousedown = th;
        excelling._resize.thStartOffset = th.offsetWidth - e.pageX;
    });

    return grip;
}
document.addEventListener('mousemove', function(e) {
    if (excelling._resize.thMousedown) {
        excelling._resize.thMousedown.style.width = excelling._resize.thStartOffset + e.pageX + 'px'; 
    }
});
document.addEventListener('mouseup', function () {
    excelling._resize.thMousedown = null;
    excelling.mouseUpListeners.forEach((l) => {
        if (l) l();
    });
});

excelling.mouseUpListeners = [];

excelling.FillTable = function(data, options) {
    excelling._onCopy = options['onCopy'];
    let table = document.createElement('table');
    let selections = [];
    let startSelectionCell = null;
    let endSelectionCell = null;

    if (data.columns) {
        let thead = document.createElement('thead');

        let trNumbers = thead.appendChild(document.createElement('tr'));
        trNumbers.appendChild(document.createElement('td')).classList.add('air');
        trNumbers.appendChild(document.createElement('td')).classList.add('air');
        Object.keys(data.columns).forEach( (key, index) => {
            let th = trNumbers.appendChild(document.createElement('td'));
            th.style.position = 'relative';
            th.textContent = '';
            th.classList.add('guide');
            let grip = excelling._createGrip(th);
            th.appendChild(grip);
        });

        let trAir = thead.appendChild(document.createElement('tr'));
        trAir.appendChild(document.createElement('td')).classList.add('air');
        Object.keys(data.columns).forEach( (key, index) => {
            trAir.appendChild(document.createElement('td')).classList.add('air');
        });
        trAir.appendChild(document.createElement('td')).classList.add('air');

        let tr = thead.appendChild(document.createElement('tr'));
        tr.appendChild(document.createElement('td')).classList.add('air');
        tr.appendChild(document.createElement('td')).classList.add('air');
        Object.keys(data.columns).forEach( (key) => {
            let th = tr.appendChild(document.createElement('td'));
            th.classList.add('header');
            th.style.position = 'relative';
            th.textContent = key;
        });

        table.appendChild(thead);
    }

    let cells = { };

    let select = function(clear) {
        if (clear) {
            excelling._clipboard = {};
            Object.keys(cells).forEach((key) => {
                cells[key]['td'].classList.remove('marked');
            });
        }
        if (startSelectionCell && endSelectionCell) {
            let startX = Math.min(startSelectionCell.col, endSelectionCell.col);
            let endX = Math.max(startSelectionCell.col, endSelectionCell.col);
            
            let startY = Math.min(startSelectionCell.row, endSelectionCell.row);
            let endY = Math.max(startSelectionCell.row, endSelectionCell.row);

            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    if (cells[x + '_' + y]) {
                        cells[x + '_' + y]['td'].classList.add('marked');
                        excelling._clipboard[x + '_' + y] = { value: cells[x + '_' + y]['value'], type: cells[x + '_' + y]['type'] };
                    }
                }    
            }
        }
        if (selections) {
            selections.forEach((s) => {
                cells[s.col + '_' + s.row];
                cells[x + '_' + y]['td'].classList.add('marked');
                excelling._clipboard[x + '_' + y] = { value: cells[x + '_' + y]['value'], type: cells[x + '_' + y]['type'] };
            });
        }
    }

    if (data.rows) {
        let tbody = document.createElement('tbody');

        data.rows.forEach( (row, rowIndex) => {
            let tr = tbody.appendChild(document.createElement('tr'));
            let tdNumber = tr.appendChild(document.createElement('td'));
            tdNumber.textContent = rowIndex + 1;
            tdNumber.classList.add('number');
            let tdAir = tr.appendChild(document.createElement('td')).classList.add('air');
            row.forEach( (key, colIndex) => { 
                let td = tr.appendChild(document.createElement('td'));
                cells[colIndex + '_' + rowIndex] = { td: td, value: key, type: data.columns[Object.keys(data.columns)[colIndex]] };
                td.textContent = key;
                td.addEventListener('mousedown', function(e) {
                    select(true);
                    td.classList.add('marked');
                    excelling.mouseUpListeners.push(function() {
                        startSelectionCell = null;
                        endSelectionCell = null;
                    });
                    startSelectionCell = { col: colIndex, row: rowIndex };
                    select();
                });
                td.addEventListener('mousemove', function(e) {
                    if (startSelectionCell) {
                        endSelectionCell = { col: colIndex, row: rowIndex };
                    }
                    select();
                });
            });
        });

        table.appendChild(tbody);
    }

    demo.appendChild(table);
}

//demo.appendChild(document.createElement('<div>asd</div>'));


excelling.FillTable(` + json + `, {
    "onCopy": function() {
        console.log('copy!');
    }
});</script>
</html>
        `;

        console.log(total);
        return total;
    }
}