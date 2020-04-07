import { User, Team, GameState, SocketEvents, Card, PlayerRole } from './models';
import * as React from "react";
import io from 'socket.io';
import { v4 as uuid } from 'uuid';
import { Button, ButtonGroup, Radio, RadioGroup, Divider, Tag, Card as BPCard } from "@blueprintjs/core";

type ClickEvent = React.MouseEvent<Element, MouseEvent>;

interface State {
    team: Team;
    name: string;
    role: PlayerRole;
    users: User[];
}

interface Props {
    socket: io.Server;
}

export default class UserControls extends React.Component<Props, State> {
    uid: string;
    constructor(props: Props) {
        super(props);
        this.state = {
            team: Team.BLUE,
            name: 'Anonymous',
            role: PlayerRole.Guesser,
            users: []
        }
        this.uid = uuid();
        props.socket.emit(SocketEvents.UpdateUser, this.me);
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
        this.props.socket.emit(SocketEvents.UpdateUser, user);
    }

    onUpdateNameClick(_: ClickEvent) {
        this.updateUser();
    }

    onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ name: e.currentTarget.value });
    }

    onTeamChange(e: React.FormEvent<HTMLInputElement>) {
        const team = e.currentTarget.value as Team;
        this.setState({ team });
        this.updateUser({ ...this.me, team })
    }

    onResetGame(_: ClickEvent) {
        this.props.socket.emit(SocketEvents.ResetGame);
    }

    onToggleRole(_: ClickEvent) {
        const newRole = (this.state.role === PlayerRole.Guesser) ? PlayerRole.ClueGiver : PlayerRole.Guesser;
        this.setState({ role: newRole });
        this.updateUser({ ...this.me, role: newRole });
    }

    render() {
        return (
            <>            
                <BPCard id="userInfo">
                    <label>Name</label><br />
                    <ButtonGroup>
                        <input className="nameField" type="text" onChange={e => this.onNameChange(e)} value={this.state.name} />
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
                        {this.state.role == PlayerRole.Guesser ? 'Change to Clue Giver' : 'Change to Guesser'}
                    </Button>
                </BPCard>
                <BPCard>
                    <Button onClick={(e: ClickEvent) => this.onResetGame(e)}>
                        Reset Game
                    </Button>
                </BPCard>
            </>
        );
    }
}