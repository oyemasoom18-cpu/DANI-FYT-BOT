module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'ping',
    aliases: ['p', 'latency'],
    description: "Check bot response speed and latency.",
    usage: 'ping',
    category: 'Utility',
    prefix: true
  },
  
  async run({ api, event, send }) {
    const start = Date.now();
    
    const info = await send.reply('Pinging...');
    
    const latency = Date.now() - start;
    
    api.editMessage(`Pong! 🏓
─────────────────
Latency: ${latency}ms`, info.messageID);
  }
};

