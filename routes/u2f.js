const express   = require('express');
const utils     = require('../tools');
const config    = require('../config.json');
const base64url = require('base64url');
const router    = express.Router();
const database  = require('./db');

router.get('/register', (request, response) => {
    if(!request.session.loggedIn) {
        response.json({
            'status': 'failed',
            'message': 'Unauthorised'
        })

        return
    }

    let user = database[request.session.username]

    let challengeMakeCred    = utils.generateServerMakeCredRequest(request.session.username, user.name, user.id)
    challengeMakeCred.status = 'ok'

    request.session.challenge = challengeMakeCred.challenge;

    response.json(challengeMakeCred)
})

router.get('/login', (request, response) => {
    if(!request.session.username) {
        response.json({
            'status': 'failed',
            'message': 'Unauthorised'
        })

        return
    }

    let getAssertion    = utils.generateServerGetAssertion(database[request.session.username].u2fauthenticators)
    getAssertion.status = 'ok'

    request.session.challenge = getAssertion.challenge;

    response.json(getAssertion)
})

router.post('/response', (request, response) => {
    if(!request.session.username) {
        response.json({
            'status': 'failed',
            'message': 'Unauthorised'
        })

        return
    }

    if(!request.body       || !request.body.id
    || !request.body.rawId || !request.body.response
    || !request.body.type  || request.body.type !== 'public-key' ) {
        response.json({
            'status': 'failed',
            'message': 'Response missing one or more of id/rawId/response/type fields, or type is not public-key!'
        })

        return
    }

    let webauthnResp = request.body
    let clientData   = JSON.parse(base64url.decode(webauthnResp.response.clientDataJSON));

    /* Check challenge... */
    if(clientData.challenge !== request.session.challenge) {
        response.json({
            'status': 'failed',
            'message': 'Challenges don\'t match!'
        })
    }

    /* ...and origin */
    if(clientData.origin !== config.origin) {
        response.json({
            'status': 'failed',
            'message': 'Origins don\'t match!'
        })
    }

    let result;
    if(webauthnResp.response.attestationObject !== undefined) {
        /* This is create cred */
        result = utils.verifyAuthenticatorAttestationResponse(webauthnResp);

        if(result.verified) {
            database[request.session.username].u2fauthenticators.push(result.authrInfo);
        }
    } else if(webauthnResp.response.authenticatorData !== undefined) {
        /* This is get assertion */            
        result = utils.verifyAuthenticatorAssertionResponse(webauthnResp, database[request.session.username].u2fauthenticators);
    } else {
        response.json({
            'status': 'failed',
            'message': 'Can not determine type of response!'
        })
    }

    if(result.verified) {
        request.session.loggedIn  = true;
        request.session.awaitsU2F = false;

        response.json({ 'status': 'ok' })
    } else {
        response.json({
            'status': 'failed',
            'message': 'Can not authenticate signature!'
        })
    }
})

module.exports = router;
