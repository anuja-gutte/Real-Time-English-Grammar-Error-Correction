import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import re


device = "cuda" if torch.cuda.is_available() else "cpu"

# replace with your saved model path
MODEL_PATH = r"C:\Users\hp\Downloads\Model Trained\Model Trained"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH).to(device)

def clean_output(text):
    # Remove everything after Correction / Error labels
    text = re.split(r'Correction:|Correction Type:|Error Type:', text)[0]

    # Remove anything after pipe |
    text = text.split("|")[0]

    # Fix spacing (e.g. "school.She" → "school. She")
    text = re.sub(r'\.(?=[A-Za-z])', '. ', text)

    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text)

    return text.strip()

def correct_grammar(text: str):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to(device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=128,
            num_beams=4
        )

    corrected = tokenizer.decode(outputs[0], skip_special_tokens=True)
    corrected = clean_output(corrected)
    return corrected