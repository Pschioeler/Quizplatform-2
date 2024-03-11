document.getElementById('signupForm').addEventListener('submit', async function(event){
    event.preventDefault();

    const signupData = new FormData(this);
    const jsonData = {};

    signupData.forEach((value, key) => {
        jsonData[key] = value;
    });

    const response = await fetch('/signup)', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
    })

    const result = await response.json();
    console.log(result.message);
})