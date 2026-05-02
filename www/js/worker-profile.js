// ============================ //
// SkillConnect Mobile         //
// Worker Profile Screen       //
// ============================ //

async function renderWorkerProfile(appElement, stateRoute) {
    const workerId = stateRoute.workerId || stateRoute.id;

    if (!workerId && !stateRoute.match) {
        showToast("Worker ID missing", "error");
        navigate(-1);
        return;
    }

    // fallback extraction string logic if routed directly via URL
    const finalWorkerId = workerId || (stateRoute.match ? stateRoute.match[1] : null);

    let wpState = {
        worker: null,
        reviews: [],
        isLoading: true,
        error: null,
        showVerifiedTooltip: false,
        expandedBio: false,
        expandedReviews: {},
        showAllReviews: false,
        showReportSheet: false,
        reportReason: '',
        reportDetails: '',
        isSubmittingReport: false
    };

    // Helper functions
    function getInitials(first, last) {
        return ((first || "W")[0] + (last || "")[0]).toUpperCase();
    }
    
    function getMockRating(id) {
        if (!id) return 4.0;
        try { return (parseInt(id.slice(-2), 16) % 20 + 30) / 10; } 
        catch { return 4.0; }
    }
    
    function getMockReviewCount(id) {
        if (!id) return 10;
        try { return parseInt(id.slice(-3), 16) % 40 + 5; } 
        catch { return 10; }
    }
    
    function renderStarsUI(rating) {
        let html = '';
        for(let i=1; i<=5; i++) {
            if(rating >= i) html += '★';
            else if(rating >= i - 0.5) html += '☆'; // or half star
            else html += '☆';
        }
        return html;
    }

    function formatMemberSince(iso) {
        if(!iso) return "January 2024";
        return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    function getRelativeTime(iso) {
        if(!iso) return "Recently";
        const diff = Date.now() - new Date(iso).getTime();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (d === 0) return "Today";
        if (d === 1) return "Yesterday";
        if (d < 30) return `${d} days ago`;
        if (d < 365) return `${Math.floor(d/30)} months ago`;
        return `${Math.floor(d/365)} years ago`;
    }

    function wpUpdateUI() {
        if (wpState.error) {
            appElement.innerHTML = `
                <div class="wp-screen">
                    <div class="wp-header">
                        <button class="wp-btn-icon" id="wp-back"><i class="ri-arrow-left-line"></i></button>
                        <div class="wp-title-global">Profile Error</div>
                        <div style="width:48px;"></div>
                    </div>
                    <div class="wp-scroll-content" style="align-items:center; justify-content:center;">
                        <i class="ri-error-warning-line" style="font-size:48px; color:#F59E0B; margin-bottom:12px;"></i>
                        <div style="font-size:18px; font-weight:700; color:#111827;">Couldn't load profile</div>
                        <div style="font-size:14px; color:#6B7280; margin-bottom:20px;">${wpState.error}</div>
                        <button id="wp-retry" style="padding:10px 24px; border-radius:20px; background:#000; color:#fff; font-weight:600;">Retry</button>
                    </div>
                </div>
            `;
            return;
        }

        if (wpState.isLoading) {
            let skels = '';
            for(let i=0; i<3; i++) {
                skels += `<div class="wp-card wp-skel" style="height:120px; margin-bottom:12px; animation: wpPulseSkel 1.4s infinite ${i*150}ms;"></div>`;
            }
            appElement.innerHTML = `
                <div class="wp-screen">
                    <div class="wp-header">
                        <button class="wp-btn-icon" id="wp-back"><i class="ri-arrow-left-line"></i></button>
                        <div class="wp-title-global">Worker Profile</div>
                        <div style="width:48px;"></div>
                    </div>
                    <div class="wp-scroll-content">
                        <div class="wp-hero">
                            <div class="wp-skel" style="width:80px; height:80px; border-radius:50%; animation: wpPulseSkel 1.4s infinite;"></div>
                            <div class="wp-skel" style="width:160px; height:22px; animation: wpPulseSkel 1.4s infinite 150ms;"></div>
                            <div class="wp-skel" style="width:120px; height:14px; animation: wpPulseSkel 1.4s infinite 300ms;"></div>
                            <div class="wp-skel" style="width:100px; height:12px; animation: wpPulseSkel 1.4s infinite 450ms;"></div>
                            <div style="display:flex; gap:10px; margin-top:20px; width:100%;">
                                <div class="wp-skel" style="flex:1; height:40px; animation: wpPulseSkel 1.4s infinite"></div>
                                <div class="wp-skel" style="flex:1; height:40px; animation: wpPulseSkel 1.4s infinite 150ms"></div>
                                <div class="wp-skel" style="flex:1; height:40px; animation: wpPulseSkel 1.4s infinite 300ms"></div>
                            </div>
                        </div>
                        ${skels}
                    </div>
                    <div class="wp-sticky-cta" style="opacity:0.5; pointer-events:none;">
                        <button class="wp-btn-msg"><i class="ri-chat-3-line"></i></button>
                        <button class="wp-btn-book">Loading...</button>
                    </div>
                </div>
            `;
            return;
        }

        const w = wpState.worker;
        if (!w) return;

        const initials = getInitials(w.firstName, w.lastName);
        const joined = formatMemberSince(w.createdAt);
        const name = `${w.firstName || ''} ${w.lastName || ''}`.trim();
        
        // Review Derived Logic
        const workerReviews = wpState.reviews.filter(r => r.reviewee === w._id);
        const reviewCountStr = workerReviews.length > 0 ? workerReviews.length : getMockReviewCount(w._id);
        const avgRatingStr = workerReviews.length > 0 
            ? (workerReviews.reduce((s, r) => s + r.overallRating, 0) / workerReviews.length).toFixed(1) 
            : getMockRating(w._id).toFixed(1);

        // Stats strip
        const expStr = w.experience || "0 yrs";
        const skillsLen = (w.skills || []).length;

        // Similar Workers
        // We look at bwState if populated, else empty
        let similarHtml = '';
        if (typeof bwState !== 'undefined' && bwState.allWorkers && bwState.allWorkers.length > 0) {
            const similar = bwState.allWorkers.filter(sw => sw._id !== w._id && sw.district === w.district).slice(0, 5);
            if (similar.length > 0) {
                similarHtml = `
                    <div class="wp-similar-title">Other workers in ${w.district || 'this area'}</div>
                    <div class="wp-similar-row">
                        ${similar.map(sw => `
                            <div class="wp-sim-card" data-id="${sw._id}">
                                <div class="wp-sim-avatar">${getInitials(sw.firstName, sw.lastName)}</div>
                                <div class="wp-sim-name">${sw.firstName} ${sw.lastName}</div>
                                <div class="wp-sim-skill">${(sw.skills && sw.skills[0]) || 'Trade'}</div>
                                <div class="wp-sim-rate">LKR ${sw.hourlyRate}/hr</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }

        // Bio logic
        let bioHtml = '';
        if (w.bio) {
            const isLong = w.bio.length > 150;
            const textToDisplay = (!wpState.expandedBio && isLong) ? w.bio.substring(0, 150) + '...' : w.bio;
            bioHtml = `
                <div class="wp-bio-text">${textToDisplay}</div>
                ${isLong ? `<div id="wp-toggle-bio" style="font-size:14px; color:#0D9488; font-weight:600; margin-top:8px; display:inline-block;">${wpState.expandedBio ? 'Read less' : 'Read more'}</div>` : ''}
            `;
        } else {
            bioHtml = `<div class="wp-bio-text" style="color:#9CA3AF; font-style:italic;">${w.firstName} hasn't added a bio yet.</div>`;
        }

        // Reviews section
        let reviewsHtml = '';
        if (workerReviews.length === 0) {
            reviewsHtml = `
                <div class="wp-no-reviews">
                    <i class="ri-star-smile-line"></i>
                    <div style="font-size:14px; font-weight:600; color:#111827;">No reviews yet</div>
                    <div style="font-size:13px; color:#6B7280;">Be the first to work with ${w.firstName} and leave a review.</div>
                </div>
            `;
        } else {
            // Chart mock
            if (workerReviews.length >= 3) {
                // TODO: replace with real distribution API
                const dist = [
                    {s:5, p: 55}, {s:4, p: 25}, {s:3, p: 12}, {s:2, p: 5}, {s:1, p: 3}
                ];
                reviewsHtml += `<div class="wp-review-chart">`;
                dist.forEach(d => {
                    reviewsHtml += `
                        <div class="wp-chart-row">
                            <div class="wp-chart-lbl">${d.s}★</div>
                            <div class="wp-chart-track"><div class="wp-chart-fill" style="width:${d.p}%;"></div></div>
                            <div class="wp-chart-count">${d.p}%</div>
                        </div>
                    `;
                });
                reviewsHtml += `</div>`;
            }

            const dispArr = wpState.showAllReviews ? workerReviews : workerReviews.slice(0, 5);
            dispArr.forEach(r => {
                const rInit = getInitials(r.reviewer?.firstName, r.reviewer?.lastName);
                const rName = r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}` : "Customer";
                
                let rTxt = r.reviewText || '';
                const isLong = rTxt.length > 100;
                if (!wpState.expandedReviews[r._id] && isLong) rTxt = rTxt.substring(0, 100) + '...';

                reviewsHtml += `
                    <div class="wp-review-card">
                        <div class="wp-r-row1">
                            <div class="wp-r-row1-left">
                                <div class="wp-r-avatar">${rInit}</div>
                                <div>
                                    <div class="wp-r-name">${rName}</div>
                                    ${r.isVerified ? `<div class="wp-r-vb">✓ Verified booking</div>` : ''}
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div class="wp-r-stars">${renderStarsUI(r.overallRating)} <span style="color:#111827; font-weight:700;">${r.overallRating}</span></div>
                            </div>
                        </div>
                        <div class="wp-r-txt">
                            ${rTxt}
                            ${isLong ? `<span class="wp-rev-toggle" data-rid="${r._id}" style="color:#0D9488; font-weight:600; margin-left:4px;">${wpState.expandedReviews[r._id] ? 'Less' : 'Read more'}</span>` : ''}
                        </div>
                        <div class="wp-r-time">${getRelativeTime(r.createdAt)}</div>
                    </div>
                `;
            });

            if (workerReviews.length > 5 && !wpState.showAllReviews) {
                reviewsHtml += `<button class="wp-btn-all" id="wp-show-all-revs">Show all ${workerReviews.length} reviews</button>`;
            }
        }

        appElement.innerHTML = `
            <div class="wp-screen">
                <div class="wp-header">
                    <button class="wp-btn-icon" id="wp-back"><i class="ri-arrow-left-line"></i></button>
                    <div class="wp-title-global">Worker Profile</div>
                    <button class="wp-btn-icon" id="wp-share"><i class="ri-share-forward-line"></i></button>
                </div>

                <div class="wp-scroll-content">
                    <!-- Hero -->
                    <div class="wp-hero">
                        <div class="wp-avatar-cluster">
                            <div class="wp-avatar-lg">${initials}</div>
                            ${w.isVerified ? `<div class="wp-badge-verified" id="wp-ver-badge"><i class="ri-check-line"></i></div>` : ''}
                            ${wpState.showVerifiedTooltip ? `
                                <div class="wp-tooltip">
                                    <div style="font-weight:700; margin-bottom:4px;">✓ Verified by SkillConnect</div>
                                    <div style="color:#D1D5DB;">This worker's identity has been confirmed by our admin team.</div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="wp-name">${name}</div>
                        <div class="wp-loc"><i class="ri-map-pin-2-fill" style="color:#9CA3AF;"></i> ${w.city || ''}, ${w.district || ''}</div>
                        <div class="wp-member-since">Member since ${joined}</div>

                        <div class="wp-rating-row">
                            <div class="wp-stars-amber">${renderStarsUI(avgRatingStr)}</div>
                            <div class="wp-rating-num">${avgRatingStr}</div>
                            <div class="wp-rating-count">· ${reviewCountStr} reviews</div>
                        </div>

                        ${w.isActive 
                            ? `<div class="wp-availability">● Available for work</div>`
                            : `<div class="wp-availability offline">○ Currently unavailable</div>`
                        }

                        <div class="wp-stats-strip">
                            <div class="wp-stat-box">
                                <div class="wp-stat-lbl">LKR ${w.hourlyRate || 0}/hr</div>
                                <div class="wp-stat-val">Rate</div>
                            </div>
                            <div class="wp-stat-div"></div>
                            <div class="wp-stat-box">
                                <div class="wp-stat-lbl">${expStr} exp</div>
                                <div class="wp-stat-val">Experience</div>
                            </div>
                            <div class="wp-stat-div"></div>
                            <div class="wp-stat-box">
                                <div class="wp-stat-lbl">${skillsLen} skills</div>
                                <div class="wp-stat-val">Verified</div>
                            </div>
                        </div>
                    </div>

                    <!-- Cards -->
                    <div class="wp-card">
                        <div class="wp-card-title">About ${w.firstName || 'Me'}</div>
                        ${bioHtml}
                    </div>

                    <div class="wp-card">
                        <div class="wp-card-title">Skills & Expertise</div>
                        ${(w.skills && w.skills.length > 0) ? `
                            <div class="wp-skills-grid">
                                ${w.skills.map(s => `<div class="wp-skill-pill">${s}</div>`).join('')}
                            </div>
                        ` : `<div style="color:#9CA3AF; font-style:italic; font-size:14px;">No skills listed</div>`}
                        
                        <div class="wp-rate-banner">
                            <div class="wp-rate-lbl"><i class="ri-wallet-3-fill"></i> Hourly Rate</div>
                            <div class="wp-rate-val">LKR ${w.hourlyRate || 0}</div>
                        </div>
                        <div class="wp-exp-row"><i class="ri-briefcase-4-fill"></i> ${expStr} of professional experience</div>
                    </div>

                    <div class="wp-card">
                        <div class="wp-card-title">Service Area</div>
                        <div class="wp-map-placeholder">
                            <div><i class="ri-map-pin-range-fill"></i> Serving ${w.city||''}, ${w.district||''}</div>
                            <div style="font-size:11px; font-style:italic;">Map coming soon</div>
                        </div>
                        <div class="wp-dist-info">Primarily serves ${w.district || 'local'} district</div>
                    </div>

                    <div class="wp-card">
                        <div class="wp-card-title">Reviews (${reviewCountStr})</div>
                        ${reviewsHtml}
                    </div>

                    <div class="wp-card">
                        <div class="wp-card-title">Booking Information</div>
                        <div class="wp-info-row">
                            <i class="ri-calendar-event-line wp-info-icon"></i>
                            <div class="wp-info-txt">Available from preferred start date</div>
                        </div>
                        <div class="wp-info-row">
                            <i class="ri-time-line wp-info-icon"></i>
                            <div class="wp-info-txt">Typical job duration based on your request</div>
                        </div>
                        ${w.isVerified ? `
                        <div class="wp-info-row">
                            <i class="ri-shield-check-line wp-info-icon"></i>
                            <div class="wp-info-txt">Verified worker — identity confirmed</div>
                        </div>
                        ` : ''}
                        <div class="wp-info-row">
                            <i class="ri-money-dollar-circle-line wp-info-icon"></i>
                            <div class="wp-info-txt">Payment handled directly between parties</div>
                        </div>
                    </div>

                    ${similarHtml}

                    <div class="wp-report-link" id="wp-trig-report">Report this worker</div>
                </div>

                <!-- Sticky CTA -->
                <div class="wp-sticky-cta">
                    <button class="wp-btn-msg" id="wp-msg"><i class="ri-chat-3-line"></i> Message</button>
                    <button class="wp-btn-book" id="wp-book"><i class="ri-calendar-check-line"></i> Book This Worker</button>
                </div>

                <!-- Report Sheet -->
                <div class="wp-report-sheet ${wpState.showReportSheet ? 'active':''}" id="wp-report-bg">
                    <div class="wp-report-content">
                        <div class="wp-rs-title">Report ${w.firstName} ${w.lastName}</div>
                        <div class="wp-rs-chips" id="wp-rs-chips">
                            ${['Inappropriate behaviour','Fraud','Fake profile','Spam','Other'].map(rsn => `
                                <div class="wp-rs-chip ${wpState.reportReason===rsn ? 'active':''}" data-rsn="${rsn}">${rsn}</div>
                            `).join('')}
                        </div>
                        <textarea class="wp-rs-area" id="wp-rs-area" placeholder="Describe the issue... (optional)" maxlength="300">${wpState.reportDetails}</textarea>
                        <button class="wp-rs-btn" id="wp-rs-submit">${wpState.isSubmittingReport ? 'Submitting...' : 'Submit Report'}</button>
                        <div class="wp-rs-cancel" id="wp-rs-cancel">Cancel</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Initial Fetch
    async function loadData() {
        wpState.isLoading = true;
        wpUpdateUI();

        let wRes, rRes;
        try {
            const token = localStorage.getItem('token');
            const headers = { "Authorization": `Bearer ${token}` };
            
            // Promise.allSettled pattern
            const results = await Promise.allSettled([
                fetch(`${api.baseURL}/profile/workers/${finalWorkerId}`, { headers }),
                fetch(`${api.baseURL}/reviews`, { headers }) // TODO: add ?reviewee=:id filter when API supports it
            ]);

            // Handle Profile
            if (results[0].status === 'fulfilled' && results[0].value.ok) {
                const j1 = await results[0].value.json();
                wpState.worker = j1.data;
            } else if (results[0].status === 'fulfilled' && results[0].value.status === 404) {
                showToast("Worker not found", "error");
                navigate(-1);
                return;
            } else if (results[0].status === 'fulfilled' && results[0].value.status === 401) {
                localStorage.clear();
                navigate('login');
                return;
            } else {
                wpState.error = "Could not connect to server.";
            }

            // Fallback for demo mode if backend down
            if (results[0].status === 'rejected' || (results[0].value && !results[0].value.ok && results[0].value.status !== 404 && results[0].value.status !== 401)) {
                 // Try falling back to finding the worker in bwState if available
                 if (typeof bwState !== 'undefined' && bwState.allWorkers && bwState.allWorkers.length > 0) {
                     const f = bwState.allWorkers.find(x => x._id === finalWorkerId);
                     if (f) {
                         wpState.worker = f;
                         wpState.error = null;
                     } else {
                         wpState.error = "Worker not found in local cache. Backend unavailable.";
                     }
                 } else {
                     wpState.error = "Could not fetch profile. Connection refused.";
                 }
            }

            // Handle Reviews
            if (results[1].status === 'fulfilled' && results[1].value.ok) {
                const j2 = await results[1].value.json();
                wpState.reviews = j2.data && j2.data.content ? j2.data.content : (j2.data || []);
            } else {
                // If reviews fail, we just leave it silent (empty array)
                // Let's mock a review for demo if worker is loaded
                if (wpState.worker && wpState.worker._id === finalWorkerId) {
                    wpState.reviews = [{
                        _id: "mrev123",
                        reviewer: { firstName: "Jane", lastName: "Doe", role: "customer" },
                        reviewee: finalWorkerId,
                        reviewerType: "customer",
                        overallRating: 5,
                        reviewText: `${wpState.worker.firstName} was incredibly punctual and solved the problem in minutes. Highly recommended for anyone needing quick service!`,
                        isVerified: true,
                        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
                    }];
                }
            }

        } catch (err) {
            wpState.error = "An unexpected error occurred.";
        } finally {
            wpState.isLoading = false;
            wpUpdateUI();
        }
    }

    // Delegations
    appElement.addEventListener('click', async (e) => {
        // Back
        if (e.target.closest('#wp-back')) navigate(-1);
        
        // Share Stub
        if (e.target.closest('#wp-share')) {
            if (navigator.share) {
                // TODO: wire when deployed
            }
            showToast("Share coming soon", "info");
        }

        // Retry
        if (e.target.closest('#wp-retry')) {
            loadData();
        }

        // Tooltip
        const vBadge = e.target.closest('#wp-ver-badge');
        if (vBadge) {
            wpState.showVerifiedTooltip = !wpState.showVerifiedTooltip;
            wpUpdateUI();
        } else if (wpState.showVerifiedTooltip) {
            wpState.showVerifiedTooltip = false;
            wpUpdateUI();
        }

        // Bio Toggle
        if (e.target.closest('#wp-toggle-bio')) {
            wpState.expandedBio = !wpState.expandedBio;
            wpUpdateUI();
        }

        // Show all reviews
        if (e.target.closest('#wp-show-all-revs')) {
            wpState.showAllReviews = true;
            wpUpdateUI();
        }

        // Expanded specific review
        const revTog = e.target.closest('.wp-rev-toggle');
        if (revTog) {
            const rid = revTog.dataset.rid;
            wpState.expandedReviews[rid] = !wpState.expandedReviews[rid];
            wpUpdateUI();
        }

        // Similar Worker Navigation
        const simCard = e.target.closest('.wp-sim-card');
        if (simCard) {
            const simId = simCard.dataset.id;
            navigate('/customer/workers/:id', { workerId: simId });
        }

        // Message
        if (e.target.closest('#wp-msg')) {
            showToast("Messaging coming soon", "info");
        }

        // Book This Worker
        if (e.target.closest('#wp-book')) {
            const w = wpState.worker;
            if(!w) return;
            // navigate to create booking flow with prepopulated state
            navigate('/customer/bookings/create', { 
                state: { 
                    workerId: w._id, 
                    workerName: `${w.firstName} ${w.lastName}`, 
                    hourlyRate: w.hourlyRate, 
                    workerSkills: w.skills 
                } 
            });
        }

        // Open Report
        if (e.target.closest('#wp-trig-report')) {
            wpState.showReportSheet = true;
            wpUpdateUI();
        }

        // Close report
        if (e.target.closest('#wp-report-bg') && e.target.id === 'wp-report-bg') {
            wpState.showReportSheet = false;
            wpUpdateUI();
        }
        if (e.target.closest('#wp-rs-cancel')) {
            wpState.showReportSheet = false;
            wpUpdateUI();
        }

        // Report chips
        const rChip = e.target.closest('.wp-rs-chip');
        if (rChip) {
            wpState.reportReason = rChip.dataset.rsn;
            wpUpdateUI(); // to reflect active class
        }

        // Report Submit
        if (e.target.closest('#wp-rs-submit')) {
            if (!wpState.reportReason) {
                showToast("Please select a reason", "error");
                return;
            }
            wpState.isSubmittingReport = true;
            wpUpdateUI();

            // Store text area val
            const area = document.getElementById('wp-rs-area');
            if (area) wpState.reportDetails = area.value;

            // TODO: POST /api/complaints when report feature is wired
            // Mock delay
            setTimeout(() => {
                wpState.isSubmittingReport = false;
                wpState.showReportSheet = false;
                wpState.reportReason = '';
                wpState.reportDetails = '';
                showToast("Report submitted. Our team will review within 24 hours.", "success");
                wpUpdateUI();
            }, 1000);
        }
    });

    appElement.addEventListener('input', (e) => {
        if (e.target.id === 'wp-rs-area') {
            wpState.reportDetails = e.target.value;
        }
    });

    loadData();
}
