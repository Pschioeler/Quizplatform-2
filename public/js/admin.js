function uploadFile(){
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch('upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if(!reponse.ok){
            throw new Error('Upload mislykkedes');
        }
        alert("Fil uploadet");
    })
    .catch(error => {
        console.error("Fejl", error);
        alert("Der skete en fejl under upload");
    })
}