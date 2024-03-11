const PASSWORD_CRITERIA = {
    lowerUpperCase: {
        regex: /(?=.*\p{Ll})(?=.*\p{Lu})/gu,
        message: "Password must include a lowercase and uppercase letter"
    },
    numbersSpecialChars: {
        regex: /(?=.*[0-9])(?=.*\W)/g,
        message: "Password must include at least one number and one special character"
    },
    minLength: {
        regex: /^.{8,}$/,
        message: "Password must be at least 8 characters long"
    }
};

//Min function her looper gennem PASSWORD_CRITERIA objektet 
//og returner false hvis bare 1 af kriterierne ikke er opfyldt.
//Derudover, smider den også den tilsvarende "message"-property ind i
//output ul-elementet som et li-element.
function validatePass(password) {
    let isValid = true;
    for (const criterion in PASSWORD_CRITERIA) {
        if (!PASSWORD_CRITERIA[criterion].regex.test(password)) {
            isValid = false;
        }
    }
    return isValid;
}

module.exports = validatePass;