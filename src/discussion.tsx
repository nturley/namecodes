import { DiscussionMessage, User, SocketEvents, GameState } from './models'
import * as React from "react";
import io from "socket.io";

interface State {
    chatMsg: string,
    discussion: DiscussionMessage[]
}

interface Props {
    socket: io.Server,
}

export default class Discussion extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { chatMsg: '', discussion: [] };
        this.props.socket.on(SocketEvents.GameState, (gs:GameState) => this.updateGameState(gs))
    }

    updateGameState(gs: GameState) {
        this.setState({discussion:gs.discussion})
    }

    onKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
        const enterKey = 13;
        if (e.keyCode == enterKey) {
            e.preventDefault();
            this.props.socket.emit(SocketEvents.ChatMessage, this.state.chatMsg);
            this.setState({chatMsg:''})
        }
    }

    onChatChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({chatMsg:e.target.value})
    }

    formatDiscussion() {
        return this.state.discussion.map((d,i) => {
            return <div key={i}><strong>{d.authorName}:</strong> {d.message}</div>;
        })
    }

    render() {
        return <>
            <div className="discussion">
                { this.formatDiscussion() }
            </div>
            <input
                type="text"
                value={ this.state.chatMsg }
                onChange={e => this.onChatChange(e)}
                onKeyUp={e => this.onKeyUp(e)}/>
        </>;
    }
}