import { User, Team, GameState, SocketEvents, Card } from './models';
import * as React from "react";
import * as ReactDOM from "react-dom";
import io from "socket.io";
import { Button, ButtonGroup, Radio, RadioGroup, Divider, Tag, Card as BPCard } from "@blueprintjs/core";
import { v4 as uuid } from 'uuid';

interface AppState extends GameState {
    team: Team;
    name: string;
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
            secretKeeper: false
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

                    </BPCard>
                    <BPCard>
                        <div>Red Team: </div>
                        {
                            this.state.users
                                .filter((u: User) => u.team === Team.RED)
                                .map((u: User, i) => <Tag className="nameTag" key={u.uid}> {u.name} </Tag>)
                        }
                        <div>Blue Team:</div>
                        {
                            this.state.users
                                .filter((u: User) => u.team === Team.BLUE)
                                .map((u: User, i) => <Tag className="nameTag" key={u.uid}> {u.name} </Tag>)
                        }
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
                                {row.map(c => <BPCard className={'cardCard ' + c.type} key={c.uid}> {c.word}</BPCard>)}
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
