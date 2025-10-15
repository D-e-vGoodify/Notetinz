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

router.post("/sendColorScheme", async (req, res) => {
    const { encryptUsername, colorScheme } = req.body

    const user = await User.findOne({ username: encryptUsername })
    if (!user) {
        return res.status(404).send({ error: "User not found" });
    }

    try {  
        if (colorScheme == "isBlue") {
            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        "settings.colorScheme.isBlue": true, 
                        "settings.colorScheme.isYellow": false, 
                        "settings.colorScheme.isGreen": false, 
                        "settings.colorScheme.isRed": false, 
                        "settings.colorScheme.isPurple": false,
                    },
                }
            )
        }
        if (colorScheme == "isYellow") {
            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        "settings.colorScheme.isBlue": false, 
                        "settings.colorScheme.isYellow": true, 
                        "settings.colorScheme.isGreen": false, 
                        "settings.colorScheme.isRed": false, 
                        "settings.colorScheme.isPurple": false,
                    },
                }
            )
        }
        if (colorScheme == "isGreen") {
            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        "settings.colorScheme.isBlue": false, 
                        "settings.colorScheme.isYellow": false, 
                        "settings.colorScheme.isGreen": true, 
                        "settings.colorScheme.isRed": false, 
                        "settings.colorScheme.isPurple": false,
                    },
                }
            )
        }
        if (colorScheme == "isRed") {
            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        "settings.colorScheme.isBlue": false, 
                        "settings.colorScheme.isYellow": false, 
                        "settings.colorScheme.isGreen": false, 
                        "settings.colorScheme.isRed": true, 
                        "settings.colorScheme.isPurple": false,
                    },
                }
            )
        }
        if (colorScheme == "isPurple") {
            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        "settings.colorScheme.isBlue": false, 
                        "settings.colorScheme.isYellow": false, 
                        "settings.colorScheme.isGreen": false, 
                        "settings.colorScheme.isRed": false, 
                        "settings.colorScheme.isPurple": true,
                    },
                }
            )
        }
    
        res.status(200).json({ status: "ok" })
    } catch(error) {
        console.log(error.message);
        return res.status(500).send({ error: "An error occurred while setting the color scheme" });
    }

})


router.post("/getColorScheme", async (req, res) => {
    const { encryptUsername } = req.body

    const user = await User.findOne({ username: encryptUsername })
    if (!user) {
        return res.status(400).json({ status: "error", error: "User not logged in" })
    }
    
    try {
        res.status(200).json({
            isBlue: user.settings.colorScheme.isBlue, 
            isYellow: user.settings.colorScheme.isYellow, 
            isGreen: user.settings.colorScheme.isGreen, 
            isRed: user.settings.colorScheme.isRed,
            isPurple: user.settings.colorScheme.isPurple
        })
    } catch(error) {
        console.log(error.message);
        return res.status(500).send({ error: "An error occurred while getting the color scheme" });
    }
    
})

router.post("/sendToggleBlur", async (req, res) => {
    const { encryptUsername, toggleBlur } = req.body

    const user = await User.findOne({ username: encryptUsername })
    if (!user) {
        return res.status(404).send({ error: "User not found" });
    }
    
    try {
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    "settings.isToggleBlur": !toggleBlur, 
                },
            }
        )
    
        res.status(200).json({ status: "ok" })
    } catch(error) {
        console.log(error.message);
        return res.status(500).send({ error: "An error occurred while setting the blur toggle" });
    }

})

router.post("/getToggleBlur", async (req, res) => {
    const { encryptUsername } = req.body

    const user = await User.findOne({ username: encryptUsername })
    if (!user) {
        return res.status(400).json({ status: "error", error: "User not logged in" })
    }

    try {
        res.status(200).json({
            isToggleBlur: user.settings.isToggleBlur
        })

    } catch(error) {
        console.log(error.message);
        return res.status(500).send({ error: "An error occurred while getting the blur toggle" });
    }

})

router.post("/getLoggedOutInfo", async (req, res) => {
    const { encryptUsername } = req.body

    const user = await User.findOne({ username: encryptUsername });
    if (!user) {
        return res.status(400).send({ error: "User not logged in" });
    }

    try {
        res.json({
            hasLoggedOut: user.settings.hasPreviouslyLoggedOut
        })
    } catch (error){
        console.log(error.message);
        return res.status(500).send({ error: "An unexpected error occured" })
    }
})


router.post("/sendReAuth", async (req, res) => {
    const { encryptUsername, reAuth } = req.body
    
    const user = await User.findOne({ username: encryptUsername });
    if (!user) {
        return res.status(404).send({ error: "User not found" });
    }

    try {
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    "settings.reAuth": reAuth, 
                },
            }
        )
        
        res.status(200).json({ status: "ok" })
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ error: "An unexpected error occured" })
    }
})

router.post("/getReAuth", async (req, res) => {
    const { encryptUsername } = req.body

    const user = await User.findOne({ username: encryptUsername });
    if (!user) {
        return res.status(400).send({ error: "User not logged in" });
    }

    try {
        res.json({
            reAuth: user.settings.reAuth
        })
    } catch (error){
        console.log(error.message);
        return res.status(500).send({ error: "An unexpected error occured" })
    }
})

module.exports = router