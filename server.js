const express = require('express');
const SocketServer = require('ws').Server;
const uuidv4 = require('uuid/v4');
const ws = require('ws');

const PORT = 3001;

const server = express()
    .use(express.static('public'))
    .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === ws.OPEN) {
            client.send(data);
        }
    })
}

const broadcastChatSize = () => {
    wss.broadcast(JSON.stringify({
        type: 'size',
        numSize: wss.clients.size,
    }));
}


let colours = ['blue', 'PaleVioletRed', 'red', 'green', 'purple']
let index = 0;
const getColour = () => {
    const id = index + 1;
    if (index === colours.length - 1) {
        index = 0;
    } else {
        index = id;
    }
    return colours[index];
};


wss.on('connection', (socket) => {
    broadcastChatSize();
    const colour = getColour();

    socket.on('close', () => {
        broadcastChatSize();
    })

    console.log('Client connected');

    socket.on('message', (data) => {
        let obj = JSON.parse(data);
        if (obj.type === 'postmsg') {
            obj.colour = colour;
            obj.id = uuidv4();
            obj.type = 'chat';
            wss.broadcast(JSON.stringify(obj));
        }
        if (obj.type === 'postnotif') {
            obj.id = uuidv4();
            obj.type = 'notif';
            obj.content = obj.oldUser + ' has changed their name to ' + obj.username
            wss.broadcast(JSON.stringify(obj));
        }
    });

    socket.on('close', () => console.log('Client disconnected'));
});