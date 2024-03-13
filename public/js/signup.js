const signupForm = document.getElementById('signupForm');

signupForm.addEventListener('submit', async function(event){
    event.preventDefault();

    const signupData = new FormData(signupForm);
    const username = signupData.get("username"); // Hent brugernavnet
    const password = signupData.get("password");

    const dataToSend = { username: username, password: password }; // Brugernavn og adgangskode som objekt

    const response = await fetch('http://localhost:3000/signedup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend) // Send brugernavn og adgangskode
    });

    try {
        const data = await response.text(); // Behandl responsen som tekst
        if (response.ok) {
            window.location.href = "/"; // Vis tekstsvar
        } else {
            const passFeedbackText = document.getElementById("passFeedbackText");
            passFeedbackText.innerHTML = `<p>${data}</p>`; // Vis fejlbesked som tekst
        }
    } catch (error) {
        console.error("Fejl under svar:", error);
        const passFeedbackText = document.getElementById("passFeedbackText");
        passFeedbackText.innerHTML = `<p>${error.message}</p>`; // Vis fejlbesked
    }
})
