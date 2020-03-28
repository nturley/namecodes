import { User, Team } from './models';
import * as React from "react";
import * as ReactDOM from "react-dom";

class Welcome extends React.Component<{},{}> {
    onClick(e: React.MouseEvent) {
        let user: User = {name:'Neil', team:Team.RED, secretKeeper:false} 
        fetch('/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success:', data);
        })
        .catch((err) => {
            console.log(err);
        });
    }

    render() {
        return (
            <>
                <h1>Hello, World!</h1>
                <input type="button" value="Push" onClick={e => this.onClick(e) } />
            </>
        );
    }
}

ReactDOM.render(
    <Welcome />,
    document.getElementById('root')
);
