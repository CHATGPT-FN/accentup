
// ===================================
// ACCENTUP - LESSON LIBRARY
// ===================================

const lessons = {
    beginner: [
        "Hello! How are you today?",
        "My name is Alex.",
        "I love learning English.",
        "Today is a beautiful day.",
        "Thank you for your help.",
        "I enjoy reading books.",
        "Have a wonderful day."
    ],

    intermediate: [
        "The future belongs to those who believe.",
        "Learning a new language takes patience.",
        "Practice makes progress every single day.",
        "Confidence comes from consistent effort.",
        "Communication opens doors to new opportunities.",
        "Small improvements can make a big difference.",
        "I am working towards my goals."
    ],

    advanced: [
        "Technology continues to transform the way we communicate.",
        "Developing confidence requires dedication and persistence.",
        "Effective communication is essential in modern society.",
        "Opportunities often come to those who prepare themselves.",
        "Artificial intelligence is changing the future of education.",
        "Consistent practice is the foundation of meaningful progress.",
        "Language allows people to connect across different cultures."
    ]
};

// ===================================
// GET ELEMENTS
// ===================================

const listenBtn = document.getElementById("listenBtn");
const exampleBtn = document.getElementById("exampleBtn");
const newSentenceBtn = document.getElementById("newSentence");

const result = document.getElementById("result");
const sentence = document.getElementById("sentence");
const levelSelect = document.getElementById("levelSelect");

const totalAttemptsElement = document.getElementById("totalAttempts");
const averageScoreElement = document.getElementById("averageScore");
const bestScoreElement = document.getElementById("bestScore");

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

let previousSentence = "";
let isListening = false;

// ===================================
// CHECK LEVEL SELECTOR
// ===================================

if (!levelSelect) {
    console.error("Level selector not found. Check index.html.");
}

// ===================================
// GET SAVED HISTORY
// ===================================

function getHistory() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("accentUpHistory") || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

// ===================================
// SAVE HISTORY
// ===================================

function saveHistory(history) {
    try {
        localStorage.setItem(
            "accentUpHistory",
            JSON.stringify(history)
        );
    } catch (error) {
        console.log("Could not save history.");
    }
}

// ===================================
// UPDATE DASHBOARD
// ===================================

function updateDashboard() {
    const history = getHistory();

    const total = history.length;

    const average = total
        ? Math.round(
            history.reduce((sum, item) => sum + item.score, 0) / total
        )
        : 0;

    const best = total
        ? Math.max(...history.map(item => item.score))
        : 0;

    totalAttemptsElement.textContent = total;
    averageScoreElement.textContent = average + "%";
    bestScoreElement.textContent = best + "%";

    historyList.replaceChildren();

    if (total === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-history";
        empty.textContent = "Your practice history will appear here.";
        historyList.appendChild(empty);
        return;
    }

    history.slice(0, 5).forEach(item => {
        const row = document.createElement("div");
        row.className = "history-item";

        const details = document.createElement("div");

        const level = document.createElement("p");
        level.textContent = item.level + " • " + item.date;

        const text = document.createElement("p");
        text.textContent = item.sentence;

        details.appendChild(level);
        details.appendChild(text);

        const score = document.createElement("span");
        score.className = "history-score";
        score.textContent = item.score + "%";

        row.appendChild(details);
        row.appendChild(score);

        historyList.appendChild(row);
    });
}

// ===================================
// CHANGE SENTENCE
// ===================================

function changeSentence() {

    const level = levelSelect.value;

    const availableLessons = lessons[level];

    if (!availableLessons) {
        result.textContent = "Please select a valid level.";
        return;
    }

    let newText;

    do {
        newText = availableLessons[
            Math.floor(Math.random() * availableLessons.length)
        ];
    } while (
        newText === previousSentence &&
        availableLessons.length > 1
    );

    previousSentence = newText;

    sentence.textContent = newText;

    result.textContent =
        "Your level is " + level + ". Choose Listen to Example or Start Speaking.";
}

// ===================================
// LEVEL SELECTOR FIX
// ===================================

levelSelect.addEventListener("change", function () {
    changeSentence();
});

// ===================================
// NEW SENTENCE
// ===================================

newSentenceBtn.addEventListener("click", changeSentence);

// ===================================
// EXAMPLE VOICE
// ===================================

