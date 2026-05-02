// ============================== //
// SkillConnect Mobile           //
// Write Review Screen           //
// ============================== //

async function renderWriteReview(appElement, stateRoute) {
    let wrState = {
        bookingId: stateRoute?.bookingId || null,
        workerId: stateRoute?.workerId || null,
        workerName: stateRoute?.workerName || "worker",
        booking: null,
        existingReview: null,
        isLoadingCheck: true,
        rating: stateRoute?.quickRating || 0,
        reviewText: "",
        isAnonymous: false,
        showTips: false,
        isSubmitting: false,
        showSuccess: false,
        error: null,
        showDiscardSheet: false
    };

    if (!wrState.bookingId || !wrState.workerId) {
        // Fallback for isolated testing/refresh without router context
        wrState.bookingId = "b123";
        wrState.workerId = "w123";
        wrState.workerName = "Kasun Perera";
    }

    const LABELS = ["", "⚡ Poor", "👎 Below Average", "👌 Average", "👍 Good", "⭐ Excellent"];
    const SUBLABELS = ["", "We're sorry to hear that.", "Thanks for your honest feedback.", "Glad it was satisfactory.", "Great! Workers appreciate good reviews.", "Amazing! This really helps the worker."];
    const COLORS = ["", "color:#DC2626", "color:#F59E0B", "color:#6B7280", "color:#0D9488", "color:#16A34A"];
    const PROMPTS = [
        "What went wrong? Your feedback helps us maintain quality.",
        "What went wrong? Your feedback helps us maintain quality.",
        "What could have been better?",
        "What was your experience like?",
        "What did they do well?",
        "Tell others why they are excellent!"
    ];
    const PLACEHOLDERS = [
        "",
        "Describe the issues you experienced...",
        "Describe the issues you experienced...",
        "Describe your experience...",
        "e.g. They arrived on time, completed the work professionally and cleaned up afterwards. Would highly recommend!",
        "e.g. They arrived on time, completed the work professionally and cleaned up afterwards. Would highly recommend!"
    ];

    function renderStar(index) {
        const active = index <= wrState.rating;
        return `
            <div class="wr-s-box" data-idx="${index}">
                <svg viewBox="0 0 24 24" class="wr-star-ic ${active ? 'active' : ''}" id="w-st-${index}">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
            </div>
        `;
    }

    function wrUpdateUI() {
        if (wrState.isLoadingCheck) {
            appElement.innerHTML = `
                <div class="wr-screen">
                    <div class="wr-header"><button class="wr-btn-icon" onclick="navigate(-1)"><i class="ri-arrow-left-line"></i></button><div class="wr-title-global">Write a Review</div><div style="width:44px;"></div></div>
                    <div class="wr-scroll-content">
                        <div class="wr-sk-ctx"></div>
                        <div class="wr-sk-c1"></div>
                        <div class="wr-sk-c2"></div>
                    </div>
                </div>
            `;
            return;
        }

        if (wrState.existingReview) {
            appElement.innerHTML = `
                <div class="wr-screen">
                    <div class="wr-header"><button class="wr-btn-icon" onclick="navigate(-1)"><i class="ri-arrow-left-line"></i></button><div class="wr-title-global">Write a Review</div><div style="width:44px;"></div></div>
                    <div class="wr-scroll-content wr-ar">
                        <div class="wr-ar-circ"><i class="ri-check-line"></i></div>
                        <div class="wr-ar-t">Review Already Submitted</div>
                        <div class="wr-ar-s">You've already reviewed this booking. Reviews can only be submitted once.</div>
                        <div class="wr-ar-c">
                            <div class="wr-ar-stars">${Array(wrState.existingReview.overallRating).fill('<i class="ri-star-fill"></i>').join('')}</div>
                            <div class="wr-ar-txt">${wrState.existingReview.reviewText}</div>
                            <div class="wr-ar-date">${new Date(wrState.existingReview.createdAt).toLocaleDateString()}</div>
                        </div>
                        <button class="wr-ar-btn" id="w-btn-back">Back to Bookings</button>
                    </div>
                </div>
            `;
            return;
        }

        const rt = wrState.rating;
        const b = wrState.booking;

        let ctxHtml = '';
        if (b) {
            const initial = String(b.worker?.firstName||'W')[0];
            const dateStr = b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'Date N/A';
            ctxHtml = `
                <div class="wr-ctx">
                    <div class="wr-ctx-r1">
                        <div class="wr-av">${initial}</div>
                        <div class="wr-ctx-mid">
                            <div class="wr-ctx-lbl">Review for</div>
                            <div class="wr-ctx-name">${b.worker?.firstName} ${b.worker?.lastName}</div>
                            <div class="wr-ctx-loc">${b.worker?.district || 'Location N/A'}</div>
                        </div>
                        ${b.worker?.isVerified ? `<div class="wr-ctx-pill">✓ Verified</div>` : ''}
                    </div>
                    <div class="wr-ctx-r2">
                        <div class="wr-ctx-i"><i class="ri-calendar-event-line"></i>${dateStr}</div>
                        ${b.job?.jobTitle ? `<div class="wr-ctx-i"><i class="ri-briefcase-4-line"></i><div class="wr-ctx-job">${b.job.jobTitle}</div></div>` : ''}
                    </div>
                </div>
            `;
        } else {
            const initial = String(wrState.workerName)[0] || 'W';
            ctxHtml = `
                <div class="wr-ctx">
                    <div class="wr-ctx-r1">
                        <div class="wr-av">${initial.toUpperCase()}</div>
                        <div class="wr-ctx-mid"><div class="wr-ctx-name">Review for ${wrState.workerName}</div></div>
                    </div>
                </div>
            `;
        }

        const len = wrState.reviewText.length;
        let cClass = 'muted'; if(len>=400) cClass = 'amber'; if(len>=480) cClass = 'red';

        const isFormValid = rt >= 1 && wrState.reviewText.trim().length >= 20 && len <= 500;

        appElement.innerHTML = `
            <div class="wr-screen">
                <div class="wr-header">
                    <button class="wr-btn-icon" id="w-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="wr-title-global">Write a Review</div>
                    <div style="width:44px;"></div>
                </div>
                
                <div class="wr-err-ban" id="w-err" style="${wrState.error?'display:block':''}">${wrState.error}</div>

                <div class="wr-scroll-content">
                    ${ctxHtml}

                    <div class="wr-card">
                        <div class="wr-cti">Your Rating</div>
                        <div class="wr-stars">${[1,2,3,4,5].map(i => renderStar(i)).join('')}</div>
                        <div class="wr-r-lbl" style="${COLORS[rt]}">${rt > 0 ? LABELS[rt] : 'Tap a star to rate'}</div>
                        <div class="wr-r-sub">${SUBLABELS[rt]}</div>
                    </div>

                    <div class="wr-card wr-tc">
                        <div class="wr-cti">Your Review</div>
                        <div class="wr-t-prompt">${rt > 0 ? PROMPTS[rt].replace('they', wrState.workerName.split(' ')[0]) : 'What went wrong? Your feedback helps us maintain quality.'}</div>
                        <textarea class="wr-ta ${(len>0 && len<20)?'err':''}" id="w-ta" placeholder="${PLACEHOLDERS[rt]}" maxlength="500">${wrState.reviewText}</textarea>
                        <div class="wr-count ${cClass}">${len} / 500</div>
                        
                        <button class="wr-tips-btn" id="w-t-btn">Tips for a helpful review ▾</button>
                        <div class="wr-tips-box ${wrState.showTips ? 'open' : ''}">
                            <div class="wr-tip">✓ Be specific about the work done</div>
                            <div class="wr-tip">✓ Mention punctuality and professionalism</div>
                            <div class="wr-tip">✓ Describe the quality of the result</div>
                            <div class="wr-tip">✓ Note if you would hire them again</div>
                            <div class="wr-tip">✗ Avoid personal attacks or offensive language</div>
                        </div>
                    </div>

                    <div class="wr-ac">
                        <div>
                            <div class="wr-a-l">Post anonymously</div>
                            <div class="wr-a-s">Your name won't appear on the review</div>
                        </div>
                        <div class="wr-switch ${wrState.isAnonymous ? 'on' : ''}" id="w-sw"><div class="wr-sw-circ"></div></div>
                    </div>

                    <div class="wr-guide">
                        <div class="wr-g-t"><i class="ri-shield-check-line"></i> Review Guidelines</div>
                        <div class="wr-g-p">Reviews must be honest and based on your actual experience. False reviews or personal attacks will be removed. SkillConnect reserves the right to moderate all reviews.</div>
                    </div>
                </div>

                <div class="wr-cta">
                    <div class="wr-prv ${rt>0 ? 'show' : ''}">
                        <span class="wr-prv-s" style="color:#F59E0B">${Array(rt).fill('<i class="ri-star-fill"></i>').join('')}</span>
                        <span class="wr-prv-l" style="${COLORS[rt]}">${rt > 0 ? LABELS[rt].replace(/[^a-zA-Z\s]/g,'').trim() : ''}</span>
                    </div>
                    <button class="wr-btn" id="w-sub" ${(!isFormValid || wrState.isSubmitting) ? 'disabled' : ''}>
                        ${wrState.isSubmitting ? `<div class="spinner" style="width:18px;height:18px;border:2px solid;border-top-color:#FFF;border-radius:50%;margin-right:8px;animation:spin 1s infinite;"></div>` : ''}
                        ${wrState.isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                    ${!isFormValid && !wrState.isSubmitting ? `
                        <div class="wr-btn-sub">${rt === 0 ? 'Please select a star rating' : 'Please write at least 20 characters'}</div>
                    ` : ''}
                </div>

                <!-- Discard Sheet -->
                <div class="wr-bs-bg ${wrState.showDiscardSheet ? 'active' : ''}" id="w-d-bg">
                    <div class="wr-bs" id="w-d-sh">
                        <div class="wr-bs-t">Discard review?</div>
                        <div class="wr-bs-s">Your rating and review text will be lost.</div>
                        <button class="wr-bs-b1" id="w-d-y">Discard</button>
                        <button class="wr-bs-b2" id="w-d-n">Keep Writing</button>
                    </div>
                </div>

                <!-- Success Overlay -->
                <div class="wr-succ ${wrState.showSuccess ? 'show anim' : ''}">
                    <div class="wr-su-stars">
                        ${[1,2,3,4,5].map(i => `
                            <svg viewBox="0 0 24 24" class="wr-su-star" style="animation-delay:${(i-1)*100}ms">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                        `).join('')}
                    </div>
                    <div class="wr-su-circ"><i class="ri-check-line"></i></div>
                    <div class="wr-su-t">Review Submitted!</div>
                    <div class="wr-su-s">Thank you for reviewing ${wrState.workerName.split(' ')[0]}. Your feedback helps the SkillConnect community.</div>
                </div>
            </div>
        `;
    }

    async function loadData() {
        wrState.isLoadingCheck = true;
        wrUpdateUI();

        // Parallel Fetch
        let chkProm = api.getMyReviews ? api.getMyReviews() : Promise.resolve({data:{content:[]}});
        let bkgProm = api.getBookingDetail ? api.getBookingDetail(wrState.bookingId) : Promise.resolve({});

        try {
            const [cR, bR] = await Promise.allSettled([chkProm, bkgProm]);

            if(cR.status === 'fulfilled' && cR.value?.data?.content) {
                const ex = cR.value.data.content.find(r => r.booking === wrState.bookingId);
                if(ex) { wrState.existingReview = ex; }
            }

            if(bR.status === 'fulfilled' && bR.value?.data) {
                wrState.booking = bR.value.data;
            } else {
                // Mock fallback context loading
                wrState.booking = {
                    _id: wrState.bookingId,
                    scheduledDate: new Date().toISOString(),
                    job: { jobTitle: "Home Renovation Fixes" },
                    worker: { firstName: wrState.workerName.split(' ')[0]||"Worker", lastName: wrState.workerName.split(' ')[1]||"", district: "Colombo", isVerified: true }
                };
            }
        } catch(e) {
            console.warn(e);
        }

        wrState.isLoadingCheck = false;
        wrUpdateUI();
    }

    appElement.addEventListener('click', async e => {
        const tg = e.target;

        // Discard Overlays
        if (tg.closest('#w-bck')) {
            if (wrState.rating > 0 || wrState.reviewText.trim().length > 0) {
                wrState.showDiscardSheet = true; wrUpdateUI();
            } else { navigate(-1); }
        }
        if (tg.closest('#w-d-n') || tg.id === 'w-d-bg') { wrState.showDiscardSheet = false; wrUpdateUI(); }
        if (tg.closest('#w-d-y')) { navigate(-1); }
        
        // Already Reviewed Nav
        if (tg.closest('#w-btn-back')) { navigate('/customer/bookings'); }

        // Tips Collapse
        if (tg.closest('#w-t-btn')) { wrState.showTips = !wrState.showTips; wrUpdateUI(); }

        // Anonymous Toggle
        if (tg.closest('#w-sw') || tg.closest('.wr-ac')) { 
            wrState.isAnonymous = !wrState.isAnonymous; wrUpdateUI();
            if(wrState.isAnonymous) showToast("Your identity is still recorded for platform safety.");
        }

        // Star Selection
        const s = tg.closest('.wr-s-box');
        if (s) {
            const idx = parseInt(s.dataset.idx);
            wrState.rating = idx;
            wrUpdateUI();
            // Apply bounce class correctly
            setTimeout(() => {
                for(let i=1; i<=idx; i++){
                    const it = document.getElementById(`w-st-${i}`);
                    if(it) {
                        it.classList.remove('pop');
                        void it.offsetWidth; // trigger reflow
                        it.style.animationDelay = `${(i-1)*50}ms`;
                        it.classList.add('pop');
                    }
                }
            }, 10);
        }

        // Submit Pipeline
        if (tg.closest('#w-sub') && !wrState.isSubmitting) {
            wrState.isSubmitting = true;
            wrState.error = null;
            wrUpdateUI();

            // Simulate API POST
            await new Promise(r => setTimeout(r, 1200));

            // Success Bounds Triggered
            wrState.isSubmitting = false;
            wrState.showSuccess = true;
            wrUpdateUI();

            showToast("Review submitted successfully!", "success");

            setTimeout(() => {
                navigate('/customer/bookings');
            }, 2500);
        }
    });

    appElement.addEventListener('input', e => {
        if(e.target.id === 'w-ta') {
            wrState.reviewText = e.target.value;
            const c = document.querySelector('.wr-count');
            if(c) {
                const ln = wrState.reviewText.length;
                let cClass = 'muted'; if(ln>=400) cClass = 'amber'; if(ln>=480) cClass = 'red';
                c.className = `wr-count ${cClass}`;
                c.innerText = `${ln} / 500`;
            }
            if(wrState.reviewText.trim().length >= 20 || wrState.reviewText.trim().length < 20) {
                 wrUpdateUI(); // validate buttons state dynamically
            }
        }
    });

    loadData();
}
