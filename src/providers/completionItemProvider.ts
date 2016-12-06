'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HoffRequest, HoffServerRequest, HoffServerResponse } from '../common/request';
import { HoffConnection } from '../common/connection';

class HoffServerCompletionRequest implements HoffServerRequest {
    pos: number;
    query: string;
    alias: string;
}
class HoffServerCompletionResponse implements HoffServerResponse {
    text: string;
}

export class HoffCompletionItemProvider implements vscode.CompletionItemProvider {
    public constructor(context: vscode.ExtensionContext) {
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
        let text = document.getText();
        let absolutPosition = document.offsetAt(position);

        let connection: HoffConnection = vscode.window.activeTextEditor['connection'];
        if (!connection || !connection.alias) {
            return Promise.resolve<vscode.CompletionItem[]>([]);
        }

        let request = new HoffServerCompletionRequest();
        request.pos = absolutPosition;
        request.query = text;
        request.alias = connection.alias;

        return HoffRequest.Call('completions', request)
            .then((response: HoffServerCompletionResponse[]) => {
                let a = 'A';
                return response.map( (completion: HoffServerCompletionResponse, index) => {
                    console.log('index', completion.text, index);
                    if (index >= 100) return Promise.resolve<vscode.CompletionItem[]>([]);
                    let c = new vscode.CompletionItem(completion.text, vscode.CompletionItemKind.Class);
                    c.detail = String.fromCharCode(97 + index) + ' => ' + index;
                    c.sortText = a;
                    a += 'A';
                    return c;
                });
            })
            .catch( (error) => {
                console.log('error', error)
            });
    }
}