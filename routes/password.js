const express  = require('express');
const utils    = require('../tools');
const router   = express.Router();
const database = require('./db');

router.post('/register', (request, response) => {
    if(!request.body || !request.body.username || !request.body.password || !request.body.name) {
        response.json({
            'status': 'failed',
            'message': 'Request missing username or password!'
        })

        return
    }

    let username = request.body.username;
    let password = request.body.password;
    let name     = request.body.name;

    if(database[username]) {
        response.json({
            'status': 'failed',
            'message': `Username ${username} already exists`
        })

        return
    }


    let passwordHash   = utils.scrypt.hash(password);
    database[username] = {
        'hash': passwordHash,
        'name': name,
        'u2fauthenticators': [],
        'id': utils.randomBase64URLBuffer()
    }

    request.session.loggedIn = true;
    request.session.username = username

    response.json({
        'status': 'ok'
    })
})

router.post('/login', (request, response) => {
    if(!request.body || !request.body.username || !request.body.password) {
        response.json({
            'status': 'failed',
            'message': 'Request missing username or password!'
        });

        return
    }

    let username = request.body.username;
    let password = request.body.password;

    if(!database[username] || !utils.scrypt.verify(password, database[username].hash)) {
        response.json({
            'status': 'failed',
            'message': `Wrong username or password!`
        });

        return
    }
    request.session.username  = username

    if(database[username].otpsecret) {
        request.session.awaitsOTP = true;
        response.json({
            'status': 'failed',
            'awaitsOTP': true
        })
    } else if(database[username].u2fauthenticators.length) {
        request.session.awaitsU2F = true;
        response.json({
            'status': 'failed',
            'awaitsU2F': true
        })
    } else {
        request.session.loggedIn = true;
        response.json({
            'status': 'ok'
        })
    }
})

module.exports = router;
