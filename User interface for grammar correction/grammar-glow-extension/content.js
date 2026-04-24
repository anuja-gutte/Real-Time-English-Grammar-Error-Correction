

const DEBOUNCE_MS = 1000;
const MIN_WORDS = 3;
const FLASK_URL = "http://localhost:5000/correct";

let debounceTimer = null;
let lastSentText = "";
let realtimeEnabled = true;


chrome.storage.local.get("realtimeEnabled", (data) => {
  realtimeEnabled = data.realtimeEnabled !== false;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_SELECTED_TEXT") {
    sendResponse({ selectedText: window.getSelection().toString() });
  }
  if (request.action === "TOGGLE_REALTIME") {
    realtimeEnabled = request.enabled;
    if (!realtimeEnabled) hideToast();
  }
});


function injectStyles() {
  if (document.getElementById("gg-styles")) return;
  const s = document.createElement("style");
  s.id = "gg-styles";
  s.textContent = `
    #gg-toast {
      all: initial;
      position: fixed !important;
      bottom: 28px !important;
      right: 28px !important;
      z-index: 2147483647 !important;
      max-width: 320px !important;
      width: 320px !important;
      background: #0f0f1c !important;
      border: 1px solid #7c5cff55 !important;
      border-radius: 14px !important;
      padding: 14px 16px !important;
      box-shadow: 0 12px 40px #000a, 0 0 0 1px #7c5cff18 !important;
      font-family: 'Segoe UI', sans-serif !important;
      font-size: 13px !important;
      color: #e8e8ff !important;
      opacity: 0 !important;
      transform: translateY(14px) !important;
      transition: opacity .2s ease, transform .2s ease !important;
      pointer-events: none !important;
      display: block !important;
    }
    #gg-toast.gg-show {
      opacity: 1 !important;
      transform: translateY(0) !important;
      pointer-events: auto !important;
    }
    #gg-toast * { all: unset; }
    #gg-toast .gg-header {
      display: flex !important;
      align-items: center !important;
      gap: 7px !important;
      margin-bottom: 8px !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      color: #9d8fff !important;
      letter-spacing: .08em !important;
      text-transform: uppercase !important;
    }
    #gg-toast .gg-dot {
      display: inline-block !important;
      width: 7px !important; height: 7px !important;
      border-radius: 50% !important;
      background: #7c5cff !important;
      box-shadow: 0 0 8px #7c5cff !important;
      flex-shrink: 0 !important;
    }
    #gg-toast .gg-badge {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      background: #7c5cff20 !important;
      border: 1px solid #7c5cff44 !important;
      color: #b0a8ff !important;
      border-radius: 6px !important;
      padding: 3px 9px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      margin-bottom: 10px !important;
    }
    #gg-toast .gg-sep { color: #7c5cff66 !important; }
    #gg-toast .gg-body {
      background: #16162a !important;
      border-radius: 9px !important;
      padding: 9px 11px !important;
      line-height: 1.6 !important;
      color: #f0f0ff !important;
      font-size: 13px !important;
      margin-bottom: 10px !important;
      word-break: break-word !important;
    }
    #gg-toast del {
      text-decoration: line-through !important;
      color: #ff6b8a99 !important;
      margin-right: 2px !important;
    }
    #gg-toast ins {
      text-decoration: none !important;
      background: #7c5cff33 !important;
      color: #c4b8ff !important;
      border-radius: 3px !important;
      padding: 1px 3px !important;
    }
    #gg-toast .gg-actions {
      display: flex !important;
      gap: 8px !important;
    }
    #gg-toast .gg-btn {
      flex: 1 !important;
      display: block !important;
      border: none !important;
      border-radius: 8px !important;
      padding: 8px 0 !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      text-align: center !important;
      transition: filter .15s !important;
    }
    #gg-toast .gg-btn:hover { filter: brightness(1.2) !important; }
    #gg-toast .gg-apply { background: #7c5cff !important; color: #fff !important; }
    #gg-toast .gg-dismiss { background: #ffffff12 !important; color: #888 !important; }
  `;
  document.documentElement.appendChild(s);
}

