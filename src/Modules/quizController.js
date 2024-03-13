const fs = require("fs");
const path = require("path");
const sanitize = require("sanitize-filename");
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
  const quizName = req.query.quizName;
  const quiz = quizzes[quizName];

  if (!quiz) {
    return res.status(404).send("Quizzen blev ikke fundet.");
  }

  if (!req.session.shownQuestions) {
    req.session.shownQuestions = {};
  }

  if (!req.session.shownQuestions[quizName]) {
    req.session.shownQuestions[quizName] = [];
  }

  const shownQuestions = req.session.shownQuestions[quizName];
  const remainingQuestions = quiz.filter((q) => !shownQuestions.includes(q.id));

  if (remainingQuestions.length === 0) {
    return res.json({ quizComplete: true });
  }

  const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
  const question = remainingQuestions[randomIndex];

  shownQuestions.push(question.id);
  req.session.shownQuestions[quizName] = shownQuestions;

  res.json({
    id: question.id,
    type: question.type,
    questiontext: question.questiontext,
    answers: question.answers.map((answer) => ({
      answertext: answer.answertext,
    })),
  });
}

// Function to ensure the results directory exists
function ensureResultsDirectory() {
  const resultsDir = path.normalize(path.join(__dirname, "../DB/results"));
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  return resultsDir;
}

function submitAnswer(req, res) {
  console.log("Request received for /quiz/submit-answer", req.body);
  const { quizName, questionId, answer } = req.body;

  const quiz = quizzes[quizName];
  if (!quiz) {
    console.log(`Quiz not found: ${quizName}`);
    return res.status(404).send("Quiz not found.");
  }

  const question = quiz.find((q) => q.id === questionId);
  if (!question) {
    console.log(`Question not found: ID ${questionId}`);
    return res.status(404).send("Question not found.");
  }

  let isCorrect = false;
  if (question.type === "multichoice") {
    // Handle multiple choice questions
    const correctAnswers = question.answers
      .filter((ans) => ans.correct)
      .map((ans) => ans.answertext.toLowerCase()); // Assume case-insensitivity
    const providedAnswers = Array.isArray(answer)
      ? answer.map((ans) => ans.toLowerCase())
      : [answer.toLowerCase()];
    isCorrect =
      correctAnswers.sort().join(",") === providedAnswers.sort().join(",");
    console.log(
      `Expected answers: [${correctAnswers}], Provided answers: [${providedAnswers}], Is correct: ${isCorrect}`
    );
  } else if (question.type === "shortanswer" || question.answers.length === 1) {
    // Handle short answer questions
    const providedAnswer = answer.toLowerCase().trim(); // Assume case-insensitivity and trim spaces
    isCorrect = question.answers.some(
      (ans) =>
        ans.correct && ans.answertext.toLowerCase().trim() === providedAnswer
    );
    console.log(
      `Expected answer: ${question.answers[0].answertext
        .toLowerCase()
        .trim()}, Provided answer: ${providedAnswer}, Is correct: ${isCorrect}`
    );
  } else {
    console.log("Question type not supported:", question.type);
  }

  logResult(quizName, questionId, isCorrect);
  res.json({ correct: isCorrect });
}
function logResult(quizName, questionId, isCorrect) {
  // For now, we don't have userId, so we'll use a placeholder
  // const userId = "placeholder-userId";

  const resultsDir = ensureResultsDirectory();
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  // Format dato og tid for at undgå problemer med filnavne
  const date = new Date();
  const dateString = date.toISOString().split("T")[0];
  // const timeString = date
  //   .toISOString()
  //   .split("T")[1]
  //   .replace(/:/g, "-")
  //   .split(".")[0];

  // Opbyg filnavnet med korrekt datoformat
  const resultFilename = `result-${quizName}-${dateString}.json`;
  const resultFilePath = path.normalize(path.join(resultsDir, resultFilename));

  let resultsArray;
  try {
    // If the file exists, read it and parse it into an array.
    if (fs.existsSync(resultFilePath)) {
      resultsArray = JSON.parse(fs.readFileSync(resultFilePath, "utf8"));
    } else {
      // If the file does not exist, start with an empty array.
      resultsArray = [];
    }
  } catch (error) {
    console.error("Error reading results:", error);
    return;
  }

  // Append the new result to the array.
  const resultData = {
    quizName,
    questionId,
    isCorrect,
    timestamp: new Date().toISOString(),
  };
  resultsArray.push(resultData);

  fs.writeFileSync(
    resultFilePath,
    JSON.stringify(resultsArray, null, 2),
    "utf8"
  );
}

// Ny funktion til at hente resultater for en bruger
function getResultsForUser(req, res) {
  //  const userId = req.session.user;
  const resultsDir = ensureResultsDirectory();
  const userResults = [];

  fs.readdirSync(resultsDir).forEach((file) => {
    // Filter filer baseret på userId (vil blive tilføjet senere)
    // if (file.startsWith(`result-${userId}-`)) {
    const result = JSON.parse(
      fs.readFileSync(path.join(resultsDir, file), "utf8")
    );
    userResults.push(result);
    // }
  });

  res.json(userResults);
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
  getResultsForUser,
};
