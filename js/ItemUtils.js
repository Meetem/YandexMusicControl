export default class ItemUtils{
    static getCombinedArtistName(artists) {
        if(artists == null || !Array.isArray(artists) || artists.length <= 0)
        return 'Empty';

        return artists.map((v) => v.title).join(', ');
    }
}