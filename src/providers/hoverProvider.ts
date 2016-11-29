'use strict';

import { HoverProvider, Hover, TextDocument, Position, Range, CancellationToken } from 'vscode';

export class HoffHoverProvider implements HoverProvider {
    constructor() {
    }

    public provideHover(document: TextDocument, position: Position, token: CancellationToken): Promise<Hover> {
        return Promise.resolve<Hover>(new Hover(`\`\`\`sql
CREATE TABLE Users
(
    UserID integer,
    UserName text
)
\`\`\``));
    }
}