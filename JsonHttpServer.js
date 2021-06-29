const http = require('http');
module.exports = class JsonHttpServer{
    
    constructor(serverPort){
        const _this = this;
        this.serverPort = serverPort;
        
        this.server = http.createServer((request, response) => {
            _this.handle(request, response);
        });
    }

    listen(){
        this.server.listen(this.serverPort);
    }

    stop(){
        this.server.close();
    }

    handle(request, response){
        try{
            if(!request.url.startsWith('/?json=')){
                return;
            }
    
            var sub = request.url.substr('/?json='.length);
            var decoded = JSON.parse(decodeURIComponent(sub));

            if(this.onData != null && typeof(this.onData) == 'function'){
                this.onData(decoded, request, response);
            }else{
                response.end(JSON.stringify(decoded));
            }
        }catch(ex){
            response.statusCode = 500;
            response.end(JSON.stringify({message: `Can't read json, ${ex}`}));
        }
    }
}