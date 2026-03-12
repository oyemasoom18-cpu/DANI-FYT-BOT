const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'lockgroup',
    aliases: ['lock', 'lockgc', 'gclock'],
    description: "Lock group name, image, or settings (admin only).",
    usage: 'lockgroup [name/emoji/theme/image/all/gcnamelock] [on/off/name]',
    category: 'Group',
    groupOnly: true,
    prefix: true,
    adminOnly: true
  },

  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID } = event;

    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    // NO ADMIN CHECK - Anyone can lock group!
    const settings = Threads.getSettings(threadID);
    const target = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();

    // Handle .gcnamelock command specially
    if (target === 'gcnamelock' || target === 'gcname') {
      if (action && action !== 'off' && action !== 'disable') {
        // Lock with custom name provided
        const customName = args.slice(1).join(' ');
        Threads.setSettings(threadID, {
          lockName: true,
          originalName: customName,
          customLockedName: customName
        });
        return send.reply(`✅ Group Name Locked!\n\nNew Name: ${customName}\n\nNo one can change the name until you turn it off.`);
      } else if (action === 'off' || action === 'disable') {
        // Lock with current group name
        Threads.setSettings(threadID, {
          lockName: false,
          originalName: null,
          customLockedName: null
        });
        return send.reply('✅ Group Name Lock DISABLED!\n\nNow anyone can change the name.');
      } else {
        // No name provided - lock with current name
        const currentName = threadInfo.threadName || 'Group';
        Threads.setSettings(threadID, {
          lockName: true,
          originalName: currentName,
          customLockedName: currentName
        });
        return send.reply(`✅ Group Name Locked!\n\nCurrent Name: ${currentName}\n\nNo one can change the name until you turn it off.`);
      }
    }

    if (!target) {
      return send.reply(`╔════════════════════════════╗
║     🔒 LOCK SETTINGS 🔒    
╠════════════════════════════╣
║ Name Lock   : ${settings.lockName ? '✅ ON' : '❌ OFF'}
║ Emoji Lock  : ${settings.lockEmoji ? '✅ ON' : '❌ OFF'}
║ Theme Lock  : ${settings.lockTheme ? '✅ ON' : '❌ OFF'}
║ Image Lock  : ${settings.lockImage ? '✅ ON' : '❌ OFF'}
╠════════════════════════════╣
║ 📝 Commands:
║ • lockgroup all on/off
║ • lockgroup name/emoji/theme/image on/off
║ • gcnamelock - Lock current name
║ • gcnamelock [name] - Lock custom
║ • gcnamelock off - Unlock
╚════════════════════════════╝`);
    }

    const enable = action === 'on' || action === 'enable' || action === 'true';

    if (target === 'name') {
      Threads.setSettings(threadID, {
        lockName: enable,
        originalName: enable ? threadInfo.threadName : null,
        customLockedName: enable ? threadInfo.threadName : null
      });
      return send.reply(`╔════════════════════════════╗
║   ${enable ? '✅' : '❌'} NAME LOCK ${enable ? 'ENABLED' : 'DISABLED'}   
║
║ 📝 ${threadInfo.threadName}
╚════════════════════════════╝`);
    }

    if (target === 'emoji') {
      Threads.setSettings(threadID, {
        lockEmoji: enable,
        originalEmoji: enable ? threadInfo.emoji : null
      });
      return send.reply(`╔════════════════════════════╗
║   ${enable ? '✅' : '❌'} EMOJI LOCK ${enable ? 'ENABLED' : 'DISABLED'}   
║
║ 😃 ${threadInfo.emoji || 'None'}
╚════════════════════════════╝`);
    }

    if (target === 'theme' || target === 'color') {
      const currentTheme = threadInfo.color || threadInfo.threadThemeID || null;
      Threads.setSettings(threadID, {
        lockTheme: enable,
        originalTheme: enable ? currentTheme : null
      });
      return send.reply(`╔════════════════════════════╗
║   ${enable ? '✅' : '❌'} THEME LOCK ${enable ? 'ENABLED' : 'DISABLED'}   
╚════════════════════════════╝`);
    }

    if (target === 'image' || target === 'photo' || target === 'pic') {
      if (enable) {
        const imageUrl = threadInfo.imageSrc;
        if (imageUrl) {
          try {
            const cacheDir = path.join(__dirname, '../cache/lockgroup');
            fs.ensureDirSync(cacheDir);

            // Delete old cached image if exists
            const oldImagePath = path.join(cacheDir, `${threadID}_image.jpg`);
            if (fs.existsSync(oldImagePath)) {
              fs.removeSync(oldImagePath);
              console.log(`[LOCKGROUP] Old cached image deleted for thread ${threadID}`);
            }

            const imagePath = path.join(cacheDir, `${threadID}_image.jpg`);
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(imagePath, Buffer.from(response.data));
            console.log(`[LOCKGROUP] New image saved to cache: ${imagePath}`);

            Threads.setSettings(threadID, {
              lockImage: true,
              originalImagePath: imagePath
            });
            return send.reply(`╔════════════════════════════╗
║      ✅ IMAGE LOCK ENABLED     
╠════════════════════════════╣
║ 🖼️ Image saved to cache
║ 🔄 Will auto-restore on change
╚════════════════════════════╝`);
          } catch (err) {
            return send.reply('❌ Failed to save group image: ' + err.message);
          }
        } else {
          return send.reply('❌ No group image found to lock.');
        }
      } else {
        // Delete the cached image file when turning off lock
        const cacheImagePath = path.join(__dirname, '../cache/lockgroup', `${threadID}_image.jpg`);
        if (fs.existsSync(cacheImagePath)) {
          fs.removeSync(cacheImagePath);
        }
        Threads.setSettings(threadID, {
          lockImage: false,
          originalImagePath: null
        });
        return send.reply(`╔════════════════════════════╗
║      ❌ IMAGE LOCK DISABLED    
║   Cache file has been deleted
╚════════════════════════════╝`);
      }
    }

    if (target === 'all') {
      let imagePath = null;

      if (enable && threadInfo.imageSrc) {
        try {
          const cacheDir = path.join(__dirname, '../cache/lockgroup');
          fs.ensureDirSync(cacheDir);

          imagePath = path.join(cacheDir, `${threadID}_image.jpg`);
          const response = await axios.get(threadInfo.imageSrc, { responseType: 'arraybuffer' });
          fs.writeFileSync(imagePath, Buffer.from(response.data));
        } catch { }
      }

      const currentTheme = threadInfo.color || threadInfo.threadThemeID || null;

      Threads.setSettings(threadID, {
        lockName: enable,
        lockEmoji: enable,
        lockTheme: enable,
        lockImage: enable,
        originalName: enable ? threadInfo.threadName : null,
        originalEmoji: enable ? threadInfo.emoji : null,
        originalTheme: enable ? currentTheme : null,
        originalImagePath: enable ? imagePath : null,
        customLockedName: enable ? threadInfo.threadName : null
      });

      return send.reply(`ALL LOCKS: ${enable ? 'ENABLED' : 'DISABLED'}
═══════════════════════
Name Lock: ${enable ? 'ON' : 'OFF'}
Emoji Lock: ${enable ? 'ON' : 'OFF'}
Theme Lock: ${enable ? 'ON' : 'OFF'}
Image Lock: ${enable ? 'ON' : 'OFF'}
═══════════════════════
${enable ? 'All original settings saved and will be restored if changed.' : ''}`);
    }

    return send.reply('Usage: lockgroup [name/emoji/theme/image/all/gcnamelock] [on/off/name]');
  }
};
