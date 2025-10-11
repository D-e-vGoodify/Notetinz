const jwt = require('jsonwebtoken');


const createAccessToken = userId => {
   return jwt.sign({ 
    userId 
}, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
})
};

const createRefreshToken = userId => {
    return jwt.sign({ 
     userId 
 }, process.env.REFRESH_TOKEN_SECRET, {
     expiresIn: '7d',
 })
 };

 const sendAccessToken = (res, accesstoken, encryptUsername, username) => {
    res.json({ 
        accesstoken,
        encryptUsername,
        username
    })
 }

 const sendRefreshToken = (res, refreshtoken) => {
    res.cookie('refreshtoken', refreshtoken, {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
        path: '/refresh_token',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
 }

 module.exports = {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken,
 }