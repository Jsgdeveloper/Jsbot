// Import library
const express = require('express');
const translate = require('@vitalets/google-translate-api');
const app = express();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Penting untuk mendeteksi konten pesan
    ]
});

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
        userData[userId] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
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
        const helpEmbed = new EmbedBuilder()
            .setTitle('📜 Daftar Perintah')
            .setDescription(`
                **!help** - Menampilkan daftar perintah
                **!info** - Menampilkan informasi tentang bot
                **!ping** - Menampilkan waktu respons bot
                **!slot <taruhan>** - Memainkan game slot dengan taruhan
                **!gacha** - Membeli item secara acak
                **!trade <user> <item>** - Menukar item dengan pengguna lain
                **!inventory** - Menampilkan daftar item yang dimiliki
                **!quest** - Menerima quest dan mendapatkan reward
                **!achievement** - Menampilkan daftar achievement yang telah dicapai
                **!leaderboard** - Menampilkan daftar pengguna dengan skor tertinggi
                **!level** - Menampilkan level dan pengalaman Anda
                **!trivia** - Menjawab pertanyaan trivia
                **!guess <angka>** - Menebak angka
                **!daily** - Mengklaim hadiah harian
                **!profile** - Menampilkan profil pengguna
                **!addmoney <user> <amount>** - Menambahkan jsmoney ke pengguna (admin hanya)
                **!transfer <user> <amount>** - Mentransfer jsmoney ke pengguna lain
                **!translate <bahasa> <teks>** - Menerjemahkan teks ke bahasa yang diinginkan
            `)
            .setColor('BLUE');
        msg.reply({ embeds: [helpEmbed] });
    }

    // Perintah !profile
    else if (command === 'profile') {
        if (!userData[msg.author.id]) {
            userData[msg.author.id] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
        }
        const profileEmbed = new EmbedBuilder()
            .setTitle(`👤 Profil ${msg.author.username}`)
            .setDescription(`
                **Level:** ${userData[msg.author.id].level} (Experience: ${userData[msg.author.id].experience}/100)
                **Coins:** ${userData[msg.author.id].coins}
                **JSMoney:** ${userData[msg.author.id].jsmoney}
                **Inventory:** ${userData[msg.author.id].inventory.join(', ') || 'Kosong'}
            `)
            .setThumbnail(msg.author.avatarURL())
            .setColor('GREEN');
        msg.reply({ embeds: [profileEmbed] });
    }

    // Perintah !addmoney
    else if (command === 'addmoney') {
        if (msg.author.id !== adminId) {
            return msg.reply("❌ Hanya pemilik bot yang dapat menambahkan jsmoney!");
        }
        const userId = args[0].replace(/[<@!>]/g, ''); // Menghapus karakter yang tidak perlu
        const amount = parseInt(args[1]);
        if (!userData[userId]) {
            userData[userId] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
        }
        userData[userId].jsmoney += amount;
        msg.reply(`✅ JSMoney telah ditambahkan ke pengguna <@${userId}>!`);
    }

    // Perintah !transfer
    else if (command === 'transfer') {
        const userId = args[0].replace(/[<@!>]/g, ''); // Menghapus karakter yang tidak perlu
        const amount = parseInt(args[1]);
        if (!userData[msg.author.id] || !userData[userId]) {
            return msg.reply("❌ Pengguna tidak ditemukan!");
        }
        if (userData[msg.author.id].jsmoney < amount) {
            return msg.reply("❌ JSMoney Anda tidak cukup!");
        }
        userData[msg.author.id].jsmoney -= amount;
        userData[userId].jsmoney += amount;
        msg.reply(`✅ JSMoney telah ditransfer ke pengguna <@${userId}>!`);
    }

    // Perintah !translate
    else if (command === 'translate') {
        const language = args[0];
        const text = args.slice(1).join(' ');
        translate(text, { to: language }).then(res => {
            msg.reply(`🌍 Terjemahan: ${res.text}`);
        }).catch(err => {
            msg.reply("❌ Terjadi kesalahan saat menerjemahkan.");
        });
    }

    // Perintah !ping
    else if (command === 'ping') {
        msg.reply('🏓 Pong!');
    }

    // Perintah !slot
    else if (command === 'slot') {
        const betAmount = parseInt(args[0]);
        if (!userData[msg.author.id] || userData[msg.author.id].jsmoney < betAmount) {
            return msg.reply("❌ JSMoney Anda tidak cukup!");
        }
        const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '🍀'];
        
        msg.reply('🔄 Memutar slot...').then(async message => {
            // Animasi berputar
            let loadingMessage = await message.edit('🔄 Memutar...');

            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // Menampilkan animasi berputar
            const spinningFrames = ['🔄 Memutar...', '🔄 Memutar...', '🔄 Memutar...'];
            for (const frame of spinningFrames) {
                await delay(500); // Delay setengah detik
                loadingMessage = await message.edit(frame);
            }

            // Tampilkan simbol satu per satu
            const result = [];
            for (let i = 0; i < 3; i++) {
                const randomIndex = Math.floor(Math.random() * symbols.length);
                await delay(1000); // Delay satu detik untuk menunjukkan setiap simbol
                loadingMessage = await message.edit(`Hasil slot: ${result.join(' ')}\n${symbols[randomIndex]}`);
                result.push(symbols[randomIndex]);
            }

            // Evaluasi hasil
            const uniqueResults = new Set(result);
            let resultMessage = `Hasil slot: ${result.join(' ')}\n`;
            if (uniqueResults.size === 1) { // Semua simbol sama
                userData[msg.author.id].jsmoney += betAmount * 2; // Membayar kemenangan
                resultMessage += `🎉 Selamat! Anda menang!`;
            } else if (uniqueResults.size === 2) { // Dua simbol sama
                userData[msg.author.id].jsmoney += betAmount; // Membayar setengah taruhan
                resultMessage += `🎊 Anda menang!`;
            } else { // Semua simbol berbeda
                userData[msg.author.id].jsmoney -= betAmount; // Mengurangi taruhan
                resultMessage += `😢 Coba lagi!`;
            }

            // Mengedit pesan akhir dengan format yang lebih baik
            const resultEmbed = new EmbedBuilder()
                .setTitle('🎰 Hasil Slot')
                .setDescription(resultMessage)
                .setColor('YELLOW');

            await message.edit({ content: null, embeds: [resultEmbed] });
        });
    }

    // Perintah !trivia
    else if (command === 'trivia') {
        const question = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
        const filter = response => response.author.id === msg.author.id;
        msg.channel.send(`🧠 Pertanyaan Trivia: ${question.question}`);

        const collector = msg.channel.createMessageCollector({ filter, time: 15000 });
        collector.on('collect', response => {
            if (response.content.toLowerCase() === question.answer.toLowerCase()) {
                msg.reply(`✅ Tepat sekali! Jawaban Anda benar: ${question.answer}`);
                collector.stop();
            } else {
                msg.reply("❌ Jawaban Anda salah, coba lagi!");
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                msg.reply(`⏰ Waktu habis! Jawaban yang benar adalah: ${question.answer}`);
            }
        });
    }

    // Perintah !guess
    else if (command === 'guess') {
        const targetNumber = Math.floor(Math.random() * 100) + 1; // Angka acak dari 1 hingga 100
        const filter = response => response.author.id === msg.author.id;
        msg.channel.send("🎯 Tebak angka antara 1 dan 100:");

        const collector = msg.channel.createMessageCollector({ filter, time: 30000 });
        collector.on('collect', response => {
            const guess = parseInt(response.content);
            if (guess === targetNumber) {
                msg.reply("🎉 Selamat! Tebakan Anda benar!");
                collector.stop();
            } else if (guess < targetNumber) {
                msg.reply("⬇️ Terlalu rendah, coba lagi!");
            } else {
                msg.reply("⬆️ Terlalu tinggi, coba lagi!");
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                msg.reply(`⏰ Waktu habis! Angka yang benar adalah: ${targetNumber}`);
            }
        });
    }

    // Perintah !daily
    else if (command === 'daily') {
        const dailyReward = 100; // Jumlah hadiah harian
        if (!userData[msg.author.id]) {
            userData[msg.author.id] = { level: 1, experience: 0, coins: 0, jsmoney: 0, inventory: [] };
        }
        userData[msg.author.id].jsmoney += dailyReward;
        msg.reply(`🎁 Anda telah menerima hadiah harian sebesar ${dailyReward} JSMoney!`);
    }

    // Perintah !level
    else if (command === 'level') {
        const levelMessage = `📈 Level Anda: ${userData[msg.author.id] ? userData[msg.author.id].level : 1}`;
        msg.reply(levelMessage);
    }

    // Perintah !achievement
    else if (command === 'achievement') {
        const achievementMessage = "🏆 Daftar Achievement: ..."; // Tambahkan daftar achievement sesuai kebutuhan
        msg.reply(achievementMessage);
    }

    // Perintah !leaderboard
    else if (command === 'leaderboard') {
        const leaderboardMessage = "🏅 Daftar Peringkat: ..."; // Tambahkan daftar peringkat sesuai kebutuhan
        msg.reply(leaderboardMessage);
    }
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

// Login ke bot dengan token yang disimpan di environment variables
client.login(process.env.DISCORD_TOKEN);
        
