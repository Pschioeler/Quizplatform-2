const fs = require("fs");
const path = require("path");
const os = require("os");
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
  let correctAnswers;
  let userAnswers = Array.isArray(answer)
    ? answer.map((a) => a.toLowerCase())
    : [answer.toLowerCase()];
  if (question.type === "multichoice") {
    correctAnswers = question.answers
      .filter((ans) => ans.correct)
      .map((ans) => ans.answertext.toLowerCase());
    isCorrect =
      correctAnswers.length === userAnswers.length &&
      userAnswers.every((a) => correctAnswers.includes(a));
  } else if (question.type === "shortanswer") {
    correctAnswers = question.answers
      .filter((ans) => ans.correct)
      .map((ans) => ans.answertext.toLowerCase());
    isCorrect = correctAnswers.includes(userAnswers[0]); // Antager at brugeren kun giver ét svar for shortanswer
  } else {
    console.log("Question type not supported:", question.type);
  }

  logResult(
    quizName,
    questionId,
    question.questiontext,
    userAnswers,
    correctAnswers,
    isCorrect
  );
  res.json({ correct: isCorrect });
}
function logResult(
  quizName,
  questionId,
  questionText,
  userAnswer,
  correctAnswers,
  isCorrect
) {
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
    questionText,
    userAnswer,
    correctAnswer: isCorrect ? undefined : correctAnswers, // Kun logge de korrekte svar, hvis brugeren svarede forkert
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

function generateAndDownloadReport(req, res) {
  const userId = req.session.user || "placeholder-user"; // Juster dette efter dit behov
  const resultsDir = ensureResultsDirectory();
  const userResults = [];

  // Saml alle resultater for den givne bruger
  fs.readdirSync(resultsDir).forEach((file) => {
    if (file.includes(userId)) {
      // Juster dette til hvordan filnavne er struktureret
      const result = JSON.parse(
        fs.readFileSync(path.join(resultsDir, file), "utf8")
      );
      userResults.push(result);
    }
  });

  // Generer rapportindhold
  let reportContent = `Rapport for bruger: ${userId}\n\n`;

  userResults.forEach((result) => {
    const score = result.filter((r) => r.isCorrect).length;
    const totalQuestions = result.length;
    const percentageCorrect = (score / totalQuestions) * 100;
    reportContent += `Quiz: ${result[0].quizName}\n`;
    reportContent += `Score: ${score} ud af ${totalQuestions} (${percentageCorrect.toFixed(
      2
    )}% korrekte)\n\n`;

    // Tilføj detaljer om hvert spørgsmål og brugerens svar
    result.forEach((r) => {
      reportContent += `Spørgsmål: ${r.questionText}\n`;
      reportContent += `Dit svar: ${r.userAnswer}\n`;
      reportContent += `Korrekt svar: ${r.correctAnswer}\n`;
      reportContent += `Resultat: ${r.isCorrect ? "Korrekt" : "Forkert"}\n\n`;
    });
  });

  // Opret midlertidig fil for rapporten
  const reportPath = path.join(os.tmpdir(), `quiz-rapport-${userId}.txt`);
  fs.writeFileSync(reportPath, reportContent);

  // Send filen til brugeren
  res.download(reportPath, `quiz-rapport-${userId}.txt`, (err) => {
    if (err) {
      console.error("Fejl ved download af rapport:", err);
      return res
        .status(500)
        .send("Der opstod en fejl under generering af rapporten.");
    }
    // Slet midlertidig fil efter download
    fs.unlinkSync(reportPath);
  });
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
  });

  res.json(userResults);
}

module.exports = {
  getQuestion,
  submitAnswer,
  generateAndDownloadReport,
  loadQuizzes,
  getResultsForUser,
  quizzes,
  logResult,
};
