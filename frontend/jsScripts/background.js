function validateTokenWithServer(token) {
    fetch('http://127.0.0.1:8000/session/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'basicAuth': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log(result);
        if (result.status && result.status.code === 200) {
            console.log("Session is active, opening list-notes page");
            chrome.action.setPopup({ popup: "html/listNotes.html" });
        } 
        else {
            console.log("Token is not valid or session expired, opening login page");
            chrome.action.setPopup({ popup: "html/loginForm.html" });
        }
    })
    .catch(error => {
        console.error('Error during token validation:', error);
        chrome.storage.local.remove("userToken", () => {
            chrome.action.setPopup({ popup: "html/loginForm.html" });
        });
    });
}


function checkToken() {
    chrome.storage.local.get("userToken", function(data) {
        console.log("Checking token:", data.userToken); 
        if (data.userToken) {
            chrome.action.setPopup({ popup: "html/listNotes.html" });
            validateTokenWithServer(data.userToken);
        } 
        else {
            console.log("opening login page");
            chrome.action.setPopup({ popup: "html/loginForm.html" });
        }
    });
}


chrome.runtime.onInstalled.addListener(() => {
    checkToken();
});

chrome.runtime.onStartup.addListener(() => {
    checkToken();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "updatePopup") {
        checkToken();
    }
});

chrome.action.onClicked.addListener(function(tab) {
    checkToken();
});


// chrome.storage.local.remove("userToken", () => {
//     chrome.action.setPopup({ popup: "html/loginForm.html" });
// });