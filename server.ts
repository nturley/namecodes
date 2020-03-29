import express from "express";
import Ajv from 'ajv';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { User, Card, CardType, GameState, SocketEvents } from './src/models'
import socketIO from 'socket.io';

const PORT = process.env.PORT || 5000;

const app = express();

interface SocketLookup {
    [key:string]:socketIO.Socket
}

const socketsByUid: SocketLookup = {}

app.use(express.json());
let ajv = new Ajv();
let schema = JSON.parse(fs.readFileSync('user.schema.json').toString());
let validate = ajv.compile(schema);

let gameState: GameState = {users:[], cards:[]}

function status(res: express.Response, code: number) {
    res.status(code);
    res.send(`<img src="https://http.cat/${ code }.jpg"/>`)
}

app.use(express.static('dist'))

const server = app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
const io = socketIO(server);

io.on('connection', (socket) => {
    socket.emit(SocketEvents.GameState, gameState);
    socket.on(SocketEvents.NewUser, msg => {
        socketsByUid[msg] = socket;
    });
    socket.on('disconnect', () => {
        Object.entries(socketsByUid).forEach(entry => {
            if (entry[1] === socket) {
                delete socketsByUid[entry[0]];
                gameState.users = gameState.users.filter(u =>u.uid !== entry[0])
                io.emit(SocketEvents.GameState, gameState);
            }
        });
    });
});

// read all users
app.get('/users', (req, res) => {
    // we use uid like an auth token, so filter it out
    res.send(gameState.users.map((u:User, i:number) => ({...u, uid:i})));
});

// read all cards
app.get('/cards/:user_id', (req, res) => {
    let user = gameState.users.find((u:User) => u.uid == req.params.user_id)
    if (user) {
        if (user.secretKeeper) {
            res.send(gameState.cards);
        } else {
            res.send(gameState.cards.map(c => c.isRevealed?c:{...c,type: CardType.UNKNOWN}));
        }
    } else {
        status(res, 404);
    }
});

//update card to be revealed
app.put('/cards/:card_id/reveal', (req, res) => {
    let card = gameState.cards.find((c:Card) => c.uid == req.params.card_id);
    if (!card) {
        status(res, 404);
        return
    }
    card.isRevealed = true;
});

// reset cards
app.delete('/cards/', (req, res) => {
    let user = gameState.users.find((u:User) => u.uid == req.params.user_id)
    if (user) {
        gameState.cards = [{uid:uuid(), word:'Yellow', type:CardType.ASSASIN, isRevealed:false}]
    } else {
        status(res, 404);
    }
});

// update user
app.put('/users', (req, res) => {
    let user: User = req.body;
    // check that user conforms to the user schema
    if (validate(user)) {
        let existingUserIndex = gameState.users.findIndex((u:User) => u.uid == user.uid)
        if (existingUserIndex != -1) {
            gameState.users[existingUserIndex] = user;
        } else {
            gameState.users.push(user);
        }
        status(res, 200);
        io.emit(SocketEvents.GameState, gameState)
    } else {
        status(res, 400);
    }
});


