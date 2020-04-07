import * as React from "react";
import { User, Team, PlayerRole, SocketEvents, GameState } from './models'
import { Card as BPCard, Tag, Divider } from "@blueprintjs/core";
import io from 'socket.io';

interface State {
    users: User[]
}

interface Props {
    socket: io.Server;
}

export default class UserList extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { users: [] };
        props.socket.on(SocketEvents.GameState, (gs:GameState) => this.onGameState(gs));
    }

    onGameState(gs: GameState) {
        this.setState({ users: gs.users });
    }

    render() {
        return (
            <BPCard>
                <div>Red Guessers: </div>
                {
                    this.state.users
                        .filter((u: User) => u.team === Team.RED && u.role === PlayerRole.Guesser)
                        .map((u: User, i) => <Tag className="nameTag" key={u.uid}> {u.name} </Tag>)
                }
                <Divider />
                <div> Red Clue Giver:
                {
                    this.state.users
                        .filter((u: User) => u.team === Team.RED && u.role === PlayerRole.ClueGiver)
                        .map((u: User, i) => <Tag className="nameTag" key={u.uid}> {u.name} </Tag>)
                }
                </div>
                <Divider />
                <div>Blue Guessers:</div>
                {
                    this.state.users
                        .filter((u: User) => u.team === Team.BLUE && u.role === PlayerRole.Guesser)
                        .map((u: User, i) => <Tag className="nameTag" key={u.uid}> {u.name} </Tag>)
                }
                <Divider />
                <div> Blue Clue Giver:
                {
                    this.state.users
                        .filter((u: User) => u.team === Team.BLUE && u.role === PlayerRole.ClueGiver)
                        .map((u: User, i) => <Tag className="nameTag" key={u.uid}> {u.name} </Tag>)
                }
                </div>
            </BPCard>);
    }
}