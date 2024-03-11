const fs = require("fs");
const path = require("path");
const processXML = require("./processXML");

let quizzes = {};

async function loadQuizzes() {
  const xmlDir = path.join(__dirname, "../DB/xml");
  const quizFiles = fs.readdirSync(xmlDir);
  for (const file of quizFiles) {
    if (file.endsWith(".xml")) {
      try {
        const quizData = await processXML(file.replace(".xml", ""));
        quizzes[file] = quizData;
      } catch (err) {
        console.error(`Failed to load quiz ${file}: ${err}`);
      }
    }
  }
}

function getQuestion(req, res) {
  const quizIds = Object.keys(quizzes);
  if (quizIds.length === 0) {
    return res.status(404).send("Ingen quizzer tilgængelige.");
  }

  const firstQuizId = quizIds[0];
  const questions = quizzes[firstQuizId];
  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = questions[randomIndex];

  // Send kun den information der er nødvendig for at stille spørgsmålet
  const questionToSend = {
    id: question.id,
    type: question.type,
    questiontext: question.questiontext,
    answers: question.answers.map((answer) => ({
      answertext: answer.answertext,
    })),
  };

  res.json(questionToSend);
}

function submitAnswer(req, res) {
  const { quizId, questionId, answer } = req.body;
  const quiz = quizzes[quizId];
  if (!quiz) {
    return res.status(404).send("Quizzen blev ikke fundet.");
  }

  const question = quiz.find((q) => q.id === questionId);
  if (!question) {
    return res.status(404).send("Spørgsmålet blev ikke fundet.");
  }

  const isCorrect = question.answers.some(
    (ans) =>
      ans.correct && ans.answertext.toLowerCase() === answer.toLowerCase()
  );

  res.json({ correct: isCorrect });
}

function getResults(req, res) {
  // Denne funktion skal udvides til at håndtere dine specifikke behov for resultathåndtering
  // For nu, sender vi blot en simpel besked tilbage
  res.send("Resultater er ikke implementeret endnu.");
}

module.exports = {
  getQuestion,
  submitAnswer,
  getResults,
  loadQuizzes, // Vi eksporterer denne så vi kan kalde den fra server.js
};
