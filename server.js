require('dotenv/config');
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const CryproJs = require('crypto-js');
const { 
  createAccessToken, 
  createRefreshToken,
  sendAccessToken,
  sendRefreshToken,  
} = require('./tokens.js');
const { isAuth } = require('./isAuth.js');
const notes = require('./notesRoute/notes');
const settings = require('./settingsRoute/settings');

const allowedOrigins = [
    "https://notetinz.web.app",
    "https://notetinz.onrender.com"
]

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowd by CORS'));
            }
        },
        credentials: true
    })
)

const mongoose = require('mongoose');
const User = require('./model/user');

const uri = "mongodb+srv://agoodness922:goodify1%40mongodb@cluster0.kw3ldk7.mongodb.net/Notetinz?retryWrites=true&w=majority&appName=Cluster0" //'mongodb://127.0.0.1:27017/Notetinz'

async function connect() {
    try {
        await mongoose.disconnect();
        await mongoose.connect(uri)

        console.log("Database connected")
    } catch(error) {
        console.log(error.message)
    }
}

connect();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/notes', notes)
app.use('/settings', settings)

app.get("/", (req, res) => {
    res.json({ message: "Welcome", Info: "Safe" });
});

app.post("/register", async (req, res) => {
    const { name, id } = req.body;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ status: 'error', error: 'Invalid Name' })
    }

    if (name.length > 15) {
        return res.status(400).json({ status: 'error', error: 'Name too long' })
    }

    var usernameLetter = () => {
        var Letter = Math.floor(Math.random() * 26);
        return "abcdefghijklmnopqrstuvwxyz".charAt(Letter);
    };

    const plainTextUserName = name + Math.floor(Math.random() * 10) * 1 + Math.floor(Math.random() * 10) * 1 + usernameLetter() + usernameLetter();


    const username = CryproJs.HmacSHA256(plainTextUserName, process.env.SECRET_KEY).toString();
    /*let text = "Thanks you for using notetinz, we are grateful for your involvement in our website and we hope you enjoy it to the fullest. Welcome, from our creator(s)."
    const rawText = convertToRaw(text);*/

    const currentDate = new Date();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    const date = `${day}/${month}/${year}`

    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const seconds = currentDate.getSeconds();

    const time = `${hours}:${minutes}:${seconds}`
    
    try {
        await User.syncIndexes();
        
        await User.create({ 
            name: name, 
            username: username,
            notes: [
                { 
                    id: id,
                    title: "WELCOME",
                    text: "Thanks you for using notetinz, I'm are grateful for your involvement in my web-app and I hope you enjoy it to the fullest. Welcome!, from the creator.",
                    hashtag: ["welcome", "hi"],
                    date: date,
                    time: time
                }
            ],
            settings: {
                colorScheme: {
                    isBlue: true,
                    isYellow: false,
                    isGreen: false,
                    isRed: false,
                    isPurple: false
                },
                isToggleBlur: true,
                hasPreviouslyLoggedOut: false,
                reAuth: false
            },
            isDarkMode: false
        }
    )

        const user = await User.findOne({ username });

        const accesstoken = await createAccessToken(user.id);
        const refreshtoken = await createRefreshToken(user.id);

        await User.updateOne({ username: `${username}` }, { $set: { refreshtoken: refreshtoken } });

        sendRefreshToken(res, refreshtoken);
        sendAccessToken(res, accesstoken, username, plainTextUserName);
        
        console.log("User created successfully");
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({ status: 'error', error: 'UNKNOWN ERROR' })
    }
    
})

