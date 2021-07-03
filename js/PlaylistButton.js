import ControlButton from "./ControlButton.js";

export default class PlaylistButton extends ControlButton{
    constructor(element, playlistName){
        super(element);
        this.playlistName = playlistName;
    }

    clicked(){
        super.clicked();
        this.play();
    }

    updateWith(serializedData){
        //console.log(`updating playlist ${this.btn.selector} with `, serializedData);
        if(serializedData == null || !serializedData.available){
            this.setEnabled(false);
            return;
        }

        this.btn.css('background-image', `url(\'${serializedData.cover}\')`);
        this.setEnabled(true);
    }

    play(){
        if(!this.isEnabled())
            return false;
        
        if(this.setPlaylist != null && typeof(this.setPlaylist) === 'function')
            this.setPlaylist(this.playlistName);
        
        return true;
    }
}