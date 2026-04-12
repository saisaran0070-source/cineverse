/* ============================================
   CineVerse — Login Page Logic
   localStorage-based auth for demo purposes
   ============================================ */

// === DOM Helpers ===
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// === Check if already logged in ===
(function checkAuth() {
    const user = JSON.parse(localStorage.getItem('cineverse_user') || 'null');
    if (user) {
        window.location.href = 'index.html';
    }
})();

// === Floating Posters Background ===
function createFloatingPosters() {
    const container = $('#floatingPosters');
    const colors = [
        ['#ff3cac', '#784ba0'], ['#00f5d4', '#2b86c5'], ['#ffd700', '#ff6b35'],
        ['#e74c3c', '#c0392b'], ['#8b5cf6', '#a855f7'], ['#f72585', '#b5179e'],
        ['#141e30', '#243b55'], ['#a8ff78', '#78ffd6'], ['#ff416c', '#ff4b2b'],
    ];

    for (let i = 0; i < 8; i++) {
        const poster = document.createElement('div');
        poster.className = 'floating-poster';
        const [c1, c2] = colors[i % colors.length];
        poster.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
        poster.style.left = `${Math.random() * 90 + 5}%`;
        poster.style.animationDuration = `${20 + Math.random() * 20}s`;
        poster.style.animationDelay = `${Math.random() * 15}s`;
        container.appendChild(poster);
    }
}

// === Toggle Forms ===
$('#showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    $('#loginForm').classList.remove('active');
    $('#signupForm').classList.add('active');
});

$('#showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    $('#signupForm').classList.remove('active');
    $('#loginForm').classList.add('active');
});

