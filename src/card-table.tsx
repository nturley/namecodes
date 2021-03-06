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
    cards: Card[],
    clue: string,

}

export default class CardTable extends React.Component<Props, State> {

    constructor(props:Props) {
        super(props);
        this.state = {
            cards:[],
            clue:''};
        props.socket.on(SocketEvents.Cards, (cards:Card[]) => this.updateGameState(cards));
        props.socket.on(SocketEvents.Clue, (clue:string) => this.updateClue(clue));
    }

    updateClue(clue: string) {
        this.setState({clue});
    }
    
    updateGameState(cards: Card[]) {
        this.setState({cards});
    }
    
    onReveal(card: Card) {
        this.props.socket.emit(SocketEvents.RevealCard, card)
    }
    
    render() {
        return (
            <div id="table">
                <div className="hFlex">
                    <h2>{this.state.clue}</h2>
                </div>
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