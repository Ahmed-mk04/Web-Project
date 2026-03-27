
// Helper function to handle fetch requests
async function postData(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

// TOGGLE UI LOGIC (Existing)
const container = document.querySelector('.container');
if (document.querySelector('.register-btn')) {
    document.querySelector('.register-btn').addEventListener('click', () => {
        container.classList.add('active');
    });
}
if (document.querySelector('.login-btn')) {
    document.querySelector('.login-btn').addEventListener('click', () => {
        container.classList.remove('active');
    });
}

// REGISTER UI LOGIC (Existing + Updated for role)
const chooseBtns = document.querySelectorAll('.choose-btn');
const stepChoose = document.querySelector('.step-choose');
const stepFields = document.querySelector('.step-fields');
const roleInput = document.getElementById('role'); // Updated ID
const studentFields = document.querySelector('.student-fields');
const teacherFields = document.querySelector('.teacher-fields');

if (chooseBtns.length > 0) {
    chooseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            stepChoose.style.display = 'none';
            stepFields.style.display = 'block';
            if (roleInput) roleInput.value = type;

            if (type === 'student') {
                if (studentFields) studentFields.style.display = 'block';
                if (teacherFields) teacherFields.style.display = 'none';
            } else if (type === 'teacher') {
                if (studentFields) studentFields.style.display = 'none';
                if (teacherFields) teacherFields.style.display = 'block';
            } else {
                // Admin or other
                if (studentFields) studentFields.style.display = 'none';
                if (teacherFields) teacherFields.style.display = 'none';
            }
        });
    });
}

// LOGIN FORM SUBMISSION
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = loginForm.querySelector('input[name="email"]').value;
        const password = loginForm.querySelector('input[name="password"]').value;

        try {
            const data = await postData('http://localhost:3000/api/auth/login', {
                email,
                password
            });

            if (data.success && data.user) {
                // Stocker le token et les infos utilisateur
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirection selon le rôle
                if (data.user.role === 'admin') {
                    window.location.href = '../dashboard-admin.html';
                } else if (data.user.role === 'teacher') {
                    window.location.href = '../enseignant.html';
                } else {
                    window.location.href = '../cours/listecours.html';
                }
            } else {
                alert('Erreur de connexion: ' + (data.message || 'Identifiants invalides'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erreur de connexion au serveur. Assurez-vous que le backend est démarré.');
        }
    });
}

// REGISTER FORM SUBMISSION
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather data
        const formData = new FormData(registerForm);
        const data = {};
        formData.forEach((value, key) => { data[key] = value });

        // Map frontend names to backend expected names if they differ
        // Frontend: firstName, lastName, role are set.
        // Frontend: register_email -> email
        // Frontend: register_password -> password

        const payload = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.register_email, // mapped from name="register_email" if not touched
            password: data.register_password, // mapped from name="register_password"
            role: data.role || 'student',
            // Student specific
            studentId: data.student_id,
            year: data.student_year,
            // Teacher specific
            domain: data.teacher_domain,
            grade: data.teacher_grade
            // Add address if needed
        };

        try {
            const responseData = await postData('http://localhost:3000/api/auth/register', payload);

            if (responseData.success) {
                alert('Inscription réussie ! Veuillez vous connecter.');
                // Switch to login view
                container.classList.remove('active');
                registerForm.reset();
                // Reset to step 1
                stepChoose.style.display = 'block';
                stepFields.style.display = 'none';
            } else {
                let errorMsg = responseData.message || 'Échec de l\'inscription';
                if (responseData.errors && Array.isArray(responseData.errors)) {
                    errorMsg += '\nDetails:\n' + responseData.errors.join('\n');
                }
                alert('Erreur: ' + errorMsg);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erreur lors de l\'inscription. Assurez-vous que le backend est démarré.');
        }
    });
}
