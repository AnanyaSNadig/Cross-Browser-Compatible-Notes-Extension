import config from './config.js';

const customEventMap = {
    "LOGINFORM_SUBMIT"            :  loginformSubmit,
    "LOGIN_SUCCESS"               :  loginSuccess,
    "LOGIN_ERROR"                 :  loginError,
    "NOTEFORM_SUBMIT"             :  noteformSubmit,
    "NOTEFORM_CANCEL"             :  noteformCancel,
    "NOTEFORM_OPEN"               :  noteformOpen,
    "NOTEFORM_LOAD"               :  noteformLoad,
    "NOTE_ADD_SUCCESS"            :  noteAddSuccess,
    "NOTE_ADD_ERROR"              :  noteAddError,
    "NOTE_MODIFY_SUCCESS"         :  noteModifySuccess,
    "NOTE_MODIFY_ERROR"           :  noteModifyError,
    "NOTE_DELETE_OPEN"            :  noteDeleteOpen,
    "NOTE_DELETE_SUBMIT"          :  noteDeleteSubmit,
    "NOTE_DELETE_CANCEL"          :  noteDeleteCancel,
    "NOTE_DELETE_SUCCESS"         :  noteDeleteSuccess,
    "NOTE_DELETE_ERROR"           :  noteDeleteError,
    "GROUPS_OPEN"                 :  groupsOpen,
    "GROUPS_CLOSE"                :  groupsClose,
    "GROUPS_RETRIEVAL_SUCCESS"    :  groupsRetrievalSuccess,
    "GROUPS_RETRIEVAL_ERROR"      :  groupsRetrievalError,
    "ALLNOTES_OPEN"               :  allnotesOpen,
    "MYNOTES_OPEN"                :  mynotesOpen,
    "NOTES_SUCCESS"               :  notesSuccess,
    "NOTES_ERROR  "               :  notesError, 
    "SINGLE_NOTE_SUCCESS"         :  singleNoteSuccess,
    "SINGLE_NOTE_ERROR"           :  singleNoteError,
    "NAVIGATE_PREV"               :  navigatePrev,
    "NAVIGATE_BAR"                :  navigateBar,
    "NAVIGATE_NEXT"               :  navigateNext,
    "NAVIGATE_TO_FIRST_PAGE"      :  navigateToFirstPage,
    "NAVIGATE_TO_LAST_PAGE"       :  navigateToLastPage,
}


class noteManager {
    constructor(jsonData) {
        if (noteManager.instance) {
            return noteManager.instance;
        }
        if(jsonData)
            this.notes = this.parseNotes(jsonData);
        else
            this.notes = {};
        
        this.currentTab = 'allNotes';
        noteManager.instance = this;
        this.currentPageAllTab = 1;
        this.currentPageMyTab = 1;
        this.notesPerPage = 5; 
    }

    parseNotes(jsonData) {
        const notesObject = {};
        jsonData.data.notes.forEach(note => {
            const { noteID, noteGroups, ...rest } = note;
            notesObject[noteID] = { ...rest, noteGroups: noteGroups || [] };
        });

        return notesObject;
    }

    initializeWithData(jsonData){
        this.notes = this.parseNotes(jsonData);
    }

    set currentPageAllTab(pageNumber){
        this._currentPageAllTab = pageNumber;
    }

    get currentPageAllTab() {
        return this._currentPageAllTab;
    }

    set currentPageMyTab(pageNumber){
        this._currentPageMyTab = pageNumber;
    }
    
    get currentPageMyTab() {
        return this._currentPageMyTab;
    }
    
    set currentTabState(tabName) {
        this.currentTab = tabName;
    }

    get currentTabState() {
        return this.currentTab;
    }

    set notesPerPage(count) {
        this._notesPerPage = count;
    }

    get notesPerPage() {
        return this._notesPerPage;
    }

    getAllNotes() {
        return this.notes;
    }

    getAuthorednotes() {
        const allNoteKeys = Object.keys(this.notes);
        const authoredNoteKeys = allNoteKeys.filter(noteID => this.notes[noteID].authored === "true");
        const authoredNotes = {};
        authoredNoteKeys.forEach(noteID => {
            authoredNotes[noteID] = this.notes[noteID];
        });
        return authoredNotes;
    }    

