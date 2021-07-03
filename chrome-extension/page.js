$.fn.exists = function () {
    return this.length !== 0;
}

import HomePagePlaylist from './HomePagePlaylist.js'
import ExtCommunication from './ExtensionCommunication.js'

const communication = new ExtCommunication(handleMessage);

console.log('Yandex.Music external control extension loaded');
var pageLoaded = false;
var timerId = undefined;
var shouldSendUpdate = true;
var prevIdx = -1;
var playlists = [];
var prevplaylistsJson = '';

function getExternalApi(){
    return externalAPI;
}

function convertTrackInfo(yandexTrack) {
    if (yandexTrack == null)
        return null;

    return yandexTrack;
}

function updatePlaylists(){
    playlists.forEach((v) => {
        v.update()
    });

    const newPlaylists = JSON.stringify(playlists.map((v) => v.serialize()));
    if(newPlaylists !== prevplaylistsJson){
        shouldSendUpdate = true;
    }

    prevplaylistsJson = newPlaylists;
}

function sendGetInfo(sendPlaylist, sendResponse, force = false) {
    updatePlaylists();

    if(force)
        shouldSendUpdate = true;
    
    const controls = externalAPI.getControls();
    var playlist = null;
    if (sendPlaylist == true) {
        var tracks = getExternalApi().getTracksList();
        if (tracks == null)
            tracks = [];

        playlist = tracks.map((v, idx, arr) => convertTrackInfo(v))
    }

    sendResponse({
        code: 0,
        cached: false,
        idx: getExternalApi().getTrackIndex(),
        controls: controls,
        current: convertTrackInfo(getExternalApi().getCurrentTrack()),
        source: getExternalApi().getSourceInfo(),
        playlist: playlist,
        homePlaylists: playlists.map((v) => v.serialize())
    });

    shouldSendUpdate = false;
}

function handleMessage(message, sendResponse, sender){
    var controls = getExternalApi().getControls();
    var trackIdx = getExternalApi().getCurrentTrack();
    if (prevIdx != trackIdx) {
        shouldSendUpdate = true;
    }

    const msgStr = message.type.toString();
    console.log(`got message: ${msgStr}`);
    if (msgStr === 'play-pause') {
        getExternalApi().togglePause();
        shouldSendUpdate = true;
        sendResponse({ code: 0 });
    } else if (msgStr == 'play') {
        var extraId = message.extra;
        if(extraId !== undefined && typeof(extraId) === 'string')
            extraId = parseInt(extraId);

        if(extraId === undefined || typeof(extraId) !== 'number'){
            getExternalApi().play();
        }else{
            getExternalApi().play(extraId);
        }

        shouldSendUpdate = true;
        sendResponse({ code: 0 });
    }else if(msgStr == 'set-playlist'){
        const playlistName = message.extra;
        console.log('setting playlist', playlistName);

        if(playlistName == 'radio'){
            getExternalApi().play(-1);
            shouldSendUpdate = true;
            sendResponse({ code: 0 });
            return;
        }
        
        for(var i = 0;i<playlists.length;i++){
            var pl = playlists[i];
            if(pl == null || pl.name !== playlistName)
                continue;

            if(pl.available !== true){
                sendResponse({ code: 1, message: 'playlist unavailable' });
                return;
            }

            pl.play();
            sendResponse({ code: 0, message: 'playlist unavailable' });
        }
    }else if (msgStr == 'toggle-play') {
        getExternalApi().togglePause();
        shouldSendUpdate = true;
        sendResponse({ code: 0 });
    }else if (msgStr == 'play-radio') {
        getExternalApi().play(-1);
        shouldSendUpdate = true;
        sendResponse({ code: 0 });
    } else if (msgStr == 'next') {
        if (controls.next === null) {
            sendResponse({ code: 1, message: 'no next track' });
            return;
        }

        shouldSendUpdate = true;
        getExternalApi().next();
        sendResponse({ code: 0 });
    } else if (msgStr == 'prev') {
        if (controls.prev === null) {
            sendResponse({ code: 1, message: 'no prev track' });
            return;
        }

        shouldSendUpdate = true;
        getExternalApi().prev();
        sendResponse({ code: 0 });
    } else if (msgStr == 'toggle-like') {
        shouldSendUpdate = true;
        getExternalApi().toggleLike();
        sendResponse({ code: 0 });
    } else if (msgStr == 'toggle-shuffle') {
        if (controls.shuffle === null) {
            sendResponse({ code: 1, message: 'no shuffle allowed' });
            return;
        }

        shouldSendUpdate = true;
        getExternalApi().toggleShuffle();
        sendResponse({ code: 0 });
    } else if (msgStr.startsWith('get-info')) {
        sendGetInfo(false, sendResponse, msgStr.endsWith('-force'));
    } else if (msgStr.startsWith('get-playlist')) {
        sendGetInfo(true, sendResponse, msgStr.endsWith('-force'))
    }
};

function pageReady() {
    getExternalApi().navigate('home');
    
    playlists.push(new HomePagePlaylist('auto-playlist_of_the_day', 'Плейлист дня'))
    playlists.push(new HomePagePlaylist('auto-never_heard', 'Дежавю'))
    playlists.push(new HomePagePlaylist('auto-missed_likes', 'Тайник'))
    updatePlaylists();
    
    pageLoaded = true;
    communication.initialize();
    console.log('page ready, api loaded');
}

function checkApiReady() {
    console.log(getExternalApi());

    if (getExternalApi() === undefined)
        return;

    pageReady();

    if (timerId !== undefined)
        clearInterval(timerId);
}

var initFunc = () =>{
    checkApiReady();

    if (!pageLoaded) {
        timerId = setInterval(() => {
            checkApiReady();
        }, 200);
    }
};

initFunc();