require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session')
const bcrypt = require('bcrypt')
const fs = require('fs');
const helmet = require('helmet');
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();
const PORT = process.env.PORT || 3000;

//vis filer fra public mappen
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false}));
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.set('trust proxy', 1);


const dataFolder = path.join(__dirname, 'data');
const contentFile = path.join(dataFolder, 'site-content.json');

fs.mkdirSync(dataFolder, { recursive: true});

//skal være i toppen før alt andet for at definere sessionen for admin
app.use(
    session({
        store: new SQLiteStore({
            db: 'sessions.sqlite',
            dir: path.join(__dirname, 'data')
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 30
        }
    })
);




// Hent og ændre forside text routes og functions:
function ensureContentFile() {
    if (!fs.existsSync(contentFile)) {
        const defaultContent = {
            welcomeTitle: 'Hej og velkommen til Style Lounges helt egen hjemmeside :)',
            welcomeText1: 'Skriv den første tekst her.',
            welcomeText2: 'Skriv den anden tekst her.'
        };

        fs.writeFileSync(
            contentFile,
            JSON.stringify(defaultContent, null, 2),
            'utf8'
        );
    }
}

function readContent() {
    ensureContentFile();
    const raw = fs.readFileSync(contentFile, 'utf8');
    return JSON.parse(raw);
}

function writeContent(newContent){
    fs.writeFileSync(
        contentFile,
        JSON.stringify(newContent, null, 2),
        'utf8'
    );
}

// public route til at get text til homepage
app.get('/api/content', (req, res) => {
    try{
        const content = readContent();
        res.json(content);
            console.log("Website Visited");

    } catch (error) {
    console.error('Could not read content file:', error);
    res.status(500).json({ error: 'Could not read content' });
  }
});


//post metode for at ændre text fra admin til index i NEWS sektionen
app.post('/api/admin/content', requireAdmin, (req, res) => {
    try {
        const { welcomeTitle, welcomeText1, welcomeText2 } = req.body;

        if (
            typeof welcomeTitle !== 'string' ||
            typeof welcomeText1 !== 'string' ||
            typeof welcomeText2 !== 'string'
        ) {
            return res.status(400).json({ ok: false, message: 'Invalid input' });
        }

        const updatedContent = {
            welcomeTitle: welcomeTitle.trim(),
            welcomeText1: welcomeText1.trim(),
            welcomeText2: welcomeText2.trim()
        };

        writeContent(updatedContent);

        console.log('Homepage text updated from admin');
        return res.json({ ok: true});
    }   catch (error) {
    console.error('Could not save homepage text:', error);
    return res.status(500).json({ ok: false, message: 'Could not save content' });
    }
});








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