import pdfplumber
import json
import os
import re

input_path = "pdfs/2025chapter2.pdf"
output_path = "2025chapter2.json" 

chunks = []
chunk_id = 0

with pdfplumber.open(input_path) as pdf:
    for page_num, page in enumerate(pdf.pages, start=1):  # 1-indexed pages
        text = page.extract_text()
        if text:
            flat_text = ' '.join(text.split('\n'))  # flatten lines
            flat_text = re.sub(r'\s{2,}', ' ', flat_text)
            sentences = re.split(r'(?<=[.!?])\s+', flat_text)

            buffer = ""
            for sentence in sentences:
                buffer += sentence.strip() + " "
                if len(buffer.split()) > 80:
                    chunks.append({
                        "chunk_id": chunk_id,
                        "source_page": page_num,
                        "text": buffer.strip()
                    })
                    chunk_id += 1
                    buffer = ""
            if buffer.strip():
                chunks.append({
                    "chunk_id": chunk_id,
                    "source_page": page_num,
                    "text": buffer.strip()
                })
                chunk_id += 1

os.makedirs("data", exist_ok=True)

with open(output_path, 'w') as f:
    json.dump(chunks, f, indent=2)

print(f"✅ Extracted {len(chunks)} chunks to {output_path}")

