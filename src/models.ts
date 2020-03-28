export enum Team {
    RED = 'RED',
    BLUE = 'BLUE'
}

export interface User {
    name: string;
    team: Team;
    secretKeeper: boolean;
}
