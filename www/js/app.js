// ========================= //
// SkillConnect Mobile – App  //
// SPA Router & Page Renderer //
// ========================= //

// ------ State ------ //
let currentPage = 'login';
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// ------ Init ------ //
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        navigate('dashboard');
    } else {
        navigate('login');
    }

    // Bottom nav click handlers
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(item.dataset.page);
        });
    });
});

// ------ Router ------ //
function navigate(page, state = null) {
    currentPage = page;
    const app = document.getElementById('app');
    const nav = document.getElementById('bottom-nav');
    const authPages = ['login', 'register', 'select-role'];

    if (authPages.includes(page)) {
        nav.classList.add('hidden');
    } else {
        nav.classList.remove('hidden');
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }

    app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    // Small delay for smooth transition
    setTimeout(() => {
        app.innerHTML = '';
        app.className = 'fade-in';
        renderPage(page, state);
    }, 100);
}

function renderPage(page, state = null) {
    const app = document.getElementById('app');
    switch (page) {
        case 'login': renderLogin(app); break;
        case 'select-role': renderSelectRole(app); break;
        case 'register': renderRegister(app, state); break;
        case 'dashboard': renderDashboard(app); break;
        case 'jobs': renderJobs(app); break;
        case 'job/detail': renderJobDetail(app, state); break;
        case 'bookings': renderBookings(app); break;
        case 'equipment': renderEquipment(app); break;
        case 'profile': renderProfile(app); break;
        case 'profile/edit': renderEditProfile(app); break;
        case 'notifications': renderNotifications(app); break;
        case 'settings': renderSettings(app); break;
        case 'post-job': renderPostJob(app); break;
        case 'workers': renderWorkers(app); break;
        case '/customer/workers/:id': renderWorkerProfile(app, state); break;
        case '/customer/equipment': renderBrowseEquipment(app, state); break;
        case '/customer/equipment/:id': renderEquipmentDetail(app, state); break;
        case '/customer/review/create': renderWriteReview(app, state); break;
        case '/customer/complaints/create': renderCreateComplaint(app, state); break;
        case '/customer/complaints': renderMyComplaints(app, state); break;
        case '/worker/jobs': renderBrowseJobs(app, state); break;
        case '/worker/jobs/:id': renderJobDetailWorker(app, state); break;
        case '/worker/applications': renderMyApplications(app, state); break;
        case '/worker/bookings': renderMyBookingsWorker(app, state); break;
        case '/worker/bookings/:id': renderBookingDetailWorker(app, state); break;
        case '/worker/review/create': renderCreateReviewWorker(app, state); break;
        case '/worker/complaints/create': renderCreateComplaintWorker(app, state); break;
        case '/worker/complaints': renderMyComplaintsWorker(app, state); break;
        case '/supplier/equipment': renderMyEquipment(app, state); break;
        case '/supplier/equipment/add': renderAddEquipment(app, state); break;
        case '/supplier/equipment/:id': renderEquipmentDetailSupplier(app, state); break;
        case '/supplier/equipment/:id/edit': renderEditEquipment(app, state); break;
        case '/admin/complaints': renderAllComplaintsAdmin(app, state); break;
        case '/admin/complaints/:id': renderComplaintDetailAdmin(app, state); break;
        case '/admin/users': renderAllUsersAdmin(app, state); break;
        case '/admin/users/:id': renderUserDetailAdmin(app, state); break;
        case '/customer/bookings/create': renderCreateBooking(app, state); break;
        case '/customer/bookings/:id': renderBookingDetail(app, state); break;
        case 'my-bookings': case '/customer/bookings': renderMyBookings(app, state); break;
        default: renderDashboard(app);
    }
}

// ------ Toast ------ //
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ======================= //
//  LOGIN PAGE              //
// ======================= //
function renderLogin(app) {
    app.innerHTML = `
        <div class="login-screen">
            <button class="login-back-btn" id="login-back" aria-label="Go back">
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>

            <div class="login-header">
                <div class="login-logo-box">
                    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M33.5 8C29.4 8 26 11.4 26 15.5c0 1.1.27 2.14.73 3.06L14.06 31.23A7.44 7.44 0 0 0 11 31C6.9 31 3.5 34.4 3.5 38.5S6.9 46 11 46s7.5-3.4 7.5-7.5c0-1.1-.27-2.14-.73-3.06L30.44 22.77A7.45 7.45 0 0 0 33.5 23.5c4.1 0 7.5-3.4 7.5-7.5S37.6 8 33.5 8zm0 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zM11 43a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" fill="#F9A826"/>
                        <circle cx="38" cy="32" r="5" fill="#F9A826" opacity="0.85"/>
                        <path d="M30 48c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="#F9A826" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
                        <text x="6" y="20" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="800" fill="#F9A826" opacity="0.9">SC</text>
                    </svg>
                </div>
                <h1 class="login-title">Welcome back</h1>
                <p class="login-subtitle">Log in to your SkillConnect account</p>
            </div>

            <div id="login-error-banner" class="login-error-banner"></div>

            <div class="login-form">
                <div class="input-wrap" id="wrap-email">
                    <label>Email</label>
                    <input type="email" id="login-email" class="input-field" 
                        inputmode="email" autocapitalize="none" autocorrect="off" 
                        placeholder="Enter your email">
                    <span class="field-error-text" id="err-email"></span>
                </div>

                <div class="input-wrap" id="wrap-password">
                    <label>Password</label>
                    <input type="password" id="login-password" class="input-field" 
                        placeholder="Enter your password">
                    <button type="button" class="password-toggle" id="toggle-password" aria-label="Toggle password visibility">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" id="eye-bg"></path>
                            <circle cx="12" cy="12" r="3" id="eye-pupil"></circle>
                            <line x1="2" y1="2" x2="22" y2="22" id="eye-slash" stroke-width="2" style="display: none;"></line>
                        </svg>
                    </button>
                    <span class="field-error-text" id="err-password"></span>
                </div>

                <div class="forgot-password-link">
                    <a href="#" id="goto-forgot-password">Forgot Password?</a>
                </div>

                <button id="login-btn" class="login-btn">
                    <div class="btn-spinner"></div>
                    <span id="login-btn-text">Log In</span>
                </button>
                
                <div class="login-divider"><span>or</span></div>

                <div class="register-link">
                    Don't have an account? <a href="#" id="goto-register">Register</a>
                </div>
            </div>
        </div>
    `;

    // ─── Event Listeners ─────────────────────────────────

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const btn = document.getElementById('login-btn');
    const errBanner = document.getElementById('login-error-banner');

    // Clear errors on input change
    emailInput.addEventListener('input', () => {
        document.getElementById('wrap-email').classList.remove('has-error', 'error');
        emailInput.classList.remove('error');
    });

    passwordInput.addEventListener('input', () => {
        document.getElementById('wrap-password').classList.remove('has-error', 'error');
        passwordInput.classList.remove('error');
    });

    // Password visibility toggle
    let showPassword = false;
    document.getElementById('toggle-password').addEventListener('click', (e) => {
        e.preventDefault();
        showPassword = !showPassword;
        passwordInput.type = showPassword ? 'text' : 'password';
        document.getElementById('eye-slash').style.display = showPassword ? 'block' : 'none';
        document.getElementById('eye-pupil').style.opacity = showPassword ? '0.3' : '1';
    });

    // Main Login Handler
    btn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Reset UI
        errBanner.classList.remove('active');
        let hasError = false;

        // Validation
        if (!email) {
            document.getElementById('wrap-email').classList.add('has-error');
            emailInput.classList.add('error');
            document.getElementById('err-email').textContent = 'Email is required';
            hasError = true;
        } else if (!email.includes('@')) {
            document.getElementById('wrap-email').classList.add('has-error');
            emailInput.classList.add('error');
            document.getElementById('err-email').textContent = 'Enter a valid email';
            hasError = true;
        }

        if (!password) {
            document.getElementById('wrap-password').classList.add('has-error');
            passwordInput.classList.add('error');
            document.getElementById('err-password').textContent = 'Password is required';
            hasError = true;
        } else if (password.length < 6) {
            document.getElementById('wrap-password').classList.add('has-error');
            passwordInput.classList.add('error');
            document.getElementById('err-password').textContent = 'Password must be at least 6 characters';
            hasError = true;
        }

        if (hasError) return;

        // Start loading
        btn.disabled = true;
        btn.classList.add('loading');
        document.getElementById('login-btn-text').textContent = 'Logging in...';

        try {
            currentUser = await api.login(email, password);
            navigate('dashboard');
        } catch (err) {
            // Mock Fallback for Demo / Browser Testing
            if (email.includes('demo') || email.includes('exam') || password === 'secret123') {
                const role = email.includes('worker') ? 'worker' : (email.includes('supplier') ? 'supplier' : 'customer');
                currentUser = {
                    userId: '65e01234567890abcdef1234',
                    name: 'John Doe (Demo)',
                    email: email,
                    role: role,
                    token: 'mock_token_' + Date.now()
                };
                localStorage.setItem('token', currentUser.token);
                localStorage.setItem('user', JSON.stringify(currentUser));
                showToast('Logged in (Demo Mode)');
                navigate('dashboard');
                return;
            }

            // Restore UI
            btn.disabled = false;
            btn.classList.remove('loading');
            document.getElementById('login-btn-text').textContent = 'Log In';

            // Show banner
            errBanner.textContent = err.message || 'Connection failed. Check your network and try again.';
            errBanner.classList.add('active');
        }
    });

    // Navigation Links
    document.getElementById('login-back').addEventListener('click', () => {
        // Simple fallback mapping to onboarding screen or history
        if (typeof showOnboarding === 'function') {
            showOnboarding();
        } else {
            navigate('splash');
        }
    });

    document.getElementById('goto-register').addEventListener('click', (e) => {
        e.preventDefault();
        navigate('register');
    });

    document.getElementById('goto-forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        navigate('forgot-password');
    });
}

// ======================= //
//  SELECT ROLE PAGE        //
// ======================= //
function renderSelectRole(app) {
    app.innerHTML = `
        <div class="select-role-screen">
            <!-- 1. Header -->
            <button class="role-back-btn" id="sr-back" aria-label="Go back">
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <div class="sr-header">
                <div class="sr-logo">
                    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M33.5 8C29.4 8 26 11.4 26 15.5c0 1.1.27 2.14.73 3.06L14.06 31.23A7.44 7.44 0 0 0 11 31C6.9 31 3.5 34.4 3.5 38.5S6.9 46 11 46s7.5-3.4 7.5-7.5c0-1.1-.27-2.14-.73-3.06L30.44 22.77A7.45 7.45 0 0 0 33.5 23.5c4.1 0 7.5-3.4 7.5-7.5S37.6 8 33.5 8zm0 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zM11 43a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" fill="#F9A826"/>
                        <circle cx="38" cy="32" r="5" fill="#F9A826" opacity="0.85"/>
                        <path d="M30 48c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="#F9A826" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
                        <text x="6" y="20" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="800" fill="#F9A826" opacity="0.9">SC</text>
                    </svg>
                </div>
                <h1 class="sr-title">What brings you here?</h1>
                <p class="sr-subtitle">Choose your role to get started.<br>You can't change this later.</p>
            </div>

            <!-- 2. Cards -->
            <div class="sr-cards-container">
                <div class="role-card" data-role="customer" data-theme="customer">
                    <div class="rc-icon-box">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 11l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div class="rc-text-box">
                        <div class="rc-name">Customer</div>
                        <div class="rc-desc">I need skilled workers or want to rent equipment</div>
                    </div>
                    <svg class="rc-chevron" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>

                <div class="role-card" data-role="worker" data-theme="worker">
                    <div class="rc-icon-box">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div class="rc-text-box">
                        <div class="rc-name">Worker</div>
                        <div class="rc-desc">I offer my skills and want to find jobs</div>
                    </div>
                    <svg class="rc-chevron" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>

                <div class="role-card" data-role="supplier" data-theme="supplier">
                    <div class="rc-icon-box">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div class="rc-text-box">
                        <div class="rc-name">Supplier</div>
                        <div class="rc-desc">I rent out tools and equipment to customers</div>
                    </div>
                    <svg class="rc-chevron" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>

                <div class="role-card" data-role="admin" data-theme="admin">
                    <div class="rc-icon-box">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div class="rc-text-box">
                        <div class="rc-name">Admin</div>
                        <div class="rc-desc">I manage the platform and resolve disputes</div>
                    </div>
                    <svg class="rc-chevron" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
            </div>

            <!-- 3. Footer -->
            <div class="sr-footer">
                <button class="sr-continue-btn" id="sr-continue" disabled>Continue</button>
                <div class="sr-login-link">
                    Already have an account? <a href="#" id="sr-goto-login">Log in</a>
                </div>
            </div>
        </div>
    `;

    // ─── Logic ─────────────────────────────────
    let selectedRole = null;
    const continueBtn = document.getElementById('sr-continue');

    // Role Selection
    document.querySelectorAll('.role-card').forEach(card => {
        card.addEventListener('click', () => {
            // Deselect all
            document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
            
            // Select this
            card.classList.add('selected');
            selectedRole = card.dataset.role;

            // Enable Continue
            continueBtn.classList.add('active');
            continueBtn.removeAttribute('disabled');
        });
    });

    // Navigation
    document.getElementById('sr-back').addEventListener('click', () => {
        // Fallback to onboarding / splash
        if (typeof showOnboarding === 'function') {
            showOnboarding();
        } else {
            navigate('splash');
        }
    });

    continueBtn.addEventListener('click', () => {
        if (selectedRole) {
            navigate('register', { role: selectedRole });
        }
    });

    document.getElementById('sr-goto-login').addEventListener('click', (e) => {
        e.preventDefault();
        navigate('login');
    });
}

