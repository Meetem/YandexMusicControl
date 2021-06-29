const format = require('string-format');
const split = require('split-string');
const http = require('http');
const fs = require('fs');
const JsonHttpServer = require('./JsonHttpServer');

var currentPlayback = {
    playing: false,
    title: null,
    author: null,
    hasPrev: false,
    hasNext: false,
    isLiked: false,
}

format.extend(String.prototype, {})

function read(filePath, encoding = 'utf8') {
    return fs.readFileSync(filePath, encoding);
}

const cfg = JSON.parse(read('config.json'));
const server = new JsonHttpServer(cfg.httpPort);

function performPlay(direction, response) {
    let responseJson = {
        error: null
    };

    if (!server.isConnected) {
        responseJson.error = 'not connected';
    } else {
        try {
            let playCommand = {
                type: 'play',
                direction: direction
            };

            server.write(JSON.stringify(playCommand));
        } catch (ex) {
            responseJson.error = ex.toString()
        }
    }

    response.end(JSON.stringify(responseJson));
}

function handleRequest(request, response) {
    var url = request.url;
    console.log(url);

    if (url == '/') {
        response.end(read('index.html'));
    } else if (url.startsWith('/getPlayback')) {
        response.end(JSON.stringify(currentPlayback));
    } else if (url.startsWith('/next')) {
        performPlay(1, response);
    } else if (url.startsWith('/playPause')) {
        performPlay(0, response);
    } else if (url.startsWith('/prev')) {
        performPlay(-1, response);
    }else{
        response.statusCode = 404;
        response.end('Not found');
    }
}

function returnHttp(data, response){
    if(data == null){
        response.end(JSON.stringify({code:0}))
        return
    }

    response.statusCode = (data.statusCode != null) ? data.statusCode : 500
    response.end(JSON.stringify({code: data.code, message: data.message}))
    return true
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

        currentPlayback = newPlayback
        console.log(`updated playback with ${JSON.stringify(currentPlayback)}`)
        returnHttp(null, response);
    }else{
        returnHttp({code:999, message: `unknown request type ${type}`}, response);
    }
}

http.createServer(handleRequest).listen(cfg.controlPort);
