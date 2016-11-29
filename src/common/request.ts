var Request = require('request');

export interface HoffServerRequest {
}

export interface HoffServerResponse {
}

export class HoffRequest {
    public static Call(name: string, request: HoffServerRequest = null): Promise<Object> {
        if (name == 'signatures') {
            return HoffRequest.Signatures();
        }
        if (!request) {
            return HoffRequest.Get(name);
        }
        else {
            return HoffRequest.Post(name, request);
        }
    }

    public static Signatures(): Promise<Object> {
        let obj =
            {
                "activeparameter": 3,
                "activesignature": 0,
                "signatures": [
                    {
                        "parameters": [
                            { "label": "UserID", "type": "integer" },
                            { "label": "UserName", "type": "text" },
                            { "label": "OrderID", "type": "bigint" },
                            { "label": "OrderType", "type": "text" }
                        ]
                    },
                    {
                        "parameters": [
                            { "label": "UserID", "type": "integer" },
                            { "label": "UserName", "type": "text" },
                            { "label": "OrderID", "type": "bigint" }
                        ]
                    }
                ] 
            };

        return Promise.resolve<Object>(obj);
    }

    private static Post(name, data): Promise<Object>
    {
        return new Promise<Object>((resolve, reject) => {
            var formData = {};

            for (let i = 0; i < Object.keys(data).length; i++) {
                let key = Object.keys(data)[i];

                if (data[key] != null) {
                    formData[key] = data[key];
                }
            }

            var post_options = {
                url: 'http://127.0.0.1:5000/' + name,
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'cache-control': 'no-cache'
                },
                formData: formData
            };

            Request(post_options, function(error, response, body) {
                if (!body) return reject('no body');
                if (error) return reject(error);

                let bodyJSON = JSON.parse(body)
                resolve(bodyJSON);
            });
        });
    }

    private static Get(name): Promise<Object>
    {
        return new Promise<Object>((resolve, reject) => {
            var post_options = {
                url: 'http://127.0.0.1:5000/' + name,
                method: 'GET',
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'cache-control': 'no-cache'
                }
            };

            Request(post_options, function(error, response, body) {
                if (!body) return reject('no body');
                if (error) return reject(error);

                let bodyJSON = JSON.parse(body)
                resolve(bodyJSON);
            });
        });
    }
}