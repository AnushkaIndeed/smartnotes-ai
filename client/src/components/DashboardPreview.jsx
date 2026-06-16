export default function DashboardPreview() {
  const notes = [
    "📄 DBMS Revision",
    "📄 Computer Networks",
    "📄 RAG Architecture",
    "📄 Interview Prep"
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr 360px",
        minHeight: "500px",
        borderRadius: "24px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "#0f172a",
        boxShadow: "0 20px 80px rgba(0,0,0,0.4)",
      }}
    >
      {/* LEFT SIDEBAR */}
      <div
        style={{
          padding: "24px",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h4
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            letterSpacing: "1px",
            marginBottom: "20px",
          }}
        >
          NOTES
        </h4>

        {notes.map((note, index) => (
          <div
            key={note}
            style={{
              padding: "12px 16px",
              marginBottom: "10px",
              borderRadius: "12px",
              background:
                index === 2
                  ? "rgba(20,184,166,0.15)"
                  : "transparent",
              color: index === 2 ? "#14b8a6" : "#cbd5e1",
              border:
                index === 2
                  ? "1px solid rgba(20,184,166,0.3)"
                  : "none",
            }}
          >
            {note}
          </div>
        ))}

        <h4
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            letterSpacing: "1px",
            marginTop: "32px",
            marginBottom: "20px",
          }}
        >
          PDFS
        </h4>

        <div style={{ color: "#cbd5e1", marginBottom: "12px" }}>
          📑 DBMS_Notes.pdf
        </div>

        <div style={{ color: "#cbd5e1" }}>
          📑 CN_Syllabus.pdf
        </div>
      </div>

      {/* EDITOR */}
      <div
        style={{
          padding: "40px",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              color: "#f8fafc",
              fontSize: "36px",
              margin: 0,
            }}
          >
            RAG Architecture
          </h2>

          <span
            style={{
              color: "#14b8a6",
              fontWeight: "600",
            }}
          >
            ● SAVED
          </span>
        </div>

        <div
          style={{
            color: "#cbd5e1",
            lineHeight: 1.8,
            fontSize: "18px",
          }}
        >
          <p>
            1. Retrieve relevant chunks from notes and PDFs.
          </p>

          <p>
            2. Inject retrieved context into the Gemini prompt.
          </p>

          <p>
            3. Generate answers grounded in your own data.
          </p>

          <p>
            This allows SmartNotes AI to answer questions
            using your notes instead of generic training
            data.
          </p>
        </div>
      </div>

      {/* CHAT */}
      <div
        style={{
          padding: "24px",
        }}
      >
        <h4
          style={{
            color: "#94a3b8",
            marginBottom: "24px",
          }}
        >
          AI ASSISTANT
        </h4>

        <div
          style={{
            background: "#1e293b",
            color: "#fff",
            padding: "16px",
            borderRadius: "16px",
            marginBottom: "16px",
            marginLeft: "40px",
          }}
        >
          What is RAG?
        </div>

        <div
          style={{
            background: "rgba(20,184,166,0.15)",
            border: "1px solid rgba(20,184,166,0.2)",
            color: "#d1fae5",
            padding: "16px",
            borderRadius: "16px",
            marginRight: "40px",
          }}
        >
          RAG retrieves relevant information from your notes
          and PDFs, then provides that context to Gemini so
          answers are based on your own content.
        </div>
      </div>
    </div>
  );
}