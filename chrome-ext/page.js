console.log('Yandex.Music external control extension loaded');
var pageLoaded = false;
var timerId = undefined;
var shouldSendUpdate = true;
var prevIdx = -1;

function getExternalApi(){
    return externalAPI;
}

function convertTrackInfo(yandexTrack) {
    if (yandexTrack == null)
        return null;

    return yandexTrack;
}

function sendGetInfo(sendPlaylist, sendResponse, force = false) {
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
        playlist: playlist
    });

    shouldSendUpdate = false;
}

function onExtensionMessage(evt){
    const detail = evt.detail;
    const message = detail.message.type;
    
    var sendResponse = (reponseObject) => {
        const event = new CustomEvent("onWriteMessageAnswer", {
            detail: {
                response: reponseObject,
                sendResponse: detail.sendResponse
            }
        });

        document.dispatchEvent(event);
    }

    if (!pageLoaded) {
        console.log('page not loaded');
        sendResponse({ code: -1 });
        return;
    }

    var controls = getExternalApi().getControls();
    var trackIdx = getExternalApi().getCurrentTrack();
    if (prevIdx != trackIdx) {
        shouldSendUpdate = true;
    }

    const msgStr = message.toString();
    console.log(`got message: ${msgStr}`);
    if (msgStr === 'play-pause') {
        getExternalApi().togglePause();
        shouldSendUpdate = true;
        sendResponse({ code: 0 });
    } else if (msgStr == 'play') {
        var extraId = detail.message.extra;
        if(extraId !== undefined && typeof(extraId) === 'string')
            extraId = parseInt(extraId);

        if(extraId === undefined || typeof(extraId) !== 'number'){
            getExternalApi().play();
        }else{
            getExternalApi().play(extraId);
        }

        shouldSendUpdate = true;
        sendResponse({ code: 0 });
    } else if (msgStr == 'toggle-play') {
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
    document.addEventListener('onExtensionMessage', onExtensionMessage);

    pageLoaded = true;
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