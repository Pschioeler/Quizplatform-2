// Denne funktion henter og viser en liste over tilgængelige quizzes.
function loadQuizList() {
  fetch("/quizzes")
    .then((response) => response.json())
    .then((quizList) => {
      const quizSelect = document.getElementById("quiz-select");
      // Sørg for, at dropdown-menuen er tom før vi tilføjer nye options.
      quizSelect.innerHTML = "";
      quizList.forEach((quizId) => {
        const option = document.createElement("option");
        option.value = quizId;
        option.textContent = quizId; // Eller formatér det til et mere brugervenligt navn
        quizSelect.appendChild(option);
      });
    });
}

// Denne funktion henter et spørgsmål for den valgte quiz.
function fetchQuestion(quizId) {
  fetch(`/quiz/get-question?quizId=${encodeURIComponent(quizId)}`)
    .then((response) => response.json())
    .then((question) => {
      const questionContainer = document.getElementById("question-container");
      questionContainer.innerHTML = "";

      const questionText = document.createElement("h2");
      questionText.textContent = question.questiontext;
      questionContainer.appendChild(questionText);

      question.answers.forEach((answer) => {
        const answerButton = document.createElement("button");
        answerButton.textContent = answer.answertext;
        answerButton.onclick = () =>
          submitAnswer(question.id, answer.answertext);
        questionContainer.appendChild(answerButton);
      });
    });
}

function startQuiz() {
  const selectedQuizId = document.getElementById("quiz-select").value;
  fetchQuestion(selectedQuizId);
}

function submitAnswer(quizId, questionId, answer) {
  const payload = { quizId, questionId, answer };
  console.log("Sender svar:", payload);

  fetch("/quiz/submit-answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((result) => {
      alert(result.correct ? "Korrekt svar!" : "Forkert svar.");
      // Genindlæs næste spørgsmål fra den samme quiz
      fetchQuestion(quizId);
    })
    .catch((error) => {
      console.error("Fejl under indsendelse af svar:", error);
      alert("Der opstod en fejl. Prøv igen.");
    });
}

// Kalder loadQuizList, når siden indlæses for at fylde dropdown-menuen.
document.addEventListener("DOMContentLoaded", loadQuizList);