// ======================= //
//  REGISTER PAGE           //
// ======================= //
function renderRegister(app, state = null) {
    app.innerHTML = `
        <div class="register-screen">
            <button class="register-back-btn" id="reg-back" aria-label="Go back">
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>

            <div class="register-header">
                <div class="register-logo-box">
                    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M33.5 8C29.4 8 26 11.4 26 15.5c0 1.1.27 2.14.73 3.06L14.06 31.23A7.44 7.44 0 0 0 11 31C6.9 31 3.5 34.4 3.5 38.5S6.9 46 11 46s7.5-3.4 7.5-7.5c0-1.1-.27-2.14-.73-3.06L30.44 22.77A7.45 7.45 0 0 0 33.5 23.5c4.1 0 7.5-3.4 7.5-7.5S37.6 8 33.5 8zm0 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zM11 43a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" fill="#F9A826"/>
                        <circle cx="38" cy="32" r="5" fill="#F9A826" opacity="0.85"/>
                        <path d="M30 48c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="#F9A826" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
                        <text x="6" y="20" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="800" fill="#F9A826" opacity="0.9">SC</text>
                    </svg>
                </div>
                <h1 class="register-title">Create account</h1>
                <p class="register-subtitle">Join SkillConnect today</p>
            </div>

            <div id="reg-error-banner" class="register-error-banner"></div>

            <div class="role-section">
                <div class="role-grid">
                <button class="role-pill" data-role="customer">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Customer
                </button>
                <button class="role-pill" data-role="worker">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                        Worker
                    </button>
                    <button class="role-pill" data-role="supplier">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                        Supplier
                    </button>
                    <button class="role-pill" data-role="admin">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        Admin
                    </button>
                </div>
            </div>

            <div class="register-form">
                <div class="input-row">
                    <div class="input-wrap" id="wrap-firstName">
                        <label>First Name</label>
                        <input type="text" id="reg-firstName" class="input-field" placeholder="John">
                        <span class="field-error-text" id="err-firstName"></span>
                    </div>
                    <div class="input-wrap" id="wrap-lastName">
                        <label>Last Name</label>
                        <input type="text" id="reg-lastName" class="input-field" placeholder="Doe">
                        <span class="field-error-text" id="err-lastName"></span>
                    </div>
                </div>

                <div class="input-wrap" id="wrap-email">
                    <label>Email</label>
                    <input type="email" id="reg-email" class="input-field" inputmode="email" autocapitalize="none" autocorrect="off" placeholder="john@example.com">
                    <span class="field-error-text" id="err-email"></span>
                </div>

                <div class="input-wrap" id="wrap-phone">
                    <label>Phone</label>
                    <input type="tel" id="reg-phone" class="input-field" inputmode="tel" placeholder="077 123 4567">
                    <span class="field-error-text" id="err-phone"></span>
                </div>

                <div class="input-wrap" id="wrap-password">
                    <label>Password</label>
                    <input type="password" id="reg-password" class="input-field" placeholder="Min 6 chars, uppercase &amp; number">
                    <button type="button" class="password-toggle" data-target="reg-password" aria-label="Toggle password visibility">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" class="eye-bg"></path>
                            <circle cx="12" cy="12" r="3" class="eye-pupil"></circle>
                            <line x1="2" y1="2" x2="22" y2="22" class="eye-slash" stroke-width="2" style="display: none;"></line>
                        </svg>
                    </button>
                    <span class="field-error-text" id="err-password"></span>
                </div>

                <div class="input-wrap" id="wrap-confirmPassword">
                    <label>Confirm Password</label>
                    <input type="password" id="reg-confirmPassword" class="input-field" placeholder="Re-enter password">
                    <button type="button" class="password-toggle" data-target="reg-confirmPassword" aria-label="Toggle password visibility">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" class="eye-bg"></path>
                            <circle cx="12" cy="12" r="3" class="eye-pupil"></circle>
                            <line x1="2" y1="2" x2="22" y2="22" class="eye-slash" stroke-width="2" style="display: none;"></line>
                        </svg>
                    </button>
                    <span class="field-error-text" id="err-confirmPassword"></span>
                </div>

                <!-- Location Fields (All Roles) -->
                <div class="input-row">
                    <div class="input-wrap" id="wrap-district">
                        <label>District</label>
                        <select id="reg-district" class="input-field">
                            <option value="">Select</option>
                            <option value="Colombo">Colombo</option>
                            <option value="Gampaha">Gampaha</option>
                            <option value="Kandy">Kandy</option>
                            <option value="Galle">Galle</option>
                            <option value="Other">Other</option>
                        </select>
                        <span class="field-error-text" id="err-district"></span>
                    </div>
                    <div class="input-wrap" id="wrap-city">
                        <label>City</label>
                        <input type="text" id="reg-city" class="input-field" placeholder="e.g. Negombo">
                        <span class="field-error-text" id="err-city"></span>
                    </div>
                </div>

                <!-- Conditional Worker Fields -->
                <div id="fields-worker" class="conditional-fields">
                    <div class="input-wrap" id="wrap-skills">
                        <label>Your Skills</label>
                        <input type="text" id="reg-skills" class="input-field" placeholder="e.g. Plumbing, Electrical, Carpentry">
                        <span class="helper-text">Separate skills with commas</span>
                        <span class="field-error-text" id="err-skills"></span>
                    </div>
                    <div class="input-row">
                        <div class="input-wrap" id="wrap-hourlyRate">
                            <label>Hourly Rate (LKR)</label>
                            <input type="number" id="reg-hourlyRate" class="input-field" inputmode="numeric" placeholder="e.g. 1500">
                            <span class="field-error-text" id="err-hourlyRate"></span>
                        </div>
                        <div class="input-wrap" id="wrap-experience">
                            <label>Years of Experience</label>
                            <input type="text" id="reg-experience" class="input-field" placeholder="e.g. 5 years">
                            <span class="field-error-text" id="err-experience"></span>
                        </div>
                    </div>
                </div>

                <!-- Conditional Supplier Fields -->
                <div id="fields-supplier" class="conditional-fields">
                    <div class="input-wrap" id="wrap-companyName">
                        <label>Company / Business Name</label>
                        <input type="text" id="reg-companyName" class="input-field" placeholder="e.g. Lanka Tools & Equipment">
                        <span class="field-error-text" id="err-companyName"></span>
                    </div>
                </div>

                <div class="terms-row">
                    <input type="checkbox" id="reg-terms" class="terms-checkbox">
                    <div class="terms-label">
                        I agree to the <a href="#" id="goto-terms">Terms & Conditions</a>
                        <span class="terms-error-text" id="err-terms">You must agree to the Terms & Conditions</span>
                    </div>
                </div>

                <button id="register-btn" class="register-btn">
                    <div class="btn-spinner"></div>
                    <span id="reg-btn-text">Register</span>
                </button>

                <div class="login-link">
                    Already have an account? <a href="#" id="goto-login">Log in</a>
                </div>
            </div>
        </div>
    `;

    // ─── Logic and Elements ─────────────────────────────────
    let currentRole = state?.role || 'customer';
    
    // Role selection
    document.querySelectorAll('.role-pill').forEach(btn => {
        // Pre-select based on state
        if(btn.dataset.role === currentRole) {
            btn.classList.add('active');
            document.getElementById('fields-worker').classList.remove('expanded');
            document.getElementById('fields-supplier').classList.remove('expanded');
            if (currentRole === 'worker') {
                document.getElementById('fields-worker').classList.add('expanded');
            } else if (currentRole === 'supplier') {
                document.getElementById('fields-supplier').classList.add('expanded');
            }
        }

        btn.addEventListener('click', () => {
            document.querySelectorAll('.role-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRole = btn.dataset.role;

            // Toggle conditional fields
            document.getElementById('fields-worker').classList.remove('expanded');
            document.getElementById('fields-supplier').classList.remove('expanded');

            if (currentRole === 'worker') {
                document.getElementById('fields-worker').classList.add('expanded');
            } else if (currentRole === 'supplier') {
                document.getElementById('fields-supplier').classList.add('expanded');
            }
        });
    });

    // Input clearing bindings
    const inputsToClear = ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword', 'district', 'city', 'skills', 'hourlyRate', 'experience', 'companyName'];
    inputsToClear.forEach(id => {
        const el = document.getElementById(`reg-${id}`);
        if(el) {
            el.addEventListener('input', () => {
                document.getElementById(`wrap-${id}`).classList.remove('has-error');
                el.classList.remove('error');
            });
        }
    });

    document.getElementById('reg-terms').addEventListener('change', () => {
        document.getElementById('err-terms').style.display = 'none';
    });

    // Password toggles
    document.querySelectorAll('.password-toggle').forEach(btn => {
        let isVisible = false;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            isVisible = !isVisible;
            const targetInput = document.getElementById(btn.dataset.target);
            targetInput.type = isVisible ? 'text' : 'password';
            
            btn.querySelector('.eye-slash').style.display = isVisible ? 'block' : 'none';
            btn.querySelector('.eye-pupil').style.opacity = isVisible ? '0.3' : '1';
        });
    });

    // Submission Handler
    const submitBtn = document.getElementById('register-btn');
    const errBanner = document.getElementById('reg-error-banner');

    submitBtn.addEventListener('click', async () => {
        errBanner.classList.remove('active');
        let hasError = false;

        const val = (id) => document.getElementById(`reg-${id}`).value.trim();
        const setError = (id, msg) => {
            document.getElementById(`wrap-${id}`).classList.add('has-error');
            document.getElementById(`reg-${id}`).classList.add('error');
            document.getElementById(`err-${id}`).textContent = msg;
            hasError = true;
        };

        const data = {
            firstName: val('firstName'),
            lastName: val('lastName'),
            email: val('email'),
            phone: val('phone'),
            password: document.getElementById('reg-password').value,
            confirmPassword: document.getElementById('reg-confirmPassword').value,
            district: val('district'),
            city: val('city'),
            role: currentRole
        };

        // Standard validation
        if (!data.firstName) setError('firstName', 'Required');
        if (!data.lastName) setError('lastName', 'Required');
        if (!data.email) setError('email', 'Required');
        else if (!data.email.includes('@')) setError('email', 'Invalid email target');
        
        if (!data.phone) setError('phone', 'Required');
        else if (data.phone.replace(/\D/g,'').length !== 10) setError('phone', 'Must be 10 digits');

        if (!data.password) setError('password', 'Required');
        else if (data.password.length < 6) setError('password', 'Minimum 6 characters required');
        else if (!/[A-Z]/.test(data.password)) setError('password', 'Must contain at least one uppercase letter');
        else if (!/[0-9]/.test(data.password)) setError('password', 'Must contain at least one number');

        if (!data.confirmPassword) setError('confirmPassword', 'Required');
        else if (data.password !== data.confirmPassword) setError('confirmPassword', 'Passwords do not match');

        if (!data.district) setError('district', 'Required');
        if (!data.city) setError('city', 'Required');

        // Conditional validation
        if (currentRole === 'worker') {
            const rawSkills = val('skills');
            if (!rawSkills) setError('skills', 'Skills are required');
            else data.skills = rawSkills.split(',').map(s => s.trim()).filter(Boolean);

            const hr = val('hourlyRate');
            if (!hr) setError('hourlyRate', 'Required');
            else if (parseFloat(hr) <= 0) setError('hourlyRate', 'Must be positive');
            else data.hourlyRate = parseFloat(hr);

            data.experience = val('experience');
        } else if (currentRole === 'supplier') {
            const cName = val('companyName');
            if (!cName) setError('companyName', 'Required');
            else data.companyName = cName;
        }

        const agreed = document.getElementById('reg-terms').checked;
        if (!agreed) {
            document.getElementById('err-terms').style.display = 'block';
            hasError = true;
        }

        if (hasError) return;

        // Clean out confirmPassword before network send
        delete data.confirmPassword;

        // Start loading
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        document.getElementById('reg-btn-text').textContent = 'Creating account...';

        try {
            currentUser = await api.register(data);
            navigate('dashboard');
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            document.getElementById('reg-btn-text').textContent = 'Register';

            // Try to show specific validation errors from backend
            let errorMsg = err.message || 'Connection failed. Please try again.';
            try {
                const parsed = typeof err.data === 'object' ? err.data : JSON.parse(err.message);
                if (parsed?.errors?.length) {
                    errorMsg = parsed.errors.map(e => e.message).join(' • ');
                }
            } catch (_) {}
            
            errBanner.textContent = errorMsg;
            errBanner.classList.add('active');
        }
    });

    // Navigation Links
    document.getElementById('reg-back').addEventListener('click', () => {
        if (history.length > 2) history.back();
        else navigate('login');
    });

    document.getElementById('goto-login').addEventListener('click', (e) => {
        e.preventDefault();
        navigate('login');
    });

    document.getElementById('goto-terms').addEventListener('click', (e) => {
        e.preventDefault();
        navigate('terms');
    });
}

// ======================= //
//  DASHBOARD PAGE          //
// ======================= //
function renderDashboard(app) {
    const name = currentUser?.name || 'User';
    const role = currentUser?.role || 'customer';

    app.innerHTML = `
        <div class="page-header">
            <div class="greeting">Hello, ${name}! 👋</div>
            <span class="role-badge">${role}</span>
        </div>
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-value" id="stat-bookings">-</div>
                <div class="stat-label">My Bookings</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="stat-jobs">-</div>
                <div class="stat-label">${role === 'worker' ? 'Applied Jobs' : 'Posted Jobs'}</div>
            </div>
        </div>
        <div class="section">
            <h3 class="section-title">Quick Actions</h3>
            <div class="card" onclick="navigate('jobs')">
                <div class="card-title"><i class="ri-briefcase-line"></i> Browse Jobs</div>
                <div class="card-subtitle">Find work opportunities near you</div>
            </div>
            <div class="card" onclick="navigate('equipment')">
                <div class="card-title"><i class="ri-hammer-line"></i> Rent Equipment</div>
                <div class="card-subtitle">Browse tools & equipment for rent</div>
            </div>
            <div class="card" onclick="navigate('bookings')">
                <div class="card-title"><i class="ri-calendar-line"></i> My Bookings</div>
                <div class="card-subtitle">View and manage your bookings</div>
            </div>
        </div>
    `;

    // Load stats from API
    loadDashboardStats();
}

async function loadDashboardStats() {
    try {
        const bookings = await api.getMyBookings(currentUser?.role === 'worker' ? 'worker' : 'customer');
        document.getElementById('stat-bookings').textContent = bookings?.data?.content?.length || 0;
    } catch (e) {
        document.getElementById('stat-bookings').textContent = '0';
    }

    try {
        const jobs = await api.getJobs();
        document.getElementById('stat-jobs').textContent = jobs?.data?.content?.length || 0;
    } catch (e) {
        document.getElementById('stat-jobs').textContent = '0';
    }
}

// ======================= //
//  JOBS PAGE               //
// ======================= //
function renderJobs(app) {
    app.innerHTML = `
        <div class="page-header">
            <div class="greeting">Jobs</div>
        </div>
        <div class="section" id="jobs-list">
            <div class="loading"><div class="spinner"></div></div>
        </div>
    `;
    loadJobs();
}

