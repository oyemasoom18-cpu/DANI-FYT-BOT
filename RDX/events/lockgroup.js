const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'lockgroup',
    eventType: ['log:thread-image'],
    description: 'Auto restore locked group image'
  },

  async run({ api, event, Threads, logMessageType }) {
    const { threadID, author } = event;
    const settings = Threads.getSettings(threadID);
    const botID = api.getCurrentUserID();

    console.log(`[LOCKGROUP] Event triggered: ${logMessageType} for thread ${threadID}`);
    console.log(`[LOCKGROUP] lockImage setting: ${settings?.lockImage}`);
    console.log(`[LOCKGROUP] originalImagePath: ${settings?.originalImagePath}`);

    if (author === botID) {
      console.log('[LOCKGROUP] Event triggered by bot, skipping');
      return;
    }

    // Only handle image lock
    if (logMessageType === 'log:thread-image' && settings?.lockImage) {
      const originalImagePath = settings.originalImagePath;

      if (originalImagePath && fs.existsSync(originalImagePath)) {
        try {
          console.log('[LOCKGROUP] Image lock triggered, attempting to restore...');

          // First send the locked photo to the group
          await api.sendMessage({
            body: "🔒 **GROUP PHOTO LOCKED!**\n\n🖼️ This is your locked photo.\n\n⚠️ Group photo is locked! Don't change it again.",
            attachment: fs.createReadStream(originalImagePath)
          }, threadID);

          console.log('[LOCKGROUP] Locked photo sent to group');

          // Wait a bit then try to restore the group image
          await new Promise(resolve => setTimeout(resolve, 2000));

          try {
            // Try with stream
            await api.changeGroupImage(fs.createReadStream(originalImagePath), threadID);
            console.log('[LOCKGROUP] Group image restored via stream');
          } catch (streamErr) {
            console.log('[LOCKGROUP] Stream method failed, trying buffer:', streamErr.message);

            // Try with buffer as fallback
            try {
              const imageBuffer = fs.readFileSync(originalImagePath);
              await api.changeGroupImage(imageBuffer, threadID);
              console.log('[LOCKGROUP] Group image restored via buffer');
            } catch (bufferErr) {
              console.log('[LOCKGROUP] Buffer method also failed:', bufferErr.message);
            }
          }
        } catch (err) {
          console.log('[LOCKGROUP] Failed to restore image:', err.message);
          // At least send the photo to the group
          try {
            await api.sendMessage({
              body: "⚠️ **LOCK ALERT:** Group photo change detected!\n\n📷 Your locked photo has been sent above.\n\n⚠️ Could not auto-restore group image due to API error.",
              attachment: fs.createReadStream(originalImagePath)
            }, threadID);
          } catch (sendErr) {
            console.log('[LOCKGROUP] Failed to send photo:', sendErr.message);
          }
        }
      } else {
        console.log('[LOCKGROUP] Original image path not found or file does not exist');
        api.sendMessage(`⚠️ **LOCK ALERT:** Group photo change detected but locked photo file not found!\n\n⚠️ Group photo is locked! Please set the photo again using lockgroup image on command.`, threadID);
      }
    }
  }
};
