module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'leave',
    eventType: 'log:unsubscribe',
    description: 'Goodbye messages and anti-out'
  },
  
  async run({ api, event, send, Users, Threads, config }) {
    const { threadID, logMessageData } = event;
    const leftParticipantFbId = logMessageData.leftParticipantFbId;
    const botID = api.getCurrentUserID();
    
    if (leftParticipantFbId === botID) return;
    
    const settings = await Threads.getSettings(threadID);
    
    let name = 'Member';
    try {
      const info = await api.getUserInfo(leftParticipantFbId);
      name = info[leftParticipantFbId]?.name || 'Member';
    } catch {}
    
    if (settings.antiout) {
      try {
        await api.addUserToGroup(leftParticipantFbId, threadID);
        return send.send(`🔒 ${name}, you can't leave! Anti-out is enabled.`, threadID);
      } catch {}
    }
    
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch {
      threadInfo = { participantIDs: [] };
    }
    
    const memberCount = threadInfo.participantIDs?.length || 0;
    const moment = require('moment-timezone');
    const leaveDate = moment().tz(config.TIMEZONE || 'Asia/Karachi').format('DD/MM/YYYY');
    const leaveTime = moment().tz(config.TIMEZONE || 'Asia/Karachi').format('hh:mm:ss A');

    let goodbyeMsg = `╭──〔❨✧✧❩〕──╮
  ✨ 𝐌𝐄𝐌𝐁𝐄𝐑 𝐋𝐄𝐅𝐓 ✨  
╰──〔❨✧✧❩〕──╯\n\n💔 Sad to see you go 💔\n ${name} \n${'꘏'.repeat(18)}\n\n👋 Goodbye Member 👋\n👤 Name: ${name}\n\n📊 Group Statistics 📊\n👥 Remaining: ${memberCount}\n📅 Date: ${leaveDate}\n🕐 Time: ${leaveTime}\n\n💡 Hope you'll come back! 💡\n🎉 Take care! 🎉`;
    
    const axios = require('axios');
    const GIF_URLS = [
      'https://i.ibb.co/d4G08M8d/342059a07400.gif',
      'https://i.ibb.co/cSNz3rdk/aa6428702cc9.gif'
    ];
    
    try {
      const randomGifUrl = GIF_URLS[Math.floor(Math.random() * GIF_URLS.length)];
      const response = await axios.get(randomGifUrl, { responseType: 'stream' });
      return api.sendMessage({
        body: goodbyeMsg,
        attachment: response.data
      }, threadID);
    } catch (err) {
      return api.sendMessage(goodbyeMsg, threadID);
    }
  }
};

