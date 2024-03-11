//Brug express
const express = require('express');
//This is for JSON files
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
//brug moduler ved: const myModule = require('./modules/myModule');

app.use(cors());

//Body-parser til url encoded requests
app.use(bodyParser.urlencoded({ extended: false }));
//Body-parser til json requests
app.use(bodyParser.json());

//Lav endpoints her via app.get eller lignende

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});