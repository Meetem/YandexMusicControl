export default class ExtensionCommunication{
    constructor(eventHandler){
        if(eventHandler != null){
            if(typeof(eventHandler) !== 'function'){
                console.error('event handler must be a function');
                this.onMessage = null;
                return;
            }

            this.onMessage = eventHandler;
        }
    }

    sendResponse(responseObject, messageId){
        const event = new CustomEvent("onWriteMessageAnswer", {
            detail: {
                response: responseObject,
                sendResponse: messageId
            }
        });

        document.dispatchEvent(event);
    }

    initialize(){
        const _this = this;
        document.addEventListener('onExtensionMessage', (evt) => _this.handleEvent(evt));
    }

    handleEvent(evtData){
        const detail = evtData.detail;
        const _this = this;

        if(this.onMessage != null && typeof(this.onMessage) === 'function'){
            this.onMessage(detail.message, (data) => {
                _this.sendResponse(data, detail.messageId)
            }, detail.sender)
        }else{
            console.log('New extension message, assign handler with onMessage', detail);
        }
    }
}