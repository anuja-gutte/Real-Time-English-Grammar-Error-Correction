

import React, { useState, useRef } from "react";
import axios from "axios";

export default function GrammarEditor() {
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [learningMode, setLearningMode] = useState(false);
  const [checkedSentence, setCheckedSentence] = useState("");
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [correctionLog, setCorrectionLog] = useState([]);

  const typingTimeoutRef = useRef(null);
  const autoCorrectTimeoutRef = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    
    if (suggestion) setSuggestion(null);

    if (autoCorrectTimeoutRef.current) {
      clearTimeout(autoCorrectTimeoutRef.current);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      detectLastSentence(value);
    }, 700);
  };

  const detectLastSentence = (value) => {
    if (!value.trim()) return;

   
    const sentences = value.match(/[^.!?]+[.!?]+/g);

    if (!sentences || sentences.length === 0) return;

    const lastSentence = sentences[sentences.length - 1].trim();

    if (!lastSentence || lastSentence === checkedSentence) return;

    const startIndex = value.lastIndexOf(lastSentence);

    if (lastSentence.length >= 3) {
      checkGrammar(lastSentence, startIndex);
      setCheckedSentence(lastSentence);
    }
  };

  const checkGrammar = async (sentence, index) => {
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/correct", {
        text: sentence,
      });

      const corrected = res.data.corrected?.trim();

      if (
        corrected &&
        corrected.toLowerCase() !== sentence.trim().toLowerCase()
      ) {
        const suggestionObj = {
          original: sentence,
          corrected,
          index,
          explanation: res.data.explanation || null,
          errorType: res.data.errorType || null,
          correctionType: res.data.correctionType || null,
        };

        setSuggestion(suggestionObj);

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
    if (autoCorrectTimeoutRef.current) {
      clearTimeout(autoCorrectTimeoutRef.current);
    }

    const s = suggestionToApply || suggestion;
    if (!s) return;

    setAnimate(true);

    setText((prev) => {
      
      const currentSlice = prev.slice(s.index, s.index + s.original.length);

      if (currentSlice !== s.original) {
        console.warn("Skipped stale correction:", s.original);
        return prev;
      }

      const before = prev.slice(0, s.index);
      const after = prev.slice(s.index + s.original.length);
      return before + s.corrected + after;
    });

    setCorrectionLog((prev) => [
      {
        original: s.original,
        corrected: s.corrected,
        explanation: s.explanation,
        errorType: s.errorType,
        correctionType: s.correctionType,
      },
      ...prev.slice(0, 4),
    ]);

    setTimeout(() => {
      if (!learningMode) {
        setSuggestion(null);
      }
      setAnimate(false);
    }, 250);
  };

  const dismissSuggestion = () => {
    if (autoCorrectTimeoutRef.current) {
      clearTimeout(autoCorrectTimeoutRef.current);
    }
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

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
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
            <p>Smart Sentence Editor</p>
          </div>

          <textarea
            value={text}
            onChange={handleChange}
            className={`textarea ${animate ? "animate" : ""}`}
            placeholder="Write here.... Corrections apply automatically ✨"
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

        {/* Suggestion Banner */}
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
              <button
                onClick={() => applyCorrection(suggestion)}
                className="apply-btn"
              >
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

            <p className="tip">
              <strong>Original:</strong>
            </p>
            <p className="old-text">{suggestion.original}</p>

            <br />

            <p className="tip">
              <strong>Suggested:</strong>
            </p>
            <p className="new-text">{suggestion.corrected}</p>

            <br />

            {suggestion.errorType && (
              <>
                <p className="tip">
                  <strong>Error Type:</strong>
                </p>
                <p className="error-type-text">{suggestion.errorType}</p>
                <br />
              </>
            )}

            {suggestion.correctionType && (
              <>
                <p className="tip">
                  <strong>Correction Type:</strong>
                </p>
                <p className="correction-type-text">
                  {suggestion.correctionType}
                </p>
                <br />
              </>
            )}

            {!suggestion.errorType && !suggestion.correctionType && (
              <p className="tip">
                No model label available for this correction.
              </p>
            )}
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

                {log.errorType && (
                  <p className="tip" style={{ fontSize: "12px", marginTop: "4px" }}>
                    <strong>Error Type:</strong> {log.errorType}
                  </p>
                )}

                {log.correctionType && (
                  <p className="tip" style={{ fontSize: "12px", marginTop: "2px" }}>
                    <strong>Correction Type:</strong> {log.correctionType}
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