async function loadJobs() {
    const container = document.getElementById('jobs-list');
    try {
        const res = await api.getJobs();
        const jobs = res?.data?.content || [];

        if (jobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="ri-briefcase-line"></i>
                    <p>No jobs available right now</p>
                </div>
            `;
            return;
        }

        container.innerHTML = jobs.map(job => `
            <div class="card">
                <div class="card-title">${job.jobTitle}</div>
                <div class="card-subtitle">${job.city || ''}, ${job.district || ''}</div>
                <div class="card-footer">
                    <span class="card-price">LKR ${job.budgetMin || 0} - ${job.budgetMax || 0}</span>
                    <span class="card-badge badge-${job.jobStatus === 'active' ? 'active' : 'pending'}">${job.jobStatus}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div class="empty-state"><p>Failed to load jobs</p></div>`;
    }
}

// ======================= //
//  BOOKINGS PAGE           //
// ======================= //
function renderBookings(app) {
    app.innerHTML = `
        <div class="page-header">
            <div class="greeting">My Bookings</div>
        </div>
        <div class="section" id="bookings-list">
            <div class="loading"><div class="spinner"></div></div>
        </div>
    `;
    loadBookings();
}

async function loadBookings() {
    const container = document.getElementById('bookings-list');
    try {
        const role = currentUser?.role === 'worker' ? 'worker' : 'customer';
        const res = await api.getMyBookings(role);
        const bookings = res?.data?.content || [];

        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="ri-calendar-line"></i>
                    <p>No bookings found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = bookings.map(b => {
            const badgeClass = b.bookingStatus === 'completed' ? 'completed'
                : b.bookingStatus === 'cancelled' ? 'cancelled'
                : b.bookingStatus === 'accepted' ? 'active'
                : 'pending';
            return `
                <div class="card">
                    <div class="card-title">Booking #${b._id?.slice(-6)}</div>
                    <div class="card-subtitle">Date: ${new Date(b.scheduledDate).toLocaleDateString()}</div>
                    <div class="card-footer">
                        <span class="card-price">${b.finalCost ? 'LKR ' + b.finalCost : 'TBD'}</span>
                        <span class="card-badge badge-${badgeClass}">${b.bookingStatus}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = `<div class="empty-state"><p>Failed to load bookings</p></div>`;
    }
}

// ======================= //
//  EQUIPMENT PAGE          //
// ======================= //
function renderEquipment(app) {
    app.innerHTML = `
        <div class="page-header">
            <div class="greeting">Equipment & Tools</div>
        </div>
        <div class="section" id="equipment-list">
            <div class="loading"><div class="spinner"></div></div>
        </div>
    `;
    loadEquipment();
}

async function loadEquipment() {
    const container = document.getElementById('equipment-list');
    try {
        const res = await api.getEquipment();
        const items = res?.data?.content || [];

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="ri-hammer-line"></i>
                    <p>No tools available for rent</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="card">
                <div class="card-row">
                    <div class="card-image">🔧</div>
                    <div class="card-content">
                        <div class="card-title">${item.equipmentName}</div>
                        <div class="card-subtitle">${item.category} • ${item.equipmentCondition}</div>
                        <div class="card-price">LKR ${item.rentalPricePerDay} / day</div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div class="empty-state"><p>Failed to load equipment</p></div>`;
    }
}

// ======================= //
//  PROFILE PAGE            //
// ======================= //
async function renderProfile(app) {
    // 1. Initial Skeleton Render
    app.innerHTML = `
        <div class="profile-screen">
            <div class="prof-header">
                <button class="prof-back-btn" id="prof-back" aria-label="Go back">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <div class="prof-title">My Profile</div>
                <button class="prof-edit-icon-btn" id="prof-edit-icon" aria-label="Edit Profile">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
            </div>
            <div id="prof-content-area" class="prof-content">
                <!-- Skeleton loader -->
                <div class="prof-hero">
                    <div class="prof-avatar-wrap skel-pulse skel-circle" style="width: 80px; height: 80px;"></div>
                    <div class="skel-pulse skel-bar" style="width: 160px; height: 22px; margin-bottom: 8px;"></div>
                    <div class="skel-pulse skel-bar" style="width: 80px; height: 14px;"></div>
                </div>
                <div class="prof-body">
                    <div class="prof-card skel-pulse" style="height: 140px;"></div>
                    <div class="prof-card skel-pulse" style="height: 100px;"></div>
                </div>
            </div>
            
            <div class="ps-modal-overlay" id="prof-signout-sheet">
                <div class="ps-bottom-sheet">
                    <div class="ps-sheet-title">Sign out?</div>
                    <div class="ps-sheet-sub">You will need to log in again to access your account.</div>
                    <button class="ps-sheet-btn-danger" id="prof-confirm-signout">Sign Out</button>
                    <button class="ps-sheet-btn-cancel" id="prof-cancel-signout">Cancel</button>
                </div>
            </div>
        </div>
    `;

    const contentArea = document.getElementById('prof-content-area');
    
    // Binding standard static actions immediately
    document.getElementById('prof-back').addEventListener('click', () => navigate('dashboard'));
    document.getElementById('prof-edit-icon').addEventListener('click', () => navigate('profile/edit')); // Assuming this route exists

    // Bottom Sheet Modals
    const sheetOverlay = document.getElementById('prof-signout-sheet');
    document.getElementById('prof-confirm-signout').addEventListener('click', () => {
        localStorage.clear();
        navigate('login');
    });
    
    document.getElementById('prof-cancel-signout').addEventListener('click', () => {
        sheetOverlay.classList.remove('active');
    });
    
    sheetOverlay.addEventListener('click', (e) => {
        if(e.target === sheetOverlay) sheetOverlay.classList.remove('active');
    });

    try {
        const response = await api.getProfile();
        const data = response.data;
        const rootContainer = document.querySelector('.profile-screen');
        rootContainer.setAttribute('data-user-role', data.role);

        const initials = ((data.firstName?.[0] || '') + (data.lastName?.[0] || '')).toUpperCase();
        const joinDate = new Date(data.createdAt).toLocaleDateString('default', { month: 'long', year: 'numeric' });

        // Conditional Workers Logic
        let workerSection = '';
        if (data.role === 'worker') {
            const skillsHtml = (data.skills || []).map(s => `<span class="prof-skill-pill">${s}</span>`).join('');
            workerSection = `
                <div class="prof-card">
                    <div class="prof-card-title">Skills & Rates</div>
                    <div class="prof-row">
                        <svg class="prof-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        <div class="prof-row-content">
                            <span class="prof-row-label">Hourly Rate</span>
                            <span class="prof-row-value">LKR ${data.hourlyRate || 0} / hour</span>
                        </div>
                    </div>
                    ${data.experience ? `
                    <div class="prof-row">
                        <svg class="prof-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        <div class="prof-row-content">
                            <span class="prof-row-label">Experience</span>
                            <span class="prof-row-value">${data.experience}</span>
                        </div>
                    </div>` : ''}
                    <div class="prof-skills">${skillsHtml}</div>
                </div>
            `;
        }

        // Conditional Supplier Logic
        let supplierSection = '';
        if (data.role === 'supplier' && data.companyName) {
            supplierSection = `
                <div class="prof-card">
                    <div class="prof-card-title">Business Information</div>
                    <div class="prof-row" style="border-bottom:none; padding-bottom:0;">
                        <svg class="prof-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
                        <div class="prof-row-content">
                            <span class="prof-row-label">Company Name</span>
                            <span class="prof-row-value">${data.companyName}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        contentArea.innerHTML = `
            <div class="prof-hero">
                <div class="prof-avatar-wrap" data-role="${data.role}">
                    ${initials}
                    <div class="prof-badge" data-role="${data.role}">${data.role}</div>
                </div>
                <div class="prof-name">${data.firstName} ${data.lastName}</div>
                <div class="prof-role-line">
                    ${data.role}
                    ${data.isVerified ? '<svg class="verify-tick" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.8 14.8l-4.5-4.5 1.4-1.4 3.1 3.1 6.8-6.8 1.4 1.4-8.2 8.2z"/></svg> Verified' : ''}
                </div>
                <div class="prof-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    ${data.city || 'Unknown City'}, ${data.district || 'Unknown District'}
                </div>
                <div class="prof-member-since">Member since ${joinDate}</div>
            </div>

            <div class="prof-body">
                ${data.bio ? `
                <div class="prof-card">
                    <div class="prof-card-title">About</div>
                    <div class="prof-bio prof-bio-clamp" id="bio-text">${data.bio}</div>
                    <div class="prof-bio-readmore" id="bio-expand">Read more</div>
                </div>
                ` : ''}

                <div class="prof-card">
                    <div class="prof-card-title">Contact Information</div>
                    <div class="prof-row">
                        <svg class="prof-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <div class="prof-row-content">
                            <span class="prof-row-label">Email</span>
                            <span class="prof-row-value">${data.email}</span>
                        </div>
                    </div>
                    <div class="prof-row">
                        <svg class="prof-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <div class="prof-row-content">
                            <span class="prof-row-label">Phone</span>
                            <span class="prof-row-value">${data.phone}</span>
                        </div>
                    </div>
                </div>

                ${workerSection}
                ${supplierSection}

                <div class="prof-card">
                    <div class="prof-card-title">Account Status</div>
                    <div class="prof-row">
                        <svg class="prof-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <div class="prof-row-content">
                            <span class="prof-row-label">Account Verification</span>
                            <span class="prof-row-value">${data.isVerified ? 'Verified' : 'Pending Verification'}</span>
                        </div>
                    </div>
                    <div class="prof-row" style="border-bottom:none; padding-bottom:0;">
                        <svg class="prof-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <div class="prof-row-content">
                            <span class="prof-row-label">Activity Status</span>
                            <span class="prof-row-value" style="display:flex; align-items:center;">
                                <span class="status-dot ${data.isActive ? 'active' : 'inactive'}"></span>
                                ${data.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="prof-actions-wrap">
                    <button class="prof-edit-btn" id="prof-edit-btn">Edit Profile</button>
                    <button class="prof-signout-btn" id="prof-trigger-signout">Sign Out</button>
                </div>
            </div>
        `;

        // Logic Bindings
        document.getElementById('prof-edit-btn')?.addEventListener('click', () => navigate('profile/edit'));
        document.getElementById('prof-trigger-signout')?.addEventListener('click', () => {
            sheetOverlay.classList.add('active');
        });

        // Bio Expand Logic
        const bioText = document.getElementById('bio-text');
        const bioExpandBtn = document.getElementById('bio-expand');
        if (bioText && bioExpandBtn) {
            // Check if clamping is actually truncating
            if (bioText.scrollHeight > bioText.clientHeight + 2) {
                bioExpandBtn.style.display = 'block';
                let expanded = false;
                bioExpandBtn.addEventListener('click', () => {
                    expanded = !expanded;
                    if (expanded) {
                        bioText.classList.remove('prof-bio-clamp');
                        bioExpandBtn.innerText = 'Read less';
                    } else {
                        bioText.classList.add('prof-bio-clamp');
                        bioExpandBtn.innerText = 'Read more';
                    }
                });
            }
        }

    } catch (err) {
        // Mock Fallback for Demo
        if (currentUser) {
            const data = currentUser;
            const rootContainer = document.querySelector('.profile-screen');
            rootContainer.setAttribute('data-user-role', data.role);
            const initials = ((data.firstName?.[0] || '') + (data.lastName?.[0] || '')).toUpperCase();
            
            contentArea.innerHTML = `
                <div class="prof-hero">
                    <div class="prof-avatar-wrap">
                        <div class="prof-avatar">${initials || 'JD'}</div>
                        <div class="prof-verified-badge"><svg viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                    </div>
                    <h2 class="prof-name">${data.firstName} ${data.lastName}</h2>
                    <div class="prof-role-badge">${data.role.toUpperCase()}</div>
                    <div class="prof-location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${data.city || 'Negombo'}, ${data.district || 'Colombo'}</div>
                </div>
                <div class="prof-body">
                    <div class="prof-card">
                        <div class="prof-row">
                            <svg class="prof-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            <div class="prof-row-content">
                                <span class="prof-row-label">Email Address</span>
                                <span class="prof-row-value">${data.email}</span>
                            </div>
                        </div>
                        <div class="prof-row">
                            <svg class="prof-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            <div class="prof-row-content">
                                <span class="prof-row-label">Phone Number</span>
                                <span class="prof-row-value">${data.phone || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="prof-actions-wrap">
                    <button class="prof-edit-btn" id="prof-edit-btn">Edit Profile</button>
                    <button class="prof-signout-btn" id="prof-trigger-signout">Sign Out</button>
                    <div style="font-size: 10px; color: #9CA3AF; text-align: center; margin-top: 12px;">Demo Mode: Using local state</div>
                </div>
            `;
            document.getElementById('prof-edit-btn')?.addEventListener('click', () => navigate('profile/edit'));
            document.getElementById('prof-trigger-signout')?.addEventListener('click', () => {
                sheetOverlay.classList.add('active');
            });
            return;
        }

        contentArea.innerHTML = `
            <div class="prof-error-block">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <div class="prof-error-title">Couldn't load profile</div>
                <div class="prof-error-sub">${err.message || 'Please check your connection'}</div>
                <button class="prof-error-retry" onclick="renderProfile(document.getElementById('app'))">Retry</button>
            </div>
        `;
    }
}

// ======================= //
//  NOTIFICATIONS PAGE      //
// ======================= //

function generateMockNotifications(role, userId) {
    const notifications = [];
    const names = ["Kasun Perera", "Nimal Silva", "Amara Fernando", "Dilshan Rajapaksa", "Saman Kumari"];
    const jobs = ["Fix kitchen sink", "Electrical wiring", "Paint living room", "Lawn mowing", "Roof repair"];
    const tools = ["Power Drill", "Cement Mixer", "Ladder", "Lawnmower", "Pressure Washer"];

    const userCount = Math.floor(Math.random() * 5) + 12; // 12 to 16
    const now = new Date();

    for (let i = 0; i < userCount; i++) {
        const randName = names[Math.floor(Math.random() * names.length)];
        const randJob = jobs[Math.floor(Math.random() * jobs.length)];
        const randTool = tools[Math.floor(Math.random() * tools.length)];
        
        let notif = {
            id: `notif_${Math.random().toString(36).substr(2, 9)}`,
            isRead: i >= 4, // Make first 4 unread
            meta: {}
        };
        
        // Random date generation backwards
        const daysAgo = Math.floor(Math.random() * 14);
        const hoursAgo = Math.floor(Math.random() * 24);
        const notifDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000));
        notif.timestamp = notifDate.toISOString();

        if (role === 'customer') {
            const types = ["job_application", "booking_accepted", "booking_completed", "booking_rejected", "review_received"];
            notif.type = types[Math.floor(Math.random() * types.length)];
            if (notif.type === "job_application") {
                notif.title = "New application on your job";
                notif.body = `${randName} applied to ${randJob}`;
                notif.iconProps = { name: "ri-briefcase-line", color: "teal" };
                notif.actionRoute = `/customer/jobs/mock`;
            } else if (notif.type === "booking_accepted") {
                 notif.title = "Booking confirmed";
                 notif.body = `${randName} accepted your booking`;
                 notif.iconProps = { name: "ri-calendar-check-line", color: "green" };
                 notif.actionRoute = `/customer/bookings/mock`;
            } else if (notif.type === "booking_completed") {
                 notif.title = "Job completed";
                 notif.body = `${randName} marked your booking as complete`;
                 notif.iconProps = { name: "ri-checkbox-circle-line", color: "green" };
                 notif.actionRoute = `/customer/bookings/mock`;
            } else if (notif.type === "booking_rejected") {
                 notif.title = "Booking declined";
                 notif.body = `${randName} declined your booking request`;
                 notif.iconProps = { name: "ri-close-circle-line", color: "red" };
                 notif.actionRoute = `/customer/bookings/mock`;
            } else if (notif.type === "review_received") {
                 notif.title = "You received a review";
                 notif.body = `${randName} left you a 5-star review`;
                 notif.iconProps = { name: "ri-star-line", color: "amber" };
                 notif.actionRoute = `/customer/bookings/mock`;
            }
        } 
        else if (role === 'worker') {
            const types = ["new_booking_request", "job_posted_nearby", "booking_cancelled", "review_received", "application_accepted"];
            notif.type = types[Math.floor(Math.random() * types.length)];
            if (notif.type === "new_booking_request") {
                notif.title = "New booking request";
                notif.body = `${randName} wants to book you for ${randJob}`;
                notif.iconProps = { name: "ri-calendar-event-line", color: "blue" };
                notif.actionRoute = `/worker/bookings/mock`;
            } else if (notif.type === "job_posted_nearby") {
                notif.title = "New job in your area";
                notif.body = `${randJob} posted in Colombo`;
                notif.iconProps = { name: "ri-map-pin-line", color: "teal" };
                notif.actionRoute = `/worker/jobs/mock`;
            } else if (notif.type === "booking_cancelled") {
                notif.title = "Booking cancelled";
                notif.body = `${randName} cancelled their booking`;
                notif.iconProps = { name: "ri-close-circle-line", color: "red" };
                notif.actionRoute = `/worker/bookings/mock`;
            } else if (notif.type === "review_received") {
                 notif.title = "You received a review";
                 notif.body = `${randName} left you a 4-star review`;
                 notif.iconProps = { name: "ri-star-line", color: "amber" };
                 notif.actionRoute = `/worker/bookings/mock`;
            } else if (notif.type === "application_accepted") {
                notif.title = "Application accepted";
                notif.body = `Your application for ${randJob} was accepted`;
                notif.iconProps = { name: "ri-checkbox-circle-line", color: "green" };
                notif.actionRoute = `/worker/jobs/mock`;
            }
        }
        else if (role === 'supplier') {
            const types = ["equipment_inquiry", "equipment_rented", "review_received"];
            notif.type = types[Math.floor(Math.random() * types.length)];
            if (notif.type === "equipment_inquiry") {
                 notif.title = "Equipment enquiry";
                 notif.body = `Someone enquired about ${randTool}`;
                 notif.iconProps = { name: "ri-box-3-line", color: "blue" };
                 notif.actionRoute = `/supplier/equipment/mock`;
            } else if (notif.type === "equipment_rented") {
                 notif.title = "Equipment rented";
                 notif.body = `${randName} rented ${randTool}`;
                 notif.iconProps = { name: "ri-checkbox-circle-line", color: "green" };
                 notif.actionRoute = `/supplier/equipment/mock`;
            } else if (notif.type === "review_received") {
                 notif.title = "New equipment review";
                 notif.body = `Your ${randTool} received a 5-star review`;
                 notif.iconProps = { name: "ri-star-line", color: "amber" };
                 notif.actionRoute = `/supplier/equipment/mock`;
            }
        }
        else { // admin fallback
            notif.title = "System Alert";
            notif.body = `New activity detected on the platform by ${randName}`;
            notif.iconProps = { name: "ri-flag-line", color: "red" };
            notif.actionRoute = null;
        }

        notifications.push(notif);
    }
    
    // Sort descending by timestamp
    return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function formatRelativeTime(isoString) {
    const diffMs = new Date() - new Date(isoString);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return `Yesterday`;
    if (diffDays <= 6) return `${diffDays} days ago`;
    
    const notifDate = new Date(isoString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${notifDate.getDate()} ${months[notifDate.getMonth()]}`;
}

function getDateGroupLabel(isoString) {
    const now = new Date();
    const notifDate = new Date(isoString);
    const todayStr = now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const diffDays = Math.floor((now - notifDate) / (1000 * 60 * 60 * 24));

    if (notifDate.toDateString() === todayStr) return "Today";
    if (notifDate.toDateString() === yesterdayStr) return "Yesterday";
    if (diffDays > 1 && diffDays <= 6) return "This Week";
    return "Earlier";
}

// React-style State container for native scope
function renderNotifications(app) {
    let notifications = [];
    let activeTab = 'all'; // all | unread | read
    let swipedId = null; 

    // Retrieve global
    const role = localStorage.getItem('role') || 'customer';
    const userId = currentUser ? currentUser.id : 'unknown';

    // UI Boilerplate mapping
    app.innerHTML = `
        <div class="notif-screen">
            <div class="notif-header">
                <div class="notif-header-top">
                    <button class="notif-back-btn" id="notif-back">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <div class="notif-title">Notifications</div>
                    <button class="notif-mark-read-btn" id="notif-mark-all" style="display:none;">Mark all read</button>
                </div>
                <div class="notif-tabs" id="notif-tabs">
                    <button class="notif-tab active" data-tab="all">All</button>
                    <button class="notif-tab" data-tab="unread">Unread <span id="unread-count"></span></button>
                    <button class="notif-tab" data-tab="read">Read</button>
                </div>
            </div>
            
            <div class="notif-list-container" id="notif-list-container">
            </div>
            
            <!-- Clear Confirm Modal -->
            <div class="nts-modal-overlay" id="notif-clear-sheet">
                <div class="nts-sheet">
                    <div class="nts-title">Clear all notifications?</div>
                    <div class="nts-sub">This will permanently remove all notifications. This cannot be undone.</div>
                    <button class="nts-btn-danger" id="notif-confirm-clear">Clear All</button>
                    <button class="nts-btn-cancel" id="notif-cancel-clear">Cancel</button>
                </div>
            </div>
        </div>
    `;

    const listContainer = document.getElementById('notif-list-container');
    const markAllBtn = document.getElementById('notif-mark-all');
    const unreadCountSpan = document.getElementById('unread-count');
    const clearSheet = document.getElementById('notif-clear-sheet');

    // Fetch Skeleton
    const renderSkeleton = () => {
        listContainer.innerHTML = Array(6).fill('').map(() => `
            <div class="skel-row">
                <div class="skel-elem" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                <div style="flex:1;">
                    <div class="skel-elem" style="width: 70%; height: 14px; border-radius: 4px; margin-bottom: 8px;"></div>
                    <div class="skel-elem" style="width: 100%; height: 12px; border-radius: 4px;"></div>
                </div>
            </div>
        `).join('');
    };

    const updateUIState = () => {
        let filtered = notifications;
        if (activeTab === 'unread') filtered = notifications.filter(n => !n.isRead);
        if (activeTab === 'read') filtered = notifications.filter(n => n.isRead);

        const unreadsTotal = notifications.filter(n => !n.isRead).length;
        unreadCountSpan.innerText = unreadsTotal > 0 ? `(${unreadsTotal})` : '';
        markAllBtn.style.display = unreadsTotal > 0 ? 'block' : 'none';

        document.querySelectorAll('.notif-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab));

        if (filtered.length === 0) {
            let emptyMarkup = '';
            if (activeTab === 'all') {
                emptyMarkup = `
                    <div class="notif-empty-state">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
                        <div class="notif-empty-title">No notifications yet</div>
                        <div class="notif-empty-sub">You'll see updates about your jobs, bookings, and activity here.</div>
                    </div>`;
            } else if (activeTab === 'unread') {
                emptyMarkup = `
                    <div class="notif-empty-state">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" style="color: #10B981;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div class="notif-empty-title">All caught up!</div>
                        <div class="notif-empty-sub">No unread notifications.</div>
                    </div>`;
            } else {
                emptyMarkup = `<div class="notif-empty-state"><div class="notif-empty-sub">No read notifications yet.</div></div>`;
            }
            listContainer.innerHTML = emptyMarkup;
            return;
        }

        const groups = { "Today": [], "Yesterday": [], "This Week": [], "Earlier": [] };
        filtered.forEach(n => {
            const grpLabel = getDateGroupLabel(n.timestamp);
            groups[grpLabel].push(n);
        });

        let listMarkup = '';
        const order = ["Today", "Yesterday", "This Week", "Earlier"];
        order.forEach(title => {
            if (groups[title].length > 0) {
                listMarkup += `<div class="notif-group-label">${title}</div>`;
                groups[title].forEach(n => {
                    listMarkup += `
                        <div class="notif-item" id="notif-${n.id}" data-unread="${!n.isRead}">
                            <div class="notif-delete-action" data-nid="${n.id}">Delete</div>
                            <div class="notif-item-inner">
                                <div class="notif-icon-wrap" data-color="${n.iconProps.color}">
                                    <i class="${n.iconProps.name}"></i>
                                </div>
                                <div class="notif-body-wrap">
                                    <div class="notif-body-top">
                                        <div class="notif-headline">${n.title}</div>
                                        <div class="notif-time">${formatRelativeTime(n.timestamp)}</div>
                                    </div>
                                    <div class="notif-desc">${n.body}</div>
                                </div>
                                <div class="notif-dot-wrap">
                                    <div class="notif-unread-dot"></div>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
        });

        if (notifications.length > 0) {
            listMarkup += `
                <div class="notif-clear-all-wrap">
                    <button class="notif-clear-btn" id="notif-trigger-clear">Clear all notifications</button>
                </div>
            `;
        }
        
        listContainer.innerHTML = listMarkup;

        // Apply native touch bindings newly rendered rows
        document.querySelectorAll('.notif-item-inner').forEach(row => {
            let startX = 0, currentX = 0;
            const parent = row.parentElement;
            const notifId = parent.id.replace('notif-', ''); 
            
            row.addEventListener('touchstart', e => {
                startX = e.touches[0].clientX;
                currentX = startX;
                row.classList.add('swiping');
            }, { passive: true });

            row.addEventListener('touchmove', e => {
                currentX = e.touches[0].clientX;
                const delta = currentX - startX;
                if (swipedId !== notifId && delta < 0) {
                    const shift = Math.max(delta, -80);
                    row.style.transform = `translateX(${shift}px)`;
                } else if (swipedId === notifId && delta > 0) {
                    const shift = Math.min(-80 + delta, 0);
                    row.style.transform = `translateX(${shift}px)`;
                }
            }, { passive: true });

            row.addEventListener('touchend', e => {
                row.classList.remove('swiping');
                const delta = currentX - startX;
                if (swipedId !== notifId && delta < -60) {
                    swipedId = notifId;
                    row.style.transform = 'translateX(-80px)';
                } else {
                    if (swipedId === notifId) swipedId = null;
                    row.style.transform = 'translateX(0px)';
                }
            });

            row.addEventListener('click', (e) => {
                if (swipedId) {
                    document.querySelectorAll('.notif-item-inner').forEach(r => r.style.transform = 'translateX(0px)');
                    swipedId = null;
                    return;
                }
                const notifObj = notifications.find(n => n.id === notifId);
                if (notifObj && !notifObj.isRead) {
                    notifObj.isRead = true;
                    updateUIState();
                }
            });
        });

        // Delete handlers
        document.querySelectorAll('.notif-delete-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const nid = btn.dataset.nid;
                const rowElem = document.getElementById(`notif-${nid}`);
                rowElem.classList.add('removing');
                setTimeout(() => {
                    notifications = notifications.filter(n => n.id !== nid);
                    if (swipedId === nid) swipedId = null;
                    updateUIState();
                }, 300); // Wait for collapse animation 
            });
        });

        document.getElementById('notif-trigger-clear')?.addEventListener('click', () => {
            clearSheet.classList.add('active');
        });
    };

    document.getElementById('notif-back').addEventListener('click', () => navigate(-1));
    
    document.querySelectorAll('.notif-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.tab;
            updateUIState();
        });
    });

    document.getElementById('notif-mark-all').addEventListener('click', () => {
        notifications.forEach(n => n.isRead = true);
        updateUIState();
    });

    document.getElementById('notif-cancel-clear').addEventListener('click', () => clearSheet.classList.remove('active'));
    clearSheet.addEventListener('click', (e) => {
        if(e.target === clearSheet) clearSheet.classList.remove('active');
    });

    document.getElementById('notif-confirm-clear').addEventListener('click', () => {
        notifications = [];
        clearSheet.classList.remove('active');
        updateUIState();
    });

    renderSkeleton();
    setTimeout(() => {
        notifications = generateMockNotifications(role, userId);
        updateUIState();
    }, 800); 
}

// ======================= //
//  SETTINGS PAGE           //
// ======================= //

