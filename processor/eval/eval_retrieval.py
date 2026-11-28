"""Measure retrieval quality: does the right page appear in the top results?

    python eval/eval_retrieval.py eval/questions.json --doc-id real1 --user-id user-a
"""
import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import embedder  # noqa: E402
from vectorstore import get_client, search  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("questions")
    parser.add_argument("--doc-id", required=True)
    parser.add_argument("--user-id", required=True)
    args = parser.parse_args()

    questions = json.loads(Path(args.questions).read_text(encoding="utf-8"))
    scored = [q for q in questions if q["pages"]]
    probes = [q for q in questions if not q["pages"]]

    client = get_client()
    embedder.get_model()  # load before timing

    hits = {1: 0, 3: 0, 5: 0}
    reciprocal_ranks = 0.0
    latencies = []

    for q in scored:
        t0 = time.perf_counter()
        vec = embedder.embed_texts([q["question"]])[0]
        results = search(client, vec, args.user_id, [args.doc_id], top_k=10)
        latencies.append((time.perf_counter() - t0) * 1000)

        pages = [r["page"] for r in results]
        rank = next((i for i, p in enumerate(pages, 1) if p in q["pages"]), None)
        for k in hits:
            if rank is not None and rank <= k:
                hits[k] += 1
        reciprocal_ranks += 1 / rank if rank else 0

        mark = "OK  " if rank and rank <= 5 else "MISS"
        top = ", ".join(f"p{r['page']}({r['score']:.2f})" for r in results[:3])
        print(f"{mark} rank={rank or '-':>3}  expected={q['pages']}  top3: {top}  | {q['question'][:55]}")

    n = len(scored)
    print("\n--- results ---")
    print(f"questions scored: {n}")
    for k in (1, 3, 5):
        print(f"hit@{k}: {hits[k]}/{n} = {hits[k] / n:.0%}")
    print(f"MRR: {reciprocal_ranks / n:.3f}")
    print(f"avg embed+search: {sum(latencies) / n:.0f} ms")

    if probes:
        print("\n--- 'no answer' probes (top score = what a miss looks like) ---")
        for q in probes:
            vec = embedder.embed_texts([q["question"]])[0]
            top = search(client, vec, args.user_id, [args.doc_id], top_k=1)
            if top:
                print(f"p{top[0]['page']} score={top[0]['score']:.2f}  | {q['question'][:60]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())