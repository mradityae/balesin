const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

async function generateGemini(prompt) {
  const res = await fetch(OPENROUTER_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://your-app.local",
      "X-Title": "Finance WhatsApp Bot"
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    })
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("OpenRouter error:", data);
    throw new Error("OpenRouter API failed");
  }

  return (
    data?.choices?.[0]?.message?.content ||
    "Maaf, saya belum bisa menjawab pertanyaan tersebut."
  );
}

module.exports = { generateGemini };
