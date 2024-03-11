function fetchQuestion() {
  fetch("/quiz/get-question")
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

function submitAnswer(questionId, answer) {
  fetch("/quiz/submit-answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ questionId, answer }),
  })
    .then((response) => response.json())
    .then((result) => {
      alert(result.correct ? "Korrekt svar!" : "Forkert svar.");
      fetchQuestion();
    });
}

fetchQuestion();