function showToast({ corrected, errorType, correctionType, original, target }) {
  injectStyles();

  let toast = document.getElementById("gg-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "gg-toast";
    document.documentElement.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="gg-header"><span class="gg-dot"></span>Grammar Glow — Suggestion</div>
    <div class="gg-badge">
      ${esc(errorType || "Grammar Error")}
      <span class="gg-sep">·</span>
      ${esc(correctionType || "Correction")}
    </div>
    <div class="gg-body">${buildDiff(original, corrected)}</div>
    <div class="gg-actions">
      <button class="gg-btn gg-apply">✓ Apply</button>
      <button class="gg-btn gg-dismiss">Dismiss</button>
    </div>
  `;

  toast.querySelector(".gg-apply").addEventListener("click", () => {
    applyCorrection(target, corrected);
    hideToast();
  });
  toast.querySelector(".gg-dismiss").addEventListener("click", hideToast);

  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("gg-show")));

  clearTimeout(toast._timer);
  toast._timer = setTimeout(hideToast, 9000);
}

function hideToast() {
  const t = document.getElementById("gg-toast");
  if (t) t.classList.remove("gg-show");
}


function buildDiff(a, b) {
  const wa = a.trim().split(/\s+/);
  const wb = b.trim().split(/\s+/);
  let html = "";
  const len = Math.max(wa.length, wb.length);
  for (let i = 0; i < len; i++) {
    if (wa[i] === wb[i]) {
      html += esc(wb[i] ?? "") + " ";
    } else if (wa[i] && wb[i]) {
      html += `<del>${esc(wa[i])}</del><ins>${esc(wb[i])}</ins> `;
    } else if (wb[i]) {
      html += `<ins>${esc(wb[i])}</ins> `;
    } else {
      html += `<del>${esc(wa[i])}</del> `;
    }
  }
  return html.trim();
}

function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── Apply correction ──────────────────────────────────────────────────────────
function applyCorrection(target, corrected) {
  if (!target) return;
  const ce = target.isContentEditable ||
             target.getAttribute("contenteditable") === "true" ||
             target.getAttribute("contenteditable") === "";

  if (ce) {
    target.focus();
    
    document.execCommand("selectAll", false, null);
    const ok = document.execCommand("insertText", false, corrected);
    if (!ok) {
     
      target.innerText = corrected;
      const range = document.createRange();
      range.selectNodeContents(target);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      target.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, data: corrected }));
    }
  } else {
    const proto = target instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(target, corrected);
    else target.value = corrected;

    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    target.selectionStart = target.selectionEnd = corrected.length;
  }

  lastSentText = corrected;
}


function getText(el) {
  const ce = el.isContentEditable ||
             el.getAttribute("contenteditable") === "true" ||
             el.getAttribute("contenteditable") === "";
  return ce ? (el.innerText || el.textContent || "").trim()
            : (el.value || "").trim();
}


async function checkGrammar(text, target) {
  if (!realtimeEnabled) return;
  if (!text || text === lastSentText) return;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORDS) return;

  
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const last = sentences[sentences.length - 1].trim();
  if (last.split(/\s+/).filter(Boolean).length < MIN_WORDS) return;
  if (last === lastSentText) return;

  lastSentText = last; 

  try {
    const res = await fetch(FLASK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: last })
    });
    if (!res.ok) { lastSentText = ""; return; }

    const data = await res.json();
    const corrected = (data.corrected || "").trim();

    if (!corrected || corrected.toLowerCase() === last.toLowerCase()) {
      lastSentText = "";
      return;
    }

    showToast({ corrected, errorType: data.errorType, correctionType: data.correctionType, original: last, target });
  } catch (_) {
    lastSentText = ""; 
  }
}


function attachTo(el) {
  if (el.__ggAttached) return;
  el.__ggAttached = true;

  const handler = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => checkGrammar(getText(el), el), DEBOUNCE_MS);
  };

 
  el.addEventListener("input", handler, true);
  el.addEventListener("keyup", handler, true);
}


const SELECTOR = [
  "textarea",
  'input[type="text"]',
  'input[type="search"]',
  '[contenteditable="true"]',
  '[contenteditable=""]',
  '[contenteditable]',
  '[role="textbox"]',
  ".ql-editor",
  ".ProseMirror",
  "#prompt-textarea",             
  'div[data-testid="tweetTextarea_0"]', 
  'div[data-tab="10"]',           
].join(", ");

function scanAndAttach() {
  try {
    document.querySelectorAll(SELECTOR).forEach(attachTo);
  } catch (_) {}
}

scanAndAttach();
new MutationObserver(scanAndAttach).observe(document.documentElement, {
  childList: true,
  subtree: true
});