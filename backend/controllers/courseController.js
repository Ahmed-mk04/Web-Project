const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Obtenir tous les cours
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
    try {
        const { search, category, level } = req.query;

        let query = {};
        console.log("getCourses query params:", req.query);

        // Recherche par titre ou description
        if (search) {
            query.$text = { $search: search };
        }

        // Filtrer par catégorie
        if (category) {
            query.category = category;
        }

        // Filtrer par niveau
        if (level) {
            query.level = level;
        }

        const courses = await Course.find(query)
            .populate('teacher', 'firstName lastName email domain')
            .populate('enrolledStudents', 'firstName lastName email')
            .sort('-createdAt');
        console.log(`Found ${courses.length} courses`);

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obtenir un cours par ID
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('teacher', 'firstName lastName email domain avatar')
            .populate('enrolledStudents', 'firstName lastName email');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Créer un cours
// @route   POST /api/courses
// @access  Private/Teacher/Admin
// @desc    Créer un cours
// @route   POST /api/courses
// @access  Private/Teacher/Admin
// @desc    Créer un cours
// @route   POST /api/courses
// @access  Private/Teacher/Admin
exports.createCourse = async (req, res, next) => {
    try {
        let teacherId;

        // Si c'est un enseignant qui crée le cours, il est forcément l'enseignant
        if (req.user.role === 'teacher') {
            teacherId = req.user._id;
        } else {
            // Si c'est un admin, il peut spécifier l'enseignant
            const { teacher } = req.body;
            teacherId = teacher;

            // Si teacher est un email, trouver l'ID
            if (teacher && teacher.toString().includes('@')) {
                // Must import Teacher model if not already imported at top? 
                // We will assume imports are present or use mongoose.model
                const Teacher = require('../models/Teacher');
                const teacherUser = await Teacher.findOne({ email: teacher });
                if (!teacherUser) {
                    return res.status(404).json({
                        success: false,
                        message: 'Enseignant non trouvé avec cet email'
                    });
                }
                teacherId = teacherUser._id;
            }
        }

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez spécifier un enseignant'
            });
        }

        const Teacher = require('../models/Teacher');
        const teacherExists = await Teacher.findById(teacherId); // Direct ID check
        if (!teacherExists) {
            return res.status(400).json({
                success: false,
                message: 'L\'enseignant spécifié n\'existe pas ou n\'a pas le rôle enseignant'
            });
        }

        // Explicitly handle boolean conversion for isPublic to avoid string "false" issues
        let isPublic = true;
        if (req.body.isPublic === false || req.body.isPublic === 'false') {
            isPublic = false;
        }

        const courseData = {
            ...req.body,
            teacher: teacherId,
            isPublic: isPublic
        };
        
        // Fix validation error: enrollmentKey is required and unique in the database schema.
        // For public courses, the user leaves it empty, triggering a validation constraint error.
        // We auto-generate a unique hidden key for public courses.
        if (isPublic && (!courseData.enrollmentKey || courseData.enrollmentKey.trim() === '')) {
            courseData.enrollmentKey = `PUB-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        }

        console.log(`Creating course: ${courseData.title}, isPublic: ${isPublic}`);

        const course = await Course.create(courseData);

        // Populate pour retourner les infos complètes
        await course.populate('teacher', 'firstName lastName email domain');

        res.status(201).json({
            success: true,
            message: 'Cours créé avec succès',
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mettre à jour un cours
// @route   PUT /api/courses/:id
// @access  Private/Teacher/Admin
exports.updateCourse = async (req, res, next) => {
    try {
        let course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Vérifier que l'utilisateur est le propriétaire ou admin
        if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier ce cours'
            });
        }

        // Note: if body contains teacher, we might need validation again, but let's assume update logic holds.

        course = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('teacher', 'firstName lastName email');

        res.status(200).json({
            success: true,
            message: 'Cours mis à jour',
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Supprimer un cours
// @route   DELETE /api/courses/:id
// @access  Private/Teacher/Admin
exports.deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Vérifier que l'utilisateur est le propriétaire ou admin
        if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer ce cours'
            });
        }

        await course.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Cours supprimé'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Inscrire un étudiant à un cours
// @route   POST /api/courses/:id/enroll
// @access  Private/Student
exports.enrollCourse = async (req, res, next) => {
    try {
        const { enrollmentKey } = req.body;
        const course = await Course.findById(req.params.id);
        const Student = require('../models/Student'); // Import locally or at top

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Verify user is a student
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Seuls les étudiants peuvent s\'inscrire aux cours'
            });
        }

        // Vérifier la clé d'inscription UNIQUEMENT si le cours n'est pas public
        if (!course.isPublic) {
            // Comparaison stricte de la clé
            // On vérifie aussi si la clé est définie dans le cours
            if (!course.enrollmentKey || course.enrollmentKey !== enrollmentKey) {
                return res.status(400).json({
                    success: false,
                    message: 'Clé d\'inscription invalide pour ce cours privé'
                });
            }
        }

        // Vérifier si déjà inscrit
        if (course.enrolledStudents.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'Vous êtes déjà inscrit à ce cours'
            });
        }

        // Ajouter l'étudiant au cours
        course.enrolledStudents.push(req.user.id);
        await course.save();

        // Ajouter le cours à l'étudiant
        await Student.findByIdAndUpdate(req.user.id, {
            $push: { enrolledCourses: course._id }
        });

        res.status(200).json({
            success: true,
            message: 'Inscription réussie au cours'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Ajouter une vidéo à un cours
// @route   POST /api/courses/:id/videos
// @access  Private/Teacher/Admin
exports.addVideo = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        course.videos.push(req.body);
        await course.save();

        res.status(200).json({
            success: true,
            message: 'Vidéo ajoutée',
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Ajouter un document à un cours
// @route   POST /api/courses/:id/documents
// @access  Private/Teacher/Admin
exports.addDocument = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        course.documents.push(req.body);
        await course.save();

        res.status(200).json({
            success: true,
            message: 'Document ajouté',
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Supprimer une vidéo
// @route   DELETE /api/courses/:id/videos/:videoId
// @access  Private/Teacher/Admin
exports.deleteVideo = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Cours non trouvé' });
        }

        course.videos = course.videos.filter(v => v._id.toString() !== req.params.videoId);
        await course.save();

        res.status(200).json({ success: true, message: 'Vidéo supprimée', data: course });
    } catch (error) {
        next(error);
    }
};

// @desc    Supprimer un document
// @route   DELETE /api/courses/:id/documents/:docId
// @access  Private/Teacher/Admin
exports.deleteDocument = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Cours non trouvé' });
        }

        course.documents = course.documents.filter(d => d._id.toString() !== req.params.docId);
        await course.save();

        res.status(200).json({ success: true, message: 'Document supprimé', data: course });
    } catch (error) {
        next(error);
    }
};

// =================== QUIZ ===================

// @desc    Ajouter un quiz (max 10)
// @route   POST /api/courses/:id/quizzes
// @access  Private/Teacher/Admin
exports.addQuiz = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Cours non trouvé' });

        if (course.quizzes.length >= 10) {
            return res.status(400).json({ success: false, message: 'Maximum 10 quiz atteint' });
        }

        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Le nom du quiz est requis' });
        }

        course.quizzes.push({ name: name.trim(), questions: [], submissions: [] });
        await course.save();

        res.status(201).json({ success: true, message: 'Quiz créé', data: course });
    } catch (error) {
        next(error);
    }
};

// @desc    Ajouter une question à un quiz
// @route   POST /api/courses/:id/quizzes/:quizId/questions
// @access  Private/Teacher/Admin
exports.addQuestion = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Cours non trouvé' });

        const quiz = course.quizzes.id(req.params.quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz non trouvé' });

        const { question, choices, correctAnswer } = req.body;
        if (!question || !choices || choices.length < 2 || correctAnswer === undefined) {
            return res.status(400).json({ success: false, message: 'Données de question invalides' });
        }

        quiz.questions.push({ question, choices, correctAnswer: Number(correctAnswer) });
        await course.save();

        res.status(201).json({ success: true, message: 'Question ajoutée', data: course });
    } catch (error) {
        next(error);
    }
};

// @desc    Supprimer une question d'un quiz
// @route   DELETE /api/courses/:id/quizzes/:quizId/questions/:questionId
// @access  Private/Teacher/Admin
exports.deleteQuestion = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Cours non trouvé' });

        const quiz = course.quizzes.id(req.params.quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz non trouvé' });

        quiz.questions = quiz.questions.filter(q => q._id.toString() !== req.params.questionId);
        await course.save();

        res.status(200).json({ success: true, message: 'Question supprimée', data: course });
    } catch (error) {
        next(error);
    }
};

// @desc    Supprimer un quiz
// @route   DELETE /api/courses/:id/quizzes/:quizId
// @access  Private/Teacher/Admin
exports.deleteQuiz = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Cours non trouvé' });

        course.quizzes = course.quizzes.filter(q => q._id.toString() !== req.params.quizId);
        await course.save();

        res.status(200).json({ success: true, message: 'Quiz supprimé', data: course });
    } catch (error) {
        next(error);
    }
};

// @desc    Soumettre un quiz (student, une seule fois)
// @route   POST /api/courses/:id/quizzes/:quizId/submit
// @access  Private/Student/Teacher/Admin
exports.submitQuiz = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Cours non trouvé' });

        const quiz = course.quizzes.id(req.params.quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz non trouvé' });

        const userId = req.user._id.toString();

        // Check if already submitted (students only)
        if (req.user.role === 'student') {
            const alreadySubmitted = quiz.submissions.some(s => s.student.toString() === userId);
            if (alreadySubmitted) {
                return res.status(400).json({ success: false, message: 'Vous avez déjà soumis ce quiz' });
            }
        }

        const { answers } = req.body; // array of selected choice indices
        const total = quiz.questions.length;
        if (!total) return res.status(400).json({ success: false, message: 'Ce quiz n\'a pas encore de questions' });

        // Calculate score out of 10
        let correctCount = 0;
        const details = quiz.questions.map((q, i) => {
            const chosen = answers[i] !== undefined ? Number(answers[i]) : -1;
            const isCorrect = chosen === q.correctAnswer;
            if (isCorrect) correctCount++;
            return { question: q.question, chosen, correctAnswer: q.correctAnswer, choices: q.choices, isCorrect };
        });

        const score = Math.round((correctCount / total) * 10 * 10) / 10; // score / 10

        // Save submission for students
        if (req.user.role === 'student') {
            quiz.submissions.push({ student: req.user._id, answers, score });
            await course.save();
        }

        res.status(200).json({
            success: true,
            score,
            correctCount,
            total,
            details
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Vérifier si un étudiant a déjà soumis un quiz
// @route   GET /api/courses/:id/quizzes/:quizId/submission
// @access  Private
exports.getSubmission = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Cours non trouvé' });

        const quiz = course.quizzes.id(req.params.quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz non trouvé' });

        const userId = req.user._id.toString();
        const submission = quiz.submissions.find(s => s.student.toString() === userId);

        res.status(200).json({ success: true, submission: submission || null });
    } catch (error) {
        next(error);
    }
};
