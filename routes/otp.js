const express   = require('express');
const utils     = require('../tools');
const speakeasy = require('speakeasy');
const qrcode    = require('qrcode');
const router    = express.Router();
const database  = require('./db');

router.get('/registerAuthenticator', (request, response) => {
    if(!request.session.loggedIn) {
        response.json({
            'status': 'failed',
            'message': 'Unauthorised'
        })

        return
    }

    let secret = speakeasy.generateSecret();

    request.session.verifyOTPSecret = secret.hex

    qrcode.toDataURL(secret.otpauth_url, function(error, data_url) {
        if(error) {
            response.json({
                'status': 'failed',
                'message': 'Error generating master key: ' + error
            }) 
        } else {
            response.json({
                'status': 'ok',
                'data': `<img src="${data_url}">`
            })
        }
    })
})

router.post('/verifyQRCode', (request, response) => {
    if(!request.session.awaitsOTP && !request.session.verifyOTPSecret) {
        response.json({
            'status': 'failed',
            'message': 'Unauthorised!'
        })

        return
    }

    if(!request.body || !request.body.otp) {
        response.json({
            'status': 'failed',
            'message': 'Request missing one-time password!'
        })

        return
    }

    let otp = request.body.otp;

    if(request.session.verifyOTPSecret) {
        let verified = speakeasy.totp.verify({ 
            secret: request.session.verifyOTPSecret,
            encoding: 'hex', token: otp 
        })

        if(verified) {
            database[request.session.username].otpsecret = request.session.verifyOTPSecret;
            request.session.verifyOTPSecret = undefined;

            response.json({
                'status': 'ok'
            })
        } else {
            response.json({
                'status': 'failed',
                'message': 'Failed to verify one-time password. Please try again'
            })
        }
    } else {
        let secret = database[request.session.username].otpsecret;

        let verified = speakeasy.totp.verify({ 
            secret: secret, encoding: 'hex', token: otp 
        })

        if(verified) {
            request.session.awaitsOTP = false;
            request.session.loggedIn = true;

            response.json({
                'status': 'ok'
            })
        } else {
            response.json({
                'status': 'failed',
                'message': 'Failed to verify one-time password.'
            })
        }
    }
})


module.exports = router;
