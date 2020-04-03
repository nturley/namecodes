import { User, Team, GameState, SocketEvents, Card, PlayerRole } from './models';
import * as React from "react";
import * as ReactDOM from "react-dom";
import io from "socket.io";
import { Button, ButtonGroup, Radio, RadioGroup, Divider, Tag, Card as BPCard } from "@blueprintjs/core";
import { v4 as uuid } from 'uuid';

interface AppState extends GameState {
    team: Team;
    name: string;
    role: PlayerRole;
}

function groupByRows(cards: Card[], rows: number): Card[][] {
    let ret = [];
    while (cards.length) ret.push(cards.splice(0, rows));
    return ret;
}

type ClickEvent = React.MouseEvent<Element, MouseEvent>;

class App extends React.Component<{}, AppState> {
    uid: string;
    socket: io.Server;

    constructor(props: {}) {
        super(props);
        this.socket = io();
        this.socket.on(SocketEvents.GameState, (gs: GameState) => this.updateGameState(gs));
        this.uid = uuid();
        this.state = {
            team: Team.BLUE,
            name: 'Anonymous',
            role: PlayerRole.Guesser,
            users: [],
            cards: []
        };
        this.socket.emit(SocketEvents.UpdateUser, this.me);
    }

    updateGameState(gs: GameState) {
        this.setState(gs);
    }

    get me(): User {
        return {
            uid: this.uid,
            name: this.state.name,
            team: this.state.team,
            role: this.state.role,
        }
    }

    updateUser(update?: User) {
        let user: User = update ? update : this.me
        this.socket.emit(SocketEvents.UpdateUser, user);
    }

    onUpdateNameClick(_: ClickEvent) {
        this.updateUser();
    }

    onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ name: e.currentTarget.value } as AppState)
    }

    onTeamChange(e: React.FormEvent<HTMLInputElement>) {
        this.setState({ team: e.currentTarget.value } as AppState)
        this.updateUser({ ...this.me, team: (e.currentTarget.value as Team) })
    }

    onResetGame(_: ClickEvent) {
        this.socket.emit(SocketEvents.ResetGame);
    }

    onToggleRole(_: ClickEvent) {
        const newRole = (this.state.role === PlayerRole.Guesser) ? PlayerRole.ClueGiver : PlayerRole.Guesser;
        this.setState({role: newRole});
        this.updateUser({...this.me, role: newRole});
    }

    onReveal(card: Card) {
        this.socket.emit(SocketEvents.RevealCard, card)
    }

    render() {
        return (
            <>
                <div className="hFlex">
                    <BPCard id="userInfo">
                        <label>Name</label><br />
                        <ButtonGroup>
                            <input type="text" onChange={e => this.onNameChange(e)} value={this.state.name} />
                            <Button onClick={(e: ClickEvent) => this.onUpdateNameClick(e)}>
                                Set Name
                            </Button>
                        </ButtonGroup>
                        <Divider />
                        <RadioGroup onChange={e => this.onTeamChange(e)} selectedValue={this.state.team}>
                            <Radio label="Team Red" value={Team.RED} />
                            <Radio label="Team Blue" value={Team.BLUE} />
                        </RadioGroup>
                        <Button onClick={(e: ClickEvent) => this.onToggleRole(e)}>
                            {this.state.role == PlayerRole.Guesser ? 'Change to Clue Giver':'Change to Guesser'}
                        </Button>
                    </BPCard>
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
                    </BPCard>
                    <BPCard>
                        <Button onClick={(e: ClickEvent) => this.onResetGame(e)}>
                            Reset Game
                        </Button>
                    </BPCard>
                </div>
                <div id="table">
                    {groupByRows([...this.state.cards], 5).map((row, i) => {
                        return (
                            <div className="hFlex" key={i}>
                                {row.map(c => 
                                    <BPCard
                                        className={`cardCard ${c.type} ${c.isRevealed?'revealed':'hidden'}`}
                                        onClick={e => this.onReveal(c)}
                                        key={c.uid}>
                                        {c.word}
                                    </BPCard>
                                )}
                            </div>);
                    })}
                </div>
            </>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
