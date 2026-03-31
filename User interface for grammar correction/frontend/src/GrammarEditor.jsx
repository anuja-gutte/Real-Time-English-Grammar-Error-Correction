// import React, { useState, useCallback, useEffect } from "react";
// import axios from "axios";
// import debounce from "lodash.debounce";



// export default function GrammarEditor() {
//   const [text, setText] = useState("");
//   const [suggestion, setSuggestion] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
//   const [animate, setAnimate] = useState(false);
//   const [learningMode, setLearningMode] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [lastCorrected, setLastCorrected] = useState("");
//   useEffect(() => {
//   if (!suggestion) return;

//   const timer = setTimeout(() => {
//     applyCorrection();
//   }, 1000); // ⏱ 1 second delay

//   return () => clearTimeout(timer); // cleanup
// }, [suggestion]);
//   // 🔥 Detect sentence completion
//  const handleChange = (e) => {
//   const value = e.target.value;
//   console.log("Typing:", value);
//   setText(value);

//   if (/[.!?]$/.test(value) && !isDeleting)  {
//     console.log("Sentence ended detected"); 
//     const match = value.match(/[^.!?]+[.!?]$/);

//     if (match) {
//       const lastSentence = match[0];
//       const startIndex = value.lastIndexOf(lastSentence);
//         console.log("Calling API with:", lastSentence);
//     //   debouncedCheck(lastSentence, startIndex);

//     checkGrammar(lastSentence, startIndex);
//     }
//   }
// };
//   // 🔥 API call
//   const checkGrammar = async (sentence, index) => {
//   setLoading(true);
//     console.log("Inside checkGrammar");
    
//   try {
//     const res = await axios.post("http://localhost:5000/correct", {
//       text: sentence,
      
//     });
//     console.log("API RESPONSE:", res.data); 

//   if (res.data.corrected !== sentence && sentence !== lastCorrected) {
//   setLastCorrected(sentence);

//   const before = text.slice(0, index);
//   const after = text.slice(index + sentence.length);

//   const updated = before + res.data.corrected + after;

//   setText(updated);


//   console.log("API RESPONSE:", res.data);
// console.log("Original:", sentence);
// console.log("Corrected:", res.data.corrected);
// }
//   } catch (err) {
//     console.error(err);
//   }

//   setLoading(false);
// };
// const debouncedCheck = useCallback(
//   debounce((sentence, index) => {
//     checkGrammar(sentence, index);
//   }, 500),
//   []
// );


//   // 🔥 Apply correction
// const applyCorrection = () => {
//   if (!suggestion) return;

//   setAnimate(true);

//   const before = text.slice(0, suggestion.index);
//   const after = text.slice(
//     suggestion.index + suggestion.original.length
//   );

//   const updated = before + suggestion.corrected + after;

//   setTimeout(() => {
//     setText(updated);
//     setSuggestion(null);
//     setAnimate(false);
//   }, 200); // small delay for animation
// };

//   return (
//     <div className="container">
//       <h2>📝 Real-time Grammar Checker</h2>

//       <button onClick={() => setLearningMode(!learningMode)}>
//   {learningMode ? "📚 Learning Mode ON" : "✍ Writing Mode"}
// </button>

//       <textarea
//   value={text}
//   onChange={handleChange}
//   className={`textarea ${animate ? "animate" : ""}`}
//   onKeyDown={(e) => {
//     if (e.key === "Backspace") {
//       setIsDeleting(true);
//     }
//   }}
//   onKeyUp={() => setIsDeleting(false)}
//   onClick={(e) => {
//     setCursorPos({
//       x: e.clientX,
//       y: e.clientY,
//     });
//   }}
  
// />

//         {learningMode && (
//   <div className="learning-box">
//     <p>
//       {suggestion.original} → {suggestion.corrected}
//     </p>
//     <p className="tip">
//       Tip: Use "goes" for third person singular
//     </p>
//   </div>
// )}

//       {loading && <p>Checking...</p>}

//       {/* {suggestion && (
//         <div className="suggestion-box">
//           <p><b>Suggestion:</b></p>
//           <p className="corrected">{suggestion.corrected}</p>

