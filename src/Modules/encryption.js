const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');

const usersFilePath = path.join(__dirname, "../DB/users.json");

// Error handling function
function handleError(errorMessage) {
    console.error(errorMessage);
    return 'An error occurred. Please try again.';
}

// Load users from file
function loadUsers() {
    try {
        const data = fs.readFileSync(usersFilePath);
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            fs.writeFileSync(usersFilePath, JSON.stringify([]));
            return [];
        } else {
            console.error('Error reading users file:', error);
            return [];
        }
    }
}

// Function for user registration
async function registerUser(username, password) {
    try {
        const users = loadUsers();
        if (users.some(user => user.username === username)) {
            return 'Username is already in use';
        }
        const usernameSalt = await bcrypt.genSalt(10);
        const hashedUser = await bcrypt.hash(username, usernameSalt);
        const passwordSalt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, passwordSalt);

        users.push({ usernameSalt, hashedUser, passwordSalt, password: hashedPassword, isAdmin: false, isSuperAdmin: false, timelogs: [] });
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        return 'User registered successfully!';
    } catch (error) {
        return handleError('Error registering user: ' + error.message);
    }
}

// Function for user login
async function loginUser(username, password) {
    try {
        const users = loadUsers();
        const user = users.find(user => user.username === username);
        const errorMessage = 'Incorrect username or password. Please try again.';
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return errorMessage;
        }
        return 'Login successful';
    } catch (error) {
        return handleError('Error logging in: ' + error.message);
    }
}
module.exports = {
    registerUser,
    loginUser
};
