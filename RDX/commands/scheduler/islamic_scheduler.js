/**
 * RDX Islamic Scheduler - Quran Ayats & Namaz Alerts
 * Separate file for Islamic scheduled messages
 */

const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const logs = require('../../../Data/utility/logs');

// Quran Pictures
const quranPics = [
    'https://i.ibb.co/8gWzFpqV/bbc9bf12376e.jpg',
    'https://i.ibb.co/DgGmLMTL/2a27f2cecc80.jpg',
    'https://i.ibb.co/Kz8CBZBD/db27a4756c35.jpg',
    'https://i.ibb.co/zTKnLMq9/c52345ec3639.jpg',
    'https://i.ibb.co/8gfGBHDr/8e3226ab3861.jpg',
    'https://i.ibb.co/WNK2Dbbq/ffed087e09a5.jpg',
    'https://i.ibb.co/hRVXMQhz/fe5e09877fa8.jpg'
];

// Namaz Pictures
const namazPics = [
    'https://i.ibb.co/sp39k0CY/e2630b0f2713.jpg',
    'https://i.ibb.co/BKdttjgN/8cd831a43211.jpg',
    'https://i.ibb.co/Q3hVDVMr/c0de33430ba4.jpg',
    'https://i.ibb.co/7td1kK7W/6d713bbe5418.jpg'
];

// Quran Ayats with translation
const quranAyats = [
    {
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        urdu: "اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے",
        surah: "Surah Al-Fatiha: 1"
    },
    {
        arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
        urdu: "بے شک مشکل کے ساتھ آسانی ہے",
        surah: "Surah Ash-Sharh: 6"
    },
    {
        arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
        urdu: "اور جو اللہ پر توکل کرے تو وہ اسے کافی ہے",
        surah: "Surah At-Talaq: 3"
    },
    {
        arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ",
        urdu: "پس تم مجھے یاد کرو میں تمہیں یاد کروں گا",
        surah: "Surah Al-Baqarah: 152"
    },
    {
        arabic: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ",
        urdu: "اور صبر کرو اور تمہارا صبر اللہ ہی کی توفیق سے ہے",
        surah: "Surah An-Nahl: 127"
    },
    {
        arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
        urdu: "بے شک اللہ صبر کرنے والوں کے ساتھ ہے",
        surah: "Surah Al-Baqarah: 153"
    },
    {
        arabic: "وَلَا تَيَأَسُوا مِن رَّوْحِ اللَّهِ",
        urdu: "اور اللہ کی رحمت سے مایوس نہ ہو",
        surah: "Surah Yusuf: 87"
    },
    {
        arabic: "رَبِّ اشْرَحْ لِي صَدْرِي",
        urdu: "اے میرے رب میرے سینے کو کھول دے",
        surah: "Surah Ta-Ha: 25"
    },
    {
        arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
        urdu: "اللہ ہمیں کافی ہے اور وہ بہترین کارساز ہے",
        surah: "Surah Al-Imran: 173"
    },
    {
        arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
        urdu: "اور کہو کہ اے میرے رب میرے علم میں اضافہ فرما",
        surah: "Surah Ta-Ha: 114"
    },
    {
        arabic: "إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ",
        urdu: "بے شک اللہ نیکی کرنے والوں کا اجر ضائع نہیں کرتا",
        surah: "Surah Yusuf: 90"
    },
    {
        arabic: "وَتُوبُوا إِلَى اللَّهِ جَمِيعًا أَيُّهَ الْمُؤْمِنُونَ",
        urdu: "اور اے مومنو تم سب اللہ کے حضور توبہ کرو",
        surah: "Surah An-Nur: 31"
    }
];

// Namaz Times
const namazTimes = {
    fajr: { time: '05:43', name: 'Fajr' },
    sunrise: { time: '07:04', name: 'Sunrise' },
    dhuhr: { time: '12:23', name: 'Dhuhr' },
    asr: { time: '16:07', name: 'Asr' },
    maghrib: { time: '17:43', name: 'Maghrib' },
    isha: { time: '19:04', name: 'Isha' }
};

let api = null;
let config = null;
let scheduledTasks = [];

// Download image helper
async function downloadImage(url, filePath) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
        fs.writeFileSync(filePath, Buffer.from(response.data));
        return true;
    } catch {
        return false;
    }
}

/**
 * Send Quran Ayat to all groups
 */
async function sendQuranAyat() {
    if (!api || !config.AUTO_ISLAMIC_POST) return;

    try {
        const threads = require('./Data/system/database/models/threads').getAll();
        const approvedThreads = threads.filter(t => t.banned !== 1);

        if (approvedThreads.length === 0) return;

        const randomAyat = quranAyats[Math.floor(Math.random() * quranAyats.length)];
        const randomPic = quranPics[Math.floor(Math.random() * quranPics.length)];
        const time = moment().tz('Asia/Karachi').format('hh:mm A');

        const message = `📖 𝐐𝐔𝐑𝐀𝐍 𝐀𝐘𝐀𝐓

${randomAyat.arabic}

𝐔𝐫𝐝𝐮 𝐓𝐫𝐚𝐧𝐬𝐥𝐚𝐭𝐢𝐨𝐧:
${randomAyat.urdu}

📍 ${randomAyat.surah}

🕌 ${config.BOTNAME} | ${time} PKT`.trim();

        const cacheDir = path.join(__dirname, 'RDX/commands/cache');
        fs.ensureDirSync(cacheDir);
        const imgPath = path.join(cacheDir, `quran_${Date.now()}.jpg`);

        const downloaded = await downloadImage(randomPic, imgPath);

        for (const thread of approvedThreads) {
            try {
                if (downloaded && fs.existsSync(imgPath)) {
                    await api.sendMessage({
                        body: message,
                        attachment: fs.createReadStream(imgPath)
                    }, thread.id);
                } else {
                    await api.sendMessage(message, thread.id);
                }
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                logs.error('QURAN_POST', `Failed to send to ${thread.id}:`, e.message);
            }
        }

        try { fs.unlinkSync(imgPath); } catch { }
        logs.success('QURAN_POST', `Sent Quran Ayat to ${approvedThreads.length} groups`);
    } catch (error) {
        logs.error('QURAN_POST', error.message);
    }
}

