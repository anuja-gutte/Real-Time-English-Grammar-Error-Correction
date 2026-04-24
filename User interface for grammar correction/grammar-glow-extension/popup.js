const inputText = document.getElementById("inputText");
const getSelectedBtn = document.getElementById("getSelectedBtn");
const checkBtn = document.getElementById("checkBtn");
const copyBtn = document.getElementById("copyBtn");
const loading = document.getElementById("loading");
const result = document.getElementById("result");
const correctedText = document.getElementById("correctedText");
const errorType = document.getElementById("errorType");
const correctionType = document.getElementById("correctionType");
const realtimeToggle = document.getElementById("realtimeToggle");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const toggleLabel = document.getElementById("toggleLabel");

const FLASK_URL = "http://localhost:5000/correct";

chrome.storage.local.get("realtimeEnabled", ({ realtimeEnabled }) => {
  const enabled = realtimeEnabled !== false; 
  realtimeToggle.checked = enabled;
  updateStatusUI(enabled);
  notifyContentScript(enabled);
});

realtimeToggle.addEventListener("change", () => {
  const enabled = realtimeToggle.checked;
  chrome.storage.local.set({ realtimeEnabled: enabled });
  updateStatusUI(enabled);
  notifyContentScript(enabled);
});

function updateStatusUI(enabled) {
  if (enabled) {
    statusDot.className = "status-dot active";
    statusText.textContent = "Monitoring active inputs on this page";
    toggleLabel.textContent = "Live";
  } else {
    statusDot.className = "status-dot inactive";
    statusText.textContent = "Real-time correction paused";
    toggleLabel.textContent = "Off";
  }
}

function notifyContentScript(enabled) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_REALTIME", enabled })
      .catch(() => {}); 
  });
}

getSelectedBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "GET_SELECTED_TEXT" }, (res) => {
    if (chrome.runtime.lastError) return;
    if (res?.selectedText) inputText.value = res.selectedText;
  });
});


checkBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();
  if (!text) { alert("Please enter or select some text."); return; }

  loading.classList.remove("hidden");
  result.classList.add("hidden");

  try {
    const res = await fetch(FLASK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json();

    correctedText.textContent = data.corrected || "No correction needed";
    errorType.textContent     = data.errorType || "None detected";
    correctionType.textContent = data.correctionType || "None detected";

    result.classList.remove("hidden");
  } catch {
    alert("Could not connect to Flask backend. Make sure it is running on port 5000.");
  }

  loading.classList.add("hidden");
});

copyBtn.addEventListener("click", async () => {
  const text = correctedText.textContent.trim();
  if (!text) return;
  await navigator.clipboard.writeText(text);
  copyBtn.textContent = "✓ Copied!";
  setTimeout(() => { copyBtn.textContent = "Copy Corrected Text"; }, 1500);
});