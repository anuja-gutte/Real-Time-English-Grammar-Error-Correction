# import torch
# from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
# import re

# device = "cuda" if torch.cuda.is_available() else "cpu"

# # replace with your saved model path
# MODEL_PATH = r"C:\Users\hp\Downloads\Model Trained1\Model Trained"

# tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
# model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH).to(device)
# model.eval()


# def extract_fields(output_text):
#     """
#     Extract corrected sentence + error type + correction type
#     from model output like:
#     'She goes to school. | Error Type: Subject-Verb Agreement | Correction Type: Verb Fix'
#     """

#     error_type = None
#     correction_type = None

#     # Extract Error Type
#     error_match = re.search(r'Error Type:\s*(.*?)(?:\||$)', output_text, re.IGNORECASE)
#     if error_match:
#         error_type = error_match.group(1).strip()

#     # Extract Correction Type
#     correction_match = re.search(r'Correction Type:\s*(.*?)(?:\||$)', output_text, re.IGNORECASE)
#     if correction_match:
#         correction_type = correction_match.group(1).strip()

#     # Extract corrected sentence only
#     corrected = re.split(
#         r'Correction:|Correction Type:|Error Type:',
#         output_text,
#         flags=re.IGNORECASE
#     )[0]
#     corrected = corrected.split("|")[0]

#     # Fix spacing
#     corrected = re.sub(r'([.!?])(?=[A-Za-z])', r'\1 ', corrected)

#     # Remove extra spaces
#     corrected = re.sub(r'\s+', ' ', corrected).strip()

#     return corrected, error_type, correction_type


# def guess_error_type(original, corrected):
#     """
#     Fallback error type detection if model doesn't provide one
#     """
#     o = original.lower().strip()
#     c = corrected.lower().strip()

#     if o == c:
#         return None

#     # Capitalization
#     if o.startswith("i ") and corrected.startswith("I "):
#         return "Capitalization Error"

#     # Subject-Verb Agreement
#     if " is " in o and " am " in c:
#         return "Subject-Verb Agreement"

#     if " was " in o and " were " in c:
#         return "Subject-Verb Agreement"

#     if " go " in o and " goes " in c:
#         return "Subject-Verb Agreement"

#     if " do " in o and " does " in c:
#         return "Subject-Verb Agreement"

#     # Verb Form
#     if "sleep" in o and "sleeping" in c:
#         return "Verb Form Error"

#     if "eat" in o and "eating" in c:
#         return "Verb Form Error"

#     # Contractions / informal grammar
#     if "aint" in o or "dont" in o or "cant" in o or "wont" in o:
#         return "Informal / Contraction Error"

#     # Article errors
#     if (" a " in o or " an " in o) and (" a " in c or " an " in c):
#         return "Article Usage Error"

#     # Tense
#     if "goed" in o and "went" in c:
#         return "Tense Error"

#     # General fallback
#     return "Grammar Error"


# def guess_correction_type(original, corrected):
#     """
#     Fallback correction type if model doesn't provide one
#     """
#     o = original.lower().strip()
#     c = corrected.lower().strip()

#     if o == c:
#         return None

#     if o.startswith("i ") and corrected.startswith("I "):
#         return "Punctuation & Capitalization Fix"

#     if " is " in o and " am " in c:
#         return "Verb Agreement Fix"

#     if " was " in o and " were " in c:
#         return "Agreement Fix"

#     if " go " in o and " goes " in c:
#         return "Verb Agreement Fix"

#     if " do " in o and " does " in c:
#         return "Verb Agreement Fix"

#     if "sleep" in o and "sleeping" in c:
#         return "Verb Form Fix"

#     if "eat" in o and "eating" in c:
#         return "Verb Form Fix"

#     if "aint" in o or "dont" in o or "cant" in o or "wont" in o:
#         return "Contraction Fix"

#     if "goed" in o and "went" in c:
#         return "Tense Fix"

#     return "Grammar Fix"


# def correct_grammar(text: str):
#     inputs = tokenizer(
#         text,
#         return_tensors="pt",
#         truncation=True,
#         max_length=512
#     ).to(device)

#     with torch.no_grad():
#         outputs = model.generate(
#             **inputs,
#             max_new_tokens=128,
#             num_beams=4
#         )

#     raw_output = tokenizer.decode(outputs[0], skip_special_tokens=True)

#     print("RAW MODEL OUTPUT:", raw_output)

#     corrected, error_type, correction_type = extract_fields(raw_output)

#     # Fallback if model doesn't provide labels
#     if not error_type:
#         error_type = guess_error_type(text, corrected)

#     if not correction_type:
#         correction_type = guess_correction_type(text, corrected)

#     print("FINAL CORRECTED:", corrected)
#     print("ERROR TYPE:", error_type)
#     print("CORRECTION TYPE:", correction_type)

#     return corrected, error_type, correction_type


import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import re

device = "cuda" if torch.cuda.is_available() else "cpu"

# Replace with your FINAL trained model path
MODEL_PATH = r"C:\Users\hp\Downloads\trained_model\bart_grammar_error_model"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH).to(device)
model.eval()


def extract_fields(output_text):
    """
    Extract corrected sentence and error type from model output.

    Expected model output format:
    Correction: She goes to school every day. Error Type: Verb & Tense
    """

    correction = "Unknown"
    error_type = "Unknown"

    # Extract correction
    corr_match = re.search(
        r'Correction:\s*(.*?)(?:Error Type:|$)',
        output_text,
        re.IGNORECASE
    )
    if corr_match:
        correction = corr_match.group(1).strip()

    # Extract error type
    err_match = re.search(
        r'Error Type:\s*(.*)',
        output_text,
        re.IGNORECASE
    )
    if err_match:
        error_type = err_match.group(1).strip()

    # Clean spacing
    correction = re.sub(r'([.!?])(?=[A-Za-z])', r'\1 ', correction)
    correction = re.sub(r'\s+', ' ', correction).strip()
    error_type = re.sub(r'\s+', ' ', error_type).strip()

    return correction, error_type


def correct_grammar(text: str):
    """
    Correct grammar + get error type directly from model
    """

    # IMPORTANT: Use same prompt as training
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

    # Fallback if model output is malformed
    if corrected == "Unknown" or corrected.strip() == "":
        corrected = raw_output.strip()

    if error_type == "Unknown" or error_type.strip() == "":
        error_type = "Unknown"

    print("FINAL CORRECTED:", corrected)
    print("ERROR TYPE:", error_type)
    print("==========================\n")

    return corrected, error_type