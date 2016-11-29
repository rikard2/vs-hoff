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
        if (!connection.alias) {
            return Promise.resolve<vscode.CompletionItem[]>([]);
        }

        let request = new HoffServerCompletionRequest();
        request.pos = absolutPosition;
        request.query = text;
        request.alias = connection.alias;

        return HoffRequest.Call('completions', request)
            .then((response: HoffServerCompletionResponse[]) => {
                return response.map( (completion: HoffServerCompletionResponse) => {
                    return new vscode.CompletionItem(completion.text);
                });
            })
            .catch( (error) => {
                console.log('error', error)
            });
    }
}