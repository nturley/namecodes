import {Socket} from 'socket.io'

export type DiscussionMessage = string | ChatMessage

export interface ChatMessage {
    message: string;
    authorName: string;
}

export enum Team {
    RED = 'red',
    BLUE = 'blue'
}

export enum PlayerRole {
    Guesser = 'guesser',
    ClueGiver = 'cluegiver'
}

export enum SocketEvents {
    //socket status
    Connection = 'connection',
    Disconnect = 'disconnect',
    
    // client -> server
    UpdateUser = 'updateUser',
    ResetCards = 'reset',
    RevealCard = 'reveal',
    ChatMessage = 'chat',
    SetClue = 'setClue',
    SetTurn = 'setTurn',
    
    // server -> client
    Discussion = 'discussion',
    Cards = 'cards',
    Users = 'users',
    Clue = 'clue',
    Turn = 'turn',
}

export interface User {
    uid: string;
    name: string;
    team: Team;
    role: PlayerRole;
    socket?:Socket
}

export enum CardType {
    ASSASIN = 'assasin',
    BYSTANDER = 'bystander',
    UNKNOWN ='unknown',
    RED = 'red',
    BLUE = 'blue'
}

export interface Card {
    uid: string;
    word: string;
    type: CardType;
    isRevealed: boolean;
}

export interface GameState {
    users: User[];
    cards: Card[];
    discussion: DiscussionMessage[];
    turn: Team;
    currentClue: string;
}