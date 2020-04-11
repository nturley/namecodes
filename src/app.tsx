import * as React from "react";
import * as ReactDOM from "react-dom";
import io from "socket.io";
import Discussion from './discussion';
import UserControls from './user-controls';
import UserList from './user-list';
import CardTable from './card-table';
import GameControls from "./game-controls";
import { PlayerRole, User } from "./models";


class App extends React.Component<{}, {role:PlayerRole}> {
    socket: io.Server;

    constructor(props: {}) {
        super(props);
        setTimeout(this.heartBeat, 1000 * 60 * 5)
        this.socket = io();
        this.state ={role: PlayerRole.Guesser};
    }

    onUserChanged(user:User){
        this.setState({role:user.role});
    }

    heartBeat() {
        fetch('/heartbeat', { method: 'PUT' });
    }

    render() {
        return (
            <div className="hFlex">
                <div>
                    <div className="hFlex">
                        <UserControls socket={this.socket} onUserChange={user => this.onUserChanged(user)}/>
                        <GameControls socket={this.socket} role={this.state.role}/>
                        <UserList socket={this.socket} />
                    </div>
                    <CardTable socket={this.socket} />
                </div>
                <div>
                    <Discussion socket={this.socket} />
                </div>
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