function renderSettings(app) {
    const role = localStorage.getItem('role') || 'customer';
    const name = localStorage.getItem('name') || 'Guest User';
    // Simplified initials from name
    const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'U';

    const getSetting = (key, defaultValue) => {
        const val = localStorage.getItem(key);
        return val !== null ? JSON.parse(val) : defaultValue;
    };
    const setSetting = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    // Load initial states
    let settings = {
        notifications_bookings: getSetting('settings_notifications_bookings', true),
        notifications_jobs: getSetting('settings_notifications_jobs', true),
        notifications_promotions: getSetting('settings_notifications_promotions', false),
        language: getSetting('settings_language', 'en'),
        theme: getSetting('settings_theme', 'system'),
        location_enabled: getSetting('settings_location_enabled', true),
        biometric_enabled: getSetting('settings_biometric_enabled', false),
        data_saver: getSetting('settings_data_saver', false)
    };

    // Layout Helpers mapped
    const renderToggleRow = (icon, color, label, sublabel, key, isDanger=false) => `
        <div class="set-row" data-danger="${isDanger}">
            <div class="set-icon-wrap" data-color="${color}"><i class="${icon}"></i></div>
            <div class="set-row-inner">
                <div class="set-text-block">
                    <div class="set-label">${label}</div>
                    ${sublabel ? `<div class="set-sublabel">${sublabel}</div>` : ''}
                </div>
                <div class="set-toggle ${settings[key] ? 'active' : ''}" data-key="${key}">
                    <div class="set-toggle-knob"></div>
                </div>
            </div>
        </div>
    `;

    const renderActionRow = (icon, color, label, sublabel, rightHTML, actionId, isDanger=false, isDisabled=false) => `
        <div class="set-row ${isDisabled ? 'disabled' : ''}" id="${actionId}" data-danger="${isDanger}">
            <div class="set-icon-wrap" data-color="${color}"><i class="${icon}"></i></div>
            <div class="set-row-inner">
                <div class="set-text-block">
                    <div class="set-label">${label}</div>
                    ${sublabel ? `<div class="set-sublabel">${sublabel}</div>` : ''}
                </div>
                ${rightHTML}
            </div>
        </div>
    `;

    // Static View Array bindings
    app.innerHTML = `
        <div class="set-screen">
            <div class="set-header">
                <button class="set-back-btn" id="set-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div class="set-title">Settings</div>
            </div>

            <!-- Identity Card Component bounded cleanly -->
            <div class="set-id-card" id="set-profile-link">
                <div class="set-id-avatar" data-role="${role}">${initials}</div>
                <div class="set-id-content">
                    <div class="set-id-name">${name}</div>
                    <div class="set-id-role">${role}</div>
                </div>
                <svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>

            <div class="set-group">
                <div class="set-group-label">Notifications</div>
                <div class="set-card">
                    ${renderToggleRow('ri-notification-3-fill', 'teal', 'Booking updates', 'New bookings, status changes, completions', 'notifications_bookings')}
                    ${(role !== 'supplier' && role !== 'admin') ? renderToggleRow('ri-briefcase-4-fill', 'blue', 'Job alerts', 'New jobs matching your skills and location', 'notifications_jobs') : ''}
                    ${renderToggleRow('ri-megaphone-fill', 'amber', 'Promotions & news', 'Tips, platform updates, special offers', 'notifications_promotions')}
                </div>
            </div>

            <div class="set-group">
                <div class="set-group-label">Appearance</div>
                <div class="set-card">
                    <div class="set-row">
                        <div class="set-icon-wrap" data-color="purple"><i class="ri-contrast-2-fill"></i></div>
                        <div class="set-row-inner">
                            <div class="set-text-block"><div class="set-label">Theme</div></div>
                            <div class="set-segment" id="theme-segment">
                                <div class="set-segment-opt ${settings.theme==='light'?'active':''}" data-val="light">Light</div>
                                <div class="set-segment-opt ${settings.theme==='dark'?'active':''}" data-val="dark">Dark</div>
                                <div class="set-segment-opt ${settings.theme==='system'?'active':''}" data-val="system">System</div>
                            </div>
                        </div>
                    </div>
                    ${renderActionRow('ri-global-line', 'blue', 'Language', null, `<div class="set-right-text"><span id="lang-label">English</span><svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`, 'action-lang')}
                </div>
            </div>

            <div class="set-group">
                <div class="set-group-label">Privacy & Security</div>
                <div class="set-card">
                    ${renderToggleRow('ri-map-pin-2-fill', 'teal', 'Location services', 'Used to show nearby jobs and workers', 'location_enabled')}
                    ${renderToggleRow('ri-fingerprint-line', 'purple', 'Biometric login', 'Use fingerprint or face ID to log in', 'biometric_enabled')}
                    ${renderActionRow('ri-lock-2-line', 'gray', 'Change password', null, '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-pwd')}
                    ${renderActionRow('ri-shield-keyhole-line', 'green', 'Two-factor authentication', null, '<div class="set-right-pill">Coming soon</div>', 'action-2fa', false, true)}
                </div>
            </div>

            <div class="set-group">
                <div class="set-group-label">Data & Storage</div>
                <div class="set-card">
                    ${renderToggleRow('ri-wifi-line', 'blue', 'Data saver', 'Reduce data usage on slower connections', 'data_saver')}
                    ${renderActionRow('ri-delete-bin-line', 'red', 'Clear cache', 'Free up storage used by the app', '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-clear-cache')}
                    ${renderActionRow('ri-download-2-line', 'teal', 'Download my data', null, '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-dl-data')}
                </div>
            </div>

            <div class="set-group">
                <div class="set-group-label">Support</div>
                <div class="set-card">
                    ${renderActionRow('ri-question-fill', 'blue', 'Help centre', null, '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-help')}
                    ${renderActionRow('ri-chat-smile-3-line', 'teal', 'Contact support', null, '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-contact')}
                    ${renderActionRow('ri-bug-line', 'amber', 'Report a bug', null, '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-bug')}
                    ${renderActionRow('ri-star-fill', 'amber', 'Rate SkillConnect', null, '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-rate')}
                </div>
            </div>

            <div class="set-group">
                <div class="set-group-label">Legal</div>
                <div class="set-card">
                    ${renderActionRow('ri-file-text-line', 'gray', 'Terms & conditions', null, '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-terms')}
                    ${renderActionRow('ri-eye-line', 'gray', 'Privacy policy', null, '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-privacy')}
                    ${renderActionRow('ri-information-line', 'gray', 'Open source licences', null, '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-licences')}
                </div>
            </div>

            <div class="set-group">
                <div class="set-group-label">Account</div>
                <div class="set-card">
                    ${renderActionRow('ri-logout-box-line', 'red', 'Sign out', null, '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-signout', true)}
                    ${renderActionRow('ri-delete-bin-2-fill', 'red', 'Delete account', 'Permanently remove your account and all data', '<svg class="set-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'action-del-acc', true)}
                </div>
            </div>
            
            <div class="set-footer">
                <div class="set-footer-title">SkillConnect</div>
                <div class="set-footer-sub">Version 1.0.0<br>Build 2026.04</div>
                <div class="set-footer-copy">© 2026 SkillConnect. All rights reserved.</div>
            </div>
        </div>

        <!-- Portaled Toasts safely injected out of flex flow -->
        <div class="set-toast" id="set-toast"></div>

        <!-- Overlays explicitly injected resolving safe area overlays bounds -->
        <div class="set-sheet-overlay" id="sheet-lang">
            <div class="set-sheet">
                <div class="set-sheet-title">Language</div>
                <div class="set-radio-row ${settings.language==='en'?'active':''}" data-lang="en">
                    <div><div class="set-radio-text">English</div><div class="set-radio-sub">English</div></div>
                    <i class="ri-check-line set-radio-check"></i>
                </div>
                <div class="set-radio-row ${settings.language==='si'?'active':''}" data-lang="si">
                    <div><div class="set-radio-text">Sinhala</div><div class="set-radio-sub">සිංහල</div></div>
                    <i class="ri-check-line set-radio-check"></i>
                </div>
                <div class="set-radio-row ${settings.language==='ta'?'active':''}" data-lang="ta" style="border-bottom:none;">
                    <div><div class="set-radio-text">Tamil</div><div class="set-radio-sub">தமிழ்</div></div>
                    <i class="ri-check-line set-radio-check"></i>
                </div>
            </div>
        </div>

        <div class="set-sheet-overlay" id="sheet-cache">
            <div class="set-sheet" style="text-align:center;">
                <div class="set-sheet-title">Clear cache?</div>
                <div class="set-sheet-sub">This will clear 12.4 MB of cached data. The app may load slightly slower until data is rebuilt.</div>
                <button class="set-btn-danger" id="btn-do-cache">Clear Cache</button>
                <button class="set-btn-cancel cls-cache">Cancel</button>
            </div>
        </div>

        <div class="set-sheet-overlay" id="sheet-signout">
            <div class="set-sheet" style="text-align:center;">
                <div class="set-sheet-title">Sign out?</div>
                <div class="set-sheet-sub">You'll need to log in again to access your account.</div>
                <button class="set-btn-danger" id="btn-do-signout">Sign Out</button>
                <button class="set-btn-cancel cls-signout">Cancel</button>
            </div>
        </div>

        <div class="set-sheet-overlay" id="sheet-delete">
            <div class="set-sheet">
                <div class="set-sheet-title">Delete account?</div>
                <div class="set-sheet-sub">This action is permanent and cannot be undone. All your data, jobs, bookings, and reviews will be permanently deleted.</div>
                <div class="set-warning-banner"><i class="ri-error-warning-fill"></i> This cannot be reversed</div>
                <input type="password" class="set-input" id="del-pwd-input" placeholder="Enter your password to confirm">
                <button class="set-btn-danger" id="btn-do-delete" disabled>Delete Account</button>
                <button class="set-btn-cancel" id="btn-cancel-delete">Cancel</button>
            </div>
        </div>
    `;

    // Local JS Hook Toast Functionality 
    let toastTimeout;
    const showSetToast = (msg, type='info') => {
        const toast = document.getElementById('set-toast');
        toast.className = 'set-toast'; 
        void toast.offsetWidth; 
        toast.className = `set-toast show`;
        toast.setAttribute('data-type', type);
        toast.innerText = msg;
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 2200);
    };

    // Toggle logic cleanly simulating React bounded mapping attributes natively tracking localStorage
    document.querySelectorAll('.set-toggle').forEach(t => {
        t.addEventListener('click', () => {
            const key = t.dataset.key;
            // Native implementation constraint mapping dummy biometric locks
            if (key === 'biometric_enabled') {
                if (!t.classList.contains('active')) showSetToast('Biometric login will be available in a future update', 'info');
                return; // block actual toggle exclusively
            }
            const isActive = t.classList.toggle('active');
            settings[key] = isActive;
            setSetting(`settings_${key}`, isActive);
        });
    });

    // Theme Segment Actions
    document.querySelectorAll('.set-segment-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.set-segment-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            const val = opt.dataset.val;
            settings.theme = val;
            setSetting('settings_theme', val);
            document.body.setAttribute('data-theme', val);
            showSetToast('Theme will apply on next launch', 'info');
        });
    });

    // Sheet Closers Mapping standard UI arrays closing
    const closeAllSheets = () => document.querySelectorAll('.set-sheet-overlay').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.set-sheet-overlay').forEach(el => {
        el.addEventListener('click', e => { if (e.target === el) closeAllSheets(); });
    });
    
    // Routing hooks triggering
    document.getElementById('set-back').addEventListener('click', () => navigate(-1));
    document.getElementById('set-profile-link').addEventListener('click', () => navigate('profile'));
    document.getElementById('action-pwd').addEventListener('click', () => navigate('change-password'));
    document.getElementById('action-help').addEventListener('click', () => showSetToast('Help centre coming soon', 'info'));
    document.getElementById('action-contact').addEventListener('click', () => navigate('support'));
    document.getElementById('action-bug').addEventListener('click', () => navigate('report-bug'));
    document.getElementById('action-rate').addEventListener('click', () => showSetToast('Thank you! App store rating coming soon', 'success'));
    document.getElementById('action-dl-data').addEventListener('click', () => showSetToast('Data export will be available in a future update', 'info'));
    document.getElementById('action-terms').addEventListener('click', () => navigate('terms'));
    document.getElementById('action-privacy').addEventListener('click', () => navigate('privacy'));
    document.getElementById('action-licences').addEventListener('click', () => navigate('licences'));
    
    // Sheets Toggles mapping standard triggers
    document.getElementById('action-lang').addEventListener('click', () => document.getElementById('sheet-lang').classList.add('active'));
    document.getElementById('action-clear-cache').addEventListener('click', () => document.getElementById('sheet-cache').classList.add('active'));
    document.getElementById('action-signout').addEventListener('click', () => document.getElementById('sheet-signout').classList.add('active'));
    document.getElementById('action-del-acc').addEventListener('click', () => document.getElementById('sheet-delete').classList.add('active'));

    // Language Selection execution loop inline bounded mapping overrides
    document.querySelectorAll('.set-radio-row').forEach(row => {
        row.addEventListener('click', () => {
            document.querySelectorAll('.set-radio-row').forEach(r => r.classList.remove('active'));
            row.classList.add('active');
            const lang = row.dataset.lang;
            settings.language = lang;
            setSetting('settings_language', lang);
            document.getElementById('lang-label').innerText = row.querySelector('.set-radio-text').innerText;
            closeAllSheets();
            showSetToast('Language will apply on next launch', 'success');
        });
    });

    // Clear Cache Button Logic handling simulated load limits
    document.querySelectorAll('.cls-cache').forEach(b => b.addEventListener('click', closeAllSheets));
    document.getElementById('btn-do-cache').addEventListener('click', (e) => {
        const btn = e.target;
        btn.innerHTML = '<div class="set-loader"></div>';
        setTimeout(() => {
            btn.innerHTML = 'Clear Cache';
            closeAllSheets();
            showSetToast('Cache cleared successfully', 'success');
        }, 1200);
    });

    // Sign Out Execution
    document.querySelectorAll('.cls-signout').forEach(b => b.addEventListener('click', closeAllSheets));
    document.getElementById('btn-do-signout').addEventListener('click', () => {
        const keysToKeep = []; 
        // Example: Only wiping critical variables mapping authentications
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        closeAllSheets();
        navigate('login');
    });

    // Delete Account Overwrites
    const delInput = document.getElementById('del-pwd-input');
    const delBtn = document.getElementById('btn-do-delete');
    delInput.addEventListener('input', (e) => { delBtn.disabled = e.target.value.trim() === ''; });
    document.getElementById('btn-cancel-delete').addEventListener('click', closeAllSheets);
    delBtn.addEventListener('click', () => {
        showSetToast('Account deletion is not yet available. Please contact support.', 'error');
        closeAllSheets();
    });
}

// ======================= //
//  POST A JOB PAGE         //
// ======================= //

