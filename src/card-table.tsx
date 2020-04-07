import { GameState, SocketEvents, Card } from './models';
import * as React from "react";
import io from "socket.io";
import { Card as BPCard } from "@blueprintjs/core";

function groupByRows(cards: Card[], rows: number): Card[][] {
    let ret = [];
    while (cards.length) ret.push(cards.splice(0, rows));
    return ret;
}

interface Props { 
    socket:io.Server
}
interface State { 
    cards: Card[]
}

export default class CardTable extends React.Component<Props, State> {

    constructor(props:Props) {
        super(props);
        this.state = {cards:[]};
        props.socket.on(SocketEvents.GameState, (gs:GameState) => this.updateGameState(gs));
    }
    
    updateGameState(gs: GameState) {
        this.setState({cards:gs.cards});
    }
    
    onReveal(card: Card) {
        this.props.socket.emit(SocketEvents.RevealCard, card)
    }
    
    render() {
        return (
            <div id="table">
                {groupByRows([...this.state.cards], 5).map((row, i) => {
                    return (
                        <div className="hFlex" key={i}>
                            {row.map(c =>
                                <BPCard
                                    className={`cardCard ${c.type} ${c.isRevealed ? 'revealed' : 'hidden'}`}
                                    onClick={e => this.onReveal(c)}
                                    key={c.uid}>
                                    {c.word}
                                </BPCard>
                            )}
                        </div>);
                })}
            </div>
        );
    }
}