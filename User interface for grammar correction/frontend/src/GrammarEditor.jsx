import React, { useState, useRef } from "react";
import axios from "axios";

export default function GrammarEditor() {
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [learningMode, setLearningMode] = useState(false);
  const [checkedUnit, setCheckedUnit] = useState("");
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [correctionLog, setCorrectionLog] = useState([]);
  const typingTimeoutRef = useRef(null);
  const autoCorrectTimeoutRef = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (suggestion) setSuggestion(null);
    if (autoCorrectTimeoutRef.current) clearTimeout(autoCorrectTimeoutRef.current);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Reset on every keystroke so the next debounce pause always re-evaluates.
    // This was the root cause of short/same-length sentences never retriggering.
    setCheckedUnit("");

    typingTimeoutRef.current = setTimeout(() => {
      detectUnit(value);
    }, 800);
  };

  const detectUnit = (value) => {
    const blocks = value
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (blocks.length === 0) return;

    const lastBlock = blocks[blocks.length - 1];

    // Split into sentences; also handles incomplete sentences without end punctuation
    const sentences = lastBlock
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length === 0) return;

    const lastSentence = sentences[sentences.length - 1];

    // Multi-sentence block → check whole block; single sentence → check it alone
    const unitToCheck = sentences.length > 1 ? lastBlock : lastSentence;

    // Minimum 3 chars — catches "i am", "she like", "i is happy." etc.
    if (unitToCheck.length >= 3) {
      const startIndex = value.lastIndexOf(unitToCheck);
      checkGrammar(unitToCheck, startIndex);
      setCheckedUnit(unitToCheck);
    }
  };

  const checkGrammar = async (unit, index) => {
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/correct", {
        text: unit,
      });

      const corrected = res.data.corrected?.trim();

      // Normalise case before comparing so "i is happy." vs "I is happy."
      // are both detected as changed, not silently skipped.
      if (corrected && corrected.toLowerCase() !== unit.trim().toLowerCase()) {
        const suggestionObj = {
          original: unit,
          corrected,
          index,
          explanation: res.data.explanation || null,
        };

        setSuggestion(suggestionObj);

        // Auto-correct after 2.5s if enabled
        if (autoCorrect) {
          autoCorrectTimeoutRef.current = setTimeout(() => {
            applyCorrection(suggestionObj);
          }, 2500);
        }
      }
    } catch (err) {
      console.error("Grammar API Error:", err);
    }

    setLoading(false);
  };

  const applyCorrection = (suggestionToApply) => {
    if (autoCorrectTimeoutRef.current) clearTimeout(autoCorrectTimeoutRef.current);

    const s = suggestionToApply || suggestion;
    if (!s) return;

    setAnimate(true);

    setText((prev) => {
      const before = prev.slice(0, s.index);
      const after = prev.slice(s.index + s.original.length);
      return before + s.corrected + after;
    });

    setCorrectionLog((prev) => [
      { original: s.original, corrected: s.corrected, explanation: s.explanation },
      ...prev.slice(0, 4),
    ]);

    setTimeout(() => {
      setSuggestion(null);
      setAnimate(false);
    }, 250);
  };

  const dismissSuggestion = () => {
    if (autoCorrectTimeoutRef.current) clearTimeout(autoCorrectTimeoutRef.current);
    setSuggestion(null);
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="page-shell">
      <div className="background-blur blur-1" />
      <div className="background-blur blur-2" />

      <div className="container glass-card">
        {/* Header */}
        <div className="hero">
          <div>
            <p className="badge">AI Writing Assistant</p>
            <h1>Grammar Glow</h1>
            <p className="subtitle">
              Write naturally, fix grammar intelligently, and learn as you go.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
            <button
              className={`mode-toggle ${learningMode ? "active" : ""}`}
              onClick={() => setLearningMode(!learningMode)}
            >
              {learningMode ? "📚 Learning Mode" : "✍ Writing Mode"}
            </button>

            <button
              className={`mode-toggle ${autoCorrect ? "active" : ""}`}
              onClick={() => setAutoCorrect(!autoCorrect)}
              style={{ fontSize: "13px", padding: "6px 14px" }}
            >
              {autoCorrect ? "⚡ Auto-Correct: On" : "⚡ Auto-Correct: Off"}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="editor-card">
          <div className="editor-topbar">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
            <p>Smart Sentence &amp; Paragraph Editor</p>
          </div>

          <textarea
            value={text}
            onChange={handleChange}
            className={`textarea ${animate ? "animate" : ""}`}
            placeholder="Write here — single sentences or full paragraphs. Corrections apply automatically ✨"
          />

          <div className="stats-row">
            <div className="stat-pill">
              <span>Words</span>
              <strong>{wordCount}</strong>
            </div>
            <div className="stat-pill">
              <span>Characters</span>
              <strong>{charCount}</strong>
            </div>
            <div className="stat-pill status-pill">
              <span>Status</span>
              <strong>
                {loading
                  ? "Checking..."
                  : suggestion
                  ? autoCorrect
                    ? "Auto-fixing…"
                    : "Fix ready"
                  : "Ready"}
              </strong>
            </div>
          </div>
        </div>

        {/* Inline suggestion banner */}
        {suggestion && (
          <div className="suggestion-banner">
            <div className="suggestion-banner-left">
              <span className="suggestion-icon">✦</span>
              <div>
                <p className="suggestion-title">
                  {autoCorrect ? "Auto-correcting in 2.5s…" : "Correction ready"}
                </p>
                <p className="suggestion-preview">
                  <span className="original-text">{suggestion.original}</span>
                  <span className="arrow"> → </span>
                  <span className="corrected-text">{suggestion.corrected}</span>
                </p>
              </div>
            </div>
            <div className="suggestion-actions">
              <button onClick={() => applyCorrection(suggestion)} className="apply-btn">
                Apply now
              </button>
              <button onClick={dismissSuggestion} className="ignore-btn">
                Ignore
              </button>
            </div>
          </div>
        )}

        {/* Learning Mode Panel */}
        {learningMode && suggestion && (
          <div className="learning-box">
            <div className="learning-header">
              <h3>Learning Insight</h3>
              <span>📘</span>
            </div>
            <p className="tip"><strong>Original:</strong></p>
            <p className="old-text">{suggestion.original}</p>
            <br />
            <p className="tip"><strong>Suggested:</strong></p>
            <p className="new-text">{suggestion.corrected}</p>
            <br />
            <p className="tip">
              {suggestion.explanation ||
                "This was improved for grammar and readability."}
            </p>
          </div>
        )}

        {/* Correction History */}
        {correctionLog.length > 0 && (
          <div className="correction-history">
            <div className="history-header">
              <h3>Recent Corrections</h3>
              <button
                className="ignore-btn"
                style={{ fontSize: "12px", padding: "4px 10px" }}
                onClick={() => setCorrectionLog([])}
              >
                Clear
              </button>
            </div>
            {correctionLog.map((log, i) => (
              <div key={i} className="history-item">
                <p className="old-text" style={{ fontSize: "13px" }}>
                  {log.original}
                </p>
                <p className="new-text" style={{ fontSize: "13px" }}>
                  ✓ {log.corrected}
                </p>
                {log.explanation && (
                  <p className="tip" style={{ fontSize: "12px", marginTop: "2px" }}>
                    {log.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}