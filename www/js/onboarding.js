// ============================================= //
//  SkillConnect – Splash + Onboarding Flow       //
//  Vanilla JS · Capacitor Android Mobile-First   //
// ============================================= //

(function () {
    'use strict';

    // ─── State ─────────────────────────────────
    let phase = 'splash';      // 'splash' | 'onboarding'
    let currentSlide = 0;      // 0 | 1 | 2
    let splashEl = null;
    let onboardingEl = null;

    // Touch tracking for swipe gesture
    let touchStartX = 0;
    let touchStartY = 0;
    let touchCurrentX = 0;
    let isSwiping = false;

    // ─── Slide Data ─────────────────────────────
    const slides = [
        {
            label: 'For Clients',
            title: 'Find Skilled\nWorkers',
            subtitle: 'Browse verified tradespeople near you — plumbers, electricians, carpenters and more.',
            illustrationId: 'slide-1',
            btnClass: 'ob-btn-amber',
            btnText: 'Next',
        },
        {
            label: 'For Employers',
            title: 'Post Jobs\nInstantly',
            subtitle: 'Describe what you need, set your budget, and get applications from workers fast.',
            illustrationId: 'slide-2',
            btnClass: 'ob-btn-teal',
            btnText: 'Next',
        },
        {
            label: 'For Everyone',
            title: 'Rent Tools &\nEquipment',
            subtitle: 'Browse supplier listings for any tool or equipment you need, at daily rental prices.',
            illustrationId: 'slide-3',
            btnClass: 'ob-btn-navy',
            btnText: '✦  Get Started',
        },
    ];

    // ─── SVG Illustrations ───────────────────────
    function getIllustration(id) {
        switch (id) {
            case 'slide-1': return `
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- Background circle -->
                    <circle cx="100" cy="100" r="75" fill="#FEF3C7" opacity="0.6"/>
                    <!-- Worker body -->
                    <rect x="72" y="105" width="56" height="60" rx="8" fill="#D97706"/>
                    <rect x="81" y="105" width="38" height="60" rx="6" fill="#F59E0B"/>
                    <!-- Head -->
                    <circle cx="100" cy="88" r="22" fill="#FBBF24"/>
                    <!-- Hard hat -->
                    <rect x="78" y="70" width="44" height="12" rx="6" fill="#B45309"/>
                    <rect x="74" y="79" width="52" height="6" rx="3" fill="#B45309"/>
                    <!-- Face features -->
                    <circle cx="93" cy="91" r="3" fill="#92400E"/>
                    <circle cx="107" cy="91" r="3" fill="#92400E"/>
                    <path d="M93 100 Q100 105 107 100" stroke="#92400E" stroke-width="2" stroke-linecap="round" fill="none"/>
                    <!-- Left arm holding wrench -->
                    <rect x="50" y="112" width="22" height="12" rx="6" fill="#F59E0B"/>
                    <!-- Wrench -->
                    <rect x="28" y="106" width="28" height="10" rx="4" fill="#9CA3AF"/>
                    <rect x="24" y="102" width="12" height="8" rx="3" fill="#6B7280"/>
                    <rect x="24" y="114" width="12" height="8" rx="3" fill="#6B7280"/>
                    <!-- Right arm -->
                    <rect x="128" y="112" width="22" height="12" rx="6" fill="#F59E0B"/>
                    <!-- Toolbox -->
                    <rect x="128" y="120" width="36" height="28" rx="6" fill="#D97706"/>
                    <rect x="128" y="120" width="36" height="10" rx="6" fill="#B45309"/>
                    <rect x="144" y="115" width="4" height="8" rx="2" fill="#9CA3AF"/>
                    <!-- Tools sticking out -->
                    <rect x="134" y="112" width="3" height="8" rx="1.5" fill="#9CA3AF"/>
                    <rect x="141" y="110" width="3" height="10" rx="1.5" fill="#9CA3AF"/>
                    <rect x="148" y="112" width="3" height="8" rx="1.5" fill="#F59E0B"/>
                    <!-- Stars -->
                    <circle cx="48" cy="65" r="4" fill="#FCD34D"/>
                    <circle cx="155" cy="72" r="3" fill="#FCD34D"/>
                    <circle cx="162" cy="52" r="2" fill="#FCD34D"/>
                    <circle cx="40" cy="52" r="2.5" fill="#FCD34D"/>
                    <!-- Verified badge -->
                    <circle cx="155" cy="95" r="14" fill="#10B981"/>
                    <path d="M148 96 L153 101 L163 88" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;

            case 'slide-2': return `
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- Background -->
                    <circle cx="100" cy="100" r="75" fill="#CCFBF1" opacity="0.6"/>
                    <!-- Job card (main) -->
                    <rect x="42" y="60" width="116" height="90" rx="12" fill="#FFFFFF" filter="url(#card-shadow)"/>
                    <defs>
                        <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0D9488" flood-opacity="0.2"/>
                        </filter>
                    </defs>
                    <rect x="42" y="60" width="116" height="90" rx="12" fill="white" opacity="0.95"/>
                    <!-- Card accent stripe -->
                    <rect x="42" y="60" width="116" height="6" rx="6" fill="#14B8A6"/>
                    <rect x="42" y="63" width="116" height="3" fill="#14B8A6"/>
                    <!-- Title line -->
                    <rect x="56" y="80" width="70" height="8" rx="4" fill="#0F172A"/>
                    <!-- Subtitle lines -->
                    <rect x="56" y="96" width="55" height="5" rx="2.5" fill="#CBD5E1"/>
                    <rect x="56" y="108" width="40" height="5" rx="2.5" fill="#CBD5E1"/>
                    <!-- LKR badge -->
                    <rect x="56" y="120" width="52" height="18" rx="9" fill="#F0FDF4"/>
                    <text x="70" y="133" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#16A34A">LKR 5,000</text>
                    <!-- Status badge -->
                    <rect x="118" y="120" width="28" height="18" rx="9" fill="#F0FDFA"/>
                    <text x="124" y="133" font-family="Inter,sans-serif" font-size="8" font-weight="600" fill="#0D9488">OPEN</text>
                    <!-- Apply button on card -->
                    <rect x="56" y="144" width="86" height="0" rx="6" fill="#14B8A6"/>
                    <!-- Floating notification bubble -->
                    <rect x="108" y="44" width="64" height="32" rx="10" fill="#0F172A"/>
                    <text x="121" y="57" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="#F9A826">New Apply!</text>
                    <text x="121" y="68" font-family="Inter,sans-serif" font-size="7" fill="#94A3B8">3 workers</text>
                    <!-- Tail -->
                    <polygon points="118,76 128,76 123,84" fill="#0F172A"/>
                    <!-- Second card (behind) -->
                    <rect x="55" y="145" width="100" height="20" rx="8" fill="#F1F5F9" opacity="0.8"/>
                    <rect x="63" y="152" width="50" height="5" rx="2.5" fill="#CBD5E1"/>
                    <!-- Floating + button -->
                    <circle cx="155" cy="155" r="18" fill="#14B8A6"/>
                    <path d="M155 147 L155 163 M147 155 L163 155" stroke="white" stroke-width="3" stroke-linecap="round"/>
                    <!-- Stars decoration -->
                    <circle cx="45" cy="52" r="3.5" fill="#99F6E4"/>
                    <circle cx="164" cy="165" r="4" fill="#99F6E4"/>
                    <circle cx="38" cy="130" r="2.5" fill="#5EEAD4"/>
                </svg>`;

            case 'slide-3': return `
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- Background -->
                    <circle cx="100" cy="100" r="75" fill="#DBEAFE" opacity="0.6"/>
                    <!-- Toolbox body -->
                    <rect x="45" y="105" width="110" height="65" rx="10" fill="#1E40AF"/>
                    <rect x="45" y="105" width="110" height="22" rx="10" fill="#2563EB"/>
                    <!-- Toolbox handle -->
                    <rect x="75" y="92" width="50" height="16" rx="8" fill="#1E40AF"/>
                    <rect x="80" y="96" width="40" height="8" rx="4" fill="#3B82F6"/>
                    <!-- Horizontal divider line -->
                    <rect x="45" y="126" width="110" height="2" fill="#1D4ED8"/>
                    <!-- Latch -->
                    <rect x="95" y="118" width="10" height="10" rx="3" fill="#BFDBFE"/>
                    <!-- Drill -->
                    <rect x="62" y="80" width="40" height="18" rx="6" fill="#374151"/>
                    <rect x="62" y="83" width="18" height="12" rx="4" fill="#4B5563"/>
                    <rect x="98" y="80" width="20" height="6" rx="2" fill="#6B7280"/>
                    <rect x="114" y="76" width="6" height="14" rx="2" fill="#9CA3AF"/>
                    <!-- Drill bit -->
                    <rect x="56" y="85" width="8" height="4" rx="2" fill="#BFDBFE"/>
                    <polygon points="52,85 56,85 56,89 52,89 50,87" fill="#93C5FD"/>
                    <!-- Wrench -->
                    <rect x="120" y="90" width="8" height="36" rx="3" fill="#9CA3AF" transform="rotate(-25 120 90)"/>
                    <ellipse cx="134" cy="88" rx="9" ry="7" fill="#9CA3AF" transform="rotate(-25 134 88)"/>
                    <ellipse cx="134" cy="88" rx="5" ry="4" fill="#374151" transform="rotate(-25 134 88)"/>
                    <ellipse cx="117" cy="118" rx="9" ry="7" fill="#9CA3AF" transform="rotate(-25 117 118)"/>
                    <ellipse cx="117" cy="118" rx="5" ry="4" fill="#374151" transform="rotate(-25 117 118)"/>
                    <!-- Hammer -->
                    <rect x="52" y="58" width="36" height="10" rx="4" fill="#B45309" transform="rotate(-15 52 58)"/>
                    <rect x="52" y="52" width="16" height="16" rx="3" fill="#6B7280" transform="rotate(-15 52 52)"/>
                    <!-- Tape measure roll -->
                    <circle cx="152" cy="115" r="16" fill="#F59E0B"/>
                    <circle cx="152" cy="115" r="9" fill="#D97706"/>
                    <circle cx="152" cy="115" r="4" fill="#FCD34D"/>
                    <rect x="136" y="112" width="14" height="6" rx="2" fill="#F59E0B"/>
                    <!-- Rental tag -->
                    <rect x="82" y="52" width="50" height="22" rx="6" fill="#EFF6FF" filter="url(#tag-shadow)"/>
                    <defs>
                        <filter id="tag-shadow">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#3B82F6" flood-opacity="0.25"/>
                        </filter>
                    </defs>
                    <text x="92" y="62" font-family="Inter,sans-serif" font-size="7" font-weight="600" fill="#64748B">RENT / DAY</text>
                    <text x="88" y="71" font-family="Inter,sans-serif" font-size="10" font-weight="800" fill="#1E40AF">LKR 850</text>
                    <!-- Stars -->
                    <circle cx="42" cy="77" r="3" fill="#93C5FD"/>
                    <circle cx="165" cy="72" r="4" fill="#93C5FD"/>
                    <circle cx="160" cy="145" r="2.5" fill="#BFDBFE"/>
                </svg>`;

            default: return '';
        }
    }

    // ─── Splash Screen HTML ──────────────────────
    function createSplashScreen() {
        const div = document.createElement('div');
        div.id = 'sc-splash';
        div.className = 'splash-screen';
        div.innerHTML = `
            <div class="splash-logo-wrap">
                <div class="splash-pulse-ring"></div>
                <div class="splash-logo-box">
                    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <!-- Wrench icon -->
                        <path d="M33.5 8C29.4 8 26 11.4 26 15.5c0 1.1.27 2.14.73 3.06L14.06 31.23A7.44 7.44 0 0 0 11 31C6.9 31 3.5 34.4 3.5 38.5S6.9 46 11 46s7.5-3.4 7.5-7.5c0-1.1-.27-2.14-.73-3.06L30.44 22.77A7.45 7.45 0 0 0 33.5 23.5c4.1 0 7.5-3.4 7.5-7.5S37.6 8 33.5 8zm0 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zM11 43a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" fill="#F9A826"/>
                        <!-- Person icon (simplified) -->
                        <circle cx="38" cy="32" r="5" fill="#F9A826" opacity="0.85"/>
                        <path d="M30 48c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="#F9A826" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
                        <!-- SC text (bold, small) -->
                        <text x="6" y="20" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="800" fill="#F9A826" opacity="0.9">SC</text>
                    </svg>
                </div>
            </div>
            <div class="splash-app-name">Skill<span>Connect</span></div>
            <div class="splash-tagline">Work · Hire · Rent</div>
            <div class="splash-dots">
                <div class="splash-dot"></div>
                <div class="splash-dot"></div>
                <div class="splash-dot"></div>
            </div>
        `;
        return div;
    }

    // ─── Onboarding Screen HTML ──────────────────
    function createOnboardingScreen() {
        const div = document.createElement('div');
        div.id = 'sc-onboarding';
        div.className = 'onboarding-screen';

        const slidesHtml = slides.map((s, i) => `
            <div class="ob-slide ob-slide-${i + 1}">
                <div class="ob-illustration">
                    ${getIllustration(s.illustrationId)}
                </div>
                <div class="ob-text-area">
                    <span class="ob-slide-label">${s.label}</span>
                    <h1 class="ob-title">${s.title.replace('\n', '<br/>')}</h1>
                    <p class="ob-subtitle">${s.subtitle}</p>
                </div>
            </div>
        `).join('');

        const dotsHtml = slides.map((_, i) =>
            `<button class="ob-dot${i === 0 ? ' active' : ''}" aria-label="Go to slide ${i + 1}" data-index="${i}"></button>`
        ).join('');

        div.innerHTML = `
            <button class="ob-skip-btn" id="ob-skip-btn" aria-label="Skip onboarding">Skip</button>
            <div class="ob-slides-container" id="ob-slides-container">
                <div class="ob-slides-track" id="ob-slides-track">
                    ${slidesHtml}
                </div>
            </div>
            <div class="ob-bottom">
                <div class="ob-dots" id="ob-dots">${dotsHtml}</div>
                <button class="ob-next-btn ob-btn-amber" id="ob-next-btn">
                    ${slides[0].btnText}
                    <svg class="ob-btn-icon" viewBox="0 0 22 22" fill="none">
                        <path d="M8 11h6M11 8l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `;

        return div;
    }

    // ─── Update UI for current slide ─────────────
    function updateSlideUI() {
        const track = document.getElementById('ob-slides-track');
        const dotsEl = document.getElementById('ob-dots');
        const nextBtn = document.getElementById('ob-next-btn');

        if (!track || !dotsEl || !nextBtn) return;

        // Move track
        track.style.transform = `translateX(${-currentSlide * (100 / 3)}%)`;

        // Update dots
        dotsEl.querySelectorAll('.ob-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });

        // Update button
        const slide = slides[currentSlide];
        nextBtn.className = `ob-next-btn ${slide.btnClass}`;

        if (currentSlide === slides.length - 1) {
            // Last slide — Get Started, no arrow
            nextBtn.innerHTML = slide.btnText;
        } else {
            nextBtn.innerHTML = `
                ${slide.btnText}
                <svg class="ob-btn-icon" viewBox="0 0 22 22" fill="none">
                    <path d="M8 11h6M11 8l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        }
    }

    // ─── Navigation ─────────────────────────────
    function goToSlide(index) {
        if (index < 0 || index >= slides.length) return;
        currentSlide = index;
        updateSlideUI();
    }

    function nextSlide() {
        if (currentSlide < slides.length - 1) {
            goToSlide(currentSlide + 1);
        } else {
            completeOnboarding();
        }
    }

    function completeOnboarding() {
        // Exit onboarding — navigate to register page
        if (onboardingEl) {
            onboardingEl.style.opacity = '0';
            onboardingEl.style.transform = 'translateY(20px)';
        }
        setTimeout(() => {
            if (onboardingEl) {
                onboardingEl.remove();
                onboardingEl = null;
            }
            // Integrate with existing SPA router
            if (typeof navigate === 'function') {
                navigate('select-role');
            } else {
                // Fallback: remove onboarding and show register manually
                console.warn('[Onboarding] navigate() not found, falling back.');
            }
        }, 320);
    }

    // ─── Touch / Swipe Handling ──────────────────
    function attachSwipeHandlers(container) {
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchCurrentX = touchStartX;
            isSwiping = false;
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!e.touches[0]) return;
            touchCurrentX = e.touches[0].clientX;
            const deltaX = touchCurrentX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;

            // If more vertical than horizontal → not a slide swipe, ignore
            if (!isSwiping && Math.abs(deltaY) > Math.abs(deltaX)) return;
            isSwiping = true;
        }, { passive: true });

        container.addEventListener('touchend', () => {
            if (!isSwiping) return;
            const deltaX = touchCurrentX - touchStartX;
            if (Math.abs(deltaX) > 50) {
                if (deltaX < 0) {
                    // Swipe left → next slide
                    nextSlide();
                } else {
                    // Swipe right → previous slide
                    goToSlide(currentSlide - 1);
                }
            }
            isSwiping = false;
        }, { passive: true });
    }

    // ─── Bind Events for Onboarding ─────────────
    function bindOnboardingEvents() {
        const skipBtn = document.getElementById('ob-skip-btn');
        const nextBtn = document.getElementById('ob-next-btn');
        const slidesContainer = document.getElementById('ob-slides-container');
        const dotsEl = document.getElementById('ob-dots');

        if (skipBtn) {
            skipBtn.addEventListener('click', completeOnboarding);
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', nextSlide);
        }

        if (dotsEl) {
            dotsEl.querySelectorAll('.ob-dot').forEach((dot) => {
                dot.addEventListener('click', () => {
                    const index = parseInt(dot.dataset.index, 10);
                    goToSlide(index);
                });
            });
        }

        if (slidesContainer) {
            attachSwipeHandlers(slidesContainer);
        }
    }

    // ─── Phase Transition: Splash → Onboarding ──
    function showOnboarding() {
        phase = 'onboarding';

        // Trigger splash exit animation
        if (splashEl) {
            splashEl.classList.add('exiting');
        }

        // Create + insert onboarding screen behind splash
        onboardingEl = createOnboardingScreen();
        document.body.appendChild(onboardingEl);

        // Bind events
        bindOnboardingEvents();

        // After splash animation ends, remove it and show onboarding
        setTimeout(() => {
            if (splashEl) {
                splashEl.remove();
                splashEl = null;
            }
            // Fade in onboarding
            requestAnimationFrame(() => {
                if (onboardingEl) {
                    onboardingEl.classList.add('visible');
                }
            });
        }, 480);
    }

    // ─── Init: Show Splash ───────────────────────
    function init() {
        // Create splash
        splashEl = createSplashScreen();
        document.body.appendChild(splashEl);

        // After 2000ms, transition to onboarding
        setTimeout(showOnboarding, 2000);
    }

    // ─── Boot ────────────────────────────────────
    // Run after DOM is ready; inject before the app renders its login page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