    addModifyNote(noteID, noteData) {
        this.notes[noteID] = noteData;
    }

    deleteNote(noteID) {
        if (this.notes[noteID]) {
            delete this.notes[noteID];
        }
    }
}

let noteManagerInstance = new noteManager();

function loginformSubmit() {
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');

    const username = usernameField.value;
    const password = passwordField.value;

    if (username && password) {
        const endpoint = 'session/';
        const url = `${config.apiUrl}/${endpoint}`;
        const methodName = 'POST';
        const bodyData = { 
            emailID: username, 
            password: password 
        }

        makeNetworkCall(url, methodName, bodyData);
    } 
    else {
        alert("Please enter both - username and password.");
    }
}

function loginSuccess(e) {
    tokenInstance.set(e.detail);
    window.location.href = "listNotes.html";
}


function loginError(data){
    const errorMessage = document.getElementById('msg');
    errorMessage.style.display = 'block';
    setTimeout(() => {
        window.location.href = "../html/loginForm.html"
    }, 1000);
}

function noteformSubmit(){
    const urlParams = new URLSearchParams(window.location.search);
    const noteID = urlParams.get('noteID');
    const noteContentParam = urlParams.get('content');
    const methodName = noteID && noteContentParam ? 'PATCH' : 'POST';
    const endpoint = "notes/"
    const url = `${config.apiUrl}/${endpoint}`;

    let bodyData = {};

    if (methodName === 'POST') {
        const contentField = document.querySelector('.contentField textarea');
        const content = contentField.value.trim();

        if (content === "") {
            alert("Please enter some content before submitting.");
            return;
        }

        const assignedGroups = Array.from(document.querySelectorAll('.dropdown-list input[type="checkbox"]:checked')).map(group => group.value);
        if (assignedGroups.length === 0) {
            alert("Please select at least one group before submitting.");
        }

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTabURL = tabs[0].url;
            if(!currentTabURL) {
                alert("URL not found");
                return;
            }
            bodyData = {
                url: currentTabURL,
                noteContent: content,
                groups: assignedGroups
            };
            makeNetworkCall(url, methodName, bodyData);
        });
    } 
    else if (methodName === 'PATCH') {
        const text = document.getElementById('noteContent');

        if (text.value.trim() === "") {
            console.error('Note content is empty. Cannot patch note.');
        }

        const selectedGroups = getSelectedGroups();

        bodyData = {
            noteID: noteID,
            newContent: text.value,
            groups: selectedGroups,
        };
        makeNetworkCall(url, methodName, bodyData);
    }
}

function noteformLoad(){
    const urlParams = new URLSearchParams(window.location.search);
    const text = document.getElementById('noteContent'); 
    const noteContent = urlParams.get('content');

    if (noteContent) {
        text.value = decodeURIComponent(noteContent);
    } 
    else {
        console.warn('Note content parameter missing in URL');
    }
}

function getSelectedGroups() {
    const checkboxes = document.querySelectorAll('.dropdown-list input[type="checkbox"]:checked');
    const selectedGroups = Array.from(checkboxes).map(checkbox => checkbox.value);

    return selectedGroups;
}

function noteformCancel(){
    window.location.href = "../html/listNotes.html"
}

function notesSuccess(e){
    const responseData = e.detail;

    noteManagerInstance.initializeWithData(responseData);

    const tabState = noteManagerInstance.currentTabState;

    var pageNumber;

    if(tabState === "allNotes"){
        pageNumber = noteManagerInstance.currentPageAllTab;
    }
    else{
        pageNumber = noteManagerInstance.currentPageMyTab;
    }

    notesRender(noteManagerInstance, pageNumber);
}

function noteformOpen(eventData){
    if(!eventData.detail)
        window.location.href = `noteForm.html?noteID=&content=`;
    else{
        const noteTile = eventData.detail.target.closest('.note');
        const noteContent = noteTile.querySelector('.info p:last-child').textContent;
        const noteID = noteTile.classList[2].split('-')[1];

        window.location.href = `noteForm.html?noteID=${noteID}&content=${encodeURIComponent(noteContent)}`;
    }
}

