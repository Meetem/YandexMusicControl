const format = require('string-format');
const split = require('split-string');
const http = require('http');
const fs = require('fs');
const JsonHttpServer = require('./JsonHttpServer');
const crypto = require('crypto')
var SingleInstance = require('single-instance');
const { exit } = require('process');
const mime = require('mime-type/with-db')

var locker = new SingleInstance('yandex-music-control-server');

locker.lock().then(() => {
    main()
}).catch((error) => {
    console.error(error);
    exit(0);
});

function main(){
    console.log('Yandex.Music external control');

    var postponedActions = [];
    var currentPlayback = null;
    var currentPlaybackHash = 0;
    
    format.extend(String.prototype, {})
    
    function read(filePath, encoding = 'utf8') {
        return fs.readFileSync(filePath, encoding);
    }
    
    function addPostponedAction(action){
        postponedActions.push(action);
    }
    
    const cfg = JSON.parse(read('config.json'));
    const server = new JsonHttpServer(cfg.httpPort);
    
    function returnHttp(data, response){
        if(data == null){
            response.end(JSON.stringify({code:0}))
            return
        }
    
        response.statusCode = (data.statusCode != null) ? data.statusCode : 500
        response.end(JSON.stringify({code: data.code, message: data.message}))
        return true
    }
    
    function setCurrentPlayback(playbackData){
        currentPlayback = playbackData;
        currentPlaybackHash = crypto.createHash('md5').update(JSON.stringify(playbackData)).digest('hex');
        //console.log(`Updated playback with`, currentPlayback, currentPlaybackHash);
    
        return {
            code: 0,
            message: 'success'
        }
    }
    
    server.listen()
    server.onData = function(jsonData, request, response){
        if(jsonData == null || jsonData.type == null)
            return returnHttp({code: 1, message: 'empty request'}, response)
    
        var type = jsonData.type
        if(type == 'updatePlayback'){
            var newPlayback = jsonData.payload
            if(newPlayback == null)
                return returnHttp({code: 2, message: 'empty playback'})
    
            returnHttp(setCurrentPlayback(newPlayback), response);
        }else if(type == 'getActions'){
            returnHttp({code: 0, message: postponedActions}, response);
            postponedActions = [];
        }else{
            returnHttp({code:999, message: `unknown request type ${type}`}, response);
        }
    }
    
    function handleApiRequest(apiUrl, response){
        var ret = {
            code: 0
        };
    
        if(apiUrl.length <= 1){
            return {code: 400, message: 'bad request'};
        }
    
        let parsedUrl = null;
        let params = null;
        let func = null;
    
        try{
            parsedUrl = new URL(apiUrl, 'http://none.com/');
            params = parsedUrl.searchParams;
            func = parsedUrl.pathname.substr(1);
        }catch(ex){
            return {code: 400, message: ex.toString()};
        }
    
        if(func == 'next' 
            || func == 'prev'
            || func == 'toggle-shuffle'
            || func == 'toggle-like'){
            addPostponedAction({action: func});
        }else if(func == 'play'){
            addPostponedAction({action: func, extra: params.get('id')});
        }else if(func == 'set-playlist'){
            addPostponedAction({action: func, extra: params.get('name')});
        }else if(func == 'toggle-play'){
            addPostponedAction({action: func});
        }else if(func == 'get-info'){
            var hash = params.get('hash');
            if(hash != currentPlaybackHash){
                ret.payload = {
                    cached: false,
                    playback: currentPlayback,
                    hash: currentPlaybackHash
                };
            }else{
                ret.payload = {
                    cached: true,
                    hash: currentPlaybackHash
                };
            }
        }else{
            ret.code = 404;
            ret.error = `can't find request ${func}`;
        }
    
        response.end(JSON.stringify(ret));
    }
    
    function handleExternalRequest(request, response) {
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
            'Access-Control-Max-Age': 2592000, // 30 days
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Request-Method': '*',
            'Allow': 'GET, POST, OPTIONS, PUT, DELETE',
            'Content-Security-Policy': 'default-src http: http:'
        };
    
        if (response.method === 'OPTIONS') {
            response.writeHead(204, headers);
            response.end();
            return;
        }
    
        let url = new URL('http://fakehost' + request.url);
        let path = url.pathname;
        let searchFull = path + url.search;
        //console.log(searchFull);

        //console.log(path);
        if (!path.startsWith('/api/') && !path.startsWith('/scripts/')) {
            if(path == '/'){
                path = 'index.html';
            }else if(path.startsWith('./')){
                path = path.substr(2);
            } else if(path[0] == '/'){
                path = path.substr(1);
            }
            
            try{
                path = decodeURIComponent(path).replace(/\/+/g, '/');
                const stats = fs.statSync(path);
                if (stats.isFile()) {
                    const stream = new fs.ReadStream(path);
                    const mimeType = mime.lookup(path);
                    //console.log(`Got mime ${mimeType} for ${path}`);

                    if(mimeType !== false){
                        headers['Content-Type'] = mimeType;
                    }

                    response.writeHead(200, headers);
                    stream.on('open', () => {
                        stream.pipe(response)
                    });
                }else{
                    throw 'Not a file'
                }
            }catch(ex){
                //console.log(ex, 'not found', path);
                response.writeHead(404);
                response.end('Not found');  
            }
            
        } else if (searchFull.startsWith('/api/')) {
            handleApiRequest(searchFull.substr('/api/'.length), response);
        }else{
            response.statusCode = 404;
            response.end('Not found');
        }
    }
    
    http.createServer(handleExternalRequest).listen(cfg.controlPort);
}
