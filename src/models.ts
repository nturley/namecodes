export enum Team {
    RED = 'red',
    BLUE = 'blue'
}

export interface User {
    uid: string;
    name: string;
    team: Team;
    secretKeeper: boolean;
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
}