export default class HomePagePlaylist{
    constructor(shortName, friendlyName){
        this.selector = `*[data-card=\"${shortName}\"]`;
        this.available = false;
        this.friendlyName = friendlyName;
        this.name = shortName;
        this.cover = null;
    }

    serialize(){
        return {
            available: this.available,
            name: this.name,
            friendlyName: this.friendlyName,
            cover: this.cover
        };
    }

    update(){
        this.element = $(this.selector);
        this.button = this.element?.find('button.button-play') || null;
        this.cover = this.element?.find('img').attr('src') || null;
        if(this.cover != null && this.cover.length > 0)
            this.cover = 'https:' + this.cover;
        else
            this.cover = null;

        if(this.button == null || !this.button.exists()){
            this.available = false;
            return;
        }

        this.available = true;
    }

    play(){
        if(this.available !== true)
            return false;

        this.button.trigger('click');
        return true;
    }
}
