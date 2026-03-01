module.exports = {
    config: {
        name: "joinNoti",
        eventType: ["log:subscribe"],
        version: "1.0.0",
        credits: "SARDAR RDX",
        description: "Send message when bot joins group and notify admin"
    },

    async run({ api, event, Threads }) {
        try {
            const fs = require('fs-extra');
            const path = require('path');
            const os = require('os');
            const moment = require('moment-timezone');
            const { threadID, logMessageData } = event;
            const config = global.config || require('../../config.json');
            const NOTIFY_GROUP = config.NOTIFY_TID || "9127321610634774"; 
            
            if (logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
                const botnick = config.BOTNICK || config.BOTNAME || "bot";
                
                try {
                    await api.changeNickname(botnick, threadID, api.getCurrentUserID());
                } catch (e) {
                    console.log("Nickname error:", e.message);
                }

                let threadName = "Unknown Group";
                try {
                    const info = await api.getThreadInfo(threadID);
                    threadName = info.threadName || "Unknown Group";
                } catch (e) {}

                const msg1 = "Hello Everyone🙋‍♂️ 𝐁𝐨𝐭 𝐢𝐬 𝐍𝐨𝐰 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝⛓️";
                const msg2 = `┏━━━━ ⚡ 𝐑𝐃𝐗 𝐁𝐎𝐓 ⚡ ━━━━┓
┃
┃   🌹 ꧁ 𝐒𝐀𝐑𝐃𝐀𝐑 𝐑𝐃𝐗 ꧂ 🌹
┃
┃   ✨ 𝐒𝐘𝐒𝐓𝐄𝐌 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 ✨
┃
┃ 🕊️ 𝑴𝒚 𝑶𝒘𝒏𝒆𝒓 𝒊𝒔 𝑴𝒓 𝑺𝒂𝒓𝒅𝒂𝒓 𝑹𝑫𝑿...
┃ 📱 𝑰𝒔𝒔𝒖𝒆𝒔? 𝑻𝒚𝒑𝒆: ${config.PREFIX}call
┃
┃ 👑 【 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎 】 👑
┃ 👤 𝐍𝐚𝐦𝐞: Sardar RDX
┃ 🌐 𝐈𝐃: fb.com/Sardar.RDX.786
┃ 📞 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩: +923301068874
┃ ✈️ 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: @SardarRDX7
┃
┃ ⚠️ 【 𝐈𝐌𝐏𝐎𝐑𝐓𝐀𝐍𝐓 】 ⚠️
┃ 📍 Bot ID active for 5 days.
┃ 📍 Add developer to keep bot.
┃ 📍 Contact for custom bots.
┃
┃ 💖 𝑻𝒉𝒂𝒏𝒌𝒔 𝑭𝒐𝒓 𝑼𝒔𝒊𝒏𝒈 𝑹𝑫𝑿 𝑩𝒐𝒕
┃
┗━━━━━━━━━━━━━━━━━━━┛
      🎀🧸🌸 𝐒𝐀𝐑𝐃𝐀𝐑 𝐑𝐃𝐗 🌸🧸🎀`;

                const videoPath = path.join(__dirname, "cache", "botjoin.mp4");

                try { await api.sendMessage(msg1, threadID); } catch {}
                await new Promise(resolve => setTimeout(resolve, 2000)); 

                try {
                    if (fs.existsSync(videoPath)) {
                        await api.sendMessage({
                            body: msg2,
                            attachment: fs.createReadStream(videoPath)
                        }, threadID);
                    } else {
                        await api.sendMessage(msg2, threadID);
                    }
                } catch (err) {
                    console.log("Video send error:", err.message);
                    try { await api.sendMessage(msg2, threadID); } catch {}
                }

                // Admin Notification with Health Info
                const uptime = process.uptime();
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                
                const freeMem = os.freemem();
                const totalMem = os.totalmem();
                const ramUsage = ((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(2);
                const ramTotal = (totalMem / 1024 / 1024 / 1024).toFixed(2);

                const adminMsg = `╭─────────────────╮̩̩̩̩̩̩̩̩\n` +
                                  `│ 🟢 BOT ADDED TO GROUP \n` +
                                  `├─────────────────┤\n` +
                                  `│ 🏠 Group: ${threadName}\n` +
                                  `│ 🆔 TID: ${threadID}\n` +
                                  `├─────────────────┤\n` +
                                  `│ 📊 [ Bot Health ]\n` +
                                  `│ ⏳ Uptime: ${hours}h ${minutes}m\n` +
                                  `│ 🧠 RAM: ${ramUsage}GB / ${ramTotal}GB\n` +
                                  `│ 🚀 Status: Healthy\n` +
                                  `│ ⏰ ${moment().tz('Asia/Karachi').format('hh:mm:ss A')}\n` +
                                  `╰─────────────────╯`;
                try {
                    await api.sendMessage(adminMsg, NOTIFY_GROUP);
                } catch (err) {
                    console.log("Admin notification error:", err.message);
                }
            }
        } catch (globalErr) {
            console.log("Global joinNoti error:", globalErr.message);
        }
    }
};

