//Brug express
const express = require('express');
// Bruges til Session ID
const session = require('express-session');
//This is for JSON files
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
//brug moduler ved: const myModule = require('./modules/myModule');

app.use(cors());

app.use(session({
    // secret kan/burde ændres til noget andet
    secret: 'super-hemmelig-nøgle',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

//Body-parser til url encoded requests
app.use(bodyParser.urlencoded({ extended: false }));
//Body-parser til json requests
app.use(bodyParser.json());

//Lav endpoints her via app.get eller lignende

/*
Middleware til authentication tjek
Hver Route skal have en requireAuth i deres app.get
*/
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next(); // User is authenticated, continue to next middleware
    } else {
        res.redirect('/login'); // User is not authenticated, redirect to login page
    }
}


/* 
Login route, sætter user id 
*/
app.post('/login', (req, res) => {
    // Validate user credentials
    if (validCredentials) {
        req.session.userId = userId; // Set session identifier
        res.redirect('/dashboard');
    } else {
        res.render('login', { error: 'Invalid username or password' });
    }
});

/* 
Dashbord route, sætter user id 
*/
app.get('/dashboard', requireAuth, (req, res) => {
    // Render the dashboard page
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});