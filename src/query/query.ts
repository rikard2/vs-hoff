'use strict';
import * as vscode from 'vscode';
import { HoffQueryTextDocumentContentProvider } from './queryTabDocumentProvider';
import { HoffRequest, HoffServerRequest } from '../common/request';
import { HoffConnection } from '../common/connection'

class HoffServerQueryResultRequest implements HoffServerRequest {
    query: string;
    alias: string;
}

export class ResultsetColumn {
    type: string;
    name: string;
    type_code: number;
}

export class Resultset {
    complete: boolean;
    timestamp: string;
    dynamic_alias: string;
    batchid: string;
    executing: boolean;
    queryid: string;
    runtime_seconds: number;
    transaction_status: string;
    statusmessage: string;

    rows: Object[];
    alias: string;
    error: string;
    notices: string[];
    columns: ResultsetColumn[];
}

export class HoffQuery {
    public constructor() {
    }

    public static Timeout(): Promise<Boolean> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 100);
        });
    }

    public static LoopIt(name): Promise<Object[]> {
        return HoffRequest.Call(name)
            .then((arr: Object[]) => {
                let alldone = true;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i]['executing']) {
                        alldone = false;
                    }
                }

                if (alldone) {
                    return arr;
                } else {
                    return HoffQuery.Timeout().then( () => {
                        return this.LoopIt(name);
                    });
                }
            });
    }

    public static ConnectAndExecute(): void {
        HoffConnection.MaybeChoose()
            .then( (connection: HoffConnection) => {
                if (connection) {
                    this.Execute(connection);
                }
            })
            .catch((error) => {

            });
    }

    public static Execute(connection: HoffConnection): void {
        let doc = vscode.window.activeTextEditor.document;
        let text = doc.getText();

        let request = new HoffServerQueryResultRequest();
        request.query = text;
        request.alias = connection.alias;
        HoffRequest.Call('query', request).then((result) => {
            let name = result['Url'].match(/result.+$/)[0];
            return HoffQuery.LoopIt(name).then((resultsets: Resultset[]) => {
                HoffQuery.ShowResultsets(resultsets);
            });
        });
    }

    private static _providers: vscode.Disposable[] = [];
    public static ShowResultsets(resultsets: Resultset[]) {
        let providers = resultsets.forEach((resultset, index) => {
            let provider = new HoffQueryTextDocumentContentProvider(resultset);
            let providerName = 'resultset-preview' + index;
            let reg = vscode.workspace.registerTextDocumentContentProvider(
                'resultset-preview' + index,
                provider
            );
            provider.update(vscode.Uri.parse(
                'resultset-preview' + index + '://authority/' + providerName
            ));

            vscode.commands.executeCommand(
                'vscode.previewHtml',
                vscode.Uri.parse(
                    'resultset-preview' + index + '://authority/' + providerName
                ),
                vscode.ViewColumn.Two,
                resultset.statusmessage
            )
        });
    }
}