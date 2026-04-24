import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import re

device = "cuda" if torch.cuda.is_available() else "cpu"


MODEL_PATH = r"C:\Users\hp\Downloads\trained_model\bart_grammar_error_model"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH).to(device)
model.eval()


def extract_fields(output_text):
    

    correction = "Unknown"
    error_type = "Unknown"

    corr_match = re.search(
        r'Correction:\s*(.*?)(?:Error Type:|$)',
        output_text,
        re.IGNORECASE
    )
    if corr_match:
        correction = corr_match.group(1).strip()

   
    err_match = re.search(
        r'Error Type:\s*(.*)',
        output_text,
        re.IGNORECASE
    )
    if err_match:
        error_type = err_match.group(1).strip()

   
    correction = re.sub(r'([.!?])(?=[A-Za-z])', r'\1 ', correction)
    correction = re.sub(r'\s+', ' ', correction).strip()
    error_type = re.sub(r'\s+', ' ', error_type).strip()

    return correction, error_type


def correct_grammar(text: str):
   
    input_text = "correct and identify error: " + text.strip()

    inputs = tokenizer(
        input_text,
        return_tensors="pt",
        truncation=True,
        max_length=128
    ).to(device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=128,
            num_beams=5,
            early_stopping=True,
            no_repeat_ngram_size=2
        )

    raw_output = tokenizer.decode(outputs[0], skip_special_tokens=True)

    print("\n==========================")
    print("INPUT TEXT:", input_text)
    print("RAW MODEL OUTPUT:", raw_output)

    corrected, error_type = extract_fields(raw_output)

    if corrected == "Unknown" or corrected.strip() == "":
        corrected = raw_output.strip()

    if error_type == "Unknown" or error_type.strip() == "":
        error_type = "Unknown"

    print("FINAL CORRECTED:", corrected)
    print("ERROR TYPE:", error_type)
    print("==========================\n")

    return corrected, error_type