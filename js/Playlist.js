import ItemUtils from "./ItemUtils.js";

export default class Playlist{
    constructor(elementPrefab, playlistRoot){
        this.currentItems = [];
        this.currentHash = '';
        this.setup(elementPrefab, playlistRoot);
    }

    setup(elementPrefab, playlistRoot){
        this.prefab = elementPrefab;
        this.root = playlistRoot;
    }

    clear(){
        this.root.empty();
        this.currentItems = [];
    }

    addPlaylistElement(data){
        let element = this.prefab.clone();
        element.attr('id', `playlist-item-${data.id}`);
        element.data('item-id', data.id);
        
        element.removeClass('prefab');

        let coverImage = data.cover;
        if(coverImage != null && coverImage.length > 0){
            coverImage = 'https://' + coverImage;
            coverImage = coverImage.replace('%%', '100x100');
            let cover = element.find('.cover');
            cover.attr('src', coverImage);
        }

        let title = element.find('.title');
        title.text(data.title);

        let artist = element.find('.author');
        artist.text(ItemUtils.getCombinedArtistName(data.artists));

        let output = {
            data: data,
            element: element,
            current: false
        };

        const _this = this;
        element.on('click', () => _this.elementClicked(output));
        this.currentItems[data.id] = output;
        return output;
    }

    elementClicked(element){
        if(this.currentItems == null || this.currentItems.length <= 0)
            return;

        //this.setCurrentItem(element.data.id);
        if(this.onSelected != null && typeof(this.onSelected) === 'function'){
            this.onSelected(element);
        }else{
            console.log('Selected playlist item', element);
        }
    }

    setCurrentItem(itemIdx){
        //TODO: better optimize to store immediate current access.
        this.currentItems.forEach((em) => {
            if(em.data.id == itemIdx){
                em.element.addClass('selected');
                em.current = true;
            }else if(em.current == true){
                em.element.removeClass('selected');
                em.current = false;
            }
        })
    }

    setItems(items, currentItemIdx, hash){
        if(this.currentHash == hash){
            this.setCurrentItem(currentItemIdx);
            return;
        }

        this.clear();
        if(items == null || items.length <= 0){
            this.currentHash = '';
            return;
        }

        const _this = this;
        items.forEach((item, index) => {
            if(item == null)
                return;

            item.id = index;

            let newItem = this.addPlaylistElement(item);
            newItem.element.appendTo(this.root);
            //_this.currentItems.push(newItem);
        });

        this.setCurrentItem(currentItemIdx);
        this.currentHash = hash;
    }
}