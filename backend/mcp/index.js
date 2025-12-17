const { buildContext } = require("./context");
const { buildRules } = require("./rules");
const { runAgent } = require("./agent");

async function MCP(userId, message) {
  const context = await buildContext(userId);

  if (!context) {
    return "Bot belum aktif. Silakan lengkapi profil bisnis terlebih dahulu.";
  }

  const rules = buildRules();

  return await runAgent({
    context,
    rules,
    message,
  });
}

module.exports = MCP;
