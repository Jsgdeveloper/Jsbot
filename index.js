// Import library
const { Client, Intents, MessageEmbed } = require('discord.js');
const express = require('express');
const translate = require('@vitalets/google-translate-api');
const app = express();
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const prefix = '!';
const userData = {};
const adminId = '1250940447325421663'; // Ganti dengan ID pengguna pemilik bot
const PORT = process.env.PORT || 3000;

const triviaQuestions = [
    { question: "Apa ibu kota Prancis?", answer: "Paris" },
    { question: "Siapa penulis 'Harry Potter'?", answer: "J.K. Rowling" },
    { question: "Berapa banyak planet di tata surya?", answer: "8" },
];

// Event saat bot siap digunakan
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Rute untuk halaman utama
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Fungsi untuk meningkatkan level pengguna
const levelUp = (userId) => {
    if (!userData[userId]) {
        userData[userId] = { level: 1, experience: 0, coins: 0, jsmoney: 0 };
    }
    userData[userId].experience += 10; // Tambah pengalaman
    // Cek apakah pengguna naik level
    if (userData[userId].experience >= 100) {
        userData[userId].level++;
        userData[userId].experience = 0; // Reset pengalaman
    }
};

// Event saat pesan diterima
client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(prefix)) return;

    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Perintah !help
    if (command === 'help') {
        const helpMessage = `
            Daftar perintah:
            !help - Menampilkan daftar perintah
            !info - Menampilkan informasi tentang bot
            !ping - Menampilkan waktu respons bot
            !slot <taruhan> - Memainkan game slot dengan taruhan
            !gacha - Membeli item secara acak
            !trade <user> <item> - Menukar item dengan pengguna lain
            !inventory - Menampilkan daftar item yang dimiliki
            !quest - Menerima quest dan mendapatkan reward
            !achievement - Menampilkan daftar achievement yang telah dicapai
            !leaderboard - Menampilkan daftar pengguna dengan skor tertinggi
            !level - Menampilkan level dan pengalaman Anda
            !trivia - Menjawab pertanyaan trivia
            !guess <angka> - Menebak angka
            !daily - Mengklaim hadiah harian
            !profile - Menampilkan profil pengguna
            !addmoney <user> <amount> - Menambahkan jsmoney ke pengguna (admin hanya)
            !transfer <user> <amount> - Mentransfer jsmoney ke pengguna lain
            !translate <bahasa> <teks> - Menerjemahkan teks ke bahasa yang diinginkan
        `;
        msg.reply(helpMessage);
    }

    // Perintah !profile
    else if (command === 'profile') {
        if (!userData[msg.author.id]) {
            userData[msg.author.id] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
        }
        const profileMessage = `**${msg.author.username}**\nLevel: ${userData[msg.author.id].level} (Experience: ${userData[msg.author.id].experience}/100)\nCoins: ${userData[msg.author.id].coins}\nJSMoney: ${userData[msg.author.id].jsmoney}\nInventory: ${userData[msg.author.id].inventory.join(', ') || 'Kosong'}`;
        const profileEmbed = new MessageEmbed()
            .setDescription(profileMessage)
            .setImage(msg.author.avatarURL())
            .setColor('BLUE');
        msg.reply({ embeds: [profileEmbed] });
    }

    // Perintah !addmoney
    else if (command === 'addmoney') {
        if (msg.author.id !== adminId) {
            return msg.reply("Hanya pemilik bot yang dapat menambahkan jsmoney!");
        }
        const userId = args[0].replace(/[<@!>]/g, ''); // Menghapus karakter yang tidak perlu
        const amount = parseInt(args[1]);
        if (!userData[userId]) {
            userData[userId] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
        }
        userData[userId].jsmoney += amount;
        msg.reply(`JSMoney telah ditambahkan ke pengguna ${userId}!`);
    }

    // Perintah !transfer
    else if (command === 'transfer') {
        const userId = args[0].replace(/[<@!>]/g, ''); // Menghapus karakter yang tidak perlu
        const amount = parseInt(args[1]);
        if (!userData[msg.author.id] || !userData[userId]) {
            return msg.reply("Pengguna tidak ditemukan!");
        }
        if (userData[msg.author.id].jsmoney < amount) {
            return msg.reply("JSMoney Anda tidak cukup!");
        }
        userData[msg.author.id].jsmoney -= amount;
        userData[userId].jsmoney += amount;
        msg.reply(`JSMoney telah ditransfer ke pengguna ${userId}!`);
    }

    // Perintah !translate
    else if (command === 'translate') {
        const language = args[0];
        const text = args.slice(1).join(' ');
        translate(text, { to: language }).then(res => {
            msg.reply(`Terjemahan: ${res.text}`);
        }).catch(err => {
            msg.reply("Terjadi kesalahan saat menerjemahkan!");
        });
    }

    // Perintah !slot
    else if (command === 'slot') {
        const betAmount = parseInt(args[0]);
        if (!userData[msg.author.id] || userData[msg.author.id].jsmoney < betAmount) {
            return msg.reply("JSMoney Anda tidak cukup!");
        }
        const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '🍀'];
        const result = [];
        
        // Menghasilkan 3 simbol acak
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * symbols.length);
            result.push(symbols[randomIndex]);
        }

        const slotMessage = `Hasil slot: ${result.join(' ')}\n`;
        if (result[0] === result[1] && result[1] === result[2]) {
            userData[msg.author.id].jsmoney += betAmount * 2; // Membayar kemenangan
            msg.reply(`${slotMessage}Selamat! Anda menang! 🎉`);
        } else {
            userData[msg.author.id].jsmoney -= betAmount; // Mengurangi taruhan
            msg.reply(`${slotMessage}Coba lagi! 😢`);
        }
    }

    // Perintah !gacha
    else if (command === 'gacha') {
        if (!userData[msg.author.id]) {
            userData[msg.author.id] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
        }
        const items = ['Sword', 'Shield', 'Potion', 'Armor', 'Ring'];
        const randomIndex = Math.floor(Math.random() * items.length);
        const item = items[randomIndex];
        userData[msg.author.id].inventory.push(item);
        msg.reply(`Anda mendapatkan item ${item}!`);
    }

    // Perintah !trade
    else if (command === 'trade') {
        const userId = args[0].replace(/[<@!>]/g, ''); // Menghapus karakter yang tidak perlu
        const item = args[1];
        if (!userData[msg.author.id] || !userData[userId]) {
            return msg.reply("Pengguna tidak ditemukan!");
        }
        if (!userData[msg.author.id].inventory.includes(item)) {
            return msg.reply("Anda tidak memiliki item tersebut!");
        }
        const index = userData[msg.author.id].inventory.indexOf(item);
        userData[msg.author.id].inventory.splice(index, 1);
        userData[userId].inventory.push(item);
        msg.reply(`Anda telah menukar item ${item} dengan pengguna ${userId}!`);
    }

    // Perintah !inventory
    else if (command === 'inventory') {
        if (!userData[msg.author.id]) {
            userData[msg.author.id] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
        }
        const inventoryMessage = `Inventory Anda: ${userData[msg.author.id].inventory.join (', ') || 'Kosong'}`;
        msg.reply(inventoryMessage);
    }

    // Perintah !quest
    else if (command === 'quest') {
        if (!userData[msg.author.id]) {
            userData[msg.author.id] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
        }
        const reward = 50;
        userData[msg.author.id].jsmoney += reward;
        msg.reply(`Quest selesai! Anda mendapatkan ${reward} JSMoney!`);
    }

    // Perintah !achievement
    else if (command === 'achievement') {
        if (!userData[msg.author.id]) {
            userData[msg.author.id] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
        }
        const achievements = ['First Quest', 'Level 5 Reached', 'First Trade'];
        const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
        msg.reply(`Anda telah mencapai achievement: ${randomAchievement}`);
    }

    // Perintah !leaderboard
    else if (command === 'leaderboard') {
        let leaderboardMessage = 'Leaderboard:\n';
        for (const userId in userData) {
            leaderboardMessage += `${client.users.cache.get(userId)?.username || 'Unknown'} - Level: ${userData[userId].level}, JSMoney: ${userData[userId].jsmoney}\n`;
        }
        msg.reply(leaderboardMessage);
    }

    // Perintah !level
    else if (command === 'level') {
        if (!userData[msg.author.id]) {
            userData[msg.author.id] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
        }
        const levelMessage = `Level: ${userData[msg.author.id].level} (Experience: ${userData[msg.author.id].experience}/100)`;
        msg.reply(levelMessage);
    }

    // Perintah !trivia
    else if (command === 'trivia') {
        const randomQuestion = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
        msg.reply(randomQuestion.question);

        const filter = m => m.author.id === msg.author.id;
        const collector = msg.channel.createMessageCollector({ filter, time: 15000 });

        collector.on('collect', m => {
            if (m.content.toLowerCase() === randomQuestion.answer.toLowerCase()) {
                msg.reply("Jawaban benar!");
                collector.stop();
            } else {
                msg.reply("Jawaban salah, coba lagi!");
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                msg.reply("Waktu habis! Jawabannya adalah " + randomQuestion.answer);
            }
        });
    }

    // Perintah !guess
    else if (command === 'guess') {
        const randomNumber = Math.floor(Math.random() * 10) + 1;
        msg.reply("Coba tebak angka antara 1 dan 10!");

        const filter = m => m.author.id === msg.author.id;
        const collector = msg.channel.createMessageCollector({ filter, time: 15000 });

        collector.on('collect', m => {
            const guess = parseInt(m.content);
            if (guess === randomNumber) {
                msg.reply("Tebakan benar!");
                collector.stop();
            } else {
                msg.reply("Salah, coba lagi!");
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                msg.reply("Waktu habis! Angka yang benar adalah " + randomNumber);
            }
        });
    }

    // Perintah !daily
    else if (command === 'daily') {
        if (!userData[msg.author.id]) {
            userData[msg.author.id] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
        }
        const dailyReward = 100;
        userData[msg.author.id].jsmoney += dailyReward;
        msg.reply(`Anda mendapatkan hadiah harian sebesar ${dailyReward} JSMoney!`);
    }

    // Perintah !ping
    else if (command === 'ping') {
        msg.reply('Pong! ' + client.ws.ping + 'ms');
    }

    // Perintah !info
    else if (command === 'info') {
        msg.reply('Bot ini dibuat untuk bersenang-senang di server Discord. Nikmati fitur-fitur game dan quiz!');
    }

    // Tambahkan logika untuk perintah lainnya sesuai kebutuhan
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});

// Login ke Discord
client.login(process.env.DISCORD_TOKEN);
