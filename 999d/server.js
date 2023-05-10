import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const __dirname = path.dirname(new URL(import.meta.url).pathname);
import m from './matrix.js'
const Matrix = new m()

app.use(express.static('public'));
app.use('/socket.io', express.static(path.join(__dirname, 'node_modules/socket.io/client-dist')));

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('setData', (data) => {
        const predata = Matrix.setData(data.data)
        socket.emit('drawing', {data:predata});
    });
    socket.on('prepareTestData', (data) => {
        const predata = Matrix.prepareTestData(data.data)
        socket.emit('drawing', {data:predata});
    });


    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
