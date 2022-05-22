const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true
    },
    tag: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        rel: 'User'
    },
    image: {
        url: {
            type: String
        }
    }
}, {
    timestamps: true
});


const Note = mongoose.model('Note', noteSchema);

module.exports = Note;