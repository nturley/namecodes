import {User, Team} from './models';

(document.querySelector('#pushBtn') as HTMLInputElement).onclick = () => {
    console.log('button pushed');
    
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