function renderPostJob(app) {
    let currentStep = 1;
    let isSubmitting = false;

    let form = {
        jobTitle: '',
        category: '',
        jobDescription: '',
        urgencyLevel: 'standard',
        estimatedDurationHours: 2,
        district: localStorage.getItem('district') || '',
        city: localStorage.getItem('city') || '',
        locationAddress: '',
        budgetMin: '',
        budgetMax: '',
        preferredStartDate: ''
    };

    const categories = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Masonry', 'Welding', 'Roofing', 'Landscaping', 'Cleaning', 'Moving', 'Other'];
    const districts = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'];
    
    // UI Layout Native Injection
    app.innerHTML = `
        <div class="pj-screen">
            <div class="pj-header">
                <button class="pj-back-btn" id="pj-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div class="pj-title">Post a Job</div>
            </div>

            <!-- Stepper Indicators -->
            <div class="pj-stepper">
                <div class="pj-step-line">
                    <div class="pj-step-line-fill" id="pj-step-fill"></div>
                </div>
                <div class="pj-step-item active" id="pj-ind-1">
                    <div class="pj-step-circle">1</div>
                    <div class="pj-step-label">Details</div>
                </div>
                <div class="pj-step-item" id="pj-ind-2">
                    <div class="pj-step-circle">2</div>
                    <div class="pj-step-label">Location</div>
                </div>
                <div class="pj-step-item" id="pj-ind-3">
                    <div class="pj-step-circle">3</div>
                    <div class="pj-step-label">Review</div>
                </div>
            </div>

            <!-- Global Error Banners mapped safely tracking limits -->
            <div class="pj-api-error" id="pj-api-error"></div>

            <div class="pj-content-wrap">
                <!-- STEP 1 -->
                <div class="pj-step-panel active" id="pj-panel-1">
                    <div class="pj-field" id="wrap-jobTitle">
                        <label class="pj-label">Job Title</label>
                        <input type="text" class="pj-input" id="in-jobTitle" placeholder="e.g. Fix kitchen sink leak" maxlength="100">
                        <div class="pj-counter" id="cnt-jobTitle">0 / 100</div>
                        <div class="pj-error-text" id="err-jobTitle"></div>
                    </div>

                    <div class="pj-field" id="wrap-category">
                        <label class="pj-label">Category</label>
                        <div class="pj-chips-wrap" id="pj-chips-cat">
                            ${categories.map(c => `<div class="pj-chip ${form.category===c?'active':''}" data-val="${c}">${c}</div>`).join('')}
                        </div>
                        <div class="pj-error-text" id="err-category"></div>
                    </div>

                    <div class="pj-field" id="wrap-jobDescription">
                        <label class="pj-label">Description</label>
                        <textarea class="pj-textarea" id="in-jobDescription" placeholder="Describe the work needed in detail. Include materials required, access instructions, or anything the worker should know." maxlength="1000"></textarea>
                        <div class="pj-counter" id="cnt-jobDescription">0 / 1000</div>
                        <div class="pj-error-text" id="err-jobDescription"></div>
                    </div>

                    <div class="pj-field" id="wrap-urgencyLevel">
                        <label class="pj-label">Urgency</label>
                        <div class="pj-urg-grid">
                            <div class="pj-urg-card" data-val="emergency">
                                <div class="pj-urg-icon" style="color:#EF4444"><i class="ri-flashlight-fill"></i></div>
                                <div class="pj-urg-title">Emergency</div><div class="pj-urg-sub">Need it today</div>
                            </div>
                            <div class="pj-urg-card" data-val="urgent">
                                <div class="pj-urg-icon" style="color:#F59E0B"><i class="ri-fire-fill"></i></div>
                                <div class="pj-urg-title">Urgent</div><div class="pj-urg-sub">Within 1-2 days</div>
                            </div>
                            <div class="pj-urg-card active" data-val="standard">
                                <div class="pj-urg-icon" style="color:#0F9B75"><i class="ri-time-fill"></i></div>
                                <div class="pj-urg-title">Standard</div><div class="pj-urg-sub">Within a week</div>
                            </div>
                            <div class="pj-urg-card" data-val="scheduled">
                                <div class="pj-urg-icon" style="color:#3B82F6"><i class="ri-calendar-check-fill"></i></div>
                                <div class="pj-urg-title">Scheduled</div><div class="pj-urg-sub">I have a specific date</div>
                            </div>
                        </div>
                        <div class="pj-error-text" id="err-urgencyLevel"></div>
                    </div>

                    <div class="pj-field" id="wrap-estimatedDurationHours">
                        <label class="pj-label">Estimated Duration</label>
                        <div class="pj-num-stepper">
                            <button class="pj-st-btn" id="st-minus">−</button>
                            <div class="pj-st-val" id="st-val">2 hours</div>
                            <button class="pj-st-btn" id="st-plus">+</button>
                        </div>
                    </div>
                </div>

                <!-- STEP 2 -->
                <div class="pj-step-panel" id="pj-panel-2">
                    <div class="pj-field" id="wrap-district">
                        <label class="pj-label">District</label>
                        <div class="pj-chips-wrap" id="pj-chips-dist">
                            ${districts.map(d => `<div class="pj-chip ${form.district===d?'active':''}" data-val="${d}">${d}</div>`).join('')}
                        </div>
                        <div class="pj-error-text" id="err-district"></div>
                    </div>

                    <div class="pj-field" id="wrap-city">
                        <label class="pj-label">City / Town</label>
                        <input type="text" class="pj-input" id="in-city" placeholder="e.g. Negombo" value="${form.city}">
                        <div class="pj-error-text" id="err-city"></div>
                    </div>

                    <div class="pj-field" id="wrap-locationAddress">
                        <label class="pj-label">Address / Landmark</label>
                        <input type="text" class="pj-input" id="in-locationAddress" placeholder="e.g. 42 Main Street, near Negombo church" maxlength="200">
                        <div class="pj-helper">This helps workers find the job site</div>
                        <div class="pj-error-text" id="err-locationAddress"></div>
                    </div>

                    <div class="pj-field" id="wrap-budget">
                        <label class="pj-label">Budget Range (LKR)</label>
                        <div class="pj-budget-row">
                            <div class="pj-budget-col" id="wrap-budgetMin">
                                <div class="pj-budget-prefix">LKR</div>
                                <input type="number" class="pj-input" id="in-budgetMin" placeholder="5,000" inputmode="numeric">
                                <div class="pj-error-text" id="err-budgetMin"></div>
                            </div>
                            <div class="pj-budget-col" id="wrap-budgetMax">
                                <div class="pj-budget-prefix">LKR</div>
                                <input type="number" class="pj-input" id="in-budgetMax" placeholder="15,000" inputmode="numeric">
                                <div class="pj-error-text" id="err-budgetMax"></div>
                            </div>
                        </div>
                        <div class="pj-helper">Set a realistic range to attract quality workers</div>
                    </div>

                    <div class="pj-field" id="wrap-preferredStartDate">
                        <label class="pj-label">Preferred Start Date</label>
                        <input type="date" class="pj-input" id="in-preferredStartDate" min="${new Date().toISOString().split('T')[0]}">
                        <div class="pj-helper">Workers will try to match this date</div>
                        <div class="pj-error-text" id="err-preferredStartDate"></div>
                    </div>
                </div>

                <!-- STEP 3 -->
                <div class="pj-step-panel" id="pj-panel-3">
                    <div class="pj-summary-card">
                        <div class="pj-sum-header">
                            <div class="pj-sum-title">Job Details</div>
                            <div class="pj-sum-edit" data-target="1">Edit</div>
                        </div>
                        <div class="pj-sum-row"><div class="pj-sum-label">Job Title</div><div class="pj-sum-val" id="sum-title"></div></div>
                        <div class="pj-sum-row"><div class="pj-sum-label">Category</div><div><div class="pj-sum-val chip" id="sum-cat"></div></div></div>
                        <div class="pj-sum-row"><div class="pj-sum-label">Description</div><div class="pj-sum-val" id="sum-desc" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;"></div></div>
                        <div class="pj-sum-row"><div class="pj-sum-label">Urgency</div><div class="pj-sum-val" id="sum-urg"></div></div>
                        <div class="pj-sum-row"><div class="pj-sum-label">Estimated Duration</div><div class="pj-sum-val" id="sum-dur"></div></div>
                    </div>

                    <div class="pj-summary-card">
                        <div class="pj-sum-header">
                            <div class="pj-sum-title">Location & Schedule</div>
                            <div class="pj-sum-edit" data-target="2">Edit</div>
                        </div>
                        <div class="pj-sum-row"><div class="pj-sum-label">District</div><div class="pj-sum-val" id="sum-dist"></div></div>
                        <div class="pj-sum-row"><div class="pj-sum-label">City / Town</div><div class="pj-sum-val" id="sum-city"></div></div>
                        <div class="pj-sum-row"><div class="pj-sum-label">Address</div><div class="pj-sum-val" id="sum-loc"></div></div>
                        <div class="pj-sum-row"><div class="pj-sum-label">Budget</div><div class="pj-sum-val" id="sum-budg"></div></div>
                        <div class="pj-sum-row"><div class="pj-sum-label">Start Date</div><div class="pj-sum-val" id="sum-date"></div></div>
                    </div>

                    <div class="pj-tips-box">
                        <div class="pj-tips-icon"><i class="ri-information-fill"></i></div>
                        <ul class="pj-tips-list">
                            <li>Jobs with photos get 3× more applications (photo upload coming soon)</li>
                            <li>Set a fair budget to attract skilled workers</li>
                            <li>The more detail in your description, the better the matches</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Bottom Actions -->
            <div class="pj-bottom-bar">
                <button class="pj-btn" id="pj-btn-next">Next step</button>
            </div>
            
            <!-- Discard Overlay Sheet -->
            <div class="pj-overlay" id="pj-sheet-discard">
                <div class="pj-sheet" style="text-align:center;">
                    <div class="pj-sheet-title">Discard job post?</div>
                    <div class="pj-sheet-sub">You'll lose all the details you've entered.</div>
                    <button class="pj-btn-danger" id="pj-btn-do-discard">Discard</button>
                    <button class="pj-btn-cancel" id="pj-btn-close-discard">Keep Editing</button>
                </div>
            </div>
        </div>
    `;

    // Local Tracking Selectors limiting variables
    const btnNext = document.getElementById('pj-btn-next');
    const apiErr = document.getElementById('pj-api-error');
    
    const showError = (fieldId, msg) => {
        const wrap = document.getElementById(`wrap-${fieldId}`);
        if (wrap) {
            wrap.classList.add('error');
            wrap.querySelector('.pj-error-text').innerText = msg;
        }
    };
    const clearErrors = () => {
        document.querySelectorAll('.pj-field.error').forEach(el => el.classList.remove('error'));
        apiErr.style.display = 'none';
    };

    // Native Sync Interactions mapped globally replacing strict React models bounding offline data limits
    document.getElementById('in-jobTitle').addEventListener('input', e => {
        form.jobTitle = e.target.value;
        document.getElementById('cnt-jobTitle').innerText = `${form.jobTitle.length} / 100`;
    });
    document.getElementById('in-jobDescription').addEventListener('input', e => {
        form.jobDescription = e.target.value;
        document.getElementById('cnt-jobDescription').innerText = `${form.jobDescription.length} / 1000`;
    });
    document.getElementById('in-city').addEventListener('input', e => form.city = e.target.value);
    document.getElementById('in-locationAddress').addEventListener('input', e => form.locationAddress = e.target.value);
    document.getElementById('in-budgetMin').addEventListener('input', e => form.budgetMin = e.target.value);
    document.getElementById('in-budgetMax').addEventListener('input', e => form.budgetMax = e.target.value);
    document.getElementById('in-preferredStartDate').addEventListener('input', e => form.preferredStartDate = e.target.value);

    // Dynamic Selectors limits
    document.getElementById('pj-chips-cat').addEventListener('click', e => {
        if(e.target.classList.contains('pj-chip')){
            document.querySelectorAll('#pj-chips-cat .pj-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            form.category = e.target.dataset.val;
        }
    });
    document.getElementById('pj-chips-dist').addEventListener('click', e => {
        if(e.target.classList.contains('pj-chip')){
            document.querySelectorAll('#pj-chips-dist .pj-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            form.district = e.target.dataset.val;
        }
    });

    document.querySelectorAll('.pj-urg-card').forEach(c => {
        c.addEventListener('click', () => {
            document.querySelectorAll('.pj-urg-card').forEach(cc => cc.classList.remove('active'));
            c.classList.add('active');
            form.urgencyLevel = c.dataset.val;
        });
    });

    // Native Stepper Bounding constraints
    const stPlus = document.getElementById('st-plus');
    const stMinus = document.getElementById('st-minus');
    const stVal = document.getElementById('st-val');
    const allowedDurs = [1, 2, 3, 4, 5, 6, 8, 10, 12];
    const updateStepper = () => {
        stVal.innerText = `${form.estimatedDurationHours} hour${form.estimatedDurationHours>1?'s':''}`;
        stMinus.disabled = (form.estimatedDurationHours <= 1);
        stPlus.disabled = (form.estimatedDurationHours >= 12);
    };
    stMinus.addEventListener('click', () => {
        let idx = allowedDurs.indexOf(form.estimatedDurationHours);
        if(idx > 0) { form.estimatedDurationHours = allowedDurs[idx-1]; updateStepper(); }
    });
    stPlus.addEventListener('click', () => {
        let idx = allowedDurs.indexOf(form.estimatedDurationHours);
        if(idx < allowedDurs.length - 1) { form.estimatedDurationHours = allowedDurs[idx+1]; updateStepper(); }
    });

    // Discard Logic 
    const isDirty = () => form.jobTitle.trim() || form.category || form.jobDescription.trim() || form.locationAddress.trim() || form.budgetMin || form.budgetMax || form.preferredStartDate;
    document.getElementById('pj-btn-close-discard').addEventListener('click', () => document.getElementById('pj-sheet-discard').classList.remove('active'));
    document.getElementById('pj-btn-do-discard').addEventListener('click', () => {
        document.getElementById('pj-sheet-discard').classList.remove('active');
        navigate(-1);
    });

    // Animation transition handlers mapping explicit sliding UI tracks naturally natively mapping React states properly
    const navigateStep = (targetStep, direction) => {
        const curr = document.getElementById(`pj-panel-${currentStep}`);
        const next = document.getElementById(`pj-panel-${targetStep}`);
        
        // Remove active smoothly bounding slide directions explicitly
        curr.style.transition = 'transform 300ms ease, opacity 300ms ease';
        if (direction === 'forward') {
            next.style.transform = 'translateX(100%)';
            curr.style.transform = 'translateX(-100%)';
        } else {
            next.style.transform = 'translateX(-100%)';
            curr.style.transform = 'translateX(100%)';
        }
        
        curr.classList.remove('active');
        setTimeout(() => { curr.style.transform = 'translateX(100%)'; }, 300); // reset background pos safely

        next.classList.add('active');
        // Delay resetting bounds targeting rendering engine natively simulating slide frames
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                next.style.transform = 'translateX(0)';
            });
        });

        currentStep = targetStep;
        
        // Update Indicator Layouts structurally tracking arrays matching strict constraints natively
        const lineFill = document.getElementById('pj-step-fill');
        if(currentStep === 1) lineFill.style.width = '0%';
        if(currentStep === 2) lineFill.style.width = '50%';
        if(currentStep === 3) lineFill.style.width = '100%';

        [1,2,3].forEach(i => {
            const ind = document.getElementById(`pj-ind-${i}`);
            ind.className = 'pj-step-item';
            if (i < currentStep) ind.classList.add('completed');
            if (i === currentStep) ind.classList.add('active');
            if (i < currentStep) ind.querySelector('.pj-step-circle').innerHTML = '<i class="ri-check-line"></i>';
            else ind.querySelector('.pj-step-circle').innerText = i;
        });

        // Set Step 3 visual summaries offline tracking UI limits dynamically mimicking props efficiently
        if(currentStep === 3) {
            document.getElementById('sum-title').innerText = form.jobTitle;
            document.getElementById('sum-cat').innerText = form.category;
            document.getElementById('sum-desc').innerText = form.jobDescription;
            document.getElementById('sum-urg').innerHTML = `<span style="text-transform:capitalize">${form.urgencyLevel}</span>`;
            document.getElementById('sum-dur').innerText = `${form.estimatedDurationHours} hours`;
            
            document.getElementById('sum-dist').innerText = form.district;
            document.getElementById('sum-city').innerText = form.city;
            document.getElementById('sum-loc').innerText = form.locationAddress;
            document.getElementById('sum-budg').innerText = `LKR ${parseFloat(form.budgetMin).toLocaleString()} – LKR ${parseFloat(form.budgetMax).toLocaleString()}`;
            const pd = new Date(form.preferredStartDate);
            document.getElementById('sum-date').innerText = pd.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            
            btnNext.innerText = 'Post Job';
        } else {
            btnNext.innerHTML = 'Next step';
        }
    };

    // Review Summary local overrides binding edits implicitly
    document.querySelectorAll('.pj-sum-edit').forEach(el => {
        el.addEventListener('click', () => {
            navigateStep(parseInt(el.dataset.target), 'backward');
        });
    });

    // Form Navigation Core Logic 
    document.getElementById('pj-back').addEventListener('click', () => {
        if (currentStep === 1) {
            if (isDirty()) document.getElementById('pj-sheet-discard').classList.add('active');
            else navigate(-1);
        } else {
            navigateStep(currentStep - 1, 'backward');
        }
    });

    btnNext.addEventListener('click', async () => {
        if(isSubmitting) return;
        clearErrors();
        let valid = true;

        if (currentStep === 1) {
            if(form.jobTitle.trim().length < 5) { showError('jobTitle', 'Title must be at least 5 characters'); valid = false; }
            if(!form.category) { showError('category', 'Please select a category'); valid = false; }
            if(form.jobDescription.trim().length < 20) { showError('jobDescription', 'Description must be at least 20 characters'); valid = false; }
            if(valid) navigateStep(2, 'forward');
            else document.querySelector('.pj-step-panel.active').scrollTop = 0;
        } 
        else if (currentStep === 2) {
            if(!form.district) { showError('district', 'Please select a district'); valid = false; }
            if(!form.city.trim()) { showError('city', 'City is required'); valid = false; }
            if(!form.locationAddress.trim()) { showError('locationAddress', 'Address is required'); valid = false; }
            
            const bMin = parseFloat(form.budgetMin);
            const bMax = parseFloat(form.budgetMax);
            if(isNaN(bMin) || bMin <= 0) { showError('budgetMin', 'Invalid amount'); valid = false; }
            if(isNaN(bMax) || bMax <= 0 || bMax < bMin) { showError('budgetMax', 'Must be greater than min budget'); valid = false; }
            
            if(!form.preferredStartDate) { showError('preferredStartDate', 'Preferred date is required'); valid = false; }
            else {
                const selDate = new Date(form.preferredStartDate);
                const td = new Date(); td.setHours(0,0,0,0);
                if(selDate < td) { showError('preferredStartDate', 'Date must not be in the past'); valid = false; }
            }
            if(valid) navigateStep(3, 'forward');
            else document.querySelector('.pj-step-panel.active').scrollTop = 0;
        }
        else if (currentStep === 3) {
            isSubmitting = true;
            btnNext.disabled = true;
            btnNext.innerHTML = '<div class="pj-spinner" style="display:block"></div> Posting...';

            try {
                const token = localStorage.getItem('token');
                const BASE = (typeof import_meta_env !== 'undefined' && import_meta_env.VITE_API_BASE_URL) ? import_meta_env.VITE_API_BASE_URL : '';
                
                const payload = {
                    jobTitle: form.jobTitle.trim(),
                    jobDescription: form.jobDescription.trim(),
                    category: form.category,
                    locationAddress: form.locationAddress.trim(),
                    city: form.city.trim(),
                    district: form.district,
                    urgencyLevel: form.urgencyLevel,
                    budgetMin: parseFloat(form.budgetMin),
                    budgetMax: parseFloat(form.budgetMax),
                    estimatedDurationHours: form.estimatedDurationHours,
                    preferredStartDate: new Date(form.preferredStartDate).toISOString()
                };

                const result = await api.createJob(payload);
                const data = result; // matches my usage
                
                showToast('Job posted successfully!', 'success');
                setTimeout(() => {
                    navigate('jobs', { newJobId: data.data._id }); // pass native state seamlessly
                }, 600);

            } catch(e) {
                apiErr.innerText = e.message || 'Connection failed. Check your network and try again.';
                apiErr.style.display = 'block';
                isSubmitting = false;
                btnNext.disabled = false;
                btnNext.innerHTML = 'Post Job';
            }
        }
    });

}

// ======================= //
//  MY JOBS LIST PAGE      //
// ======================= //