//           <div className="buttons">
//             <button onClick={applyCorrection} className="apply">
//               ✔ Auto Correct
//             </button>
//             <button onClick={() => setSuggestion(null)} className="ignore">
//               ✖ Ignore
//             </button>
//           </div>
//         </div>
//       )} */
      
//       suggestion && (
//   <div
//     className="floating-bubble"
//     style={{
//       top: cursorPos.y + 10,
//       left: cursorPos.x + 10,
//     }}
//   >
//     <p>{suggestion.corrected}</p>

//     <button onClick={applyCorrection}>✔</button>
//     <button onClick={() => setSuggestion(null)}>✖</button>
//   </div>
// )}
      
//     </div>
//   );
// }


import React, { useState, useEffect } from "react";
import axios from "axios";

export default function GrammarEditor() {
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [animate, setAnimate] = useState(false);
  const [learningMode, setLearningMode] = useState(false);
  const [lastCorrected, setLastCorrected] = useState("");
  const [prevText, setPrevText] = useState("");

  // 🔥 Auto apply after 1 sec
  useEffect(() => {
    if (!suggestion) return;

    const timer = setTimeout(() => {
      applyCorrection();
    }, 1000);

    return () => clearTimeout(timer);
  }, [suggestion]);

  // 🔥 Detect typing vs deleting
  const handleChange = (e) => {
    const value = e.target.value;

    const isDeleting = value.length < prevText.length;

    setText(value);

    // Only trigger when NOT deleting
    if (!isDeleting && /[.!?]$/.test(value)) {
      const match = value.match(/[^.!?]+[.!?]$/);

      if (match) {
        const lastSentence = match[0];
        const startIndex = value.lastIndexOf(lastSentence);

        checkGrammar(lastSentence, startIndex);
      }
    }

    setPrevText(value);
  };

  // 🔥 API call
  const checkGrammar = async (sentence, index) => {
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/correct", {
        text: sentence,
      });

      const corrected = res.data.corrected;

      // Avoid loops
      if (corrected !== sentence && corrected !== lastCorrected) {
        setLastCorrected(corrected);

        setSuggestion({
          original: sentence,
          corrected: corrected,
          index: index,
          explanation: res.data.explanation || null,
        });
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // 🔥 Apply correction with animation
  const applyCorrection = () => {
    if (!suggestion) return;

    setAnimate(true);

    setText((prev) => {
      const before = prev.slice(0, suggestion.index);
      const after = prev.slice(
        suggestion.index + suggestion.original.length
      );
      return before + suggestion.corrected + after;
    });

    setTimeout(() => {
      setSuggestion(null);
      setAnimate(false);
    }, 200);
  };

  return (
    <div className="container">
      <h2>📝 Real-time Grammar Checker</h2>

      {/* Mode Toggle */}
      <button onClick={() => setLearningMode(!learningMode)}>
        {learningMode ? "📚 Learning Mode ON" : "✍ Writing Mode"}
      </button>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={handleChange}
        className={`textarea ${animate ? "animate" : ""}`}
        onClick={(e) => {
          setCursorPos({
            x: e.clientX,
            y: e.clientY,
          });
        }}
        placeholder="Type a sentence..."
      />

      {/* Loading */}
      {loading && <p>Checking...</p>}

      {/* Floating Suggestion Bubble */}
      {suggestion && (
        <div
          className="floating-bubble"
          style={{
            top: cursorPos.y + 10,
            left: cursorPos.x + 10,
          }}
        >
          <p>{suggestion.corrected}</p>

          <button onClick={applyCorrection}>✔</button>
          <button onClick={() => setSuggestion(null)}>✖</button>
        </div>
      )}

      {/* Learning Mode */}
      {learningMode && suggestion && (
        <div className="learning-box">
          <p>
            {suggestion.original} → {suggestion.corrected}
          </p>
          <p className="tip">
            {suggestion.explanation ||
              "Grammar improved for correctness."}
          </p>
        </div>
      )}
    </div>
  );
}