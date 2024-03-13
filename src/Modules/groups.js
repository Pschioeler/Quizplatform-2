const { loadUsers } = require('./encryption.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { group } = require('console');
const usersFilePath = path.join(__dirname, '../DB/users.json');
const groupsFilePath = path.join(__dirname, '../DB/groups.json');

//helper funktion for at finde den korrekte bruger
function findUser(username) {
    const users = loadUsers();
    const foundUser = users.find(user => {
        return bcrypt.compareSync(username, user.hashedUser);
    });
    if (!foundUser) {
        throw new Error(`Bruger '${username}' blev ikke fundet.`);
    }
    return foundUser;
}
//helper funktion
function saveToFile(data, path) {
    try {
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error ved skrivning i filen:', error);
    }
}
//helper funktion
function loadGroups() {
    try {
        const data = fs.readFileSync(groupsFilePath);
        console.log("successfully fetched group data.");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            fs.writeFileSync(groupsFilePath, JSON.stringify([]));
            return [];
        } else {
            console.error('Error reading groups file:', error);
            return [];
        }
    }
}
//funktion til at oprette ny grupper
function createGroup(groupId, groupName) {
    try {
        const groups = loadGroups();
        if (groups.some(group => group.groupId === groupId)) {
            console.log("this groupId is already in use.");
            return 'This groupId is already in use';
        } else if (groups.some(group => group.groupName === groupName)) {
            console.log("this group name is already in use.");
            return 'This group name is already in use';
        }

        groups.push({ groupId: groupId, groupName: groupName, availableQuizzes: [], members: [] });
        console.log(groups);
        fs.writeFileSync(groupsFilePath, JSON.stringify(groups, null, 2));
        console.log('Group created successfully!');
        return 'Group created successfully!';
    } catch (error) {
        console.log("Error creating group");
        return 'Error creating group: ' + error.message;
    }
}
//funktion for at admins kan give adgang til grupper
function allowGroupAccess(groupId, username) {
    const foundUser = findUser(username);
    // Kontroller om brugeren allerede er tilmeldt til den givne gruppe
    const existingGroup = foundUser.groups.find(group => group.groupId === groupId);
    if (existingGroup) {
        throw new Error(`'${username}' har allerede adgang til gruppen med ID '${groupId}'.`);
    }
    foundUser.groups.push({groupId: groupId, isAccepted: false});
     let users = loadUsers();
     // Find og opdater brugeren i arrayet
     const userIndex = users.findIndex(user => user.username === username);
     if (userIndex !== -1) {
         users[userIndex] = foundUser;
     } else {
         console.error(`User '${username}' not found.`);
         return;
     }
     // Gem den opdateret version
     saveToFile(users, usersFilePath);
    console.log(foundUser.groups);
}
//funktion til at acceptere invitationer til grupper
function acceptGroupInvitation(groupId, username) {
    const user = findUser(username);
    const groupToAccept = user.groups.find(group => group.hasOwnProperty("groupId") && group.groupId === groupId);
    if (!groupToAccept) {
        throw new Error(`Gruppen med ID '${groupId}' blev ikke fundet.`);
    }
    const groups = loadGroups();
    const foundGroup = groups.find(group => group.hasOwnProperty("groupId") && group.groupId === groupId);
    foundGroup.members.push(username);
    saveToFile(groups, groupsFilePath);
    groupToAccept.isAccepted = true;
    console.log(user.groups);
    let users = loadUsers();
    const userIndex = users.findIndex(user => user.username === username);
    if (userIndex !== -1) {
        users[userIndex] = user;
    } else {
        console.error(`User '${username}' not found.`);
        return;
    }
    saveToFile(users, usersFilePath);
}
//funktion se hvilke grupper brugeren er en del af
function checkUserGroups(username) {
    try {
        const user = findUser(username);
        console.log(user.groups);
        return user.groups;
    } catch (error) {
        console.error(error.message);
        // returnerer tom array hvis der er ingen grupper
        return [];
    }
}

//createGroup(3, "funny test group");
//findUser("maja");
//allowGroupAccess(2, "test");
//checkUserGroups("test");
//acceptGroupInvitation(2, "test");
//allowGroupAccess(1, "test");

