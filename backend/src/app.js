const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path"); // AJOUT : Importation du module path

const supabase = require("./config/supabase");

const productRoutes = require("./routes/productRoutes");
const forgeRoutes = require("./routes/forge.routes");
const sealRoutes = require("./routes/sealRoutes");

const dashboardRoutes = require("./routes/dashboardRoutes");
const historyRoutes = require("./routes/historyRoutes");
const mapRoutes = require("./routes/mapRoutes");

// NOUVEAU
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());

// MODIFICATION TEMPORAIRE : Désactivation de la CSP pour le test
app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.use(express.json());

// AJOUT : Middleware pour servir les fichiers statiques du dossier admin
app.use(
    express.static(
        path.join(__dirname, "../admin")
    )
);

// ==========================
// AUTHENTICATION
// ==========================

app.use(
    "/api/auth",
    authRoutes
);

// ==========================
// DASHBOARD
// ==========================

app.use(
    "/api/dashboard",
    dashboardRoutes
);

// ==========================
// HISTORY
// ==========================

app.use(
    "/api/history",
    historyRoutes
);

// ==========================
// MAP
// ==========================

app.use(
    "/api/map",
    mapRoutes
);

// ==========================
// ADMIN
// ==========================

app.use(
    "/api/admin",
    adminRoutes
);

// ==========================
// PRODUCTS
// ==========================

app.use(
    "/api/products",
    productRoutes
);

// ==========================
// FORGE
// ==========================

app.use(
    "/api/forge",
    forgeRoutes
);

// ==========================
// SEALS
// ==========================

app.use(
    "/api/seal",
    sealRoutes
);

// ==========================
// ROOT (MODIFIÉ TEMPORAIREMENT)
// ==========================

app.get("/", (req, res) => {
    res.send("JE SUIS LE BON SERVEUR");
});

// ==========================
// TEST DATABASE
// ==========================

app.get("/test-db", async (req, res) => {

    const { data, error } =
        await supabase
            .from("products")
            .select("*")
            .limit(1);

    if (error) {

        return res
            .status(500)
            .json(error);

    }

    res.json(data);

});

// ==========================
// HEALTH CHECK
// ==========================

app.get("/ping", (req, res) => {

    res.json({
        ok: true
    });

});

module.exports = app;