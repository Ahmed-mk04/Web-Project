const mongoose = require('mongoose');
const User = require('../models/User'); // Import du modèle User pour la création auto

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`✅ MongoDB connecté: ${conn.connection.host}`);

        // ========= CRÉATION AUTO DE L'ADMIN AU DÉMARRAGE =========
        const adminEmail = 'admin2026@gmail.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            console.log(`⚠️ Aucun admin détecté. Création du compte admin par défaut...`);
            const nouveauAdmin = new User({
                firstName: 'Admin',
                lastName: 'Principal',
                email: adminEmail,
                password: 'admin2026',
                role: 'admin',
                isActive: true
            });
            await nouveauAdmin.save();
            console.log(`✅ Admin par défaut créé avec succès (${adminEmail}) !`);
        }
        // ==========================================================

    } catch (error) {
        console.error(`❌ Erreur de connexion MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
