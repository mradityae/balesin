const { generateGemini } = require("../ai/gemini");

async function runAgent({ context, rules, message, isFirstMessage }) {
  let prompt;

  if (isFirstMessage) {
    prompt = `
Kamu adalah customer service WhatsApp.

${context}

${rules}

TUGAS:
- Sambut pelanggan
- Perkenalkan bisnis
- Jelaskan semua produk secara ringkas
- Jangan menunggu pertanyaan
`.trim();
  } else {
    prompt = `
Kamu adalah customer service WhatsApp.

${context}

${rules}

Pertanyaan pelanggan:
${message}
`.trim();
  }

  return await generateGemini(prompt);
}

module.exports = { runAgent };
