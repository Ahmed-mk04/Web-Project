const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');

// Helper to find user across collections
const findUserById = async (id) => {
    let user = await Student.findById(id).populate('enrolledCourses', 'title description');
    if (user) return { user, model: Student, role: 'student' };

    user = await Teacher.findById(id);
    if (user) return { user, model: Teacher, role: 'teacher' };

    user = await Admin.findById(id);
    if (user) return { user, model: Admin, role: 'admin' };

    return null;
};

// @desc    Obtenir tous les utilisateurs (avec filtre par rôle)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
    try {
        const { role, search } = req.query;
        let users = [];

        let query = {};
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role === 'student') {
            users = await Student.find(query).select('-password');
        } else if (role === 'teacher') {
            users = await Teacher.find(query).select('-password');
        } else if (role === 'admin') {
            users = await Admin.find(query).select('-password');
        } else {
            // No role specified: fetch all
            const [students, teachers, admins] = await Promise.all([
                Student.find(query).select('-password'),
                Teacher.find(query).select('-password'),
                Admin.find(query).select('-password')
            ]);
            users = [...students, ...teachers, ...admins];
        }

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obtenir un utilisateur par ID
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
    try {
        const found = await findUserById(req.params.id);

        if (!found) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: found.user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Créer un utilisateur (Admin)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
    try {
        const { role } = req.body;
        let user;

        if (role === 'student') {
            user = await Student.create(req.body);
        } else if (role === 'teacher') {
            user = await Teacher.create(req.body);
        } else if (role === 'admin') {
            user = await Admin.create(req.body);
        } else {
            // Default check or error
            return res.status(400).json({
                success: false,
                message: 'Rôle invalide ou manquant'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mettre à jour un utilisateur
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    try {
        const found = await findUserById(req.params.id);

        if (!found) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        const { user } = found;

        // Apply all updates from req.body to the user document
        Object.keys(req.body).forEach(key => {
            user[key] = req.body[key];
        });

        // Use save() so that the 'pre-save' middleware (password hashing) runs!
        await user.save();

        // Prevent sending back the password
        const userData = user.toObject ? user.toObject() : user;
        delete userData.password;

        res.status(200).json({
            success: true,
            message: 'Utilisateur mis à jour',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Supprimer un utilisateur
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const found = await findUserById(req.params.id);

        if (!found) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        await found.model.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Utilisateur supprimé'
        });
    } catch (error) {
        next(error);
    }
};
