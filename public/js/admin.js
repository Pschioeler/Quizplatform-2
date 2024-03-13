function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if(!response.ok){
            throw new Error('Upload mislykkedes');
        }
        alert("Fil uploadet");
    })
    .catch(error => {
        console.error("Fejl", error);
        alert("Der skete en fejl under upload", error);
    })
}

// Function to fetch quizzes from the server and display them on the admin page
function displayQuizzes() {
    // Fetch quizzes from the server
    fetch('http://localhost:3000/quizzes')
    .then(response => response.json())
    .then(quizIds => {
        const quizListElement = document.getElementById('quiz_list');
        // Clear existing content
        quizListElement.innerHTML = '';
        // Create and append a link and a delete button for each quiz
        quizIds.forEach(quizId => {
            const quizLink = document.createElement('a');
            quizLink.href = '/quiz/' + quizId;
            quizLink.textContent = 'Quiz ' + quizId;
            quizListElement.appendChild(quizLink);
            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = function() {
                console.log('Delete button clicked for quiz ID:', quizId);
                deleteQuiz(quizId);
            };
            quizListElement.appendChild(deleteButton);
            quizListElement.appendChild(document.createElement('br')); // Add a line break
        });
    })
    .catch(error => console.error('Error fetching quizzes:', error));
}

function deleteQuiz(quizId) {
    console.log("Sletter quiz: ", quizId)
    fetch('http://localhost:3000/delete-quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName: quizId }),
    })
    .then(response => {
        if (response.ok) {
            alert('Quiz deleted successfully.');
            displayQuizzes(); // Refresh the quiz list after deletion
        } else {
            throw new Error('Failed to delete quiz.');
        }
    })
    .catch(error => {
        console.error('Error deleting quiz:', error);
        alert('Failed to delete quiz.');
    });
}

// Call the function to display quizzes when the page loads
window.onload = function() {
    displayQuizzes();
    setInterval(displayQuizzes, 1000);
};