import express from "express";
import { v4 as uuid } from 'uuid';
import Ajv from 'ajv';
import fs from 'fs';
import { User } from './src/models'

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

function status(res: express.Response, code: number) {
    res.status(code);
    res.send(`<img src="https://http.cat/${ code }.jpg"/>`)
}

app.use(express.static('dist'))

app.get('/users/:user_id', (req, res) => {
    if (req.params.user_id in users) {
        res.send(users[req.params.user_id]);
    } else {
        status(res, 404);
    }
});

app.post('/users', (req, res) => {
    console.log(`create user: ${ req.body }`)
    let user: User = req.body;
    if (validate(user)) {
        let uid = uuid();
        users[uid] = user;
        res.send(JSON.stringify({uri:`users/${uid}`}));
    } else {
        status(res, 400);
    }
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
