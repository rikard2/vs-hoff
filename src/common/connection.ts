'use strict';

import * as vscode from 'vscode';
import { HoffRequest, HoffServerRequest } from './request';

class HoffServerConnection {
    public requiresauthkey: boolean;
    public connected: boolean;
}

class HoffServerConnectRequest implements HoffServerRequest {
    alias: string;
    authKey: string;
    method: string;
}
interface HoffServerConnectResponse {
    success: boolean;
    errormessage: string;
    alias: string;
}

export class ConnectionQuickListItem implements vscode.QuickPickItem {
    public label: string = "";
    public description: string = "";
    public detail: string = "";

    public connection: HoffConnection;

    public constructor(alias: string, hoffServerConnection: HoffServerConnection) {
        this.label = alias;
        this.connection = HoffConnection.CreateFromHoffServerConnection(alias, hoffServerConnection);
        if (this.connection.requiresAuthKey) {
            this.detail = "Requires auth key.";
        }
        if (this.connection.connected) {
            this.description = "Connected";
        }
    }
}

export class HoffConnection {
    public alias: string = "";
    public connected: boolean = false;
    public authKey: string = null;
    public requiresAuthKey: boolean = false;

    public constructor() {

    }
    public static CreateFromHoffServerConnection(alias: string, hoffServerConnection: HoffServerConnection): HoffConnection {
        let connection = new HoffConnection();

        connection.alias = alias;
        connection.requiresAuthKey = hoffServerConnection.requiresauthkey;
        connection.connected = hoffServerConnection.connected;

        return connection;
    }

    public static MaybeChoose(): Promise<HoffConnection> {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showErrorMessage("No active text editor");
            return Promise.resolve<HoffConnection>(null);
        }
        if (vscode.window.activeTextEditor['connection']) {
            return Promise.resolve<HoffConnection>(vscode.window.activeTextEditor['connection']);
        }

        return HoffConnection.Choose();
    }

    public static Choose(): Promise<HoffConnection> {
        return HoffRequest.Call('listservers')
            .then((connections: HoffServerConnection[]) => {
                let quickListItems = Object.keys(connections).map( (alias) => {
                    return new ConnectionQuickListItem(alias, connections[alias]);
                });

                return quickListItems;
            })
            .then((items) => {
                return vscode.window.showQuickPick(items);
            })
            .then((selected: ConnectionQuickListItem) => {
                if (selected.connection.requiresAuthKey) {
                    let options: vscode.InputBoxOptions = {
                        prompt: "Enter the auth key",
                        password: true
                    };
                    return vscode.window.showInputBox(options).then((authKey) => {
                        selected.connection.authKey = authKey;
                        return selected.connection;
                    });
                }

                return selected.connection;
            })
            .then((connection: HoffConnection) => {
                if (connection.connected) {
                    vscode.window.activeTextEditor['connection'] = connection;
                    return connection;
                }

                let request = new HoffServerConnectRequest();
                request.alias = connection.alias;
                request.authKey = connection.authKey;

                return HoffRequest.Call('connect', request)
                    .then((response: HoffServerConnectResponse) => {
                        if (response.success) {
                            vscode.window.showInformationMessage('Connected!');
                            vscode.window.activeTextEditor['connection'] = connection;
                        } else if (response.errormessage) {
                            throw new Error('Could not connect to ' + response.alias + '. Error message: ' + response.errormessage);
                        }

                        return connection;
                    });
            })
            .catch((error) => {
                console.log('error');
            });
    }
}