function noteAddSuccess(eventData){
    noteManagerInstance.addModifyNote(eventData.detail.data.noteID);

    const successMessage = document.getElementById('msg');
    successMessage.classList.remove('error');
    successMessage.classList.add('success');

    successMessage.textContent = "Added a new note successfully!";

    successMessage.style.display = 'block';

    setTimeout(() => {
        window.location.href = "../html/listNotes.html"
    }, 1000);
}

function noteAddError(){
    const errorMessage = document.getElementById('msg');
    errorMessage.classList.remove('success');
    errorMessage.classList.add('error');
    errorMessage.textContent = "Failed add content,please contact admin (admin@hyperface.co)";
    errorMessage.style.display = 'block';
    setTimeout(() => {
        window.location.href = "../html/listNotes.html"
    }, 3000);
}


function noteModifySuccess(eventData){
    noteManagerInstance.addModifyNote(eventData.detail.data.noteID);
    const successMessage = document.getElementById('msg');
    successMessage.classList.remove('error');
    successMessage.classList.add('success');

    successMessage.textContent = "Modified the note successfully!";

    successMessage.style.display = 'block';

    setTimeout(() => {
        window.location.href = "../html/listNotes.html"
    }, 1000);
}

function noteModifyError(){
    const errorMessage = document.getElementById('msg');
    errorMessage.style.display = 'block';
    setTimeout(() => {
        window.location.href = "../html/listNotes.html"
    }, 1000);
}

function noteDeleteOpen(event) {
    const noteTile = event.detail.target.closest('.note');
    const noteID = noteTile.classList[2].split('-')[1];
    window.location.href = `deletePrompt.html?noteID=${noteID}`;
}

function noteDeleteSubmit(){
    const urlParams = new URLSearchParams(window.location.search);
    const noteID = urlParams.get('noteID');
    const endpoint = "notes/"
    const url = `${config.apiUrl}/${endpoint}?noteID=${noteID}`;
    const methodName = 'DELETE';
    const bodyData = {};

    makeNetworkCall(url, methodName, bodyData);
}

function noteDeleteCancel(){
    window.location.href = "../html/listNotes.html"
}

function noteDeleteSuccess(eventData){;
    noteManagerInstance.deleteNote(eventData.detail.data.noteID);

    const successMessage = document.getElementById('msg');
    successMessage.classList.remove('error');
    successMessage.classList.add('success');

    successMessage.textContent = "Deleted the note successfully!";

    successMessage.style.display = 'block';

    setTimeout(() => {
        window.location.href = "../html/listNotes.html"
    }, 1000);
}

function noteDeleteError(){
    const errorMessage = document.getElementById('msg');
    errorMessage.style.display = 'block';
    setTimeout(() => {
        window.location.href = "../html/listNotes.html"
    }, 1000);
}

function groupsOpen(){
    const endpoint = "user/"
    const url = `${config.apiUrl}/${endpoint}`;

    const methodName = 'GET';
    const bodyData = {};

    makeNetworkCall(url, methodName, bodyData);
}

function groupsClose(e){
    const dropdownSelect = document.getElementById('dropdownField');
    const dropdownList = document.getElementById('groups');
    if (dropdownSelect && dropdownList && !dropdownSelect.contains(e.target) && !dropdownList.contains(e.target)) {
        dropdownList.style.display = dropdownList.style.display === 'none' ? 'block' : 'none';
    }
}

function groupsRetrievalSuccess(e){
    const groupList = e.detail.data.groups;

    const list = document.querySelector('.dropdown-list');
    list.innerHTML = '';

    groupList.forEach(group => {
        const groupName = group.charAt(0).toUpperCase() + group.slice(1);
        const dropdownHTML = `
            <label><input type="checkbox" id="${group}" name="group" value="${group}"> ${groupName}</label>`;
        list.innerHTML += dropdownHTML;
    });

    const dropdownList = document.getElementById('groups');
    dropdownList.style.display = dropdownList.style.display === 'none' ? 'block' : 'none';

    const urlParams = new URLSearchParams(window.location.search);
    const noteID = urlParams.get('noteID');

    if (noteID) {
        const endpoint = "notes/";
        const apiUrl = `${config.apiUrl}/${endpoint}${noteID}/`;
        const methodName = "GET";
        const bodyData = {};
        
        makeNetworkCall(apiUrl, methodName, bodyData);
    }

}

