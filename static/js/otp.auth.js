/* Handle for register form submission */
let otpDialog = document.querySelector('#otpDialog');
dialogPolyfill.registerDialog(otpDialog);

$('#addOTP').click(() => {
    fetch('/otp/registerAuthenticator', {credentials: 'include'})
        .then((response) => response.json())
        .then((response) => {
            if(response.status === 'ok') {
                let qrcode = response.data;
                $('#qrcodeimage').html(qrcode);
                otpDialog.showModal()
            } else {
                alert('Error while fetching QR code! The message is: ' + response.message)
            }
        })
})

$('#verifyotp').submit(function(event) {
    event.preventDefault();

    let otp = this.code.value;

    if(!otp) {
        alert('OTP code is missing!')
        return
    }

    let formBody = {otp}; 

    fetch('/otp/verifyQRCode', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formBody)
    })
    .then((response) => response.json())
    .then((response) => {
        if(response.status === 'ok') {
            alert('Successfully verified OTP!');
            otpDialog.close();
            this.code.value = '';

            if(window.awaitsOTP) {
                loadMainContainer()
            }
        } else {
            alert(`Server responed with error. The message is: ${response.message}`);
        }
    })
})
