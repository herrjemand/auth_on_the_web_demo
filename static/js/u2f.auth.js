'use strict';

let u2fDialog = document.querySelector('#u2fDialog');
dialogPolyfill.registerDialog(u2fDialog);

let getU2FMakeCredentialsChallenge = () => {
    return fetch('/u2f/register', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
    })
    .then((response) => response.json())
    .then((response) => {
        if(response.status !== 'ok')
            throw new Error(`Server responed with error. The message is: ${response.message}`);

        return response
    })
}

let sendU2FWebAuthnResponse = (body) => {
    return fetch('/u2f/response', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then((response) => response.json())
    .then((response) => {
        if(response.status !== 'ok')
            throw new Error(`Server responed with error. The message is: ${response.message}`);

        return response
    })
}

/* Handle for register form submission */
$('#addU2F').click(function(event) {
    event.preventDefault();
    u2fDialog.showModal();
    getU2FMakeCredentialsChallenge()
        .then((response) => {
            let publicKey = preformatMakeCredReq(response);
            return navigator.credentials.create({ publicKey })
        })
        .then((response) => {
            let makeCredResponse = publicKeyCredentialToJSON(response);
            return sendU2FWebAuthnResponse(makeCredResponse)
        })
        .then((response) => {
            if(response.status === 'ok') {
                alert('Successfully added U2F device!');
            } else {
                alert(`Server responed with error. The message is: ${response.message}`);
            }

            u2fDialog.close();
        })
        .catch((error) => {
            alert(error);
            u2fDialog.close();
        })
})

let getU2FGetAssertionChallenge = () => {
    return fetch('/u2f/login', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
    })
    .then((response) => response.json())
    .then((response) => {
        if(response.status !== 'ok')
            throw new Error(`Server responed with error. The message is: ${response.message}`);

        return response
    })
}


var u2fLogin = () => {
    u2fDialog.showModal();
/* Handle for login form submission */
    getU2FGetAssertionChallenge()
        .then((response) => {
            let publicKey = preformatGetAssertReq(response);
            return navigator.credentials.get({ publicKey })
        })
        .then((response) => {
            let getAssertionResponse = publicKeyCredentialToJSON(response);
            return sendU2FWebAuthnResponse(getAssertionResponse)
        })
        .then((response) => {
            if(response.status === 'ok') {
                loadMainContainer()   
            } else {
                alert(`Server responed with error. The message is: ${response.message}`);
            }
            u2fDialog.close();
        })
        .catch((error) => {
            alert(error);
            u2fDialog.close();
        })
}