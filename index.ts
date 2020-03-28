import express from "express";
import { v4 as uuid } from 'uuid';
import Ajv from 'ajv';
import fs from 'fs';

let ajv = new Ajv();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());

let schema = JSON.parse(fs.readFileSync('user.schema.json').toString());
let validate = ajv.compile(schema);

interface UserLookup {
    [key: string]: User
}

let users: UserLookup = {}

enum Team {
    RED='RED',
    BLUE='BLUE'
}

interface User {
    name: string;
    team: Team;
    secretKeeper: boolean;
}

function status(res: express.Response, code: number) {
    res.status(code);
    res.send(`<img src="https://http.cat/${ code }.jpg"/>`)
}

app.get('/', (_, res) => status(res, 200))

app.get('/users/:user_id', (req, res) => {
    res.send(users[req.params.user_id]);
});

app.post('/users', (req, res) => {
    console.log('create user')
    let user: User = req.body;
    console.log(user);
    if (validate(user)) {
        let uid = uuid();
        users[uid] = user;
        res.send(`users/${uid}`);
    } else {
        status(res, 400);
    }
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))