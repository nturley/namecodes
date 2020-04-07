import { DiscussionMessage, User, SocketEvents, GameState } from './models'
import * as React from "react";
import io from "socket.io";
import { Button, ButtonGroup } from "@blueprintjs/core";

type ClickEvent = React.MouseEvent<Element, MouseEvent>;

interface State {
    chatMsg: string,
    discussion: DiscussionMessage[]
}

interface Props {
    socket: io.Server
}

export default class Discussion extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { chatMsg: '', discussion: [] };
        this.props.socket.on(SocketEvents.Discussion, (d: DiscussionMessage[]) => this.updateDiscussion(d))
    }

    updateDiscussion(discussion: DiscussionMessage[]) {
        this.setState({ discussion })
        document.querySelector('#bobber')?.scrollIntoView(false);
    }

    onKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
        const enterKey = 13;
        if (e.keyCode == enterKey) {
            e.preventDefault();
            this.props.socket.emit(SocketEvents.ChatMessage, this.state.chatMsg);
            this.setState({ chatMsg: '' })
        }
    }

    onChatChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ chatMsg: e.target.value })
    }

    onClickSend(e: ClickEvent) {
        this.props.socket.emit(SocketEvents.ChatMessage, this.state.chatMsg);
        this.setState({ chatMsg: '' })
    }

    formatDiscussion() {
        return this.state.discussion.map((d, i) => {
            if (typeof d === 'string')
                return <div key={i}><strong>{d}</strong></div>; 
            return <div key={i}><strong>{d.authorName}:</strong> {d.message}</div>;
        })
    }

    render() {
        return <>
            <div className="discussion">
                {this.formatDiscussion()}
                <span id="bobber"/>
            </div>
            <ButtonGroup className="discussionField">
                <input
                    type="text"
                    value={this.state.chatMsg}
                    onChange={e => this.onChatChange(e)}
                    onKeyUp={e => this.onKeyUp(e)} />
                <Button onClick={(e: ClickEvent) => this.onClickSend(e)}>Send</Button>
            </ButtonGroup>
        </>;
    }
}
