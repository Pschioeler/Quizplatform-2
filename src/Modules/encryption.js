const fs = require('fs');
const bcrypt = require('bcrypt');

const usersFilePath = '../DB/users.json';

// Feljhåndtering
function handleError(errorMessage) {
    console.error(errorMessage);
    return 'Der er sket en fejl. Venligst prøv igen.';
}

// Load users from file
function loadUsers() {
    let users = {};
    try {
        const data = fs.readFileSync(usersFilePath);
        users = JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            fs.writeFileSync(usersFilePath, JSON.stringify({}));
        } else {
            console.error('Error reading users file:', error);
        }
    }
    return users;
}

// Function for user registration
async function registerUser(username, password) {
    try {
        const users = loadUsers();
        if (users[username]) {
            return 'Brugernavn er allerede i brug';
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        users[username] = { salt, password: hashedPassword, isAdmin: false, isSuperAdmin: false, timelogs: [] };
        fs.writeFileSync(usersFilePath, JSON.stringify(users));
        return 'Bruger oprettet!';
    } catch (error) {
        return handleError('Fejl ved oprettelse af bruger: ' + error.message);
    }
}

// Function for user login
async function loginUser(username, password) {
    try {
        const users = loadUsers();
        const user = users[username];
        const errorMessage = 'Brugernavn eller kodeord er forkert. Venligst prøv igen.';
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return errorMessage;
        }
        return 'Login vellykket';
    } catch (error) {
        return handleError('Fejl ved login: ' + error.message);
    }
}

module.exports = {
    registerUser,
    loginUser
};