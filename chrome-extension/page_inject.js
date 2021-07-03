var injected = false;
const scriptUrl = chrome.runtime.getURL("page.js");
var idNumber = 0;
var sendResponseCallbacks = {};
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!injected) {
        sendResponse({ code: -1 });
        return;
    }

    sendResponseCallbacks[idNumber.toString()] = sendResponse;
    const event = new CustomEvent("onExtensionMessage", {
        detail: {
            message: message,
            sender: sender,
            messageId: idNumber.toString()
        }
    });
    
    document.dispatchEvent(event);
    idNumber++;
});

document.addEventListener('onWriteMessageAnswer', event => {
    const d = event.detail;
    const funcId = d.sendResponse;

    var cb = sendResponseCallbacks[funcId];
    if(cb != null)
        cb(d.response);

    delete sendResponseCallbacks[funcId];
});

document.addEventListener('readystatechange', event => {
    if (event.target.readyState === "complete") {
        const script = document.createElement("script");
        script.type = 'module';
        script.src = scriptUrl;
        document.documentElement.appendChild(script);
        injected = true;
        console.log('injected script');
    }
});