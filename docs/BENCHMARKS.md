**# Benchmarks**

| Document | Pages | Stage | Seconds | Peak RAM (MB) |
|---|---:|---|---:|---:|
| Synthetic text PDF | 50 | extraction | 0.18 | 40.11 |
| Synthetic text PDF | 300 | extraction | 0.48 | 40.80 |
| Synthetic text PDF | 1000 | extraction | 1.13 | 41.64 |
| CN_CIC307_Handbook_Unit1_2.pdf.pdf | 50 | extraction | 0.12 | 37.53 |

## Observations

- The opening and ending look sensible: page 1 begins with the handbook title, and the final chunk ends with the complete U2-Q32 question. The table of contents on page 2 is also extracted, including dot leaders, so front matter may appear in search results.
- A running header is repeated throughout the handbook (`Computer Networks (CIC-307) | GGSIPU B.Tech IT | Unit I & II Handbook | Page … | Q&A format …`). It adds noise to chunks; page numbers are embedded in that header rather than appearing as separate lines.
- Tables are flattened into a single text stream. For example, the Stop-and-Wait / Go-Back-N / Selective Repeat comparison on page 28 loses clear column alignment, and its rows continue across the page 27–28 boundary.
- Some chunks start or end mid-sentence or mid-value. Page 20 chunk 1 starts with “up end-to-end” and splits the crosspoint calculation; page 49 chunks split the sliding-window question. Neighboring chunks overlap these boundaries, preserving some context but repeating text.
- The page 20 crosspoint example extracts `1000 x 1000 needs 106`; the intended exponent or superscript appears to be lost or flattened. Numeric and table-heavy content should be checked against the source PDF before relying on it.
