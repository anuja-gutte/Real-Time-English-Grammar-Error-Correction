from flask import Flask, request, jsonify
from model_loader import correct_grammar

from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/correct", methods=["POST"])
def correct():
    data = request.json
    text = data.get("text", "")

    if not text.strip():
        return jsonify({"corrected": text})

    corrected = correct_grammar(text)

    return jsonify({
        "original": text,
        "corrected": corrected
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)