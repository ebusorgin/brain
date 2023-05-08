import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {GeneticNetwork} from "./GeneticNetwork.mjs";

const app = express();
const http = createServer(app);

app.use(express.static('public'));
app.use('/node_modules', express.static('node_modules'));
http.listen(3000, () => {
    console.log('listening on *:3000');
});

// let net = new GeneticNetwork()
// await net.init()
export class ServerNetwork {
    lastMessage = {}

    constructor() {
        this.initServer()
        // this.initNetwork()
    }
    async initNetwork(data){
        this.NETWORK = new GeneticNetwork({
            populationSize: data?.populationSize||2,
            numGenerations: data?.numGenerations||4,
            numParents: data?.numParents||2,
        })
        await this.NETWORK.init()
    }
    initServer(){
        this.io = new Server(http);
        this.io.on('connection', (socket) => {
            console.log('a user connected');

            this.sendMessage('initdata',{

            })

            socket.on('message', (msg) => {
                const message =  JSON.parse(msg)
                switch (message.method) {
                    case 'initNetwork':
                        this.initNetwork(message.data)
                        break;
                }

            });

            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });
    }
    sendMessage(method,data){
        this.io.emit('message', {method,data});
    }
    sendMessageLogs(type,uid,msg){
        this.io.emit('message', {method:'logs',data:{uid,type,msg}});
    }

}




