require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session')
const bcrypt = require('bcrypt')
const fs = require('fs');
const crypto = require('crypto');
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
            secure: 'auto',
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




// Produkter til prisside routes og functions:
const productsFile = path.join(dataFolder, 'products.json');

function ensureProductsFile() {
    if (!fs.existsSync(productsFile)) {
        const defaultProducts = {
            boxes: [
                { id: 1, title: 'Klip & behandling' },
                { id: 2, title: 'Farve & striber' }
            ],
            products: []
        };

        fs.writeFileSync(
            productsFile,
            JSON.stringify(defaultProducts, null, 2),
            'utf8'
        );
    }
}

function readProducts() {
    ensureProductsFile();
    const raw = fs.readFileSync(productsFile, 'utf8');
    return JSON.parse(raw);
}

function writeProducts(data) {
    fs.writeFileSync(
        productsFile,
        JSON.stringify(data, null, 2),
        'utf8'
    );
}

// public route: hent alle bokse + produkter til prissiden
app.get('/api/products', (req, res) => {
    try {
        res.json(readProducts());
    } catch (error) {
        console.error('Could not read products file:', error);
        res.status(500).json({ error: 'Could not read products' });
    }
});

// admin route: tilføj et nyt produkt
app.post('/api/admin/products', requireAdmin, (req, res) => {
    try {
        const { name, price, description, box } = req.body;

        if (typeof name !== 'string' || typeof price !== 'string') {
            return res.status(400).json({ ok: false, message: 'Invalid input' });
        }

        const trimmedName = name.trim();
        const trimmedPrice = price.trim();
        const boxId = Number(box);

        if (!trimmedName || !trimmedPrice) {
            return res.status(400).json({ ok: false, message: 'Name and price are required' });
        }

        const data = readProducts();

        if (!data.boxes.some((b) => b.id === boxId)) {
            return res.status(400).json({ ok: false, message: 'Invalid box' });
        }

        const newProduct = {
            id: crypto.randomUUID(),
            box: boxId,
            name: trimmedName,
            price: trimmedPrice,
            description: typeof description === 'string' ? description.trim() : ''
        };

        data.products.push(newProduct);
        writeProducts(data);

        console.log('Product added:', newProduct.name);
        return res.json({ ok: true, product: newProduct });
    } catch (error) {
        console.error('Could not add product:', error);
        return res.status(500).json({ ok: false, message: 'Could not add product' });
    }
});

// admin route: slet et produkt ud fra id
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    try {
        const data = readProducts();
        const before = data.products.length;
        data.products = data.products.filter((p) => p.id !== req.params.id);

        if (data.products.length === before) {
            return res.status(404).json({ ok: false, message: 'Product not found' });
        }

        writeProducts(data);
        console.log('Product deleted:', req.params.id);
        return res.json({ ok: true });
    } catch (error) {
        console.error('Could not delete product:', error);
        return res.status(500).json({ ok: false, message: 'Could not delete product' });
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