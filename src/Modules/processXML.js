const fs = require('fs');
const xml2js = require('xml2js');

async function processXML(file) {
  try {
    // Læs filen
    const xmlData = fs.readFileSync(`../DB/xml/${file}.xml`, 'utf8');
    // Parse XML
    const result = await new Promise((resolve, reject) => {
      xml2js.parseString(xmlData, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
    // Generer array ud fra parsed XML
const dataArray = result.quiz.question.map(question => ({
      id: question.id ? question.id[0] : undefined,
      type: question.type ? question.type[0] : undefined,
      questiontext: question.questiontext ? question.questiontext[0] : undefined,
      answers: question.answer ? question.answer.map(answer => ({
        answertext: answer.answertext ? answer.answertext[0] : undefined,
        correct: answer.correct ? answer.correct[0] === 'True' : undefined,
        casesensitive: answer.casesensitive ? answer.casesensitive[0] === 'True' : undefined
      })) : []
}));
    //console.log(dataArray[0]);
    return dataArray;
  }
  catch (error) {
    console.error(error);
    return [];
  }
}
//processXML("Data- og variabeltyper");