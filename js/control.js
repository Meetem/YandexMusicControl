class ControlButton {
    constructor(jqueryBtn) {
        this.btn = jqueryBtn;
        const _this = this;

        this.btn.on('click', () => _this.clicked());
        this.active = false;
        this.enabled = true;
    }

    clicked() {
        if (this.onClicked != null && typeof (this.onClicked) === 'function') {
            this.onClicked();
        }
    }

    setEnabled(v) {
        this.enabled = v;

        if (v){
            this.btn.removeClass('disabled');
            this.btn.css('display', '');
        }
        else{
            this.btn.addClass('disabled');
            this.btn.css('display', 'none');
        }
    }

    isEnabled(){
        return this.enabled;
    }

    isActive(){
        return this.active;
    }

    setActive(v){
        this.active = v;

        if(v)
            this.btn.addClass('active');
        else
            this.btn.removeClass('active');
    }
}

var buttons = {
    like: null,
    prev: null,
    next: null,
    play: null,
    shuffle: null,
    radio: null
};

var trackInfo = {
    title: null,
    author: null
};

var currentPlaybackData = {

};

var initialized = false;
var lastPlaylistHash = '';

function sendCommand(cmd, args){
    var url = `/api/${cmd}?`;
    if(args != null){
        var strs = [];
        for (const [key, value] of Object.entries(args)) {
            strs.push(`${key}=${encodeURIComponent(value)}`);
        }

        url += strs.join('&');
        
        console.log(url);
    }
    
    fetch(url).then((r) => r.json()).then((response) => {
        if(response == null || response.code !== 0){
            console.error(response);
        }
    }).catch((ex) => {
        console.error(ex);
    });

}

function nextClicked() {
    console.log('next');
    sendCommand('next');
}

function likeClicked() {
    console.log('like');
    sendCommand('toggle-like');
    buttons.like.setActive(buttons.like.isActive() != true);
}

function prevClicked() {
    console.log('prev');
    sendCommand('prev');
}

function playClicked() {
    console.log('toggle-play');
    sendCommand('toggle-play');
}

function shuffleClicked() {
    console.log('toggle-shuffle');
    sendCommand('toggle-shuffle');
    buttons.shuffle.setActive(buttons.shuffle.isActive() != true);
}

function radioClicked(){
    console.log('radio');
    sendCommand('play', {id: -1});
    buttons.radio.setActive(buttons.radio.isActive() != true);
}

function setupControls(controls) {
    if (controls == null) {
        return;
    }

    buttons.like.setEnabled(controls.like !== null);
    buttons.shuffle.setEnabled(controls.shuffle !== null);
    buttons.prev.setEnabled(controls.prev !== null);
    buttons.next.setEnabled(controls.next !== null);
    buttons.play.setEnabled(true);

    buttons.radio.setActive(controls.prev === null);
    buttons.shuffle.setActive(controls.shuffle === true);
}

function getAuthor(authorsList){
    if(authorsList == null || !Array.isArray(authorsList) || authorsList.length <= 0)
        return 'Empty';

    return authorsList.map((v) => v.title).join(', ');
}

function setupCover(track){
    const coverElement = $('#track-cover');

    if(track == null || track.album == null || typeof(track.album.cover) !== 'string' || track.album.cover.length <= 0){
        coverElement.css('display', 'none');
        return;
    }

    var link = 'https://' + track.album.cover;
    link = link.replace('%%', '100x100');
    coverElement.attr('src', link);
}

function setupCurrentTrack(track){
    currentPlaybackData = track;
    trackInfo.title.text(track?.title || '');
    trackInfo.author.text(getAuthor(track?.artists || null));
    buttons.like.setActive(track.liked === true);

    setupCover(track);
}

function updatePlaybackData(playback) {
    const controls = playback.controls;
    setupControls(controls);
    setupCurrentTrack(playback.current);
    console.log(playback);
}

function handlePlaybackData(data) {
    lastPlaylistHash = data.payload.hash;
    if (data.payload.cached === true)
        return;

    const playback = data.payload.playback;
    if (playback == null) {
        return;
    }

    updatePlaybackData(playback);
}

function reloadData(forced) {
    if(forced === true){
        lastPlaylistHash = '';
    }

    fetch(`/api/get-info?hash=${lastPlaylistHash}`).then((r) => r.json()).then((result) => {
        if (result.code !== 0) {
            console.error(result);
            return;
        }

        handlePlaybackData(result);
    }).catch((ex) => {
        console.error(ex);
    });
}

$(document).ready(() => {
    buttons.like = new ControlButton($('#like-btn'));
    buttons.prev = new ControlButton($('#prev-btn'));
    buttons.next = new ControlButton($('#next-btn'));
    buttons.play = new ControlButton($('#play-btn'));
    buttons.shuffle = new ControlButton($('#shuffle-btn'));
    buttons.radio = new ControlButton($('#radio-btn'));

    buttons.like.onClicked = likeClicked;
    buttons.prev.onClicked = prevClicked;
    buttons.next.onClicked = nextClicked;
    buttons.play.onClicked = playClicked;
    buttons.shuffle.onClicked = shuffleClicked;
    buttons.radio.onClicked = radioClicked;

    trackInfo.title = $('#track-title');
    trackInfo.author = $('#track-author');

    initialized = true;

    reloadData(true);
    setInterval(() => reloadData(false), 250);
});