// === Toggle Password Visibility ===
function setupPasswordToggle(toggleBtn, inputId) {
    toggleBtn.addEventListener('click', () => {
        const input = $(inputId);
        const icon = toggleBtn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
}

setupPasswordToggle($('#toggleLoginPassword'), '#loginPassword');
setupPasswordToggle($('#toggleSignupPassword'), '#signupPassword');

// === Password Strength ===
$('#signupPassword').addEventListener('input', function () {
    const val = this.value;
    const fill = $('#strengthFill');
    const text = $('#strengthText');

    let strength = 0;
    if (val.length >= 6) strength++;
    if (val.length >= 10) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    const levels = [
        { width: '0%', color: 'transparent', label: '' },
        { width: '20%', color: '#ff4757', label: 'Weak' },
        { width: '40%', color: '#ffa502', label: 'Fair' },
        { width: '60%', color: '#ffd700', label: 'Good' },
        { width: '80%', color: '#2ed573', label: 'Strong' },
        { width: '100%', color: '#00f5d4', label: 'Excellent' },
    ];

    const level = levels[strength];
    fill.style.width = level.width;
    fill.style.background = level.color;
    text.textContent = level.label;
    text.style.color = level.color;
});

// === Validation ===
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(groupId, errorId, message) {
    $(groupId).classList.add('error');
    $(errorId).textContent = message;
}

function clearFieldError(groupId, errorId) {
    $(groupId).classList.remove('error');
    $(errorId).textContent = '';
}

function clearAllErrors() {
    $$('.input-group').forEach(g => g.classList.remove('error'));
    $$('.input-error').forEach(e => e.textContent = '');
}

// === Toast ===
function showLoginToast(message, type = 'info') {
    // Remove existing toast
    const existing = $('.login-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `login-toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// === Login Handler ===
$('#loginFormElement').addEventListener('submit', function (e) {
    e.preventDefault();
    clearAllErrors();

    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    let valid = true;

    if (!email) {
        showFieldError('#loginEmailGroup', '#loginEmailError', 'Email is required');
        valid = false;
    } else if (!validateEmail(email)) {
        showFieldError('#loginEmailGroup', '#loginEmailError', 'Enter a valid email address');
        valid = false;
    }

    if (!password) {
        showFieldError('#loginPasswordGroup', '#loginPasswordError', 'Password is required');
        valid = false;
    }

    if (!valid) return;

    const btn = $('#loginBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    // Simulate login delay
    setTimeout(() => {
        // Check localStorage for registered users
        const users = JSON.parse(localStorage.getItem('cineverse_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Successful login
            localStorage.setItem('cineverse_user', JSON.stringify({
                name: user.name,
                email: user.email,
                avatar: user.name.charAt(0).toUpperCase(),
                loginTime: Date.now()
            }));
            showLoginToast('Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = 'index.html', 1200);
        } else if (users.length === 0) {
            // No users registered — allow demo login with any credentials
            localStorage.setItem('cineverse_user', JSON.stringify({
                name: email.split('@')[0],
                email: email,
                avatar: email.charAt(0).toUpperCase(),
                loginTime: Date.now()
            }));
            showLoginToast('Welcome to CineVerse!', 'success');
            setTimeout(() => window.location.href = 'index.html', 1200);
        } else {
            showLoginToast('Invalid email or password', 'error');
            showFieldError('#loginEmailGroup', '#loginEmailError', 'Check your email');
            showFieldError('#loginPasswordGroup', '#loginPasswordError', 'Check your password');
        }

        btn.classList.remove('loading');
        btn.disabled = false;
    }, 1500);
});

// === Signup Handler ===
$('#signupFormElement').addEventListener('submit', function (e) {
    e.preventDefault();
    clearAllErrors();

    const name = $('#signupName').value.trim();
    const email = $('#signupEmail').value.trim();
    const password = $('#signupPassword').value;
    const confirm = $('#signupConfirm').value;
    const terms = $('#termsCheck').checked;
    let valid = true;

    if (!name) {
        showFieldError('#signupNameGroup', '#signupNameError', 'Name is required');
        valid = false;
    } else if (name.length < 2) {
        showFieldError('#signupNameGroup', '#signupNameError', 'Name must be at least 2 characters');
        valid = false;
    }

    if (!email) {
        showFieldError('#signupEmailGroup', '#signupEmailError', 'Email is required');
        valid = false;
    } else if (!validateEmail(email)) {
        showFieldError('#signupEmailGroup', '#signupEmailError', 'Enter a valid email address');
        valid = false;
    }

    if (!password) {
        showFieldError('#signupPasswordGroup', '#signupPasswordError', 'Password is required');
        valid = false;
    } else if (password.length < 6) {
        showFieldError('#signupPasswordGroup', '#signupPasswordError', 'Password must be at least 6 characters');
        valid = false;
    }

    if (password !== confirm) {
        showFieldError('#signupConfirmGroup', '#signupConfirmError', 'Passwords do not match');
        valid = false;
    }

    if (!terms) {
        showLoginToast('Please accept the Terms of Service', 'error');
        valid = false;
    }

    if (!valid) return;

    const btn = $('#signupBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
        // Check if email already exists
        const users = JSON.parse(localStorage.getItem('cineverse_users') || '[]');
        if (users.find(u => u.email === email)) {
            showLoginToast('Email already registered. Please sign in.', 'error');
            showFieldError('#signupEmailGroup', '#signupEmailError', 'Email already in use');
            btn.classList.remove('loading');
            btn.disabled = false;
            return;
        }

        // Register user
        users.push({ name, email, password });
        localStorage.setItem('cineverse_users', JSON.stringify(users));

        // Auto login
        localStorage.setItem('cineverse_user', JSON.stringify({
            name,
            email,
            avatar: name.charAt(0).toUpperCase(),
            loginTime: Date.now()
        }));

        showLoginToast('Account created successfully!', 'success');
        setTimeout(() => window.location.href = 'index.html', 1200);

        btn.classList.remove('loading');
        btn.disabled = false;
    }, 1500);
});

// === Social Login (Demo) ===
$$('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const provider = btn.classList.contains('google') ? 'Google' :
                         btn.classList.contains('github') ? 'GitHub' : 'Twitter';
        showLoginToast(`${provider} login coming soon!`, 'info');
    });
});

// === Forgot Password ===
$('#forgotPasswordLink').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginToast('Password reset link sent to your email!', 'info');
});

// === Enter key support ===
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const activeForm = $('.auth-form.active');
        if (activeForm.id === 'loginForm') {
            $('#loginFormElement').dispatchEvent(new Event('submit'));
        } else {
            $('#signupFormElement').dispatchEvent(new Event('submit'));
        }
    }
});

// === Init ===
createFloatingPosters();
