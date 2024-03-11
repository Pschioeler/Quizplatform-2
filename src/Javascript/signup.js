const signupForm = document.getElementById('signupForm');

signupForm.addEventListener('submit', async function(event){
    event.preventDefault();

    const signupData = new FormData(signupForm);
    const password = signupData.get("password");

    const response = await fetch('/signup', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: password })
    });

    try {
        const data = await response.text(); // Behandl responsen som tekst
        if (response.ok) {
            alert(data); // Vis tekstsvar
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