function groupsRetrievalError(){
    const errorMessage = document.getElementById('msg');
    errorMessage.textContent = "Failed to retrieve the groups";
    errorMessage.style.display = 'block';

    setTimeout(() => {
        window.location.href = "../html/listNotes.html"
    }, 1000);
}

function allnotesOpen() {
    const endpoint = "notes/";
    const apiUrl = `${config.apiUrl}/${endpoint}`;

    chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
        const currentUrl = tabs[0].url;
        const urlWithQuery = `${apiUrl}?url=${currentUrl}`;
        const methodName = "GET";
        const bodyData = {};
    
        makeNetworkCall(urlWithQuery, methodName, bodyData);
    })
}

function mynotesOpen() {
    const endpoint = "notes/";
    const apiUrl = `${config.apiUrl}/${endpoint}`;

    chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
        const currentUrl = tabs[0].url;
        const urlWithQuery = `${apiUrl}?url=${currentUrl}`;
        const methodName = "GET";
        const bodyData = {};
    
        makeNetworkCall(urlWithQuery, methodName, bodyData);
    })

}

function notesRender(noteManagerInstance, pageNumber) {
    const tabState = noteManagerInstance.currentTabState;

    if (tabState == 'myNotes') {
        const startIndex = (pageNumber - 1) * noteManagerInstance.notesPerPage;
        const endIndex = startIndex + noteManagerInstance.notesPerPage;
        const myNotes = noteManagerInstance.getAuthorednotes();
        noteManagerInstance.currentPageMyTab = pageNumber;

        const noteIDs = Object.keys(myNotes);

        noteIDs.sort((a, b) => {
            return new Date(myNotes[b].createdAt) - new Date(myNotes[a].createdAt);
        });

        const notesToRender = noteIDs.slice(startIndex, endIndex).map(noteID => ({
            noteID: noteID,
            note: myNotes[noteID]
        }));

        const notesContainer = document.getElementById('notesContainer');
        notesContainer.innerHTML = '';
        notesToRender.forEach(({
            noteID,
            note
        }) => {
            const noteHTML = `
                    <div class="flex note tile-${noteID}" role="button" tabindex="0">
                        <div class="info">
                            <p class="date">Updated at ${new Date(note.createdAt).toLocaleString()}</p>
                            <p class="note-content overflow-ellipsis">${note.noteContent}</p>
                        </div>
                        <div class="modify-icon">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </div>
                        <div class="delete-icon">
                            <i class="fa-regular fa-trash-can"></i>
                        </div>
                        <div class="dropdown-icon">
                            <i class="bi bi-caret-down-fill"></i>
                        </div>
                    </div>
                `;
            notesContainer.innerHTML += noteHTML;
        })
        raiseCustomEvent("NAVIGATE_BAR");
    } 
    
    else {
        const startIndex = (pageNumber - 1) * noteManagerInstance.notesPerPage;
        const endIndex = startIndex + noteManagerInstance.notesPerPage;
        const allNotes = noteManagerInstance.getAllNotes();
        noteManagerInstance.currentPageAllTab = pageNumber;

        const noteIDs = Object.keys(allNotes);

        noteIDs.sort((a, b) => {
            return new Date(allNotes[b].createdAt) - new Date(allNotes[a].createdAt);
        });

        const notesToRender = noteIDs.slice(startIndex, endIndex).map(noteID => ({
            noteID: noteID,
            note: allNotes[noteID]
        }));

        const notesContainer = document.getElementById('notesContainer');
        notesContainer.innerHTML = '';
        notesToRender.forEach(({
            noteID,
            note
        }) => {
            const noteHTML = `
                    <div class="flex note tile-${noteID}" role="button" tabindex="0">
                        <div class="info">
                            <p class="date">Updated at ${new Date(note.createdAt).toLocaleString()}</p>
                            <p class="note-content overflow-ellipsis">${note.noteContent}</p>
                        </div>
                        <div class="dropdown-icon">
                            <i class="bi bi-caret-down-fill"></i>
                        </div>
                    </div>
                `;
            notesContainer.innerHTML += noteHTML;

        })
        raiseCustomEvent("NAVIGATE_BAR");
    }
}

