const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Le titre du cours est requis'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'La description est requise']
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: [true, 'L\'enseignant est requis']
    },
    enrollmentKey: {
        type: String,
        required: [true, 'La clé d\'inscription est requise'],
        unique: true
    },
    targetAudience: {
        type: String,
        default: 'Tous'
    },
    category: {
        type: String,
        default: 'Informatique'
    },
    isPublic: {
        type: Boolean,
        default: true
    },

    // Contenu du cours
    videos: [{
        title: String,
        url: String,
        duration: String,
        order: Number
    }],

    documents: [{
        title: String,
        url: String,
        fileType: String,
        size: String,
        order: Number
    }],

    // Quizzes
    quizzes: [{
        name: { type: String, required: true },
        questions: [{
            question: String,
            choices: [String],
            correctAnswer: Number   // index of the correct choice in choices[]
        }],
        submissions: [{
            student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
            answers: [Number],      // student's chosen choice index per question
            score: Number,
            submittedAt: { type: Date, default: Date.now }
        }]
    }],

    // Métadonnées
    thumbnail: {
        type: String,
        default: 'default-course.jpg'
    },
    duration: {
        type: String
    },
    level: {
        type: String,
        enum: ['Débutant', 'Intermédiaire', 'Avancé'],
        default: 'Débutant'
    },

    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],

    isActive: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index pour la recherche
courseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Course', courseSchema);