exampleBtn.addEventListener("click", function () {

    if (!("speechSynthesis" in window)) {
        result.textContent = "Speech is not supported in this browser.";
        return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(
        sentence.textContent
    );

    speech.lang = "en-US";
    speech.rate = 0.85;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
});

// ===================================
// COMPARE WORDS
// ===================================

function compareWords(spoken, expected) {

    const targetWords =
        expected.toLowerCase().match(/[a-z']+/g) || [];

    const spokenWords =
        spoken.toLowerCase().match(/[a-z']+/g) || [];

    const rows = targetWords.length + 1;
    const cols = spokenWords.length + 1;

    const dp = Array.from(
        { length: rows },
        () => Array(cols).fill(0)
    );

    for (let i = 1; i < rows; i++) {
        for (let j = 1; j < cols; j++) {

            if (targetWords[i - 1] === spokenWords[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(
                    dp[i - 1][j],
                    dp[i][j - 1]
                );
            }
        }
    }

    const matched = dp[rows - 1][cols - 1];

    const score = targetWords.length
        ? Math.round((matched / targetWords.length) * 100)
        : 0;

    const correct = new Set();

    let i = targetWords.length;
    let j = spokenWords.length;

    while (i > 0 && j > 0) {

        if (targetWords[i - 1] === spokenWords[j - 1]) {
            correct.add(i - 1);
            i--;
            j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return {
        score: score,
        targetWords: targetWords,
        correct: correct
    };
}

// ===================================
// SAVE ATTEMPT
// ===================================

function saveAttempt(score, spoken) {

    const history = getHistory();

    history.unshift({
        score: score,
        sentence: sentence.textContent,
        spoken: spoken,
        level: levelSelect.value,
        date: new Date().toLocaleDateString()
    });

    saveHistory(history.slice(0, 100));

    updateDashboard();
}

// ===================================
// SHOW RESULTS
// ===================================

function showResult(spoken) {

    const comparison = compareWords(
        spoken,
        sentence.textContent
    );

    result.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent =
        "Your matching score: " + comparison.score + "%";

    result.appendChild(heading);

    const spokenText = document.createElement("p");
    spokenText.textContent = "You said: " + spoken;
    result.appendChild(spokenText);

    const feedback = document.createElement("p");

    if (comparison.score === 100) {
        feedback.textContent = "Excellent! You matched every word!";
    } else if (comparison.score >= 70) {
        feedback.textContent = "Great effort! Keep practising.";
    } else {
        feedback.textContent = "Good try! Practise again.";
    }

    result.appendChild(feedback);

    const wordTitle = document.createElement("p");
    wordTitle.textContent = "Word comparison:";
    result.appendChild(wordTitle);

    const wordContainer = document.createElement("div");
    wordContainer.className = "word-comparison";

    comparison.targetWords.forEach((word, index) => {

        const span = document.createElement("span");
        span.textContent = word + " ";

        span.className = comparison.correct.has(index)
            ? "correct-word"
            : "missing-word";

        wordContainer.appendChild(span);
    });

    result.appendChild(wordContainer);

    const note = document.createElement("p");
    note.textContent =
        "This score measures word matching, not accent quality.";

    note.style.fontSize = "12px";
    result.appendChild(note);

    saveAttempt(comparison.score, spoken);
}

// ===================================
// SPEECH RECOGNITION
// ===================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    listenBtn.addEventListener("click", function () {

        if (isListening) return;

        result.textContent = "🎤 Listening... Speak now!";
        listenBtn.textContent = "Listening...";
        isListening = true;

        try {
            recognition.start();
        } catch (error) {
            isListening = false;
            listenBtn.textContent = "🎤 Start Speaking";
            result.textContent = "Please wait and try again.";
        }
    });

    recognition.onresult = function (event) {
        showResult(event.results[0][0].transcript);
    };

    recognition.onerror = function (event) {

        const messages = {
            "not-allowed": "Please allow microphone access.",
            "no-speech": "No speech detected. Try again.",
            "audio-capture": "No microphone found.",
            "network": "Check your internet connection."
        };

        result.textContent =
            messages[event.error] || "Something went wrong.";
    };

    recognition.onend = function () {
        isListening = false;
        listenBtn.textContent = "🎤 Start Speaking";
    };

} else {

    listenBtn.disabled = true;
    result.textContent =
        "Speech recognition is not supported. Try Google Chrome.";
}

// ===================================
// CLEAR HISTORY
// ===================================

clearHistoryBtn.addEventListener("click", function () {

    if (getHistory().length === 0) {
        result.textContent = "There is no history to clear.";
        return;
    }

    if (confirm("Clear all your practice history?")) {
        localStorage.removeItem("accentUpHistory");
        updateDashboard();
    }
});

// ===================================
// START WEBSITE
// ===================================

changeSentence();
updateDashboard();
