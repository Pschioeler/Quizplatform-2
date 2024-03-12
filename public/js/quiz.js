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
    .then((response) => response.json())
    .then((data) => {
      if (data.quizComplete) {
        showCompletionPopup(); // Antager du har denne funktion implementeret
        return;
      }

      const questionContainer = document.getElementById("question-container");
      questionContainer.innerHTML = "";

      const questionText = document.createElement("h2");
      questionText.textContent = data.questiontext;
      questionText.className = "question-text";
      questionContainer.appendChild(questionText);

      const correctAnswerCount = data.answers.filter(
        (answer) => answer.correct
      ).length;

      // Informerer brugeren om at vælge alle korrekte svar, hvis der er flere end ét korrekt svar
      if (correctAnswerCount > 1) {
        const instruction = document.createElement("p");
        instruction.textContent =
          "Vælg alle de korrekte svar. At vælge forkerte svar vil reducere din score.";
        instruction.className = "instruction-text";
        questionContainer.appendChild(instruction);
      }

      if (data.type === "multichoice") {
        // Opret en form til at holde checkboxes eller knapper
        const form = document.createElement("form");
        form.id = "answers-form";

        data.answers.forEach((answer, index) => {
          if (correctAnswerCount > 1) {
            // Brug checkboxes for spørgsmål med flere korrekte svar
            const checkboxId = `answer-${index}`;
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = checkboxId;
            checkbox.name = "answers";
            checkbox.value = answer.answertext;
            const label = document.createElement("label");
            label.htmlFor = checkboxId;
            label.textContent = answer.answertext;
            form.appendChild(checkbox);
            form.appendChild(label);
          } else {
            // Brug knapper for spørgsmål med kun ét korrekt svar
            const answerButton = document.createElement("button");
            answerButton.textContent = answer.answertext;
            answerButton.type = "button";
            answerButton.onclick = () =>
              submitAnswer(quizName, data.id, [answer.answertext]);
            form.appendChild(answerButton);
          }
        });

        // Tilføj en submit-knap til formen, hvis der er checkboxes
        if (correctAnswerCount > 1) {
          const submitButton = document.createElement("button");
          submitButton.textContent = "Indsend svar";
          submitButton.type = "button"; // Forhindrer formens standard submit handling
          submitButton.onclick = () => {
            const selectedAnswers = Array.from(
              form.querySelectorAll("input:checked")
            ).map((input) => input.value);
            submitAnswer(quizName, data.id, selectedAnswers);
          };
          form.appendChild(submitButton);
        }

        questionContainer.appendChild(form);
      } else if (data.type === "shortanswer") {
        // Tilføj input og knap til short answer spørgsmål som før
        const answerInput = document.createElement("input");
        answerInput.type = "text";
        answerInput.className = "short-answer-input";
        questionContainer.appendChild(answerInput);

        const submitButton = document.createElement("button");
        submitButton.textContent = "Indsend";
        submitButton.className = "submit-button shortanswer";
        submitButton.onclick = () => {
          submitAnswer(quizName, data.id, [answerInput.value]);
          answerInput.value = ""; // Nulstil inputfeltet efter indsendelse
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
  let payload;

  if (Array.isArray(selectedAnswer) && selectedAnswer.length > 1) {
    payload = { quizName, questionId, answer: selectedAnswer };
  } else {
    payload = {
      quizName,
      questionId,
      answer: Array.isArray(selectedAnswer)
        ? selectedAnswer[0]
        : selectedAnswer,
    };
  }

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
      // Hent det næste spørgsmål
      fetchQuestion(quizName);
    })
    .catch((error) => {
      console.error("Fejl under indsendelse af svar:", error);
      alert("Der opstod en fejl. Prøv igen.");
    });
}

// Kalder loadQuizList, når siden indlæses for at fylde dropdown-menuen.
document.addEventListener("DOMContentLoaded", loadQuizList);
