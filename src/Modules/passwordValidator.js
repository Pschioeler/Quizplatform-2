const PASSWORD_FIELD = document.getElementById("passwordInputField"); //Koden er baseret på, at dette er et input feldt
const OUTPUT_TEXT = document.getElementById("passFeedbackText"); //Koden er baseret op, at dette er et ul-element
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

PASSWORD_FIELD.addEventListener("input", function() {
    const password = PASSWORD_FIELD.value;
    validatePass(password);
});

//Min function her looper gennem PASSWORD_CRITERIA objektet 
//og returner false hvis bare 1 af kriterierne ikke er opfyldt.
//Derudover, smider den også den tilsvarende "message"-property ind i
//output ul-elementet som et li-element.
function validatePass(password) {
    OUTPUT_TEXT.innerHTML = "";
    let isValid = true;
    for (const criterion in PASSWORD_CRITERIA) {
        if (!PASSWORD_CRITERIA[criterion].regex.test(password)) {
            const feedback = document.createElement("li");
            feedback.textContent = PASSWORD_CRITERIA[criterion].message;
            OUTPUT_TEXT.appendChild(feedback);
            isValid = false;
        }
    }
    return isValid;
}