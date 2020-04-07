import express from "express";
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { User, Card, CardType, GameState, SocketEvents, PlayerRole } from './src/models'
import socketIO from 'socket.io';
import _ from 'lodash';
const csv = require('csv-parser')

let wordlist: string[] = [];
 
fs.createReadStream('wordlist.csv')
    .pipe(csv({headers:false}))
    .on('data', (data: object) => wordlist = _.uniq([...wordlist, ...Object.values(data)]))
    .on('end', () => {
        wordlist = wordlist.filter(r => r);
    });
var numCards: { [key: string]: number; } = {};
numCards[CardType.ASSASIN] = 1;
numCards[CardType.RED] = 8;
numCards[CardType.BLUE] = 9;
numCards[CardType.BYSTANDER] = 7;

const cardTypes: CardType[] = []
for (let cardType of Object.keys(numCards)) {
    for (let i=0; i<numCards[cardType]; i++) {
        cardTypes.push(cardType as CardType);
    }
}

const PORT = process.env.PORT || 5000;

class NameCodeServer {
    app: express.Express;
    io: SocketIO.Server;
    gameState: GameState = { users: [], cards: [], discussion: []};

    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static('dist'))
        this.app.put('/heartbeat', (_,res) => {res.send('beat')});
        const server = this.app.listen(
            PORT,
            () => console.log(`Example app listening on port ${PORT}!`)
        );
        this.io = socketIO(server);
        this.io.on(SocketEvents.Connection, socket => this.socketConnect(socket));
    }

    sendCards() {
        const guesserCards = this.gameState.cards.map(c =>
            ({...c, type:(c.isRevealed?c.type:CardType.UNKNOWN)}));
        this.io.to(PlayerRole.Guesser).emit(SocketEvents.Cards, guesserCards);
        this.io.to(PlayerRole.ClueGiver).emit(SocketEvents.Cards, this.gameState.cards);
    }

    socketConnect(socket: SocketIO.Socket) {
        socket.on(SocketEvents.UpdateUser, user => this.onUser(socket, user));
        socket.on(SocketEvents.Disconnect, () => this.socketDisconnect(socket));
        socket.on(SocketEvents.ResetCards, () => this.resetGame(socket))
        socket.on(SocketEvents.RevealCard, (card) => this.revealCard(socket, card));
        socket.on(SocketEvents.ChatMessage, (msg) => this.chatMessage(socket, msg));
    }

    chatMessage(socket: SocketIO.Socket, message: string) {
        const foundUser = this.gameState.users.find(u => u.socket === socket);
        if (foundUser) {
            const authorName = foundUser.name;
            this.gameState.discussion.push({authorName, message});
            this.io.emit(SocketEvents.Discussion, this.gameState.discussion);
        }
    }

    revealCard(socket: SocketIO.Socket, card: Card) {
        const foundCard = this.gameState.cards.find(c => c.uid === card.uid);
        if (!foundCard) return;
        if (foundCard.isRevealed) return;
        foundCard.isRevealed = true;
        this.sendCards()
        const foundUser = this.gameState.users.find(u => u.socket === socket);
        if (!foundUser) return
        this.gameState.discussion.push(`${foundUser.name} revealed ${foundCard.word} and it is ${foundCard.type}`);
        this.io.emit(SocketEvents.Discussion, this.gameState.discussion);
    }

    resetGame(socket: SocketIO.Socket) {
        this.gameState.cards = []
        let types = _.shuffle(cardTypes)
        let words = _.shuffle(wordlist)
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                this.gameState.cards.push({
                    uid: uuid(),
                    word: words.pop() || '',
                    type: types.pop() || CardType.UNKNOWN,
                    isRevealed: false,
                });
            }
        }
        this.sendCards()
        const foundUser = this.gameState.users.find(u => u.socket === socket);
        if (!foundUser) return
        this.gameState.discussion.push(`${foundUser.name} reset the cards`);
        this.io.emit(SocketEvents.Discussion, this.gameState.discussion);
    }

    socketDisconnect(socket: SocketIO.Socket) {
        // delete users associated with this socket
        this.gameState.users = this.gameState.users.filter(u => u.socket != socket);
        this.sendUsers();
    }

    onUser(socket: SocketIO.Socket, user: User) {
        user.socket = socket;
        socket.leaveAll();
        socket.join(user.role);
        this.updateUser(user);
        // send the initial discussion and cards
        this.io.emit(SocketEvents.Discussion, this.gameState.discussion);
        this.sendCards();
    }

    updateUser(user: User) {
        let existingUserIndex = this.gameState.users.findIndex((u: User) => u.uid == user.uid)
        if (existingUserIndex != -1) {
            this.gameState.users[existingUserIndex] = user;
        } else {
            this.gameState.users.push(user);
        }
        this.sendUsers();
    }

    sendUsers() {
        const users = this.gameState.users.map(u => ({ ...u, socket: null }))
        this.io.emit(SocketEvents.Users, users);
    }
}
const serve = new NameCodeServer()
