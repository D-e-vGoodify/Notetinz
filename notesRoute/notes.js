require('dotenv/config');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const User = require('../model/user')

const uri = process.env.MONGODB_URI;

async function connect() {
    try {
        await mongoose.disconnect();
        await mongoose.connect(uri)
    } catch(error) {
        console.log(error.message)
    }
}

connect();

router.post("/updateNotes", async (req, res) => {
    const { encryptUsername, notes } = req.body

    const user = await User.findOne({ username: encryptUsername });
    if (!user) {
        return res.status(404).send({ error: "User not found" });
    }

    try {
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    'notes': notes,
                },
            }
        )

        res.status(200).send({ message: "Notes updated successfully" })
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ error: "An error occurred while updating the notes" });
    }
});

router.post("/addNotes", async (req, res) => {
    const { encryptUsername, id, rawTitle, title, rawText, text, hashtags, date, time } = req.body;

    if (!Array.isArray(hashtags)) {
        return res.status(400).send({ error: "Hashtag must be an array" });
    }

    const user = await User.findOne({ username: encryptUsername });
    if (!user) {
        return res.status(404).send({ error: "User not found" });
    }

    try {
        await User.updateOne(
            { _id: user._id },
            {
                $push: {
                    notes: {
                        $each: [
                            { 
                                id: id,
                                rawTitle: rawTitle,
                                title: title,
                                rawText: rawText,
                                text: text,
                                hashtag: hashtags,
                                date: date,
                                time: time
                            }
                        ]
                    }
                }
            }
        );

        res.status(200).send({ message: "Note added successfully" });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ error: "An error occurred while adding the note" });
    }
});

router.post("/getNotes", async (req, res) => {
    const { encryptUsername } = req.body;
    
    const user = await User.findOne({ username: encryptUsername });
    if (!user) {
        return res.status(400).send({ error: "User not logged in" });
    }

    try {
        const notes = user.notes.map(note => ({
            id: note.id,
            rawTitle: note.rawTitle,
            title: note.title,
            rawText: note.rawText,
            text: note.text,
            hashtag: note.hashtag,
            date: note.date,
            time: note.time
        }));

        return res.status(200).json({ notes, name: user.name });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ error: "An error occurred while retrieving the notes" });
    }
});

router.post("/deleteNotes", async (req, res) => {
    const { id } = req.body;

    try {
        await User.updateOne({ 'notes.id': id },
            { $pull: { notes: { id: id } } });
    
        return res.status(200).json({ status: "ok" })
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ error: "An error occurred while deleting the note" });
    }

})

router.post("/editNotes", async (req, res) => {
    const { id, rawTitle, title, rawText, text, hashtags, date, time } = req.body;

    try {
        await User.updateOne(
            { 'notes.id': id },
            {
                $set: {
                    'notes.$.rawTitle': rawTitle,
                    'notes.$.title': title,
                    'notes.$.rawText': rawText,
                    'notes.$.text': text,
                    'notes.$.hashtag': hashtags,
                    'notes.$.date': date,
                    'notes.$.time': time,
                  },
            }
        );

        res.status(200).send({ message: "Note updated successfully" });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ error: "An error occurred while updating the note" });
    }
    
});

module.exports = router