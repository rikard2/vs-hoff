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
        let provider = new HoffQueryTextDocumentContentProvider();
        let providerName = 'resultset-preview';
        let reg = vscode.workspace.registerTextDocumentContentProvider(
            'resultset-preview',
            provider
        );
    }

    public static Timeout(): Promise<Boolean> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 100);
        });
    }

    public static LoopIt(name, provider: HoffQueryTextDocumentContentProvider): Promise<Resultset> {
        return HoffRequest.Call(name)
            .then((resultset: Resultset) => {
                HoffQuery.resultsets[resultset.queryid] = resultset;
                if (resultset.error) {
                    return Promise.resolve<Resultset>(resultset);
                }
                if (resultset.executing || !resultset.complete) {
                    return HoffQuery.Timeout().then( () => {
                        return this.LoopIt(name, provider);
                    });
                } else {
                    return Promise.resolve<Resultset>(resultset);
                }
            });
    }

    public static ConnectAndExecute(context: vscode.ExtensionContext, provider: HoffQueryTextDocumentContentProvider): Promise<void> {
        HoffQuery.resultsets = {};
        return HoffConnection.MaybeChoose()
            .then( (connection: HoffConnection) => {
                if (connection) {
                    this.Execute(context, connection, provider);
                }
            })
            .catch((error) => {
            });
    }

    public static resultsets: Object = { };
    public static Execute(context: vscode.ExtensionContext, connection: HoffConnection, provider: HoffQueryTextDocumentContentProvider): Promise<void> {
        let doc = vscode.window.activeTextEditor.document;
        let text = doc.getText();

        let request = new HoffServerQueryResultRequest();
        request.query = text;
        request.alias = connection.alias;
        return HoffRequest.Call('query', request).then((result) => {
            return Promise.all<Resultset>(result['queryids'].map(queryId => {
                return HoffQuery.LoopIt('result/' + queryId, provider).then(x => {
                    return x;
                });
            })).then(resultsets => {
                provider.update( vscode.Uri.parse('css-preview://authority/css-preview'), resultsets );
                //return resultsets;
            });
        });
    }

    private static _providers: vscode.Disposable[] = [];
    public static _provider: HoffQueryTextDocumentContentProvider = null;

}