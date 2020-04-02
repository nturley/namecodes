import express from "express";
import Ajv from 'ajv';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { User, Card, CardType, GameState, SocketEvents, PlayerRole } from './src/models'
import socketIO from 'socket.io';
const randomWords = require('random-english-words');
import _ from 'lodash';


const PORT = process.env.PORT || 5000;

class NameCodeServer {
    app: express.Express;
    validateUser: Ajv.ValidateFunction;
    io: SocketIO.Server;
    gameState: GameState = { users: [], cards: [] };

    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static('dist'))
        const server = this.app.listen(
            PORT,
            () => console.log(`Example app listening on port ${PORT}!`)
        );
        this.io = socketIO(server);
        this.io.on(SocketEvents.Connection, socket => this.socketConnect(socket));

        const ajv = new Ajv();
        const schema = JSON.parse(fs.readFileSync('user.schema.json').toString());
        this.validateUser = ajv.compile(schema);
    }

    sendGameState() {
        const guesserGS = {
            cards: this.gameState.cards.map(c => ({...c, type:(c.isRevealed?c.type:CardType.UNKNOWN)})),
            users: this.gameState.users.map(u => ({ ...u, socket: null })) }
        this.io.to(PlayerRole.Guesser).emit(SocketEvents.GameState, guesserGS)
        const clueGiverGS = {
            cards: this.gameState.cards,
            users: this.gameState.users.map(u => ({ ...u, socket: null })) }
            this.io.to(PlayerRole.ClueGiver).emit(SocketEvents.GameState, clueGiverGS)
    }

    socketConnect(socket: SocketIO.Socket) {
        // send newcomer the starting gamestate
        this.sendGameState()
        // listen for user updates
        socket.on(SocketEvents.UpdateUser, user => this.onUser(socket, user));
        // remove user on disconnect
        socket.on(SocketEvents.Disconnect, () => this.socketDisconnect(socket));
        // reset game
        socket.on(SocketEvents.ResetGame, () => this.resetGame(socket))
        // reveal card
        socket.on(SocketEvents.RevealCard, (card) => this.revealCard(socket, card));
    }

    revealCard(socket: SocketIO.Socket, card: Card) {
        const foundCard = this.gameState.cards.find(c => c.uid === card.uid);
        if (foundCard) {
            foundCard.isRevealed = true;
            this.sendGameState()
        }
    }

    resetGame(socket: SocketIO.Socket) {
        this.gameState.cards = []
        const cardTypes = [
            CardType.BYSTANDER,
            CardType.ASSASIN,
            CardType.RED,
            CardType.BLUE
        ]
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                this.gameState.cards.push({
                    uid: uuid(),
                    word: randomWords(),
                    type: _.sample(cardTypes) || CardType.BYSTANDER,
                    isRevealed: false,
                });
            }
        }
        this.sendGameState()
    }

    socketDisconnect(socket: SocketIO.Socket) {
        // delete users associated with this socket
        this.gameState.users = this.gameState.users.filter(u => u.socket != socket);
        this.sendGameState()
    }

    onUser(socket: SocketIO.Socket, user: User) {
        if (this.validateUser(user)) {
            user.socket = socket;
            socket.leaveAll();
            socket.join(user.role);
            this.updateUser(user);
        }
    }

    updateUser(user: User) {
        let existingUserIndex = this.gameState.users.findIndex((u: User) => u.uid == user.uid)
        if (existingUserIndex != -1) {
            this.gameState.users[existingUserIndex] = user;
        } else {
            this.gameState.users.push(user);
        }
        this.sendGameState()
    }
}
const serve = new NameCodeServer()