function toggleNoteExpansion(noteElement) {
    noteElement.classList.toggle('note-expanded');
    const icon = noteElement.querySelector('.dropdown-icon .bi');
    icon.classList.toggle('bi-caret-up-fill');
    icon.classList.toggle('bi-caret-down-fill');
    const paragraph = noteElement.querySelector('.note-content');

    if (noteElement.classList.contains('note-expanded')) {
        paragraph.classList.remove('overflow-ellipsis');
    } else {
        paragraph.classList.add('overflow-ellipsis');
    }

    const allNotes = document.querySelectorAll('.note');
    allNotes.forEach(otherNote => {
        if (otherNote !== noteElement) {
            otherNote.classList.remove('note-expanded');
            otherNote.querySelector('.dropdown-icon .bi').classList.remove('bi-caret-up-fill');
            otherNote.querySelector('.dropdown-icon .bi').classList.add('bi-caret-down-fill');
            otherNote.querySelector('.note-content').classList.add('overflow-ellipsis');
        }
    });
}

function notesError(){
    alert("Notes load error");
}

function singleNoteSuccess(e){
    const responseData = e.detail;

    const previouslySelectedGroups = responseData.data.noteData.noteGroups;

    const checkboxes = document.querySelectorAll('.dropdown-list input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = previouslySelectedGroups.includes(checkbox.value);
    });
}

function singleNoteError(){
    alert("Error loading the note data");
}

function navigateToFirstPage(){
    const selNoteTab = noteManagerInstance.currentTabState;
    if(selNoteTab=='myNotes'){
        noteManagerInstance.currentPageMyTab = 1;
        notesRender(noteManagerInstance,noteManagerInstance.currentPageMyTab);
    }
    else if(selNoteTab=='allNotes'){
        noteManagerInstance.currentPageAllTab = 1;
        notesRender(noteManagerInstance,noteManagerInstance.currentPageAllTab);
    }
}

function navigateToLastPage(){
    const selNoteTab = noteManagerInstance.currentTabState;
    if(selNoteTab=='myNotes'){
        const myNotesTotal = getTotalAuthoredNotes();
        const totalPages = Math.ceil(myNotesTotal/noteManagerInstance.notesPerPage);
        noteManagerInstance.currentPageMyTab = totalPages;
        notesRender(noteManagerInstance,noteManagerInstance.currentPageMyTab);
    }else if(selNoteTab=='allNotes'){
        const allNotesTotal = getTotalNotes();
        const totalPages = Math.ceil(allNotesTotal/noteManagerInstance.notesPerPage);
        noteManagerInstance.currentPageAllTab = totalPages;
        notesRender(noteManagerInstance,noteManagerInstance.currentPageAllTab);
    }
}

function navigatePrev(){
    const selNoteTab = noteManagerInstance.currentTabState;
    if (selNoteTab == 'myNotes') {
        noteManagerInstance.currentPageMyTab--;
        if (noteManagerInstance.currentPageMyTab < 1) {
            noteManagerInstance.currentPageMyTab = 1;
        }
        notesRender(noteManagerInstance, noteManagerInstance.currentPageMyTab);
    } else if (selNoteTab == 'allNotes') {
        noteManagerInstance.currentPageAllTab--;
        if (noteManagerInstance.currentPageAllTab < 1) {
            noteManagerInstance.currentPageAllTab = 1;
        }
        notesRender(noteManagerInstance, noteManagerInstance.currentPageAllTab);
    }
}

