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
        showCompletionPopup();
        return;
      }

      const questionContainer = document.getElementById("question-container");
      questionContainer.innerHTML = "";

      const questionText = document.createElement("h2");
      questionText.textContent = data.questiontext;
      questionText.className = "question-text";
      questionContainer.appendChild(questionText);

      if (data.type === "multichoice") {
        const correctAnswerCount = data.answers.reduce(
          (count, answer) => count + (answer.correct === "True" ? 1 : 0),
          0
        );
        console.log(correctAnswerCount);

        if (correctAnswerCount > 1) {
          // Brug checkboxes for flere korrekte svar
          const form = document.createElement("form");
          form.id = "multi-answer-form";
          data.answers.forEach((answer, index) => {
            const checkboxId = `answer-${index}`;
            const checkbox = document.createElement("input");
            const label = document.createElement("label");
            const wrapper = document.createElement("div");

            checkbox.type = "checkbox";
            checkbox.id = checkboxId;
            checkbox.name = "answers";
            checkbox.value = answer.answertext;
            label.htmlFor = checkboxId;
            label.textContent = answer.answertext;

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            form.appendChild(wrapper);
          });

          const submitButton = document.createElement("button");
          submitButton.textContent = "Indsend svar";
          submitButton.type = "button"; // Forhindre form submit handling
          submitButton.onclick = () => {
            const selectedAnswers = Array.from(
              form.querySelectorAll("input:checked")
            ).map((input) => input.value);
            submitAnswer(quizName, data.id, selectedAnswers);
          };
          form.appendChild(submitButton);
          questionContainer.appendChild(form);
        } else {
          // Brug knapper for et enkelt korrekt svar
          data.answers.forEach((answer) => {
            const answerButton = document.createElement("button");
            answerButton.textContent = answer.answertext;
            answerButton.className = "answer-button";
            answerButton.onclick = () =>
              submitAnswer(quizName, data.id, [answer.answertext]);
            questionContainer.appendChild(answerButton);
          });
        }
      } else if (data.type === "shortanswer") {
        // Shortanswer håndtering
        const answerInput = document.createElement("input");
        answerInput.type = "text";
        answerInput.className = "short-answer-input";
        const submitButton = document.createElement("button");
        submitButton.textContent = "Indsend";
        submitButton.className = "submit-button shortanswer";
        submitButton.onclick = () =>
          submitAnswer(quizName, data.id, [answerInput.value]);
        questionContainer.appendChild(answerInput);
        questionContainer.appendChild(submitButton);
      }
    })
    .catch((error) => {
      console.error("Fejl ved hentning af spørgsmål:", error);
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
