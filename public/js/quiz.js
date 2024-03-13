// Denne funktion anmoder serveren om en liste over alle tilgængelige quizzes og viser disse i en dropdown-menu på websiden. Ved hver quiz' ID, der modtages fra serveren, oprettes der et nyt <option>-element i dropdown-menuen, så brugeren kan vælge mellem forskellige quizzes.
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
        option.textContent = quizId;
        quizSelect.appendChild(option);
      });
    });
}

// Når en bruger har valgt en quiz, anmoder denne funktion serveren om et spørgsmål fra den valgte quiz. Hvis der ikke er flere spørgsmål tilbage i quizzen, vises en afslutnings-popup. Hvis der er et spørgsmål, vises det på siden, og brugeren præsenteres for enten multiple choice-knapper eller et tekstfelt til kort svar, afhængigt af spørgsmålstypen.
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
      questionText.innerHTML = data.questiontext;
      questionText.className = "question-text";
      questionContainer.appendChild(questionText);

      if (data.type === "multichoice") {
        let correctAnswerCount = 0;
        for (let i = 0; i < data.answers.length; i++) {
          if (data.answers[i].correct === "True") {
            // Her tjekker vi for strengværdien "True"
            correctAnswerCount++;
          }
        }

        if (correctAnswerCount > 1) {
          // logik for at vise checkboxes for spørgsmål med flere korrekte svar
          const form = document.createElement("form");
          form.id = "multi-answer-form";
          data.answers.forEach((answer, index) => {
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
          });

          const submitButton = document.createElement("button");
          submitButton.textContent = "Indsend svar";
          submitButton.type = "submit";
          form.appendChild(submitButton);

          questionContainer.appendChild(form);

          submitButton.addEventListener("click", function (event) {
            event.preventDefault();
            const selectedAnswers = Array.from(
              form.querySelectorAll("input:checked")
            ).map((input) => input.value);
            submitAnswer(quizName, data.id, selectedAnswers);
          });
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

// Denne funktion viser en popup-meddelelse, når brugeren har besvaret alle spørgsmål i en quiz. Meddelelsen lykønsker brugeren med at have afsluttet quizzen og tilbyder en knap til at vende tilbage til hjemmesiden.
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

// Denne funktion indlæses, når brugeren vælger en quiz og trykker på en knap for at starte den. Den henter det første spørgsmål fra den valgte quiz ved at kalde fetchQuestion() med den valgte quiz' ID.
function startQuiz() {
  const selectedQuizId = document.getElementById("quiz-select").value;
  fetchQuestion(selectedQuizId);
}

// Når en bruger besvarer et spørgsmål, samler denne funktion informationen om det givne svar og sender den til serveren. Serveren tjekker, om svaret er korrekt, og sender resultatet tilbage. Funktionen viser derefter en alert-boks, der informerer brugeren om, hvorvidt svaret var korrekt, og henter det næste spørgsmål.
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

// Denne funktion anmoder serveren om en liste over tilgængelige rapportfiler og viser disse i en dropdown-menu. Brugeren kan vælge en rapport fra listen og downloade den.
function loadAvailableReports() {
  fetch("/available-reports")
    .then((response) => response.json())
    .then((files) => {
      const reportsSelect = document.getElementById("reportsSelect");
      files.forEach((file) => {
        const option = document.createElement("option");
        option.value = file;
        option.textContent = file;
        reportsSelect.appendChild(option);
      });
    })
    .catch((error) => console.error("Error loading available reports:", error));
}

document.addEventListener("DOMContentLoaded", loadAvailableReports);

// Denne event listener er knyttet til en knap, der giver brugeren mulighed for at downloade den valgte rapportfil. Når knappen trykkes, anvender den valgte fil fra dropdown-menuen som en del af en URL til download-endpointet, hvilket starter download-processen.
document
  .getElementById("downloadReportBtn")
  .addEventListener("click", function () {
    const selectedFile = document.getElementById("reportsSelect").value;
    if (selectedFile) {
      window.location.href = `/quiz/results/download?file=${encodeURIComponent(
        selectedFile
      )}`;
    } else {
      alert("Vælg venligst en rapport at downloade.");
    }
  });
