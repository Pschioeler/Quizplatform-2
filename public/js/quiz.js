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

function fetchQuestion(quizName) {
  fetch(`/quiz/get-question?quizName=${encodeURIComponent(quizName)}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Problem med at hente quiz spørgsmålet.");
      }
      return response.json();
    })
    .then((data) => {
      // Tjek for om quizzen er færdig
      if (data.quizComplete) {
        showCompletionPopup(); // Viser en afsluttende popup
        return;
      }

      const questionContainer = document.getElementById("question-container");
      questionContainer.innerHTML = "";

      const questionText = document.createElement("h2");
      questionText.textContent = data.questiontext;
      questionText.className = "question-text";
      questionContainer.appendChild(questionText);

      if (data.type === "multichoice") {
        data.answers.forEach((answer) => {
          const answerButton = document.createElement("button");
          answerButton.textContent = answer.answertext;
          answerButton.className = "answer-button multichoice";
          answerButton.onclick = () =>
            submitAnswer(quizName, data.id, answer.answertext);
          questionContainer.appendChild(answerButton);
        });
      } else if (data.type === "shortanswer") {
        const answerInput = document.createElement("input");
        answerInput.type = "text";
        answerInput.id = "short-answer-input";
        answerInput.className = "short-answer-input";
        questionContainer.appendChild(answerInput);

        const submitButton = document.createElement("button");
        submitButton.textContent = "Indsend";
        submitButton.className = "submit-button shortanswer";
        submitButton.onclick = () => {
          const input = document.getElementById("short-answer-input");
          submitAnswer(quizName, data.id, input.value);
        };
        questionContainer.appendChild(submitButton);
      }
    })
    .catch((error) => {
      console.error("Fejl:", error);
      alert("Der skete en fejl under indlæsning af spørgsmålet.");
    });
}

// Funktion til at vise en afsluttende popup
function showCompletionPopup() {
  const completionPopup = document.createElement("div");
  completionPopup.innerHTML = `
    <div class="completion-popup">
      <p>Alle spørgsmål for denne quiz er allerede blevet vist. Tillykke med at have afsluttet quizzen!</p>
      <button onclick="window.location.href = '/'">Gå til hjemmeside</button>
    </div>
  `;
  document.body.appendChild(completionPopup);
}

function startQuiz() {
  const selectedQuizId = document.getElementById("quiz-select").value;
  fetchQuestion(selectedQuizId);
}

function submitAnswer(quizName, questionId, selectedAnswer) {
  const payload = { quizName, questionId, answer: selectedAnswer };

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
      fetchQuestion(quizName); // Hent det næste spørgsmål
    })
    .catch((error) => {
      console.error("Fejl under indsendelse af svar:", error);
      alert("Der opstod en fejl. Prøv igen.");
    });
}

// Kalder loadQuizList, når siden indlæses for at fylde dropdown-menuen.
document.addEventListener("DOMContentLoaded", loadQuizList);
