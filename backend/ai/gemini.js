
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";

const GEMINI_API =
  `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

async function generateGemini(prompt) {
  const res = await fetch(GEMINI_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Gemini error:", data);
    throw new Error("Gemini API failed");
  }

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Maaf, saya belum bisa menjawab pertanyaan tersebut."
  );
}

module.exports = { generateGemini };