app.post('/login', async (req, res) => {
    const { username } = req.body;

    const encryptUsername = CryproJs.HmacSHA256(username, process.env.SECRET_KEY).toString();

    const user = await User.findOne({ username: encryptUsername });

    
    if (!user) {
        return res.status(400).json({ status: 'error', error: 'Invalid username' });
    }

    try {
        const accesstoken = await createAccessToken(user.id);
        const refreshtoken = await createRefreshToken(user.id);

        await User.updateOne({ username: `${user.username}` }, { $set: { refreshtoken: refreshtoken } });
      
        sendRefreshToken(res, refreshtoken);
        sendAccessToken(res, accesstoken, encryptUsername);
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({ status: 'error', error: 'UNKNOWN ERROR' })
    }
  
  });  

app.post('/logout', async (req, res) => {
    const { encryptUsername } = req.body

    const user = await User.findOne({ username: encryptUsername })

    if (!user) {
        return res.status(401).json({ status: 'error', error: 'Log in first' });
    }

    try {
        await User.updateOne({ _id: user._id }, { $set: { "settings.hasPreviouslyLoggedOut": true } });
    
        res.clearCookie('refreshtoken', { path: '/refresh_token' });
        console.log("User Logged Out")
        return res.status(200).json({
            message: "Logged out successfully",
        })
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({ status: 'error', error: 'UNKNOWN ERROR' })
    }
})

app.post('/protected', async (req, res) => {
    try {
        const userId = isAuth(req);
        if (userId !== null) {
            res.json({
                data: 'This is protected data.',
            });
        }
    } catch (err) {
        return res.json({
            error: `${err.message}`,
        });
    }
  
});

app.post('/refresh_token', async (req, res) => {
    const token = req.cookies.refreshtoken;

    if (!token) return res.status(401).json({ accesstoken: '', error: "Not logged in" });

    let payload = null;
    try {
        payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        return res.status(400).json({ accesstoken: '', error: err.message });
    }

    const user = await User.findOne({ refreshtoken: token });
    if (!user) return res.status(401).json({ accesstoken: '', error: "User not logged in" });

    const accesstoken = await createAccessToken(user.id);
    const refreshtoken = await createRefreshToken(user.id);

    try {
        await User.updateOne({ _id: user._id }, { $set: { refreshtoken: refreshtoken } });
    } catch (error) {
        console.log(error.message)
        return res.status(400).json({ status: 'error', error: 'UNKNOWN ERROR' })
    }


    sendRefreshToken(res, refreshtoken);

    return res.status(200).json({ accesstoken, encryptUsername: user.username });
});

app.post("/get-temp-key", (req, res) => {
    try {
        const tempKey = process.env.MASTER_SECRET_KEY
    
        res.status(200).json({ tempKey })
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({ status: 'error', error: 'An unexpected error' })
    }
});

app.post("/get-decryptUsername", (req, res) => {
    const { encrypted, tempKey } = req.body

    try {
        const bytes = CryproJs.AES.decrypt(encrypted, tempKey);
        const username = bytes.toString(CryproJs.enc.Utf8);

        if (!bytes) {
            res.status(400).json({ status: 'error', error: 'No user recorded' })
        }
    
        res.json({ username })
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({ status: 'error', error: 'No user recorded' })
    }
})

app.post("/sendDarkMode", async (req, res) => {
    const { encryptUsername, darkMode } = req.body

    const user = await User.findOne({ username: encryptUsername })
    if (!user) {
        return res.status(404).json({ status: "error", error: "User not found" })
    }

    try {
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    isDarkMode: !darkMode,
                },
            }
        )

        res.status(200).json({ status: "ok" })
    } catch(error) {
        console.log(error.message);
        return res.status(500).send({ error: "An error occurred while sending the dark mode" });
    }

})

app.post("/getDarkMode", async (req, res) => {
    const { encryptUsername } = req.body
    
    const user = await User.findOne({ username: encryptUsername })
    if (!user) {
        return res.status(400).json({ status: "error", error: "User not logged in" })
    }

    try {
        res.json({
            isDarkMode: user.isDarkMode
        })
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: "An error occurred while getting the dark mode" });
    }

})

app.post("/getAppData", async (req, res) => {
    
})

app.listen(5000, () => { console.log("Server listening on port 5000") })