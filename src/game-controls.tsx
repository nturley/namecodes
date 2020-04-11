import { Team, SocketEvents, PlayerRole } from './models';
import * as React from "react";
import io from 'socket.io';
import { Button, ButtonGroup, Radio, RadioGroup, Divider, Card as BPCard } from "@blueprintjs/core";

type ClickEvent = React.MouseEvent<Element, MouseEvent>;

interface State {
    turn: Team,
    clue: string,
}

interface Props {
    socket: io.Server,
    role: PlayerRole,
}

export default class GameControls extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            turn: Team.BLUE,
            clue: '',
        }
        this.props.socket.on(SocketEvents.Turn, (turn: Team) => this.onTurn(turn));
    }

    onTurn(turn: Team) {
        this.setState({turn});
    }

    onChangeTurn(e: React.FormEvent<HTMLInputElement>) {
        const turn = e.currentTarget.value as Team;
        this.setState({ turn });
        this.props.socket.emit(SocketEvents.SetTurn, turn);
    }

    onResetGame(_: ClickEvent) {
        this.props.socket.emit(SocketEvents.ResetCards);
    }

    onClueChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({clue:e.target.value});
    }

    onSetClue(e: ClickEvent) {
        this.props.socket.emit(SocketEvents.SetClue, this.state.clue);
    }

    renderSetClue() {
        if (this.props.role == PlayerRole.ClueGiver) {
            return (
                <>
                <Divider/>
                <ButtonGroup>
                    <input className="clueField" type="text" onChange={e => this.onClueChange(e)} value={this.state.clue} />
                    <Button onClick={(e: ClickEvent) => this.onSetClue(e)} >
                        Set Clue
                    </Button>
                </ButtonGroup>
                </>
            );
        }
        return <></>;
    }

    render() {
        return (
            <BPCard>
                <Button onClick={(e: ClickEvent) => this.onResetGame(e)}>
                    Reset Game
                </Button>
                <Divider/>
                <RadioGroup onChange={e => this.onChangeTurn(e)} selectedValue={this.state.turn}>
                    <Radio label="Red's Turn" value={Team.RED}></Radio>
                    <Radio label="Blue's Turn" value={Team.BLUE}></Radio>
                </RadioGroup>
                {this.renderSetClue()}
            </BPCard>
        );
    }
}