/**
 * Send Namaz Alert to all groups
 */
async function sendNamazAlert(namazName) {
    if (!api) return;

    try {
        const threads = require('./Data/system/database/models/threads').getAll();
        const approvedThreads = threads.filter(t => t.banned !== 1);

        if (approvedThreads.length === 0) return;

        const randomPic = namazPics[Math.floor(Math.random() * namazPics.length)];
        const time = moment().tz('Asia/Karachi').format('hh:mm A');

        const message = `🕌 𝐍𝐀𝐌𝐀𝐙 𝐀𝐋𝐄𝐑𝐓

⏰ ${namazName.toUpperCase()} کا وقت ہو گیا!

"إِنَّ الصَّلَاةَ كَانَتْ عَلَى 
الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا"

بے شک نماز مومنوں پر وقت 
مقررہ پر فرض ہے۔

📍 نماز پڑھیں - جنت کی چابی

🕌 ${config.BOTNAME} | ${time} PKT`.trim();

        const cacheDir = path.join(__dirname, 'RDX/commands/cache');
        fs.ensureDirSync(cacheDir);
        const imgPath = path.join(cacheDir, `namaz_${Date.now()}.jpg`);

        const downloaded = await downloadImage(randomPic, imgPath);

        for (const thread of approvedThreads) {
            try {
                if (downloaded && fs.existsSync(imgPath)) {
                    await api.sendMessage({
                        body: message,
                        attachment: fs.createReadStream(imgPath)
                    }, thread.id);
                } else {
                    await api.sendMessage(message, thread.id);
                }
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                logs.error('NAMAZ_ALERT', `Failed to send to ${thread.id}:`, e.message);
            }
        }

        try { fs.unlinkSync(imgPath); } catch { }
        logs.success('NAMAZ_ALERT', `Sent ${namazName} alert to ${approvedThreads.length} groups`);
    } catch (error) {
        logs.error('NAMAZ_ALERT', error.message);
    }
}

/**
 * Stop all Islamic schedulers
 */
function stopIslamicSchedulers() {
    for (const task of scheduledTasks) {
        try {
            task.stop();
        } catch (e) { }
    }
    scheduledTasks = [];
    logs.info('ISLAMIC_SCHEDULER', 'All Islamic schedulers stopped');
}

/**
 * Start Islamic schedulers (Quran & Namaz)
 */
function startIslamicSchedulers() {
    // Stop existing schedulers first
    stopIslamicSchedulers();

    if (!config.AUTO_ISLAMIC_POST) {
        logs.info('ISLAMIC_SCHEDULER', 'Islamic posts are disabled in config');
        return;
    }

    // Hourly Quran Ayat
    const quranTask = cron.schedule('0 * * * *', () => {
        logs.info('SCHEDULER', 'Hourly Quran Ayat triggered');
        sendQuranAyat();
    }, {
        timezone: 'Asia/Karachi'
    });
    scheduledTasks.push(quranTask);

    // Fajr Namaz Alert - 5:43 AM
    const fajrTask = cron.schedule('43 5 * * *', () => {
        logs.info('SCHEDULER', 'Fajr Namaz Alert');
        sendNamazAlert('Fajr');
    }, { timezone: 'Asia/Karachi' });
    scheduledTasks.push(fajrTask);

    // Dhuhr Namaz Alert - 12:23 PM
    const dhuhrTask = cron.schedule('23 12 * * *', () => {
        logs.info('SCHEDULER', 'Dhuhr Namaz Alert');
        sendNamazAlert('Dhuhr');
    }, { timezone: 'Asia/Karachi' });
    scheduledTasks.push(dhuhrTask);

    // Asr Namaz Alert - 4:07 PM
    const asrTask = cron.schedule('7 16 * * *', () => {
        logs.info('SCHEDULER', 'Asr Namaz Alert');
        sendNamazAlert('Asr');
    }, { timezone: 'Asia/Karachi' });
    scheduledTasks.push(asrTask);

    // Maghrib Namaz Alert - 5:43 PM
    const maghribTask = cron.schedule('43 17 * * *', () => {
        logs.info('SCHEDULER', 'Maghrib Namaz Alert');
        sendNamazAlert('Maghrib');
    }, { timezone: 'Asia/Karachi' });
    scheduledTasks.push(maghribTask);

    // Isha Namaz Alert - 7:04 PM
    const ishaTask = cron.schedule('4 19 * * *', () => {
        logs.info('SCHEDULER', 'Isha Namaz Alert');
        sendNamazAlert('Isha');
    }, { timezone: 'Asia/Karachi' });
    scheduledTasks.push(ishaTask);

    logs.success('ISLAMIC_SCHEDULER', 'Quran Ayat + Namaz Alerts schedulers started');
}

/**
 * Initialize Islamic scheduler with API and config
 */
function initIslamicScheduler(botApi, botConfig) {
    api = botApi;
    config = botConfig;
    startIslamicSchedulers();
}

module.exports = {
    initIslamicScheduler,
    startIslamicSchedulers,
    stopIslamicSchedulers,
    sendQuranAyat,
    sendNamazAlert
};
