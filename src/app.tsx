import * as React from "react";
import * as ReactDOM from "react-dom";
import io from "socket.io";
import Discussion from './discussion';
import UserControls from './user-controls';
import UserList from './user-list';
import CardTable from './card-table';

class App extends React.Component<{}, {}> {
    socket: io.Server;

    constructor(props: {}) {
        super(props);
        setTimeout(this.heartBeat, 1000 * 60 * 5)
        this.socket = io();
    }

    heartBeat() {
        fetch('/hearbeat', { method: 'PUT' });
    }

    render() {
        return (
            <div className="hFlex">
                <div>
                    <div className="hFlex">
                        <UserControls socket={this.socket} />
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
