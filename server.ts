import express from "express";
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { User, Card, CardType, GameState, SocketEvents, PlayerRole, Team } from './src/models'
import socketIO from 'socket.io';
import _ from 'lodash';
const csv = require('csv-parser')

let wordlist: string[] = [];

fs.createReadStream('wordlist.csv')
    .pipe(csv({ headers: false }))
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
    for (let i = 0; i < numCards[cardType]; i++) {
        cardTypes.push(cardType as CardType);
    }
}

let unusedWords: string[] = []
const PORT = process.env.PORT || 5000;

class NameCodeServer {
    app: express.Express;
    io: SocketIO.Server;
    gameState: GameState = {
        users: [],
        cards: [],
        discussion: [],
        turn: Team.BLUE,
        currentClue: '',
    };

    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static('dist'))
        this.app.put('/heartbeat', (_, res) => { res.send('beat') });
        const server = this.app.listen(
            PORT,
            () => console.log(`Example app listening on port ${PORT}!`)
        );
        this.io = socketIO(server);
        this.io.on(SocketEvents.Connection, socket => this.socketConnect(socket));
    }

    sendCards() {
        const guesserCards = this.gameState.cards.map(c =>
            ({ ...c, type: (c.isRevealed ? c.type : CardType.UNKNOWN) }));
        this.io.to(PlayerRole.Guesser).emit(SocketEvents.Cards, guesserCards);
        this.io.to(PlayerRole.ClueGiver).emit(SocketEvents.Cards, this.gameState.cards);
    }

    socketConnect(socket: SocketIO.Socket) {
        socket.on(SocketEvents.UpdateUser, user => this.onUser(socket, user));
        socket.on(SocketEvents.Disconnect, () => this.socketDisconnect(socket));
        socket.on(SocketEvents.ResetCards, () => this.resetGame(socket))
        socket.on(SocketEvents.RevealCard, (card) => this.revealCard(socket, card));
        socket.on(SocketEvents.ChatMessage, (msg) => this.chatMessage(socket, msg));
        socket.on(SocketEvents.SetTurn, (turn) => this.setTurn(socket, turn));
        socket.on(SocketEvents.SetClue, (clue) => this.setClue(socket, clue));
    }

    setTurn(socket: SocketIO.Socket, turn: Team) {
        const foundUser = this.gameState.users.find(u => u.socket === socket);
        if (!foundUser) return;
        if (turn == this.gameState.turn) return;
        this.gameState.turn = turn;
        this.io.emit(SocketEvents.Turn, turn);
        this.gameState.discussion.push(`${foundUser.name} set the game to ${turn}'s turn`);
        this.io.emit(SocketEvents.Discussion, this.gameState.discussion);
        this.gameState.currentClue = '';
        this.io.emit(SocketEvents.Clue, '');
    }

    setClue(socket: SocketIO.Socket, clue: string) {
        const foundUser = this.gameState.users.find(u => u.socket === socket);
        if (!foundUser) return;
        if (foundUser.role != PlayerRole.ClueGiver) return;
        if (foundUser.team != this.gameState.turn) return;
        this.gameState.currentClue = clue;
        this.gameState.discussion.push(`${foundUser.name} set the clue to ${clue}`);
        this.io.emit(SocketEvents.Discussion, this.gameState.discussion);
        this.io.emit(SocketEvents.Clue, clue);
    }

    chatMessage(socket: SocketIO.Socket, message: string) {
        const foundUser = this.gameState.users.find(u => u.socket === socket);
        if (foundUser) {
            const authorName = foundUser.name;
            this.gameState.discussion.push({ authorName, message });
            this.io.emit(SocketEvents.Discussion, this.gameState.discussion);
        }
    }

    revealCard(socket: SocketIO.Socket, card: Card) {
        const foundCard = this.gameState.cards.find(c => c.uid === card.uid);
        if (!foundCard) return;
        if (foundCard.isRevealed) return;
        const foundUser = this.gameState.users.find(u => u.socket === socket);
        if (!foundUser) return
        if (foundUser.team != this.gameState.turn) return;
        if (foundUser.role != PlayerRole.Guesser) return;
        foundCard.isRevealed = true;
        this.sendCards()
        this.gameState.discussion.push(`${foundUser.name} chose ${foundCard.word} and it is ${foundCard.type}`);
        this.io.emit(SocketEvents.Discussion, this.gameState.discussion);
    }

    resetGame(socket: SocketIO.Socket) {
        this.gameState.turn = Team.BLUE;
        this.gameState.currentClue = '';
        this.gameState.cards = []
        let types = _.shuffle(cardTypes)
        if (unusedWords.length < 25)
            unusedWords = _.shuffle(wordlist)
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                this.gameState.cards.push({
                    uid: uuid(),
                    word: unusedWords.pop() || '',
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
        // send the initial discussion, cards, turn, and clue
        this.io.emit(SocketEvents.Discussion, this.gameState.discussion);
        this.sendCards();
        this.io.emit(SocketEvents.Turn, this.gameState.turn);
        this.io.emit(SocketEvents.Clue, this.gameState.currentClue);

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