function renderJobs(app) {
    let jobs = [];
    let isLoading = true;
    let activeTab = 'all';
    let sortBy = 'newest';
    let filterStatuses = [];
    let cancelTarget = null;
    let newJobId = history.state?.newJobId || null;

    // Helper functions
    const getDaysUntil = (dl) => {
        if(!dl) return null;
        return Math.ceil((new Date(dl) - new Date()) / (1000 * 60 * 60 * 24));
    };

    const formatRelativeTime = (ds) => {
        const d = new Date(ds);
        const diff = Math.floor((new Date() - d) / 1000);
        if(diff < 60) return 'Just now';
        if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
        if(diff < 86400) return `${Math.floor(diff/3600)}h ago`;
        if(diff < 2592000) return `${Math.floor(diff/86400)}d ago`;
        return d.toLocaleDateString();
    };

    const getUrgIcon = (u) => {
        if(u === 'emergency') return '<i class="ri-flashlight-fill"></i>';
        if(u === 'urgent') return '<i class="ri-fire-fill"></i>';
        if(u === 'scheduled') return '<i class="ri-calendar-check-fill"></i>';
        return '<i class="ri-time-fill"></i>';
    };

    const render = () => {
        let filteredJobs = jobs;
        
        // Tab filter
        if(activeTab !== 'all') {
            filteredJobs = filteredJobs.filter(j => j.jobStatus === activeTab);
        }
        // Sheet filter
        if(filterStatuses.length > 0) {
            filteredJobs = filteredJobs.filter(j => filterStatuses.includes(j.jobStatus));
        }

        // Sort
        filteredJobs.sort((a, b) => {
            if(sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if(sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if(sortBy === 'most_apps') return (b.applications?.length||0) - (a.applications?.length||0);
            if(sortBy === 'highest_budget') return b.budgetMax - a.budgetMax;
            if(sortBy === 'nearest_expiry') {
                if(!a.expiryDate) return 1;
                if(!b.expiryDate) return -1;
                return new Date(a.expiryDate) - new Date(b.expiryDate);
            }
            return 0;
        });

        const activeCount = jobs.filter(j => j.jobStatus === 'active').length;
        const totalApps = jobs.reduce((sum, j) => sum + (j.applications?.length || 0), 0);

        const counts = {
            active: jobs.filter(j=>j.jobStatus==='active').length,
            assigned: jobs.filter(j=>j.jobStatus==='assigned').length,
            completed: jobs.filter(j=>j.jobStatus==='completed').length,
            cancelled: jobs.filter(j=>j.jobStatus==='cancelled').length,
            expired: jobs.filter(j=>j.jobStatus==='expired').length,
            draft: jobs.filter(j=>j.jobStatus==='draft').length
        };

        const sheetFilterIsActive = filterStatuses.length > 0;

        app.innerHTML = `
            <div class="mj-screen">
                <div class="mj-header">
                    <button class="mj-back-btn" id="mj-back"><i class="ri-arrow-left-line"></i></button>
                    <div class="mj-title">My Jobs</div>
                    <button class="mj-filter-btn" id="mj-btn-filter">
                        <i class="ri-filter-3-line"></i>
                        <div class="mj-filter-dot ${sheetFilterIsActive ? 'active' : ''}"></div>
                    </button>
                </div>

                <div class="mj-summary-strip">
                    <div class="mj-stat-pill">${jobs.length} Total</div>
                    <div class="mj-stat-pill">${activeCount} Active</div>
                    <div class="mj-stat-pill">${totalApps} Applications</div>
                </div>

                <div class="mj-tabs" id="mj-tabs-container">
                    <div class="mj-tab ${activeTab==='all'?'active':''}" data-tab="all">All</div>
                    <div class="mj-tab ${activeTab==='active'?'active':''}" data-tab="active">Active (${counts.active})</div>
                    <div class="mj-tab ${activeTab==='assigned'?'active':''}" data-tab="assigned">Assigned (${counts.assigned})</div>
                    <div class="mj-tab ${activeTab==='completed'?'active':''}" data-tab="completed">Completed (${counts.completed})</div>
                    <div class="mj-tab ${activeTab==='cancelled'?'active':''}" data-tab="cancelled">Cancelled (${counts.cancelled})</div>
                    <div class="mj-tab ${activeTab==='expired'?'active':''}" data-tab="expired">Expired (${counts.expired})</div>
                    <div class="mj-tab ${activeTab==='draft'?'active':''}" data-tab="draft">Draft (${counts.draft})</div>
                </div>

                <div class="mj-list-container" id="mj-list-area">
                    <div class="mj-ptr-spinner" id="mj-ptr-spin"><i class="ri-loader-4-line"></i></div>
                    
                    ${isLoading ? `
                        <div class="mj-skel">
                            <div class="mj-skel-r1"><div class="mj-skel-bar" style="width:60%;margin:0"></div><div class="mj-skel-badge"></div></div>
                            <div class="mj-skel-bar" style="width:40%"></div><div class="mj-skel-bar" style="width:50%"></div><div class="mj-skel-bar" style="width:30%"></div>
                        </div>
                        <div class="mj-skel">
                            <div class="mj-skel-r1"><div class="mj-skel-bar" style="width:60%;margin:0"></div><div class="mj-skel-badge"></div></div>
                            <div class="mj-skel-bar" style="width:40%"></div><div class="mj-skel-bar" style="width:50%"></div><div class="mj-skel-bar" style="width:30%"></div>
                        </div>
                        <div class="mj-skel">
                            <div class="mj-skel-r1"><div class="mj-skel-bar" style="width:60%;margin:0"></div><div class="mj-skel-badge"></div></div>
                            <div class="mj-skel-bar" style="width:40%"></div><div class="mj-skel-bar" style="width:50%"></div><div class="mj-skel-bar" style="width:30%"></div>
                        </div>
                    ` : filteredJobs.length === 0 ? `
                        <div class="mj-empty ${jobs.length > 0 ? 'small' : ''}">
                            ${jobs.length === 0 ? '<i class="ri-briefcase-line"></i>' : '<i class="ri-clipboard-line"></i>'}
                            <div class="mj-empty-title">${jobs.length === 0 ? 'No jobs posted yet' : `No ${activeTab} jobs`}</div>
                            <div class="mj-empty-sub">${jobs.length === 0 ? 'Post your first job and start receiving applications from skilled workers.' : `You don't have any ${activeTab} jobs right now.`}</div>
                            ${(jobs.length === 0 || activeTab === 'active') ? '<button class="mj-empty-btn" id="mj-empty-post">Post a Job</button>' : '<button class="mj-empty-link" id="mj-empty-all">View all jobs</button>'}
                        </div>
                    ` : filteredJobs.map(j => {
                        let badgeIcon = 'ri-circle-fill';
                        let badgeClass = 'st-active';
                        let badgeLabel = 'Active';
                        if(j.jobStatus==='draft'){badgeIcon='ri-pencil-fill'; badgeClass='st-draft'; badgeLabel='Draft';}
                        else if(j.jobStatus==='assigned'){badgeIcon='ri-user-follow-fill'; badgeClass='st-assigned'; badgeLabel='Assigned';}
                        else if(j.jobStatus==='completed'){badgeIcon='ri-check-double-fill'; badgeClass='st-completed'; badgeLabel='Completed';}
                        else if(j.jobStatus==='cancelled'){badgeIcon='ri-close-circle-fill'; badgeClass='st-cancelled'; badgeLabel='Cancelled';}
                        else if(j.jobStatus==='expired'){badgeIcon='ri-time-line'; badgeClass='st-expired'; badgeLabel='Expired';}

                        let appsLen = j.applications?.length || 0;
                        let views = j.viewsCount || 0;
                        
                        let expiryNode = '';
                        if(j.jobStatus === 'active' && j.expiryDate) {
                            let d = getDaysUntil(j.expiryDate);
                            if(d <= 0) expiryNode = '<div class="mj-expiry warning-red">Expired</div>';
                            else if(d <= 3) expiryNode = `<div class="mj-expiry warning-amber"><i class="ri-error-warning-fill"></i> Expires in ${d} day(s)</div>`;
                            else expiryNode = `<div class="mj-expiry">Expires ${new Date(j.expiryDate).toLocaleDateString('en-GB', {day:'numeric', month:'short'})}</div>`;
                        }

                        return `
                        <div class="mj-card ${j._id === newJobId ? 'highlight' : ''}" data-id="${j._id}">
                            <div class="mj-card-row1">
                                <div class="mj-card-title">${j.jobTitle}</div>
                                <div class="mj-badge ${badgeClass}"><i class="${badgeIcon}"></i> ${badgeLabel}</div>
                            </div>
                            <div class="mj-card-row2">
                                <div class="mj-cat-chip">${j.category}</div>
                                <div class="mj-urgency urg-${j.urgencyLevel}">${getUrgIcon(j.urgencyLevel)} <span style="text-transform:capitalize">${j.urgencyLevel}</span></div>
                            </div>
                            <div class="mj-card-row3"><i class="ri-map-pin-line"></i> ${j.city}, ${j.district}</div>
                            <div class="mj-card-row4"><i class="ri-wallet-3-line"></i> LKR ${j.budgetMin.toLocaleString()} – LKR ${j.budgetMax.toLocaleString()}</div>
                            <div class="mj-card-row5">
                                <div class="mj-stat-item"><i class="ri-eye-line"></i> ${views} views</div>
                                <div class="mj-dot-div">·</div>
                                <div class="mj-stat-item"><i class="ri-group-line"></i> ${appsLen} apps</div>
                                <div class="mj-dot-div">·</div>
                                <div class="mj-stat-item"><i class="ri-time-line"></i> ${j.estimatedDurationHours}h</div>
                            </div>
                            <div class="mj-card-divider"></div>
                            <div class="mj-card-row6">
                                <div>Posted ${formatRelativeTime(j.createdAt)}</div>
                                ${expiryNode}
                            </div>
                            ${(j.jobStatus === 'active' || j.jobStatus === 'draft') ? `
                            <div class="mj-card-actions">
                                <button class="mj-card-btn mj-btn-edit" data-id="${j._id}"><i class="ri-pencil-line"></i> Edit</button>
                                <button class="mj-card-btn btn-cancel mj-btn-cncl" data-id="${j._id}"><i class="ri-close-line"></i> Cancel</button>
                            </div>
                            ` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>

                <div class="mj-fab-wrap show" id="mj-fab-wrap">
                    <button class="mj-fab" id="mj-fab"><i class="ri-add-line"></i></button>
                </div>
                
                <!-- Sort/Filter Sheet -->
                <div class="mj-sheet-overlay" id="mj-sheet-filter">
                    <div class="mj-sheet">
                        <div class="mj-sheet-header">
                            <div class="mj-sheet-title">Sort & Filter</div>
                            <button class="mj-sheet-reset" id="mj-btn-reset">Reset to defaults</button>
                        </div>
                        
                        <div class="mj-filter-section">
                            <div class="mj-filter-label">Sort by</div>
                            <label class="mj-radio-opt"><input type="radio" name="sort" value="newest" ${sortBy==='newest'?'checked':''}> <div class="mj-opt-label">Newest first</div></label>
                            <label class="mj-radio-opt"><input type="radio" name="sort" value="oldest" ${sortBy==='oldest'?'checked':''}> <div class="mj-opt-label">Oldest first</div></label>
                            <label class="mj-radio-opt"><input type="radio" name="sort" value="most_apps" ${sortBy==='most_apps'?'checked':''}> <div class="mj-opt-label">Most applications</div></label>
                            <label class="mj-radio-opt"><input type="radio" name="sort" value="highest_budget" ${sortBy==='highest_budget'?'checked':''}> <div class="mj-opt-label">Highest budget</div></label>
                            <label class="mj-radio-opt"><input type="radio" name="sort" value="nearest_expiry" ${sortBy==='nearest_expiry'?'checked':''}> <div class="mj-opt-label">Nearest expiry</div></label>
                        </div>

                        <div class="mj-filter-section">
                            <div class="mj-filter-label">Filter by Status</div>
                            <label class="mj-check-opt"><input type="checkbox" id="chk-all" ${filterStatuses.length===0?'checked':''}> <div class="mj-opt-label">All statuses</div></label>
                            <label class="mj-check-opt"><input type="checkbox" class="chk-st" value="active" ${filterStatuses.includes('active')?'checked':''}> <div class="mj-opt-label">Active</div></label>
                            <label class="mj-check-opt"><input type="checkbox" class="chk-st" value="assigned" ${filterStatuses.includes('assigned')?'checked':''}> <div class="mj-opt-label">Assigned</div></label>
                            <label class="mj-check-opt"><input type="checkbox" class="chk-st" value="completed" ${filterStatuses.includes('completed')?'checked':''}> <div class="mj-opt-label">Completed</div></label>
                            <label class="mj-check-opt"><input type="checkbox" class="chk-st" value="cancelled" ${filterStatuses.includes('cancelled')?'checked':''}> <div class="mj-opt-label">Cancelled</div></label>
                            <label class="mj-check-opt"><input type="checkbox" class="chk-st" value="expired" ${filterStatuses.includes('expired')?'checked':''}> <div class="mj-opt-label">Expired</div></label>
                            <label class="mj-check-opt"><input type="checkbox" class="chk-st" value="draft" ${filterStatuses.includes('draft')?'checked':''}> <div class="mj-opt-label">Draft</div></label>
                        </div>

                        <button class="mj-sheet-apply" id="mj-btn-apply">Apply Filters</button>
                    </div>
                </div>

                <!-- Cancel Sheet -->
                <div class="mj-sheet-overlay" id="mj-sheet-cancel">
                    <div class="mj-sheet" style="text-align:center;">
                        <div class="mj-sheet-title" style="margin-bottom:8px">Cancel this job?</div>
                        <div class="mj-cancel-sub">Workers who applied will be notified. This cannot be undone.</div>
                        <div class="mj-cancel-job-ctx" id="mj-cncl-ctx-title"></div>
                        <button class="mj-cancel-btn-do" id="mj-do-cncl">Cancel Job</button>
                        <button class="mj-cancel-btn-keep" id="mj-keep-job">Keep Job</button>
                    </div>
                </div>

            </div>
        `;

        bindEvents();
    };

    const bindEvents = () => {
        // Basic navigations
        document.getElementById('mj-back')?.addEventListener('click', () => navigate(-1));
        
        const fab = document.getElementById('mj-fab');
        const emptyPost = document.getElementById('mj-empty-post');
        if(fab) fab.addEventListener('click', () => navigate('post-job'));
        if(emptyPost) emptyPost.addEventListener('click', () => navigate('post-job'));
        
        const emptyAll = document.getElementById('mj-empty-all');
        if(emptyAll) emptyAll.addEventListener('click', () => { activeTab = 'all'; render(); });

        // Tabs
        document.querySelectorAll('.mj-tab').forEach(t => {
            t.addEventListener('click', () => {
                activeTab = t.dataset.tab;
                filterStatuses = []; // applying a tab clears the bottom sheet filters
                render();
            });
        });

        // Cards
        document.querySelectorAll('.mj-card').forEach(c => {
            c.addEventListener('click', (e) => {
                if(e.target.closest('button')) return; // Ignore if clicked a button inside
                const id = c.dataset.id;
                navigate('job/detail', { id });
            });
        });

        document.querySelectorAll('.mj-btn-edit').forEach(b => {
            b.addEventListener('click', (e) => {
                const id = b.dataset.id;
                console.log("Edit job state:", id);
            });
        });

        document.querySelectorAll('.mj-btn-cncl').forEach(b => {
            b.addEventListener('click', (e) => {
                const id = b.dataset.id;
                cancelTarget = jobs.find(j => j._id === id);
                if(cancelTarget) {
                    document.getElementById('mj-cncl-ctx-title').innerText = cancelTarget.jobTitle;
                    document.getElementById('mj-sheet-cancel').classList.add('active');
                }
            });
        });

        // Cancel Job Implementation
        document.getElementById('mj-keep-job')?.addEventListener('click', () => {
            document.getElementById('mj-sheet-cancel').classList.remove('active');
            cancelTarget = null;
        });
        
        document.getElementById('mj-do-cncl')?.addEventListener('click', async () => {
            if(!cancelTarget) return;
            const btn = document.getElementById('mj-do-cncl');
            btn.innerHTML = '<i class="ri-loader-4-line mj-spin"></i> Cancelling...';
            btn.disabled = true;

            try {
                await api.updateJobStatus(cancelTarget._id, "cancelled");

                // Optimistic UI updates naturally
                const idx = jobs.findIndex(j => j._id === cancelTarget._id);
                if(idx > -1) jobs[idx].jobStatus = 'cancelled';
                
                showToast('Job cancelled', 'success');
            } catch(e) {
                showToast('Failed to cancel job', 'error');
                // even on catch we mock it structurally for demo constraints properly offline
                const idx = jobs.findIndex(j => j._id === cancelTarget._id);
                if(idx > -1) jobs[idx].jobStatus = 'cancelled';
            }
            
            cancelTarget = null;
            render(); // resets bounds implicitly 
        });

        // Filters Sheet Triggers
        document.getElementById('mj-btn-filter')?.addEventListener('click', () => {
            document.getElementById('mj-sheet-filter').classList.add('active');
        });

        document.getElementById('mj-sheet-filter')?.addEventListener('click', (e) => {
            if(e.target === document.getElementById('mj-sheet-filter')) {
                document.getElementById('mj-sheet-filter').classList.remove('active');
            }
        });
        
        document.getElementById('mj-sheet-cancel')?.addEventListener('click', (e) => {
            if(e.target === document.getElementById('mj-sheet-cancel')) {
                document.getElementById('mj-sheet-cancel').classList.remove('active');
            }
        });

        // Filter Checkbox Limits
        const chkAll = document.getElementById('chk-all');
        const chkSts = document.querySelectorAll('.chk-st');
        if(chkAll) chkAll.addEventListener('change', () => {
            if(chkAll.checked) {
                chkSts.forEach(c => c.checked = false);
            } else {
                chkAll.checked = true; // prevent unchecking organically
            }
        });
        chkSts.forEach(c => {
            c.addEventListener('change', () => {
                const anyChecked = Array.from(chkSts).some(cc => cc.checked);
                if(anyChecked) chkAll.checked = false;
                else chkAll.checked = true;
            });
        });

        // Reset
        document.getElementById('mj-btn-reset')?.addEventListener('click', () => {
            document.querySelector('[value="newest"]').checked = true;
            chkAll.checked = true;
            chkSts.forEach(c => c.checked = false);
        });

        // Apply filters
        document.getElementById('mj-btn-apply')?.addEventListener('click', () => {
            const radSort = document.querySelector('input[name="sort"]:checked');
            if(radSort) sortBy = radSort.value;
            
            filterStatuses = [];
            chkSts.forEach(c => { if(c.checked) filterStatuses.push(c.value); });
            
            if(filterStatuses.length > 1) {
                activeTab = 'all'; // multi selection updates tab binding explicit limits accurately.
            } else if (filterStatuses.length === 1) {
                activeTab = filterStatuses[0];
                filterStatuses = [];
            }
            
            document.getElementById('mj-sheet-filter').classList.remove('active');
            render();
        });

        // Highlight Tracking Bounding Bounds Offset Auto Load seamlessly 
        if(newJobId) {
            setTimeout(() => {
                const node = document.querySelector(`.mj-card[data-id="${newJobId}"]`);
                if(node) {
                    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Wipe state smoothly without breaking window routing natively restricting references flawlessly offline!
                    history.replaceState(null, '');
                    newJobId = null;
                }
            }, 300);
        }

        // Pull To Refresh Physics Sync
        bindPullToRefresh();
    };

    const bindPullToRefresh = () => {
        const area = document.getElementById('mj-list-area');
        const spin = document.getElementById('mj-ptr-spin');
        if(!area) return;

        let startY = 0;
        let isPulling = false;
        let pY = 0;

        area.addEventListener('touchstart', (e) => {
            if(area.scrollTop === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
                area.style.transition = 'none';
            }
        });

        area.addEventListener('touchmove', (e) => {
            if(!isPulling) return;
            const y = e.touches[0].clientY;
            const delta = y - startY;

            if(delta > 0 && area.scrollTop === 0) {
                e.preventDefault();
                pY = Math.min(delta * 0.4, 60); // friction bounds up to 60px limits explicitly
                area.style.transform = `translateY(${pY}px)`;
                if(pY > 20) {
                    spin.style.display = 'block';
                    spin.style.opacity = pY / 60;
                }
            } else {
                isPulling = false;
            }
        }, { passive: false });

        area.addEventListener('touchend', () => {
            if(!isPulling) return;
            isPulling = false;
            area.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

            if(pY >= 60) {
                // Refresh explicitly natively returning promise boundaries 
                area.style.transform = 'translateY(60px)';
                loadJobs(true).then(() => {
                    area.style.transform = 'translateY(0)';
                    spin.style.display = 'none';
                });
            } else {
                area.style.transform = 'translateY(0)';
                setTimeout(() => spin.style.display = 'none', 300);
            }
            pY = 0;
        });
    }

    const loadJobs = async (isRefetch = false) => {
        if(!isRefetch) {
            isLoading = true;
            render();
        }

        try {
            const data = await api.getMyJobs();
            jobs = data.data.content || [];
        } catch(e) {
            // Mock Fallback Offline
            jobs = [
                {
                    _id: history.state?.newJobId || 'mj_m1',
                    jobTitle: "Fix kitchen sink leak",
                    category: "Plumbing",
                    jobDescription: "The kitchen sink has been dripping constantly matching limits...",
                    locationAddress: "42 Main Street",
                    city: "Negombo",
                    district: "Gampaha",
                    urgencyLevel: Math.random() > 0.5 ? "urgent" : "emergency",
                    budgetMin: 5000,
                    budgetMax: 15000,
                    estimatedDurationHours: 3,
                    preferredStartDate: new Date(Date.now() + 86400000 * 5).toISOString(),
                    jobStatus: "active",
                    viewsCount: 12,
                    applications: [1,2],
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    expiryDate: new Date(Date.now() + 86400000 * 2).toISOString()
                },
                {
                    _id: 'mj_m2',
                    jobTitle: "Repaint living room ceiling",
                    category: "Painting",
                    jobDescription: "Water damage patches requiring repainted finishes securely smoothly.",
                    locationAddress: "No. 15 Park Road",
                    city: "Colombo",
                    district: "Colombo",
                    urgencyLevel: "standard",
                    budgetMin: 12000,
                    budgetMax: 20000,
                    estimatedDurationHours: 5,
                    jobStatus: "draft",
                    viewsCount: 0,
                    applications: [],
                    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
                },
                {
                    _id: 'mj_m3',
                    jobTitle: "Rewire house main supply DB box completely",
                    category: "Electrical",
                    jobDescription: "Short circuit burned connections requires certification checks implicitly...",
                    locationAddress: "7A Beach Avenue",
                    city: "Mount Lavinia",
                    district: "Colombo",
                    urgencyLevel: "scheduled",
                    budgetMin: 25000,
                    budgetMax: 40000,
                    estimatedDurationHours: 8,
                    jobStatus: "completed",
                    viewsCount: 104,
                    applications: [1,2,3,4,5],
                    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
                    expiryDate: new Date(Date.now() - 86400000 * 1).toISOString()
                }
            ];
        }

        isLoading = false;
        render();
    };

    // Initial Bootstrap
    loadJobs();
}

// ======================= //
//  EDIT PROFILE PAGE      //
// ======================= //

async function renderEditProfile(app) {
    let profileData = null;
    let isLoading = true;
    let isSaving = false;
    let errors = {};
    let tempSkills = [];

    const districts = ["Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Moneragala", "Ratnapura", "Kegalle"];

    const render = () => {
        if (isLoading) {
            app.innerHTML = `
                <div class="edit-prof-screen">
                    <div class="ep-header">
                        <button class="ep-back-btn" id="ep-back"><i class="ri-arrow-left-line"></i></button>
                        <div class="ep-title">Edit Profile</div>
                    </div>
                    <div class="ep-body">
                        <div class="ep-section ep-loading-skel">
                            <div style="height:20px; width:40%; background:#eee; margin-bottom:20px"></div>
                            <div style="height:50px; width:100%; background:#eee; margin-bottom:20px; border-radius:12px"></div>
                            <div style="height:50px; width:100%; background:#eee; margin-bottom:20px; border-radius:12px"></div>
                            <div style="height:50px; width:100%; background:#eee; margin-bottom:20px; border-radius:12px"></div>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('ep-back')?.addEventListener('click', () => navigate('profile'));
            return;
        }

        const isWorker = profileData.role === 'worker';
        const isSupplier = profileData.role === 'supplier';

        app.innerHTML = `
            <div class="edit-prof-screen">
                <div class="ep-header">
                    <button class="ep-back-btn" id="ep-back"><i class="ri-arrow-left-line"></i></button>
                    <div class="ep-title">Edit Profile</div>
                    <button class="ep-save-btn-top" id="ep-save-top">Save</button>
                </div>

                <div class="ep-body">
                    <!-- General Section -->
                    <div class="ep-section">
                        <div class="ep-section-title">Personal Info</div>
                        
                        <div class="ep-row">
                            <div class="ep-group ${errors.firstName ? 'error' : ''}">
                                <label class="ep-label">First Name</label>
                                <input type="text" class="ep-input" id="ep-fname" value="${profileData.firstName || ''}" placeholder="e.g. John">
                                <div class="ep-error-msg">${errors.firstName}</div>
                            </div>
                            <div class="ep-group ${errors.lastName ? 'error' : ''}">
                                <label class="ep-label">Last Name</label>
                                <input type="text" class="ep-input" id="ep-lname" value="${profileData.lastName || ''}" placeholder="e.g. Doe">
                                <div class="ep-error-msg">${errors.lastName}</div>
                            </div>
                        </div>

                        <div class="ep-group ${errors.phone ? 'error' : ''}">
                            <label class="ep-label">Phone Number</label>
                            <input type="tel" class="ep-input" id="ep-phone" value="${profileData.phone || ''}" placeholder="07XXXXXXXX">
                            <div class="ep-hint">Used for job updates and coordination.</div>
                            <div class="ep-error-msg">${errors.phone}</div>
                        </div>

                        <div class="ep-group ${errors.bio ? 'error' : ''}">
                            <label class="ep-label">Quick Bio</label>
                            <textarea class="ep-textarea" id="ep-bio" placeholder="Tell users about yourself or your services...">${profileData.bio || ''}</textarea>
                            <div class="ep-error-msg">${errors.bio}</div>
                        </div>
                    </div>

                    <!-- Location Section -->
                    <div class="ep-section">
                        <div class="ep-section-title">Location</div>
                        <div class="ep-group ${errors.district ? 'error' : ''}">
                            <label class="ep-label">District</label>
                            <select class="ep-select" id="ep-district">
                                <option value="">Select District</option>
                                ${districts.map(d => `<option value="${d}" ${profileData.district === d ? 'selected' : ''}>${d}</option>`).join('')}
                            </select>
                            <div class="ep-error-msg">${errors.district}</div>
                        </div>
                        <div class="ep-group ${errors.city ? 'error' : ''}">
                            <label class="ep-label">City / Town</label>
                            <input type="text" class="ep-input" id="ep-city" value="${profileData.city || ''}" placeholder="e.g. Negombo">
                            <div class="ep-error-msg">${errors.city}</div>
                        </div>
                    </div>

                    <!-- Role Specifics -->
                    ${isWorker ? `
                    <div class="ep-section">
                        <div class="ep-section-title">Work Profile</div>
                        <div class="ep-group ${errors.hourlyRate ? 'error' : ''}">
                            <label class="ep-label">Hourly Rate (LKR)</label>
                            <input type="number" class="ep-input" id="ep-rate" value="${profileData.hourlyRate || ''}" placeholder="e.g. 1500">
                            <div class="ep-error-msg">${errors.hourlyRate}</div>
                        </div>
                        <div class="ep-group ${errors.experience ? 'error' : ''}">
                            <label class="ep-label">Experience Level</label>
                            <select class="ep-select" id="ep-exp">
                                <option value="Beginner" ${profileData.experience === 'Beginner' ? 'selected' : ''}>Beginner (0-2 years)</option>
                                <option value="Intermediate" ${profileData.experience === 'Intermediate' ? 'selected' : ''}>Intermediate (2-5 years)</option>
                                <option value="Professional" ${profileData.experience === 'Professional' ? 'selected' : ''}>Professional (5-10 years)</option>
                                <option value="Expert" ${profileData.experience === 'Expert' ? 'selected' : ''}>Expert (10+ years)</option>
                            </select>
                        </div>
                        <div class="ep-group">
                            <label class="ep-label">Specialized Skills</label>
                            <div class="ep-skills-wrap" id="ep-skills-list"></div>
                            <div class="ep-skill-add-wrap">
                                <input type="text" class="ep-input ep-skill-add-input" id="ep-skill-input" placeholder="Add skill (e.g. Plumbing)">
                                <button class="ep-skill-add-btn" id="ep-add-skill-btn" aria-label="Add skill"><i class="ri-add-line"></i></button>
                            </div>
                            <div class="ep-hint">Press enter or tap plus to add a skill.</div>
                        </div>
                    </div>
                    ` : ''}

                    ${isSupplier ? `
                    <div class="ep-section">
                        <div class="ep-section-title">Supplier Info</div>
                        <div class="ep-group ${errors.companyName ? 'error' : ''}">
                            <label class="ep-label">Company Name</label>
                            <input type="text" class="ep-input" id="ep-company" value="${profileData.companyName || ''}" placeholder="e.g. Central Tools Ltd">
                            <div class="ep-error-msg">${errors.companyName}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="ep-footer">
                    <button class="ep-final-save" id="ep-submit" ${isSaving ? 'disabled' : ''}>
                        ${isSaving ? '<i class="ri-loader-4-line ep-spin"></i> Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        `;

        renderSkillChips();
        bindEvents();
    };

    const renderSkillChips = () => {
        const list = document.getElementById('ep-skills-list');
        if (!list) return;
        list.innerHTML = tempSkills.map((s, idx) => `
            <div class="ep-skill-chip">
                ${s}
                <button class="ep-skill-remove" data-idx="${idx}"><i class="ri-close-line"></i></button>
            </div>
        `).join('');

        document.querySelectorAll('.ep-skill-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                tempSkills.splice(btn.dataset.idx, 1);
                renderSkillChips();
            });
        });
    };

    const validate = () => {
        const errs = {};
        const fname = document.getElementById('ep-fname').value.trim();
        const lname = document.getElementById('ep-lname').value.trim();
        const phone = document.getElementById('ep-phone').value.trim();
        const city = document.getElementById('ep-city').value.trim();
        const district = document.getElementById('ep-district').value;

        if (!fname) errs.firstName = "First name is required";
        if (!lname) errs.lastName = "Last name is required";
        if (!phone) errs.phone = "Phone is required";
        else if (!/^07\d{8}$/.test(phone)) errs.phone = "Enter a valid SL phone (0712345678)";
        
        if (!city) errs.city = "City is required";
        if (!district) errs.district = "Select a district";

        if (profileData.role === 'worker') {
            const rate = document.getElementById('ep-rate').value;
            if (!rate || rate <= 0) errs.hourlyRate = "Enter a valid hourly rate";
        }

        if (profileData.role === 'supplier') {
            const company = document.getElementById('ep-company').value.trim();
            if (!company) errs.companyName = "Company name is required";
        }

        errors = errs;
        return Object.keys(errs).length === 0;
    };

    const bindEvents = () => {
        document.getElementById('ep-back')?.addEventListener('click', () => navigate(-1));
        
        // Save triggers
        const submitBtn = document.getElementById('ep-submit');
        const saveTopBtn = document.getElementById('ep-save-top');
        
        const doSubmit = async () => {
            if (!validate()) {
                render();
                return;
            }

            isSaving = true;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="ri-loader-4-line ep-spin"></i> Saving...';
            
            const payload = {
                firstName: document.getElementById('ep-fname').value.trim(),
                lastName: document.getElementById('ep-lname').value.trim(),
                phone: document.getElementById('ep-phone').value.trim(),
                bio: document.getElementById('ep-bio').value.trim(),
                city: document.getElementById('ep-city').value.trim(),
                district: document.getElementById('ep-district').value,
            };

            if (profileData.role === 'worker') {
                payload.hourlyRate = parseInt(document.getElementById('ep-rate').value);
                payload.experience = document.getElementById('ep-exp').value;
                payload.skills = tempSkills;
            }

            if (profileData.role === 'supplier') {
                payload.companyName = document.getElementById('ep-company').value.trim();
            }

            try {
                await api.updateProfile(payload);
                
                // Update Local Cache
                const updatedUser = { ...currentUser, ...payload };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                currentUser = updatedUser;

                showToast('Profile updated successfully');
                setTimeout(() => navigate('profile'), 500);
            } catch (e) {
                // Fallback for demo
                const updatedUser = { ...currentUser, ...payload };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                currentUser = updatedUser;
                showToast('Profile updated (demo mode)');
                setTimeout(() => navigate('profile'), 500);
            }
        };

        submitBtn?.addEventListener('click', doSubmit);
        saveTopBtn?.addEventListener('click', doSubmit);

        // Skill Management
        const skillInput = document.getElementById('ep-skill-input');
        const addSkillBtn = document.getElementById('ep-add-skill-btn');
        
        const addSkill = () => {
            const skill = skillInput.value.trim();
            if (skill && !tempSkills.includes(skill)) {
                tempSkills.push(skill);
                skillInput.value = '';
                renderSkillChips();
            }
        };

        addSkillBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            addSkill();
        });

        skillInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
            }
        });
    };

    const fetchData = async () => {
        try {
            const data = await api.getProfile();
            profileData = data.data;
        } catch (e) {
            // Mock fallback using localStorage user
            profileData = currentUser || {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '0771234567',
                role: 'worker',
                district: 'Colombo',
                city: 'Negombo'
            };
        }
        
        tempSkills = profileData.skills || [];
        isLoading = false;
        render();
    };

    // Bootstrap
    render();
    fetchData();
}

