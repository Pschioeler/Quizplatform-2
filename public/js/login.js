function login() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // Send login information to the server
    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    /*
    .then(response => response.json())
    
    .then(data => {
        if (data.success) {
            //alert('Login successful!');
            // Redirect to another page or do something else upon successful login
            
        } else {
            alert('Forkert brugernavn eller kodeord. Prøv igen.');
        }
    })
    
    */
    .catch(error => {
        console.error('Error:', error);
    });
}
