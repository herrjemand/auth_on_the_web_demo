/* Handle for register form submission */
$('#register').submit(function(event) {
    event.preventDefault();

    let username = this.username.value;
    let password = this.password.value;
    let name     = this.name.value;

    if(!username || !password || !name) {
        alert('Name, username or password is missing!')
        return
    }

    let formBody = {username, password, name}; 

    fetch('/password/register', {
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
            this.username.value = '';
            this.password.value = '';
            this.name.value     = '';
            loadMainContainer()
        } else {
            alert(`Server responed with error. The message is: ${response.message}`);
        }
    })
})

/* Handle for login form submission */
$('#login').submit(function(event) {
    event.preventDefault();

    let username = this.username.value;
    let password = this.password.value;

    if(!username || !password) {
        alert('Username or password is missing!')
        return
    }

    let formBody = {username, password}; 
    fetch('/password/login', {
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
            loadMainContainer()
            this.username.value = '';
            this.password.value = '';
        } else {
            if(response.awaitsOTP) {
                window.awaitsOTP = true;
                $('#qrcodeimage').html('');
                otpDialog.showModal()

                this.username.value = '';
                this.password.value = '';
            } else if(response.awaitsU2F) {
                u2fLogin()
            } else {
                alert(`Server responed with error. The message is: ${response.message}`);
            }

        }
    })
})


