const fs = require("fs");
const path = require("path");
const os = require("os");
const sanitize = require("sanitize-filename");
const processXML = require("./processXML");

let quizzes = {};

// Denne asynkrone funktion indlæser alle quizzer fra XML-filer i en bestemt mappe og gemmer dem i et quizzes objekt. Den bruger processXML funktionen til at parse hver XML-fil og gemme resultatet under quiz' ID i quizzes objektet. Funktionen logger succes eller fejl ved indlæsningen af quizzerne.
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

// Når en bruger anmoder om et nyt spørgsmål fra en quiz, finder denne funktion den pågældende quiz i quizzes objektet og vælger et tilfældigt spørgsmål, som brugeren endnu ikke har set. Funktionen returnerer det valgte spørgsmål som JSON eller en fejl, hvis quizzen ikke findes eller alle spørgsmål allerede er besvaret.
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

// Denne funktion tjekker, om der eksisterer en mappe til at gemme resultaterne i, og opretter den, hvis den ikke eksisterer. Dette sikrer, at serveren har et sted at gemme brugerens svar og resultater.
function ensureResultsDirectory() {
  const resultsDir = path.normalize(path.join(__dirname, "../DB/results"));
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  return resultsDir;
}

// Når en bruger indsender et svar på et spørgsmål, validerer denne funktion svaret ved at sammenligne det med de korrekte svar gemt i quizzes objektet. Den beregner, om svaret er korrekt, og opdaterer brugerens session med information om det besvarede spørgsmål. Derefter logges resultatet ved at kalde logResult funktionen, og svarets korrekthed sendes tilbage til brugeren.
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

// Denne funktion logger brugerens svar på et spørgsmål sammen med oplysninger om spørgsmålet og om svaret var korrekt eller ej. Resultaterne gemmes i en JSON-fil, organiseret efter quiznavn og dato, i results mappen. TO BE FIXED -- Hvis filen allerede eksisterer, tilføjes det nye resultat til den eksisterende fil. Hvis filen ikke eksisterer, oprettes en ny fil med det nye resultat.
function logResult(
  quizName,
  questionId,
  questionText,
  userAnswer,
  correctAnswers,
  isCorrect
) {
  const resultsDir = ensureResultsDirectory();
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  // Opret filnavn baseret på quiznavn og dato
  const date = new Date();
  const dateString = date.toISOString().split("T")[0];
  const resultFilename = `result-${quizName}-${dateString}.json`;
  const resultFilePath = path.normalize(path.join(resultsDir, resultFilename));

  let resultsArray;
  try {
    // Hvis filen eksisterer, læs indholdet og konverter det til et array
    if (fs.existsSync(resultFilePath)) {
      resultsArray = JSON.parse(fs.readFileSync(resultFilePath, "utf8"));
    } else {
      // Hvis filen ikke eksisterer, opret et nyt array
      resultsArray = [];
    }
  } catch (error) {
    console.error("Error reading results:", error);
    return;
  }

  // Tilføj det nye resultat til arrayet
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

// Denne funktion genererer en rapport over en brugers resultater på tværs af alle quizzes, de har deltaget i. Den samler data fra resultaterne gemt i results mappen, beregner score og korrekthedsprocent, og genererer en tekstfil med en detaljeret rapport. Rapporten downloades derefter af brugeren.
function generateAndDownloadReport(req, res) {
  const userId = req.session.user || "placeholder-user";
  const resultsDir = ensureResultsDirectory();
  const userResults = [];

  // Saml alle resultater for den givne bruger
  fs.readdirSync(resultsDir).forEach((file) => {
    if (file.includes(userId)) {
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

// Denne funktion giver en oversigt over alle resultater for den aktuelle bruger ved at læse resultaterne fra results mappen. Den returnerer en liste over resultater som JSON, som kan bruges til at vise brugerens præstationer på klient-siden.
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
