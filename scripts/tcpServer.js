const net = require('net');
const { setTimeout } = require('timers');

module.exports = class TcpServer{
    constructor(serverPort, serverAddr = '127.0.0.1'){
        this.socket = new net.Socket();
        this.port = serverPort;
        this.addr = serverAddr;
        this.recvBuffer = '';
        this.isConnected = false;

        const _this = this;
        this.socket.on('data', (data) => {
            _this.socketRecvData(data);
        });

        this.socket.on('close', () => {
            _this.socketClosed();
        });
        
        this.socket.on('error', (err) => {
            this.isConnected = false;
            console.log(err);
        });
    }

    connect(){
        const _this = this;
        this.socket.connect(this.port, this.addr, function() {
            console.log("Connected to chrome server");
            _this.isConnected = true;
        });
    }

    write(data){
        if(data == null || data.length <= 0)
            return false;

        if(this.socket == null || !this.isConnected){
            return false;
        }

        this.socket.write(data + '\n');
        return true;
    }

    socketRecvData(data){
        if(data.length > 1024 * 1024)
            return;

        let strData = data.toString();
        //console.log('Got data:', strData);

        this.recvBuffer += strData;
        
        //Accumulate strings because TCP will split them with MTU.
        let pos = undefined;
        let prevPos = undefined;
        let gotStrings = [];
        while((pos = this.recvBuffer.indexOf('\n', pos)) != -1){
            let pp = 0;
            if(prevPos !== undefined)
                pp = prevPos;

            let substr = this.recvBuffer.substring(pp, pos).trim();
            //console.log('Splited', substr);

            gotStrings.push(substr);
            
            pos += 1;
            prevPos = pos;
        }

        if(prevPos !== undefined){
            if(prevPos < this.recvBuffer.length){
                this.recvBuffer = this.recvBuffer.substr(prevPos);
            }else{
                this.recvBuffer = '';
            }
        }

        for(var i = 0; i < gotStrings.length;i++){
            this.readString(gotStrings[i]);
        }
    }

    readString(strData){
        try{
            if(this.onDataString != null && typeof(this.onDataString) == 'function'){
                this.onData(onDataString);
            }

            if(this.onData != null && typeof(this.onData) == 'function'){
                let obj = JSON.parse(strData);
                this.onData(obj);
            }
        }catch(ex){
            console.log(`Can\'t read data from server ${ex}`);
        }
    }

    socketClosed(){
        this.recvBuffer = '';
        this.isConnected = false;
        console.log('Connection terminated');

        if(this.reconnect !== false && this.socket != null){
            const _this = this;
            setTimeout(() => {
                _this.connect()
            }, 1000);
        }
    }

    terminate(){
        this.isConnected = false;
        this.reconnect = false;
        if(this.socket != null){
            this.socket.close();
            this.socket = null;
        }
    }
}