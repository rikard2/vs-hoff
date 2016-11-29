'use strict';
import * as vscode from 'vscode';
import { Resultset } from './query'
export class HoffQueryTextDocumentContentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    constructor(private resultset: Resultset) { }

    public provideTextDocumentContent(uri: vscode.Uri): string {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            return this.snippet(editor.document);
        } else {
            return 'no editor';
        }
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }

    private snippet(document: vscode.TextDocument): string {
        let html = '<table>';

        if (this.resultset.error) {
            return '<div>Error: ' + this.resultset.error + '</div>';
        }

        let notices = this.resultset.notices.map((n) => {
            return '<div>Notice: ' + n + '</div>'; 
        }).join('');

        let th = this.resultset.columns.map((column) => {
            return '<th>' + column.name + '</th>';
        }).join('');

        let tr = this.resultset.rows.map((row: Object[]) => {
            return '<tr>' + row.map((column: string) => {
                return '<td>' + column + '</td>';
            }).join('') + '</tr>';
        }).join('');

        return `
        <style>
            table td {
                border: 1px solid #efefef;
                padding: 5px;
            }
        </style>
        ` + notices + `
        <table>
        <thead>
            ` + th + `
        </thead>
        <tbody>
            ` + tr + `
        </tbody>
        </table>
        `;
    }
}