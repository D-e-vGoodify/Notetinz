const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema({
    id: { type: String, require: true, unique: true },
    rawTitle: { type: mongoose.Schema.Types.Mixed },
    title: { type: String, require: true },
    rawText: { type: mongoose.Schema.Types.Mixed },
    text: { type: String },
    hashtag: { type: Array },
    date: { type: String },
    time: { type: String }
})

const UserSchema = new mongoose.Schema({
    name: { type: String, require: true, unique: false },
    username: { type: String, require: true, unique: true },
    notes: [noteSchema],
    settings: { type: Object, require: true },
    isDarkMode: { type: Boolean, require: true },
    refreshtoken: String,
}, { collection: 'users' })

const model = mongoose.model('UserSchema', UserSchema)

module.exports = model