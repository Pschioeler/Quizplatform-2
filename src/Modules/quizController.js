const fs = require("fs");
const path = require("path");
const processXML = require("./processXML");

let quizzes = {};

async function loadQuizzes() {
  const xmlDir = path.join(__dirname, "../DB/xml");
  const quizFiles = fs.readdirSync(xmlDir);
  const quizPromises = quizFiles
    .filter((file) => file.endsWith(".xml"))
    .map((file) => {
      const quizId = path.basename(file, ".xml");
      return processXML(quizId).then((quizData) => {
        quizzes[quizId] = quizData;
      });
    });

  try {
    // Vent på, at alle quizzer er blevet indlæst
    await Promise.all(quizPromises);
    console.log("Alle quizzer er blevet indlæst.");
  } catch (err) {
    console.error("Fejl under indlæsning af quizzer:", err);
  }
}

function getQuestion(req, res) {
  const quizId = req.query.quizId;
  const shownQuestions = req.session.shownQuestions || {};

  if (!shownQuestions[quizId]) {
    shownQuestions[quizId] = [];
  }

  const quiz = quizzes[quizId];
  if (!quiz) {
    return res.status(404).send("Quizzen blev ikke fundet.");
  }

  const remainingQuestions = quiz.filter(
    (q) => !shownQuestions[quizId].includes(q.id)
  );

  if (remainingQuestions.length === 0) {
    return res
      .status(404)
      .send("Alle spørgsmål for denne quiz er allerede blevet vist.");
  }

  const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
  const question = remainingQuestions[randomIndex];

  // Gemmer den viste spørgsmåls ID i sessionen
  shownQuestions[quizId].push(question.id);
  req.session.shownQuestions = shownQuestions;

  res.json({
    id: question.id,
    type: question.type,
    questiontext: question.questiontext,
    answers: question.answers.map((answer) => ({
      answertext: answer.answertext,
    })),
  });
}

// Tilføj en funktion til at logge resultaterne
function logResult(user, quizId, questionId, isCorrect) {
  // Læs den eksisterende results.json fil
  const resultsPath = path.join(__dirname, "../DB/results.json");
  const resultsData = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

  // Tilføj det nye resultat
  const result = {
    user,
    quizId,
    questionId,
    isCorrect,
    timestamp: new Date(),
  };
  resultsData.push(result);

  // Gem det opdaterede resultater tilbage til results.json
  fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2));
}

function submitAnswer(req, res) {
  console.log("Anmodning modtaget til /quiz/submit-answer", req.body);
  const { quizId, questionId, answer, user } = req.body; // Antager, at 'user' sendes med for at identificere, hvem der svarer
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

  // Log resultatet
  logResult(user, quizId, questionId, isCorrect);

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
  loadQuizzes,
  quizzes,
};
