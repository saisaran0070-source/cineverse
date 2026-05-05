/* ============================================
   CineVerse — Login Page Logic
   Firebase Authentication
   ============================================ */
// Global variables provided by firebase.js


// === DOM Helpers ===
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// === Check if already logged in ===
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.replace('index.html');
    }
});

// Prefetch main page resources for faster redirect
const prefetchLink = document.createElement('link');
prefetchLink.rel = 'prefetch';
prefetchLink.href = 'index.html';
document.head.appendChild(prefetchLink);
const prefetchCSS = document.createElement('link');
prefetchCSS.rel = 'prefetch';
prefetchCSS.href = 'styles.css';
document.head.appendChild(prefetchCSS);
const prefetchJS = document.createElement('link');
prefetchJS.rel = 'prefetch';
prefetchJS.href = 'app.js';
document.head.appendChild(prefetchJS);

// === Floating 3D Objects Background ===
function createFloatingObjects() {
    const container = $('#floatingPosters');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing
    
    const icons = ['fa-film', 'fa-ticket-alt', 'fa-star', 'fa-video', 'fa-clapperboard', 'fa-popcorn', 'fa-glasses'];
    const colors = [
        '#ff3cac', '#00f5d4', '#ffd700', '#e74c3c', '#8b5cf6', '#f72585', '#a8ff78'
    ];

    for (let i = 0; i < 12; i++) {
        const obj = document.createElement('i');
        // Randomly select icon and color
        const iconClass = icons[Math.floor(Math.random() * icons.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        obj.className = `fas ${iconClass} floating-object`;
        obj.style.color = color;
        obj.style.textShadow = `0 0 20px ${color}`;
        
        // Randomize size, position, and animation
        const size = Math.random() * 40 + 20; // 20px to 60px
        obj.style.fontSize = `${size}px`;
        obj.style.left = `${Math.random() * 90 + 5}%`;
        obj.style.animationDuration = `${15 + Math.random() * 25}s`;
        obj.style.animationDelay = `${Math.random() * 10}s`;
        
        // Random 3D rotation start
        obj.style.transform = `translateZ(${Math.random() * 100 - 50}px)`;
        
        container.appendChild(obj);
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

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            showLoginToast('Login successful! Redirecting...', 'success');
            // Auth observer will handle the redirect
        })
        .catch((error) => {
            btn.classList.remove('loading');
            btn.disabled = false;
            let msg = 'Invalid email or password';
            if (error.code === 'auth/user-not-found') msg = 'No account found with this email';
            if (error.code === 'auth/wrong-password') msg = 'Incorrect password';
            if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password';
            showLoginToast(msg, 'error');
            showFieldError('#loginPasswordGroup', '#loginPasswordError', msg);
        });
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

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Update profile with name
            updateProfile(userCredential.user, {
                displayName: name
            }).then(() => {
                showLoginToast('Account created successfully!', 'success');
                // Auth observer will redirect
            });
        })
        .catch((error) => {
            btn.classList.remove('loading');
            btn.disabled = false;
            let msg = 'Failed to create account';
            if (error.code === 'auth/email-already-in-use') {
                msg = 'Email already registered. Please sign in.';
                showFieldError('#signupEmailGroup', '#signupEmailError', 'Email already in use');
            } else if (error.code === 'auth/weak-password') {
                msg = 'Password is too weak';
                showFieldError('#signupPasswordGroup', '#signupPasswordError', 'Password is too weak');
            } else {
                msg = `Error: ${error.code} - ${error.message}`;
            }
            showLoginToast(msg, 'error');
        });
});