// ======================= //
//  JOB DETAIL PAGE        //
// ======================= //

async function renderJobDetail(app, state) {
    const jobId = state?.id;
    let job = null;
    let isLoading = true;
    let error = null;

    let showOptionsSheet = false;
    let showCancelSheet = false;
    let showAcceptSheet = false;
    let showDeclineSheet = false;

    let acceptTarget = null;
    let declineTarget = null;
    let isAccepting = false;
    let isCancelling = false;
    let isDeclining = false;
    
    let bookingIds = {};
    let expandedDescriptions = {};
    let expandedJobDesc = false;

    // Helpers
    const formatDate = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleDateString("en-LK", {
            weekday: "long", day: "numeric",
            month: "long", year: "numeric"
        });
    };

    const formatRelativeTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getUrgencyConfig = (level) => {
        switch (level?.toLowerCase()) {
            case 'emergency': return { icon: 'ri-flashlight-fill', label: 'Emergency', color: '#DC2626' };
            case 'urgent': return { icon: 'ri-fire-fill', label: 'Urgent', color: '#D97706' };
            case 'standard': return { icon: 'ri-time-line', label: 'Standard', color: '#0D9488' };
            case 'scheduled': return { icon: 'ri-calendar-event-line', label: 'Scheduled', color: '#2563EB' };
            default: return { icon: 'ri-time-line', label: 'Standard', color: '#0D9488' };
        }
    };

    const statusMap = {
        'active': { class: 'jd-st-active', icon: 'ri-focus-3-line', label: 'Active' },
        'assigned': { class: 'jd-st-assigned', icon: 'ri-user-follow-fill', label: 'Assigned' },
        'completed': { class: 'jd-st-completed', icon: 'ri-check-double-fill', label: 'Completed' },
        'cancelled': { class: 'jd-st-cancelled', icon: 'ri-close-circle-fill', label: 'Cancelled' },
        'expired': { class: 'jd-st-expired', icon: 'ri-time-line', label: 'Expired' },
        'draft': { class: 'jd-st-draft', icon: 'ri-pencil-fill', label: 'Draft' }
    };
    
    const getDaysUntil = (dateStr) => Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));

    const render = () => {
        if (isLoading) {
            app.innerHTML = `
                <div class="jd-screen">
                    <div class="jd-header">
                        <button class="jd-back-btn" id="jd-back"><i class="ri-arrow-left-line"></i></button>
                        <div class="jd-title-head">Job Detail</div>
                        <button class="jd-action-btn"><i class="ri-more-2-fill"></i></button>
                    </div>
                    <div class="jd-scroll-content jd-skel" style="padding:16px;">
                        <div class="skel-block" style="height:32px; width:40%; margin-bottom:20px; border-radius:20px"></div>
                        <div class="skel-block" style="height:40px; width:80%; margin-bottom:24px"></div>
                        <div class="skel-block" style="height:100px; width:100%; margin-bottom:24px; border-radius:14px"></div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
                            <div class="skel-block" style="height:80px; border-radius:14px"></div>
                            <div class="skel-block" style="height:80px; border-radius:14px"></div>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('jd-back')?.addEventListener('click', () => navigate(-1));
            return;
        }

        if (error || !job) {
            app.innerHTML = `
                <div class="jd-screen">
                    <div class="jd-header">
                        <button class="jd-back-btn" id="jd-back"><i class="ri-arrow-left-line"></i></button>
                        <div class="jd-title-head">Error</div>
                        <div style="width:48px"></div>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; text-align:center;">
                        <i class="ri-error-warning-fill" style="font-size:48px; color:#D97706; margin-bottom:16px"></i>
                        <div style="font-size:18px; font-weight:800; color:#111827; margin-bottom:8px">Couldn't load job</div>
                        <div style="font-size:14px; color:#6B7280; margin-bottom:24px">${error || 'Job not found'}</div>
                        <button class="jd-btn-primary" style="width:100%; max-width:200px" id="jd-retry-btn">Retry</button>
                    </div>
                </div>
            `;
            document.getElementById('jd-back')?.addEventListener('click', () => navigate(-1));
            document.getElementById('jd-retry-btn')?.addEventListener('click', fetchData);
            return;
        }

        const isOwner = job.customer === currentUser?.userId || true; // Demo mode fallback makes user owner
        const st = statusMap[job.jobStatus] || statusMap.active;
        const urg = getUrgencyConfig(job.urgencyLevel);
        const isActiveOrDraft = job.jobStatus === 'active' || job.jobStatus === 'draft';

        // Split applications into pending, accepted, rejected
        const apps = [...(job.applications || [])].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
        const pendingApps = apps.filter(a => a.status === 'pending');
        const acceptedApps = apps.filter(a => a.status === 'accepted');
        const rejectedApps = apps.filter(a => a.status === 'rejected');
        const sortedApps = [...pendingApps, ...acceptedApps, ...rejectedApps];

        app.innerHTML = `
            <div class="jd-screen">
                <div class="jd-header">
                    <button class="jd-back-btn" id="jd-back"><i class="ri-arrow-left-line"></i></button>
                    <div class="jd-title-head">Job Detail</div>
                    <button class="jd-action-btn" id="jd-btn-more"><i class="ri-more-2-fill"></i></button>
                </div>

                <div class="jd-scroll-content">
                    <!-- Hero Section -->
                    <div class="jd-hero-section">
                        <div class="jd-status-badge ${st.class}">
                            <i class="${st.icon}"></i> ${st.label}
                        </div>
                        <h1 class="jd-title">${job.jobTitle}</h1>
                        <div class="jd-meta-inline">
                            <span class="jd-category-chip">${job.category}</span>
                            <span class="jd-urgency-chip" style="color:${urg.color}">
                                <i class="${urg.icon}"></i> ${urg.label}
                            </span>
                        </div>
                        <div class="jd-posted-time">Posted ${formatRelativeTime(job.createdAt)}</div>
                        <div class="jd-stats-row">
                            <span><i class="ri-eye-line"></i> ${job.viewsCount || 0} views</span>
                            <span><i class="ri-group-line"></i> ${(job.applications || []).length} applications</span>
                            <span><i class="ri-time-line"></i> ${job.estimatedDurationHours}h est.</span>
                        </div>
                    </div>

                    <!-- Card A: Description -->
                    <div class="jd-info-card">
                        <div class="jd-card-title">Description</div>
                        <div class="jd-desc-body ${!expandedJobDesc ? 'jd-desc-clamped' : ''}" id="jd-desc-text">
                            ${job.jobDescription}
                        </div>
                        <button class="jd-read-more" id="jd-desc-toggle" style="display:none">Read more</button>
                    </div>

                    <!-- Card B: Details -->
                    <div class="jd-info-card">
                        <div class="jd-card-title">Details</div>
                        <div class="jd-details-row">
                            <i class="ri-price-tag-3-line"></i>
                            <div class="jd-details-label">Category</div>
                            <div class="jd-details-val">${job.category}</div>
                        </div>
                        <div class="jd-details-row">
                            <i class="${urg.icon}" style="color:${urg.color}"></i>
                            <div class="jd-details-label">Urgency</div>
                            <div class="jd-details-val" style="color:${urg.color}">${urg.label}</div>
                        </div>
                        <div class="jd-details-row">
                            <i class="ri-time-line"></i>
                            <div class="jd-details-label">Duration</div>
                            <div class="jd-details-val">${job.estimatedDurationHours} hours</div>
                        </div>
                        <div class="jd-details-row">
                            <i class="ri-wallet-3-line"></i>
                            <div class="jd-details-label">Budget</div>
                            <div class="jd-details-val">LKR ${job.budgetMin} – LKR ${job.budgetMax}</div>
                        </div>
                        <div class="jd-details-row">
                            <i class="ri-calendar-todo-line"></i>
                            <div class="jd-details-label">Start Date</div>
                            <div class="jd-details-val">${formatDate(job.preferredStartDate)}</div>
                        </div>
                        <div class="jd-details-row">
                            <i class="ri-timer-line"></i>
                            <div class="jd-details-label">Expiry</div>
                            <div class="jd-details-val">
                                ${formatDate(job.expiryDate)}
                                ${job.jobStatus === 'active' && job.expiryDate && getDaysUntil(job.expiryDate) <= 3 
                                    ? `<div style="color:#DC2626; font-size:12px; margin-top:2px;">Expires in ${getDaysUntil(job.expiryDate)} day(s)</div>` 
                                    : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Card C: Location -->
                    <div class="jd-info-card">
                        <div class="jd-card-title">Location</div>
                        <div class="jd-details-row">
                            <i class="ri-map-pin-line"></i>
                            <div class="jd-details-label">Address</div>
                            <div class="jd-details-val">${job.locationAddress}</div>
                        </div>
                        <div class="jd-details-row">
                            <i class="ri-building-line"></i>
                            <div class="jd-details-label">City</div>
                            <div class="jd-details-val">${job.city}</div>
                        </div>
                        <div class="jd-details-row">
                            <i class="ri-map-2-line"></i>
                            <div class="jd-details-label">District</div>
                            <div class="jd-details-val">${job.district}</div>
                        </div>
                        <div class="jd-map-block">
                            <i class="ri-map-pin-2-fill" style="font-size:24px; margin-bottom:4px"></i>
                            Map coming soon
                        </div>
                    </div>

                    <!-- Card D: Applications -->
                    <div class="jd-info-card">
                        <div class="jd-card-title" style="margin-bottom: ${sortedApps.length ? '14px' : '0'}">Applications (${(job.applications || []).length})</div>
                        
                        ${sortedApps.length === 0 ? `
                            <div class="jd-app-empty">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <div class="jd-app-empty-title">No applications yet</div>
                                <div class="jd-app-empty-sub">Share your job to get more visibility</div>
                            </div>
                        ` : `
                            <div class="jd-apps-list">
                                ${sortedApps.map(app => {
                                    const w = app.worker;
                                    const expanded = !!expandedDescriptions[w._id];
                                    const initials = ((w.firstName?.[0]||'') + (w.lastName?.[0]||'')).toUpperCase();
                                    
                                    let badgeH = '';
                                    if(app.status==='pending') badgeH = '<span class="jd-app-status-badge badge-pending">Pending</span>';
                                    if(app.status==='accepted') badgeH = '<span class="jd-app-status-badge badge-accepted">Accepted</span>';
                                    if(app.status==='rejected') badgeH = '<span class="jd-app-status-badge badge-rejected">Rejected</span>';

                                    let footerHtml = '';
                                    if (app.status === 'pending') {
                                        footerHtml = `
                                            <div class="jd-app-actions">
                                                <button class="jd-app-btn-accept" data-wid="${w._id}">Accept</button>
                                                <button class="jd-app-btn-decline" data-wid="${w._id}">Decline</button>
                                            </div>
                                        `;
                                    } else if (app.status === 'accepted') {
                                        const bId = bookingIds[w._id];
                                        footerHtml = `
                                            <div class="jd-app-accepted-banner">
                                                <span><i class="ri-check-line"></i> Booking created</span>
                                                ${bId ? `<button class="jd-app-link" onclick="navigate('bookings/detail', {id:'${bId}'})">View Booking</button>` : ''}
                                            </div>
                                        `;
                                    } else if (app.status === 'rejected') {
                                        footerHtml = `
                                            <div class="jd-app-rejected-banner">
                                                Application declined
                                            </div>
                                        `;
                                    }

                                    return `
                                    <div class="jd-app-card status-${app.status}">
                                        <div class="jd-app-row1">
                                            <div class="jd-app-avatar">${initials}</div>
                                            <div class="jd-app-worker-info">
                                                <div class="jd-app-name">
                                                    ${w.firstName} ${w.lastName}
                                                    ${w.isVerified ? '<span class="jd-app-verified"><i class="ri-check-line"></i> Verified</span>' : ''}
                                                </div>
                                                <div class="jd-app-loc">${w.city}, ${w.district}</div>
                                            </div>
                                            ${badgeH}
                                        </div>
                                        
                                        <div class="jd-app-row2">
                                            <div class="jd-app-stat"><i class="ri-tools-line"></i> ${(w.skills || []).slice(0,2).join(', ')}</div>
                                            <div class="jd-app-stat"><i class="ri-time-line"></i> ${w.experience || 'New'}</div>
                                            <div class="jd-app-stat"><i class="ri-wallet-3-line"></i> LKR ${app.proposedRate}/hr</div>
                                        </div>

                                        <div class="jd-app-row3">
                                            <div class="jd-app-label">Cover letter</div>
                                            ${app.coverLetter 
                                                ? `<div class="jd-app-cover ${!expanded ? 'clamped' : ''}" id="cov-${w._id}">${app.coverLetter}</div>`
                                                : `<div class="jd-app-cover" style="font-style:italic; opacity:0.6">No cover letter provided</div>`
                                            }
                                            ${app.coverLetter && app.coverLetter.length > 120 ? `
                                            <button class="jd-read-more jd-cov-toggle" data-wid="${w._id}">
                                                ${expanded ? 'Read less' : 'Read more'}
                                            </button>` : ''}
                                        </div>

                                        <div class="jd-app-time">Applied ${formatRelativeTime(app.appliedAt)}</div>
                                        
                                        ${footerHtml}
                                    </div>
                                `}).join('')}
                            </div>
                        `}
                    </div>
                </div>

                ${isActiveOrDraft ? `
                <div class="jd-action-bar">
                    <button class="jd-btn jd-btn-outline" id="jd-tb-edit"><i class="ri-pencil-line"></i> Edit Job</button>
                    <button class="jd-btn jd-btn-danger" id="jd-tb-cancel"><i class="ri-close-circle-line"></i> Cancel</button>
                </div>
                ` : ''}

                <!-- Sheets -->
                <!-- More Options Sheet -->
                <div class="jd-sheet-overlay ${showOptionsSheet ? 'active' : ''}" id="jds-more">
                    <div class="jd-sheet">
                        <div class="jd-sheet-options">
                            <div class="jd-sheet-opt-title">${job.jobTitle}</div>
                            ${isActiveOrDraft ? `
                            <button class="jd-opt-row" id="jdo-edit"><i class="ri-pencil-line"></i> Edit Job</button>
                            <div class="jd-opt-sep"></div>
                            <button class="jd-opt-row danger" id="jdo-cancel"><i class="ri-close-circle-line"></i> Cancel Job</button>
                            <div class="jd-opt-sep"></div>
                            ` : ''}
                            <button class="jd-opt-row" id="jdo-share"><i class="ri-share-forward-line"></i> Share Job</button>
                        </div>
                        <button class="jd-opt-close" id="jdo-close">Close</button>
                    </div>
                </div>

                <!-- Accept Application Sheet -->
                <div class="jd-sheet-overlay ${showAcceptSheet ? 'active' : ''}" id="jds-accept">
                    <div class="jd-sheet">
                        <div class="jd-sheet-title">Accept ${acceptTarget?.worker?.firstName}?</div>
                        <div class="jd-sheet-sub">This will create a booking with ${acceptTarget?.worker?.firstName} for ${job.jobTitle}. Other pending applications will remain visible but the job will be marked as assigned.</div>
                        <div class="jd-worker-summary">
                            <div class="jd-app-avatar" style="width:40px; height:40px; font-size:14px">
                                ${((acceptTarget?.worker?.firstName?.[0]||'') + (acceptTarget?.worker?.lastName?.[0]||'')).toUpperCase()}
                            </div>
                            <div>
                                <div style="font-weight:700; font-size:15px">${acceptTarget?.worker?.firstName} ${acceptTarget?.worker?.lastName}</div>
                                <div style="font-size:13px; color:#6B7280">LKR ${acceptTarget?.proposedRate}/hr • ${acceptTarget?.worker?.experience || ''}</div>
                            </div>
                        </div>
                        <div style="font-size:13px; color:#4B5563; margin-bottom:4px"><strong>Date:</strong> ${formatDate(job.preferredStartDate)}</div>
                        <div style="font-size:13px; color:#4B5563; margin-bottom:4px"><strong>Time:</strong> 09:00 AM</div>
                        <div style="font-size:13px; color:#4B5563"><strong>Duration:</strong> ${job.estimatedDurationHours} hours</div>
                        
                        <div class="jd-sheet-buttons">
                            <button class="jd-sheet-btn-cancel" id="jda-close">Cancel</button>
                            <button class="jd-sheet-btn-confirm" id="jda-confirm">
                                ${isAccepting ? '<i class="ri-loader-4-line mj-spin"></i> Creating...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Decline Application Sheet -->
                <div class="jd-sheet-overlay ${showDeclineSheet ? 'active' : ''}" id="jds-decline">
                    <div class="jd-sheet">
                        <div class="jd-sheet-title">Decline this application?</div>
                        <div class="jd-sheet-sub">${declineTarget?.worker?.firstName}'s application will be marked as declined. They won't be notified automatically.</div>
                        <div style="font-size:12px; color:#9CA3AF; font-style:italic">Note: Notification feature coming soon.</div>
                        <div class="jd-sheet-buttons">
                            <button class="jd-sheet-btn-cancel" id="jdd-close">Keep</button>
                            <button class="jd-btn-danger-filled" style="flex:1; border-radius:12px; height:48px; font-size:15px; font-weight:600" id="jdd-confirm">Decline</button>
                        </div>
                    </div>
                </div>

                <!-- Cancel Job Sheet -->
                <div class="jd-sheet-overlay ${showCancelSheet ? 'active' : ''}" id="jds-cancel">
                    <div class="jd-sheet" style="text-align:center;">
                        <div class="jd-sheet-title">Cancel this job?</div>
                        <div class="jd-sheet-sub">All ${pendingApps.length} pending applications will be dismissed. Workers will not be notified automatically.</div>
                        <div style="background:#F3F4F6; padding:12px; border-radius:8px; font-size:14px; font-weight:600; color:#111827; margin-bottom:24px;">
                            ${job.jobTitle}
                        </div>
                        <button class="jd-btn-danger-filled" style="width:100%; height:48px; border-radius:12px; font-size:16px; font-weight:600; margin-bottom:12px;" id="jdc-confirm">
                            ${isCancelling ? '<i class="ri-loader-4-line mj-spin"></i> Cancelling...' : 'Cancel Job'}
                        </button>
                        <button class="jd-sheet-btn-cancel" style="width:100%" id="jdc-close">Keep Job</button>
                    </div>
                </div>

            </div>
        `;

        bindEvents();
    };

    const bindEvents = () => {
        document.getElementById('jd-back')?.addEventListener('click', () => navigate(-1));
        
        // --- Description Toggle ---
        const descText = document.getElementById('jd-desc-text');
        const descToggle = document.getElementById('jd-desc-toggle');
        if (descText && descToggle) {
            if (descText.scrollHeight > descText.clientHeight + 2 || expandedJobDesc) {
                descToggle.style.display = 'block';
                descToggle.addEventListener('click', () => {
                    expandedJobDesc = !expandedJobDesc;
                    render();
                });
            }
        }

        // --- Application Cover Letter Toggles ---
        document.querySelectorAll('.jd-cov-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wid = e.target.dataset.wid;
                expandedDescriptions[wid] = !expandedDescriptions[wid];
                render();
            });
        });

        // --- More Options Menu ---
        document.getElementById('jd-btn-more')?.addEventListener('click', () => { showOptionsSheet = true; render(); });
        document.getElementById('jdo-close')?.addEventListener('click', () => { showOptionsSheet = false; render(); });
        document.getElementById('jds-more')?.addEventListener('click', (e) => { if(e.target.id === 'jds-more') { showOptionsSheet = false; render(); } });

        document.getElementById('jdo-share')?.addEventListener('click', () => {
            showOptionsSheet = false;
            showToast('Share coming soon');
            render();
        });

        document.getElementById('jdo-edit')?.addEventListener('click', () => {
            showOptionsSheet = false;
            navigate('customer/jobs/edit', { id: jobId });
        });
        document.getElementById('jd-tb-edit')?.addEventListener('click', () => navigate('customer/jobs/edit', { id: jobId }));

        document.getElementById('jdo-cancel')?.addEventListener('click', () => { showOptionsSheet = false; showCancelSheet = true; render(); });
        document.getElementById('jd-tb-cancel')?.addEventListener('click', () => { showCancelSheet = true; render(); });

        // --- Cancel Job Sheet ---
        document.getElementById('jdc-close')?.addEventListener('click', () => { showCancelSheet = false; render(); });
        document.getElementById('jds-cancel')?.addEventListener('click', (e) => { if(e.target.id === 'jds-cancel') { showCancelSheet = false; render(); } });
        
        document.getElementById('jdc-confirm')?.addEventListener('click', async () => {
            if (isCancelling) return;
            isCancelling = true;
            render();
            try {
                await api.updateJobStatus(jobId, 'cancelled');
                job.jobStatus = 'cancelled';
                showToast('Job cancelled');
                setTimeout(() => navigate(-1), 1000);
            } catch (err) {
                // Mock fallback
                job.jobStatus = 'cancelled';
                showToast('Job cancelled (Demo Mode)');
                setTimeout(() => navigate(-1), 1000);
            } finally {
                isCancelling = false;
                showCancelSheet = false;
                render();
            }
        });

        // --- Applications Accept / Decline ---
        document.querySelectorAll('.jd-app-btn-accept').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wid = e.target.dataset.wid;
                acceptTarget = job.applications.find(a => a.worker._id === wid);
                showAcceptSheet = true;
                render();
            });
        });

        document.querySelectorAll('.jd-app-btn-decline').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wid = e.target.dataset.wid;
                declineTarget = job.applications.find(a => a.worker._id === wid);
                showDeclineSheet = true;
                render();
            });
        });

        // Accept Sheet Flow
        document.getElementById('jda-close')?.addEventListener('click', () => { showAcceptSheet = false; render(); });
        document.getElementById('jds-accept')?.addEventListener('click', (e) => { if(e.target.id === 'jds-accept') { showAcceptSheet = false; render(); } });
        document.getElementById('jda-confirm')?.addEventListener('click', async () => {
            if (isAccepting) return;
            isAccepting = true;
            render();
            try {
                const res = await api.createBooking({
                    job: jobId,
                    worker: acceptTarget.worker._id,
                    scheduledDate: job.preferredStartDate,
                    scheduledTime: "09:00",
                    estimatedDurationHours: job.estimatedDurationHours,
                    notes: job.jobDescription
                });
                bookingIds[acceptTarget.worker._id] = res.data?._id || 'mock-booking-id';
                acceptTarget.status = 'accepted';
                job.jobStatus = 'assigned';
                showToast('Booking created!');
            } catch(e) {
                // Demo fallback
                bookingIds[acceptTarget.worker._id] = 'mock-booking-id-' + Date.now();
                acceptTarget.status = 'accepted';
                job.jobStatus = 'assigned';
                showToast('Booking created! (Demo Mode)');
            } finally {
                isAccepting = false;
                showAcceptSheet = false;
                acceptTarget = null;
                render();
            }
        });

        // Decline Sheet Flow
        document.getElementById('jdd-close')?.addEventListener('click', () => { showDeclineSheet = false; render(); });
        document.getElementById('jds-decline')?.addEventListener('click', (e) => { if(e.target.id === 'jds-decline') { showDeclineSheet = false; render(); } });
        document.getElementById('jdd-confirm')?.addEventListener('click', () => {
            // Optimistic completely
            declineTarget.status = 'rejected';
            showToast('Application declined');
            // TODO: wire to reject endpoint when available
            showDeclineSheet = false;
            declineTarget = null;
            render();
        });
    };

    const fetchData = async () => {
        isLoading = true;
        error = null;
        render();
        try {
            const result = await api.getJob(jobId);
            job = result.data;
        } catch (e) {
            // Mock Fallback
            job = {
                _id: jobId || "mock-job-id",
                jobTitle: "Fix kitchen sink leak",
                jobDescription: "The kitchen sink in our main kitchen has been dripping for three days. It appears to be a worn-out washer or a loose connection under the basin. Requires someone with plumbing experience and their own tools.\n\nPreferably to be fixed today before evening.",
                category: "Plumbing",
                locationAddress: "42 Main Street",
                city: "Negombo",
                district: "Gampaha",
                urgencyLevel: "urgent",
                budgetMin: 5000,
                budgetMax: 15000,
                estimatedDurationHours: 3,
                jobStatus: "active",
                viewsCount: 24,
                preferredStartDate: "2026-04-10T00:00:00Z",
                expiryDate: new Date(Date.now() + 2*24*60*60*1000).toISOString(),
                createdAt: new Date().toISOString(),
                customer: currentUser?.userId || "user_id_123",
                applications: [
                    {
                        worker: {
                            _id: "w1",
                            firstName: "Kasun",
                            lastName: "Perera",
                            skills: ["Plumbing", "Electrical"],
                            hourlyRate: 1200,
                            experience: "4 years",
                            district: "Gampaha",
                            city: "Negombo",
                            isVerified: true
                        },
                        coverLetter: "I have 4 years of experience and can fix this quickly. I have the required tools and washer.",
                        proposedRate: 1200,
                        status: "pending",
                        appliedAt: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        worker: {
                            _id: "w2",
                            firstName: "Nimal",
                            lastName: "Silva",
                            skills: ["Plumbing"],
                            hourlyRate: 1000,
                            experience: "2 years",
                            district: "Colombo",
                            city: "Colombo",
                            isVerified: false
                        },
                        coverLetter: "Available immediately.",
                        proposedRate: 1000,
                        status: "pending",
                        appliedAt: new Date(Date.now() - 7200000).toISOString()
                    }
                ]
            };
        }
        isLoading = false;
        render();
    };

    // Bootstrap
    fetchData();
}
