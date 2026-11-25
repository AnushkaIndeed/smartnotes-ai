import embedder

print("dimension:", embedder.dimension(), "| max tokens:", embedder.get_model().max_seq_length)

pairs = [
    ("How do I reset my password?", "I forgot my login credentials"),
    ("How do I reset my password?", "Banana bread needs ripe bananas"),
]
for a, b in pairs:
    va, vb = embedder.embed_texts([a, b])
    score = sum(x * y for x, y in zip(va, vb))  # vectors are normalised, so this is cosine
    print(f"{score:.3f}  {a!r}  vs  {b!r}")