const http = require('http');
module.exports = class JsonHttpServer {

    constructor(serverPort) {
        const _this = this;
        this.serverPort = serverPort;

        this.server = http.createServer((request, response) => {
            _this.handle(request, response);
        });
    }

    listen() {
        this.server.listen(this.serverPort);
    }

    stop() {
        this.server.close();
    }

    handlePlainText(request, response) {
        if (request.method !== 'GET') {
            response.end(JSON.stringify({ code: 500, message: 'not a get request' }));
            return;
        }

        var sub = request.url.substr('/?json='.length);
        var decoded = JSON.parse(decodeURIComponent(sub));

        if (this.onData != null && typeof (this.onData) == 'function') {
            this.onData(decoded, request, response);
        } else {
            response.end(JSON.stringify(decoded));
        }
    }

    handlePostJson(request, response) {
        if (request.method !== 'POST') {
            response.end(JSON.stringify({ code: 500, message: 'not a post request' }));
            return;
        }

        let body = '';
        request.on('data', (chunk) => {
            body += chunk;
        });

        request.on('end', () => {
            body = body.trim();
            if (body.length < 2) {
                response.end(JSON.stringify({ code: 501, message: 'bad json' }));
                return;
            }

            if (body[0] == '\'' || body[0] == '\"')
                body = body.substr(1);

            if (body.length < 2) {
                response.end(JSON.stringify({ code: 501, message: 'bad json' }));
                return;
            }

            if (body[body.length - 1] == '\'' || body[body.length - 1] == '\"')
                body = body.substring(0, body.length - 1);

            let decoded = null;
            try {
                decoded = JSON.parse(body);

                if (decoded == null)
                    throw 'Decoded is null';
            } catch (parseEx) {
                response.end(JSON.stringify({ code: 501, message: `Can\'t parse json ${parseEx}` }));
                return;
            }

            if (this.onData != null && typeof (this.onData) == 'function') {
                this.onData(decoded, request, response);
            } else {
                response.end(JSON.stringify(decoded));
            }
        });
    }

    handle(request, response) {
        try {
            if (request.url.startsWith('/?json=')) {
                this.handlePlainText(request, response);
            } else if (request.url.startsWith('/?postJson')) {
                this.handlePostJson(request, response);
            }
        } catch (ex) {
            response.statusCode = 500;
            response.end(JSON.stringify({ message: `Can't read json, ${ex}` }));
        }
    }
}