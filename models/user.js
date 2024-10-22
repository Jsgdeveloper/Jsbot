// Import library
const mongoose = require('mongoose');

// Membuat schema untuk User
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    jsmoney: { type: Number, default: 0 },
    inventory: { type: [String], default: [] },
});

// Membuat model untuk User
const User = mongoose.model('User', userSchema);

module.exports = User;
