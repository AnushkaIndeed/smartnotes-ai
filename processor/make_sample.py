"""Generate a text-only PDF for testing.
Usage: python make_sample.py 300 samples/sample_300.pdf
"""
import sys

import pymupdf

pages = int(sys.argv[1])
out = sys.argv[2]

filler = (
    "Retrieval augmented generation grounds a language model in your own documents "
    "instead of its general training data. "
) * 14

doc = pymupdf.open()
for i in range(1, pages + 1):
    page = doc.new_page()
    page.insert_textbox(pymupdf.Rect(54, 54, 540, 780), f"Page {i}\n\n{filler}", fontsize=11)
doc.save(out)
print(f"wrote {out} ({pages} pages)")