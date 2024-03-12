//Brug express
const express = require("express");
//This is for JSON files
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();

//modules:
const quizController = require("./Modules/quizController");

app.use(cors());

app.use(express.static(path.join(__dirname, "..", "public")));

//Body-parser til url encoded requests
app.use(bodyParser.urlencoded({ extended: false }));
//Body-parser til json requests
app.use(bodyParser.json());

//Lav endpoints her via app.get eller lignende

// Indlæs quizzer ved opstart
quizController.loadQuizzes();

app.get("/quizzes", (req, res) => {
  const quizIds = Object.keys(quizController.quizzes);
  res.json(quizIds);
});

// Endpoint for at få et tilfældigt spørgsmål
app.get("/quiz/get-question", quizController.getQuestion);

// Endpoint for at indsende svar på et spørgsmål
app.post("/quiz/submit-answer", quizController.submitAnswer);

// Endpoint for at få resultaterne af en quiz
app.get("/quiz/get-results", quizController.getResults);

app.get("/quiz/results/download", (req, res) => {
  const resultsPath = path.join(__dirname, "../DB/results.json");
  res.download(resultsPath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
