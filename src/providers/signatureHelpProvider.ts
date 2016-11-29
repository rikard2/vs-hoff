'use strict';

import { SignatureHelpProvider, SignatureHelp, SignatureInformation, ParameterInformation, TextDocument, Position, CancellationToken } from 'vscode';
import { HoffRequest } from '../common/request';

class SignatureParameter {
    label: string;
    type: string;
}

class Signature {
    parameters: SignatureParameter[];
}

class Signatures {
    signatures: Signature[];
    activeparameter: number;
    activesignature: number;
}

export class HoffSignatureHelpProvider implements SignatureHelpProvider {
    public provideSignatureHelp(document: TextDocument, position: Position, token: CancellationToken): Promise<SignatureHelp> {

       return HoffRequest.Call('signatures').then((signatures: Signatures) => {
            let signatureHelp = new SignatureHelp();
            signatureHelp.activeParameter = signatures.activeparameter;
            signatureHelp.activeSignature = signatures.activesignature;

            signatureHelp.signatures = signatures.signatures.map((signature) => {
                let info = new SignatureInformation('');

                info.label = signature.parameters.map((parameter) => {
                    return parameter.label;
                }).join(', ');

                info.parameters = signature.parameters.map((parameter) => {
                    return new ParameterInformation(parameter.label, parameter.type);
                });

                return info;
            });

            return signatureHelp; 
        })
        .catch((err) => {
            console.log('err');
        });
    }
}