function navigateNext(){
    const selNoteTab = noteManagerInstance.currentTabState;
    if (selNoteTab == 'myNotes') {
        const myNotesTotal = getTotalAuthoredNotes();
        const totalPages = Math.ceil(myNotesTotal / noteManagerInstance.notesPerPage);
        noteManagerInstance.currentPageMyTab++;
        if (noteManagerInstance.currentPageMyTab > totalPages) {
            noteManagerInstance.currentPageMyTab = totalPages;
        }
        notesRender(noteManagerInstance, noteManagerInstance.currentPageMyTab);
    } else {
        const allNotesTotal = getTotalNotes();
        const totalPages = Math.ceil(allNotesTotal / noteManagerInstance.notesPerPage);
        noteManagerInstance.currentPageAllTab++;
        if (noteManagerInstance.currentPageAllTab > totalPages) {
            noteManagerInstance.currentPageAllTab = totalPages;
        }
        notesRender(noteManagerInstance, noteManagerInstance.currentPageAllTab);
    }
}

function getTotalAuthoredNotes() {
    return Object.keys(noteManagerInstance.getAuthorednotes()).length;
}

function getTotalNotes() {
    return Object.keys(noteManagerInstance.getAllNotes()).length;
}

function navigateBar() {
    const selNoteTab = noteManagerInstance.currentTabState;
    if (selNoteTab == 'myNotes') {
        navBarRender(noteManagerInstance.currentPageMyTab);
    } else {
        navBarRender(noteManagerInstance.currentPageAllTab);
    }
}

function navBarRender(currentPage) {
    const navPages = document.querySelector('.nav-pages');
    navPages.innerHTML = '';
    const li = document.createElement('li');
    li.textContent = currentPage;
    navPages.appendChild(li);
}

class Token {
    constructor() {
        if (!Token.instance) {
            this.authToken = "";
            Token.instance = this;
        }
        return Token.instance;
    }

    get(callback) {
        chrome.storage.local.get("userToken", (data) => {
            if (data.userToken) {
                this.authToken = data.userToken;
                callback(this.authToken);
            } else {
                this.authToken = null; 
                callback(this.authToken);
            }
        });
    }

    set(data) {
        chrome.storage.local.set({userToken: data.data.token}, () => {
            chrome.action.setPopup({ popup: "html/listNotes.html" });
            chrome.runtime.sendMessage({action: "updatePopup"});
        });
    }
}

const tokenInstance = new Token();

function makeNetworkCall(url, methodName, bodyData) {
    const tokenObj = new Token();

    tokenObj.get((token) => {
        const headers = {
            "Content-Type": "application/json"
        };

        if (token) {
            headers["basicAuth"] = token; 
        }

        const fetchBody = {
            method: methodName,
            headers: headers
        };

        if (methodName === 'POST' || methodName === 'PATCH') {
            fetchBody.body = JSON.stringify(bodyData);
        }

        fetch(url, fetchBody)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network error - " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if(data && data.event && customEventMap[data.event]) {
                raiseCustomEvent(data.event, data);
            }
        })
        .catch(error => {
            alert("Error occurred - " + error);
        });
    });
}

document.addEventListener('DOMContentLoaded', function (){
    bindEventListeners();
    bindingCustomEvents();

    const modifyContentField = document.getElementById('noteContent');
    if(modifyContentField){
        raiseCustomEvent("NOTEFORM_LOAD");
    }

    const allNotesTab = document.getElementById('allNotes');
    if(allNotesTab){
        raiseCustomEvent("ALLNOTES_OPEN");
    }
});

