require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session')
const bcrypt = require('bcrypt')

const app = express();
const PORT = process.env.PORT || 3000;

//vis filer fra public mappen
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false}));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 1000 * 60 * 30
        }
    })
);

// middleware to protect admin page
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.redirect('/login.html');
}

//protected admin page
app.get('/admin', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});


//login route
app.post('/login', async (req, res) => {
    const password = req.body.password;

    if (!password) {
        return res.redirect('/login.html?error=1');
    }

    const passwordPASS = await bcrypt.compare(
        password,
        process.env.ADMIN_PASSWORD_HASH
    );

    if (!passwordPASS){
        return res.redirect('/login.html?error=1');
    }

    req.session.regenerate((err) => {
        if (err) {
            console.error('Could not regenerate session after login');
            return res.redirect('/login.html?error=1')
        }

        req.session.isAdmin = true;
        console.log('Admin session created or renewed')

        return res.redirect('/admin');
    });
});



//logout route
app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        return res.redirect('/');
    })
})





//Start serveren
app.listen(PORT, () => {
    console.log("Server running at http://localhost:" + PORT);
})