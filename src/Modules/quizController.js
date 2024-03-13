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
  console.log("Anmodning modtaget for /quiz/submit-answer", req.body);
  const { quizName, questionId, answer } = req.body;
  const user = req.session.user;

  // Find quizzen og spørgsmålet
  const quiz = quizzes[quizName];
  if (!quiz) return res.status(404).send("Quizzen blev ikke fundet.");

  const question = quiz.find((q) => q.id === questionId);
  if (!question) return res.status(404).send("Spørgsmålet blev ikke fundet.");

  let isCorrect = false;
  if (Array.isArray(answer) && question.answers.some((ans) => ans.correct)) {
    // Scenarie med flere korrekte svar
    const correctAnswers = question.answers
      .filter((ans) => ans.correct)
      .map((ans) => ans.answertext.toLowerCase());
    const providedAnswers = answer.map((ans) => ans.toLowerCase());
    // Tjek om alle valgte svar er korrekte og at ingen ekstra forkerte svar er valgt
    isCorrect =
      providedAnswers.every((ans) => correctAnswers.includes(ans)) &&
      providedAnswers.length === correctAnswers.length;
  } else if (question.type === "shortanswer" || question.answers.length === 1) {
    // Scenarie med ét korrekt svar eller short-answer
    const providedAnswer = answer.toLowerCase();
    isCorrect = question.answers.some(
      (ans) => ans.correct && ans.answertext.toLowerCase() === providedAnswer
    );
  }

  // Log resultatet med bruger id
  logResult(/*userId, */ quizName, questionId, isCorrect);

  const resultTimestamp = new Date().toISOString().replace(/:/g, "-"); // Ensuring invalid characters are replaced
  const safeQuizName = sanitize(quizName);
  const userResultFilename = `result-${safeQuizName}-${resultTimestamp}.json`;
  const resultsDir = ensureResultsDirectory();

  // Ensure that the results directory exists when the server starts
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const userResultPath = path.normalize(
    path.join(resultsDir, userResultFilename)
  );

  const resultData = {
    quizName: quizName,
    questionId: questionId,
    answer: answer,
    isCorrect: isCorrect,
    timestamp: resultTimestamp,
  };

  console.log("Attempting to write to:", userResultPath); // Debugging
  fs.writeFile(userResultPath, JSON.stringify(resultData, null, 2), (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return res.status(500).send("Internal server error");
    }
    res.json({ correct: isCorrect });
  });
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
    if (fs.existsSync(resultFilePath)) {
      resultsArray = JSON.parse(fs.readFileSync(resultFilePath, "utf8"));
    } else {
      resultsArray = [];
    }
  } catch (error) {
    console.error("Fejl ved læsning af resultater:", error);
    return;
  }

  const resultData = {
    // userId, // This is a temporary line
    quizName,
    questionId,
    isCorrect,
    timestamp: date.toISOString(), // Use ISO string for consistency
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