// === Social Login ===
$$('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('phone')) return; // Handled by setupPhoneAuth
        if (btn.classList.contains('google')) {
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Connecting...</span>';
            btn.style.opacity = '0.8';
            btn.style.pointerEvents = 'none';
            
            signInWithPopup(auth, provider)
                .then((result) => {
                    showLoginToast('Welcome! Redirecting...', 'success');
                    window.location.replace('index.html');
                })
                .catch((error) => {
                    btn.innerHTML = originalContent;
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                    console.error("Google Auth Error:", error);
                    if (error.code !== 'auth/popup-closed-by-user') {
                        showLoginToast(`Google Error: ${error.message}`, 'error');
                    }
                });
        } else {
            const tempProvider = btn.classList.contains('github') ? 'GitHub' : 'Twitter';
            showLoginToast(`${tempProvider} login coming soon!`, 'info');
        }
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

// === Phone Login Implementation (Surgical Addition) ===
let confirmationResult = null;

function setupPhoneAuth() {
    if (!$('#phoneLoginBtn')) return;

    const phoneBtns = [$('#phoneLoginBtn'), $('#phoneSignupBtn')];
    
    phoneBtns.forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            const modal = $('#otpModal');
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
            
            $('#phoneInputGroup').style.display = 'block';
            $('#otpInputGroup').style.display = 'none';
            $('#sendOtpBtn').style.display = 'block';
            $('#verifyOtpBtn').style.display = 'none';
            $('#sendOtpBtn').disabled = false;
            $('#sendOtpBtn').textContent = 'Send Code';
        });
    });

    $('#closeOtpModal').addEventListener('click', (e) => {
        e.preventDefault();
        const modal = $('#otpModal');
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 400);
        if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    });

    $('#sendOtpBtn').addEventListener('click', async () => {
        const number = $('#phoneNumber').value.trim();
        if (!number || number.length < 8) {
            showLoginToast('Please enter a valid phone number', 'error');
            return;
        }

        $('#sendOtpBtn').disabled = true;
        $('#sendOtpBtn').textContent = 'Sending...';

        try {
            // Lazy-init reCAPTCHA if not ready (Surgical Fix)
            if (!window.recaptchaVerifier) {
                const RecaptchaClass = window.RecaptchaVerifier || (typeof firebase !== 'undefined' ? firebase.auth.RecaptchaVerifier : null);
                if (!RecaptchaClass) throw new Error('Firebase Auth not ready. Please refresh.');
                
                window.recaptchaVerifier = new RecaptchaClass('recaptcha-container', {
                    'size': 'invisible',
                    'callback': (response) => { console.log('reCAPTCHA solved'); }
                });
            }

            confirmationResult = await signInWithPhoneNumber(auth, number, window.recaptchaVerifier);
            showLoginToast('Code sent! Check your phone.', 'success');
            
            $('#phoneInputGroup').style.display = 'none';
            $('#otpInputGroup').style.display = 'block';
            $('#sendOtpBtn').style.display = 'none';
            $('#verifyOtpBtn').style.display = 'block';
        } catch (error) {
            console.error('Phone Auth Error:', error);
            showLoginToast('Connection Issue: ' + error.message, 'error');
            
            // RESET BUTTON STATE (Fix for 'Stuck' Button)
            $('#sendOtpBtn').disabled = false;
            $('#sendOtpBtn').textContent = 'Send Code';
            
            if (window.recaptchaVerifier && window.recaptchaVerifier.render) {
                try {
                    const widgetId = await window.recaptchaVerifier.render();
                    if (typeof grecaptcha !== 'undefined') grecaptcha.reset(widgetId);
                } catch (e) {
                    window.recaptchaVerifier = null; // Force re-init on next click
                }
            }
        }
    });

    $('#verifyOtpBtn').addEventListener('click', async () => {
        const code = $('#otpCode').value.trim();
        if (code.length !== 6) {
            showLoginToast('Enter the 6-digit code', 'error');
            return;
        }

        $('#verifyOtpBtn').disabled = true;
        $('#verifyOtpBtn').textContent = 'Verifying...';

        try {
            await confirmationResult.confirm(code);
            showLoginToast('Phone verified! Redirecting...', 'success');
            // Auth observer in login.js will handle redirect
        } catch (error) {
            console.error('OTP Verification Error:', error);
            showLoginToast('Invalid code. Try again.', 'error');
            $('#verifyOtpBtn').disabled = false;
            $('#verifyOtpBtn').textContent = 'Verify Code';
        }
    });
}

// === Init ===
createFloatingObjects();
setupPhoneAuth();

// === 3D Tilt Effect ===
const authCard = $('.auth-card');
const loginContainer = $('.login-container');

if (authCard && loginContainer) {
    loginContainer.addEventListener('mousemove', (e) => {
        const rect = loginContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Max tilt of 12 degrees
        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;
        
        authCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    loginContainer.addEventListener('mouseleave', () => {
        authCard.style.transform = `rotateX(0deg) rotateY(0deg)`;
    });
}