function bindEventListeners() {
    const loginButton = document.getElementById('loginBtn');
    if(loginButton){
        loginButton.addEventListener('click', function(event){
            event.preventDefault(); 
            raiseCustomEvent("LOGINFORM_SUBMIT");
        });
    }

    const submitButton = document.getElementById('submitBtn');
    if(submitButton){
        submitButton.addEventListener('click', function(e){
            e.stopPropagation(); 
            raiseCustomEvent("NOTEFORM_SUBMIT", e);
        });
    }

    const cancelButton = document.getElementById('cancelBtn');
    if(cancelButton){
        cancelButton.addEventListener('click', function(e){
            e.stopPropagation(); 
            raiseCustomEvent("NOTEFORM_CANCEL");
        });
    }
    
    const addButton = document.getElementById('addBtn');
    if(addButton){
        addButton.addEventListener('click', function(){
            raiseCustomEvent("NOTEFORM_OPEN");
        });
    }

    document.addEventListener('click', function (event) {
        const modifyIcon = event.target.closest('.modify-icon');
        if (modifyIcon) {
            raiseCustomEvent("NOTEFORM_OPEN", event);
        }

        const deleteIcon = event.target.closest('.delete-icon');
        if (deleteIcon) {
            raiseCustomEvent("NOTE_DELETE_OPEN", event);
        }
    });

    const yesButton = document.getElementById('yesBtn');
    if(yesButton){
        yesButton.addEventListener('click', function(){
            raiseCustomEvent("NOTE_DELETE_SUBMIT");
        });
    }
    
    const noButton = document.getElementById('noBtn');
    if(noButton){
        noButton.addEventListener('click', function(){
            raiseCustomEvent("NOTE_DELETE_CANCEL");
        });
    }
    
    const dropdownField = document.getElementById('dropdownField');
    if (dropdownField) {
        dropdownField.addEventListener('click', function(e){
            e.stopPropagation(); 
            raiseCustomEvent("GROUPS_OPEN",e);
        });

        window.addEventListener('click', function(e){
            raiseCustomEvent("GROUPS_CLOSE",e);
        });
    }
    
    const allNotesTab = document.getElementById('allNotes');
    if (allNotesTab) {
        allNotesTab.addEventListener('click', function () {
            allNotesTab.classList.add('selected');
            allNotesTab.classList.remove('unselected');
            myNotesTab.classList.add('unselected');
            myNotesTab.classList.remove('selected');

            noteManagerInstance.currentTab = 'allNotes';
            raiseCustomEvent("ALLNOTES_OPEN");
        });
    }

    const myNotesTab = document.getElementById('myNotes');
    if (myNotesTab) {
        myNotesTab.addEventListener('click', function () {
            myNotesTab.classList.add('selected');
            myNotesTab.classList.remove('unselected');
            allNotesTab.classList.add('unselected');
            allNotesTab.classList.remove('selected');

            noteManagerInstance.currentTab = 'myNotes';
            raiseCustomEvent("MYNOTES_OPEN");
        });
    }
    const prevButton = document.getElementById('prevBtn');
    if(prevButton){
        prevButton.addEventListener('click', function(){
            raiseCustomEvent("NAVIGATE_PREV");
        });
    }

    const nextButton = document.getElementById('nextBtn');
    if(nextButton){
        nextButton.addEventListener('click', function(){
            raiseCustomEvent("NAVIGATE_NEXT");
        });
    }

    const firstPageBtn = document.getElementById('firstPageBtn');
    if(firstPageBtn){
        firstPageBtn.addEventListener('click',function(){
            raiseCustomEvent("NAVIGATE_TO_FIRST_PAGE")
        });
    }

    const lastPageBtn = document.getElementById('lastPageBtn');
    if(lastPageBtn){
        lastPageBtn.addEventListener('click',function(){
            raiseCustomEvent("NAVIGATE_TO_LAST_PAGE")
        });
    }

    const navPages = document.querySelector('.nav-pages');
    if (navPages) {
        navPages.addEventListener('click', function (event) {
            if (event.target.tagName === 'li') {
                raiseCustomEvent("NAVIGATE_BAR");
            }
        });
    }

    document.addEventListener('click', function (event) {
        const noteTile = event.target.closest('.note');
        if (noteTile) {
            toggleNoteExpansion(noteTile.closest('.note'));
        }
    });
}

function bindingCustomEvents(){
    for (const [eventName, eventHandler] of Object.entries(customEventMap)) {
        document.getElementById("eventCenter").addEventListener(eventName, eventHandler);
    }
}

function raiseCustomEvent(eventName, eventData){
    if(eventData === undefined){
        document.getElementById('eventCenter').dispatchEvent(new CustomEvent(eventName));
    } 
    else{
        document.getElementById('eventCenter').dispatchEvent(new CustomEvent(eventName, { detail: eventData })); 
    }
}