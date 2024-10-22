// Import library
const express = require('express');
const translate = require('@vitalets/google-translate-api');
const mongoose = require('mongoose');
const User = require('./models/user'); // Import model user
const app = express();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const prefix = '!';
const PORT = process.env.PORT || 3000;

// Koneksi ke MongoDB
mongoose.connect('mongodb://jamasantuy:Budeaxasb13@atlas-sql-6717e27b6ddc496cbce71b7e-sryeq.a.query.mongodb.net/?ssl=true&authSource=admin&appName=atlas-sql-6717e27b6ddc496cbce71b7e')
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Event saat bot siap digunakan
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Rute untuk halaman utama
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Fungsi untuk meningkatkan level pengguna
const levelUp = async (userId) => {
    let user = await User.findOne({ userId });
    if (!user) {
        user = new User({ userId });
    }
    user.experience += 10; // Tambah pengalaman

    // Cek apakah pengguna naik level
    if (user.experience >= 100) {
        user.level++;
        user.experience = 0; // Reset pengalaman
    }
    await user.save();
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
                **!battle <user>** - Melawan pengguna lain
                **!duel <user> <taruhan>** - Menantang pengguna lain untuk duel
                **!farm** - Melakukan farming untuk mendapatkan jsmoney
            `)
            .setColor(0x3498db);
        msg.reply({ embeds: [helpEmbed] });
    }

    // Perintah !info
    else if (command === 'info') {
        const infoEmbed = new EmbedBuilder()
            .setTitle('🤖 Informasi Bot')
            .setDescription('Bot ini dibuat untuk memberikan berbagai fitur menarik dan permainan di Discord!')
            .addField('Versi:', '1.0.0', true)
            .addField('Pengembang:', 'HendraCoders', true)
            .setColor(0x2ecc71);
        msg.reply({ embeds: [infoEmbed] });
    }

    // Perintah !profile
    else if (command === 'profile') {
        let user = await User.findOne({ userId: msg.author.id });
        if (!user) {
            user = new User({ userId: msg.author.id });
            await user.save();
        }
        const profileEmbed = new EmbedBuilder()
            .setTitle(`👤 Profil ${msg.author.username}`)
            .setDescription(`
                **Level:** ${user.level} (Experience: ${user.experience}/100)
                **Coins:** ${user.coins}
                **JSMoney:** ${user.jsmoney}
                **Inventory:** ${user.inventory.join(', ') || 'Kosong'}
            `)
            .setThumbnail(msg.author.avatarURL())
            .setColor(0x2ecc71);
        msg.reply({ embeds: [profileEmbed] });
    }

    // Perintah !daily
    else if (command === 'daily') {
        const dailyReward = 100; // Jumlah hadiah harian
        let user = await User.findOne({ userId: msg.author.id });
        if (!user) {
            user = new User({ userId: msg.author.id });
        }
        user.jsmoney += dailyReward;
        await user.save();
        msg.reply(`🎁 Anda telah menerima hadiah harian sebesar ${dailyReward} JSMoney!`);
    }

    // Perintah !battle
    else if (command === 'battle') {
        const opponentId = args[0].replace(/[<@!>]/g, '');
        const user = await User.findOne({ userId: msg.author.id });
        const opponent = await User.findOne({ userId: opponentId });

        if (!opponent) {
            return msg.reply("❌ Pengguna tidak ditemukan!");
        }

        const userHealth = user.level * 10; // HP pengguna
        const opponentHealth = opponent.level * 10; // HP lawan

        // Simulasi pertarungan
        const battleEmbed = new EmbedBuilder()
            .setTitle(`⚔️ Pertarungan antara ${msg.author.username} dan ${opponent.username}`)
            .setDescription(`**${msg.author.username} HP:** ${userHealth} vs **${opponent.username} HP:** ${opponentHealth}`)
            .setColor(0xe74c3c);
        msg.reply({ embeds: [battleEmbed] });

        while (userHealth > 0 && opponentHealth > 0) {
            const userDamage = Math.floor(Math.random() * user.level) + 1;
            const opponentDamage = Math.floor(Math.random() * opponent.level) + 1;
            opponentHealth -= userDamage;
            userHealth -= opponentDamage;

            await new Promise(resolve => setTimeout(resolve, 2000)); // Delay 2 detik untuk efek
            msg.channel.send(`**${msg.author.username}** menyerang dan memberi **${userDamage}** damage!`);
            msg.channel.send(`**${opponent.username}** menyerang dan memberi **${opponentDamage}** damage!`);
        }

        if (userHealth <= 0 && opponentHealth <= 0) {
            msg.channel.send("🏳️ Pertarungan berakhir imbang!");
        } else if (userHealth <= 0) {
            msg.channel.send(`💔 ${msg.author.username} kalah!`);
        } else {
            msg.channel.send(`🏆 ${msg.author.username} menang!`);
        }
    }

    // Perintah !duel
    else if (command === 'duel') {
        const opponentId = args[0].replace(/[<@!>]/g, '');
        const betAmount = parseInt(args[1]);
        const user = await User.findOne({ userId: msg.author.id });
        const opponent = await User.findOne({ userId: opponentId });

        if (!opponent) {
            return msg.reply("❌ Pengguna tidak ditemukan!");
        }

        if (user.jsmoney < betAmount) {
            return msg.reply("❌ Anda tidak memiliki cukup jsmoney untuk bertaruh!");
        }

        const win = Math.random() < 0.5; // 50% kemungkinan menang
        if (win) {
            user.jsmoney += betAmount;
            opponent.jsmoney -= betAmount;
            msg.reply(`🏆 Anda menang melawan ${opponent.username} dan mendapatkan ${betAmount} JSMoney!`);
        } else {
            user.jsmoney -= betAmount;
            opponent.jsmoney += betAmount;
            msg.reply(`💔 Anda kalah melawan ${opponent.username} dan kehilangan ${betAmount} JSMoney!`);
        }

        await user.save();
        await opponent.save();
    }

    // Perintah !inventory
    else if (command === 'inventory') {
        let user = await User.findOne({ userId: msg.author.id });
        if (!user) {
            user = new User({ userId: msg.author.id });
            await user.save();
        }
        const inventoryEmbed = new EmbedBuilder()
            .setTitle(`🎒 Inventory ${msg.author.username}`)
            .setDescription(user.inventory.length ? user.inventory.join(', ') : 'Kosong')
            .setColor(0x2ecc71);
        msg.reply({ embeds: [inventoryEmbed] });
    }

    // Perintah !guess
    else if (command === 'guess') {
        const guessNumber = parseInt(args[0]);
        const randomNumber = Math.floor(Math.random() * 10) + 1; // Angka acak antara 1-10

        if (guessNumber === randomNumber) {
            msg.reply(`🎉 Selamat! Anda menebak angka yang benar: ${randomNumber}`);
            await levelUp(msg.author.id);
        } else {
            msg.reply(`❌ Sayang sekali! Angka yang benar adalah: ${randomNumber}`);
        }
    }

    // Perintah !translate
    else if (command === 'translate') {
        const targetLang = args[0];
        const textToTranslate = args.slice(1).join(' ');

        translate(textToTranslate, { to: targetLang }).then(res => {
            msg.reply(`🔤 Terjemahan: ${res.text}`);
        }).catch(err => {
            msg.reply("❌ Gagal menerjemahkan!");
        });
    }
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

// Login ke Discord
client.login(process.env.DISCORD_TOKEN);
    
