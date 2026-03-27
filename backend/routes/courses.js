const express = require('express');
const router = express.Router();
const {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollCourse,
    addVideo,
    addDocument,
    deleteVideo,
    deleteDocument,
    addQuiz,
    addQuestion,
    deleteQuestion,
    deleteQuiz,
    submitQuiz,
    getSubmission
} = require('../controllers/courseController');
const { protect, restrictTo } = require('../middleware/auth');

// Routes publiques
router.get('/', getCourses);
router.get('/:id', getCourse);

// Routes protégées
router.post('/', protect, restrictTo('teacher', 'admin'), createCourse);
router.put('/:id', protect, restrictTo('teacher', 'admin'), updateCourse);
router.delete('/:id', protect, restrictTo('teacher', 'admin'), deleteCourse);

// Inscription à un cours
router.post('/:id/enroll', protect, restrictTo('student'), enrollCourse);

// Ajouter du contenu
// Ajouter du contenu
router.post('/:id/videos', protect, restrictTo('teacher', 'admin'), addVideo);
router.post('/:id/documents', protect, restrictTo('teacher', 'admin'), addDocument);

// Supprimer du contenu
router.delete('/:id/videos/:videoId', protect, restrictTo('teacher', 'admin'), deleteVideo);
router.delete('/:id/documents/:docId', protect, restrictTo('teacher', 'admin'), deleteDocument);

// Quiz routes
router.post('/:id/quizzes', protect, restrictTo('teacher', 'admin'), addQuiz);
router.post('/:id/quizzes/:quizId/questions', protect, restrictTo('teacher', 'admin'), addQuestion);
router.delete('/:id/quizzes/:quizId/questions/:questionId', protect, restrictTo('teacher', 'admin'), deleteQuestion);
router.delete('/:id/quizzes/:quizId', protect, restrictTo('teacher', 'admin'), deleteQuiz);
router.post('/:id/quizzes/:quizId/submit', protect, submitQuiz);
router.get('/:id/quizzes/:quizId/submission', protect, getSubmission);

module.exports = router;
