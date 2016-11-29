'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode                          from 'vscode';
import { HoffCompletionItemProvider }       from './providers/completionItemProvider';
import { HoffQuery }                        from './query/query';
import { HoffConnection }                   from './common/connection'
import { HoffHoverProvider }                from './providers/hoverProvider'
import { HoffSignatureHelpProvider }        from './providers/signatureHelpProvider'

const SQL: vscode.DocumentFilter = { language: 'sql', scheme: 'file' };

export function activate(context: vscode.ExtensionContext) {
    console.log('Amazing stuff, this!')

    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(SQL, new HoffCompletionItemProvider(context), '.', ' '));
    context.subscriptions.push(vscode.languages.registerHoverProvider(SQL, new HoffHoverProvider()));
    context.subscriptions.push(vscode.languages.registerSignatureHelpProvider(SQL, new HoffSignatureHelpProvider(), '('));
    context.subscriptions.push(vscode.commands.registerCommand('extension.chooseConnection', HoffConnection.Choose));
    context.subscriptions.push(vscode.commands.registerCommand('extension.executeQuery', () => { HoffQuery.ConnectAndExecute() }));
}
export function deactivate() { }
