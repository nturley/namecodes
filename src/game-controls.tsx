import { Team, SocketEvents } from './models';
import * as React from "react";
import io from 'socket.io';
import { v4 as uuid } from 'uuid';
import { Button, Radio, RadioGroup, Divider, Card as BPCard } from "@blueprintjs/core";

type ClickEvent = React.MouseEvent<Element, MouseEvent>;

interface State {
    turn: Team,
}

interface Props {
    socket: io.Server;
}

export default class GameControls extends React.Component<Props, State> {
    uid: string;
    constructor(props: Props) {
        super(props);
        this.state = {
            turn: Team.BLUE
        }
        this.uid = uuid();
        this.props.socket.on(SocketEvents.Turn, (turn: Team) => this.onTurn(turn));
    }

    onTurn(turn: Team) {
        console.log('received turn')
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
            </BPCard>
        );
    }
}