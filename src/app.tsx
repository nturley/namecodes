import { User, Team } from './models';
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Button, ButtonGroup, Card, Radio, RadioGroup, Divider, Tag } from "@blueprintjs/core";
import { v4 as uuid } from 'uuid';
import Cookies from 'js-cookie';

interface AppState {
    team:Team;
    name:string;
}

class App extends React.Component<{},AppState> {
    uid: string;
    
    constructor(props:{}) {
        super(props);
        let myUuid = Cookies.get('uid')
        if (!myUuid) {
            myUuid = uuid()
        }
        Cookies.set('uid', myUuid, {expires:14})
        this.uid = myUuid;
        this.state = {
            team: Team.BLUE,
            name:'Anonymous'
        };
    }

    updateUser(update?: User) {
        let user: User = update?update:{
            uid:this.uid,
            name:this.state.name,
            team:this.state.team,
            secretKeeper:false
        }
        fetch('/users', {
            method: 'PUT',
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

    onUpdateNameClick(_: React.MouseEvent) {
        this.updateUser();
    }

    onNameChange(e:React.ChangeEvent<HTMLInputElement>) {
        this.setState({name:e.currentTarget.value} as AppState)
    }

    onTeamChange(e:React.FormEvent<HTMLInputElement>) {
        this.setState({team:e.currentTarget.value} as AppState)
        this.updateUser()
    }

    render() {
        return (
            <>
            <div className="hFlex">
            <Card id="userInfo">
                <label>Name</label><br/>
                <ButtonGroup>
                    <input type="text" onChange={e => this.onNameChange(e) } value={this.state.name} />
                    <Button onClick={(e: React.MouseEvent<Element, MouseEvent>) => this.onUpdateNameClick(e) }> Update Name</Button>
                </ButtonGroup>
                <Divider/>
                <RadioGroup onChange={ e=> this.onTeamChange(e)} selectedValue={this.state.team}>
                    <Radio label="Team Red" value={Team.RED} />
                    <Radio label="Team Blue" value={Team.BLUE} />
                </RadioGroup>
                
            </Card>
            <Card>
                <div>Red Team: </div>
                <Tag className="nameTag">Bob</Tag><Tag className="nameTag">Joe</Tag>
                 <div>Blue Team:</div>
                 <Tag className="nameTag">Shirley</Tag>
            </Card>
            </div>
            <div id="table">
            <div className="hFlex">
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
            </div>
            <div className="hFlex">
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
            </div>
            <div className="hFlex">
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
            </div>
            <div className="hFlex">
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
            </div>
            <div className="hFlex">
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
                <Card className="cardCard">Hello</Card>
            </div>
            </div>
            </>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
