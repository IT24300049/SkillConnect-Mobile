// ============================== //
// SkillConnect Mobile           //
// File a Complaint Screen       //
// ============================== //

async function renderCreateComplaint(appElement, stateRoute) {
    let ccState = {
        bookings: [],
        workers: [],
        isLoading: true,
        
        hasRouterCtx: !!stateRoute?.workerId,
        complainedAgainst: stateRoute?.workerId || "",
        complainedAgainstName: stateRoute?.workerName || "",
        selectedBookingId: stateRoute?.bookingId || "",
        
        complaintCategory: "",
        complaintTitle: "",
        complaintDescription: "",
        priority: "medium",
        workerSearchQuery: "",
        
        freeTextName: "", // Handles the fallback if workers fetch fails
        workersLoaded: true,

        isSubmitting: false,
        showSuccess: false,
        successData: null,
        error: null,
        showDiscardSheet: false,
        showTips: false
    };

    const CAT_CONF = {
        'service_quality': { ic: 'ri-star-half-line', lbl: 'Service Quality', d: 'Poor workmanship, incomplete job, or unsatisfactory results', c: 'cat-sq' },
        'inappropriate_behavior': { ic: 'ri-user-unfollow-line', lbl: 'Inappropriate Behaviour', d: 'Rude, threatening, or unprofessional conduct', c: 'cat-ib' },
        'fraud': { ic: 'ri-shield-cross-line', lbl: 'Fraud', d: 'Overcharging, theft, or deceptive practices', c: 'cat-fr' },
        'payment_issue': { ic: 'ri-wallet-3-line', lbl: 'Payment Issue', d: 'Disputes about payment, charges, or refunds', c: 'cat-pi' },
        'other': { ic: 'ri-more-line', lbl: 'Other', d: 'Any other issue not listed above', c: 'cat-ot' }
    };

    function ccUpdateUI() {
        if (ccState.isLoading) {
            appElement.innerHTML = `
                <div class="cc-screen">
                    <div class="cc-header"><button class="cc-btn-icon" onclick="navigate(-1)"><i class="ri-arrow-left-line"></i></button><div class="cc-title-global">File a Complaint</div><div style="width:44px;"></div></div>
                    <div class="cc-scroll-content">
                        ${ccState.hasRouterCtx ? '<div class="cc-sk-ban"></div>' : ''}
                        <div class="cc-sec-wrap">
                            <div class="cc-sk-c"></div><div class="cc-sk-c"></div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        if (ccState.showSuccess) {
            const shortId = ccState.successData?._id?.slice(-8) || "UNKNOWN";
            appElement.innerHTML = `
                <div class="cc-screen">
                    <div class="cc-header"><button class="cc-btn-icon" style="opacity:0"><i class="ri-arrow-left-line"></i></button><div class="cc-title-global">File a Complaint</div><div style="width:44px;"></div></div>
                    <div class="cc-succ show">
                        <div class="cc-su-circ"><i class="ri-check-line"></i></div>
                        <div class="cc-su-t">Complaint Filed</div>
                        <div class="cc-su-s">Your complaint has been submitted and is under review. Our admin team will investigate and respond within 48 hours.</div>
                        <div class="cc-su-ref">
                            <div class="cc-sr-r">Reference: #${shortId}</div>
                            <div class="cc-sr-s">Status: Pending Review<br>Priority: ${ccState.priority.charAt(0).toUpperCase()+ccState.priority.slice(1)}</div>
                        </div>
                        <div class="cc-su-nx">
                            <div class="cc-sn-t">What happens next?</div>
                            <div class="cc-sn-l">1. Admin team reviews your complaint<br>2. Investigation is conducted<br>3. Resolution is communicated to both parties<br>4. Complaint is marked resolved or rejected</div>
                        </div>
                        <button class="cc-su-btn" id="c-btn-my">View My Complaints</button>
                        <div class="cc-su-lnk" id="c-btn-hm">Back to Home</div>
                    </div>
                </div>
            `;
            return;
        }

        const isDirty = ccState.complaintTitle.trim().length > 0 || ccState.complaintDescription.trim().length > 0 || ccState.complaintCategory || ccState.complainedAgainst || ccState.freeTextName;
        const validTitle = ccState.complaintTitle.trim().length >= 10 && ccState.complaintTitle.length <= 100;
        const validDesc = ccState.complaintDescription.trim().length >= 50 && ccState.complaintDescription.length <= 1000;
        const isFormValid = (ccState.complainedAgainst || ccState.freeTextName) && ccState.complaintCategory && validTitle && validDesc;

        let helperStr = "";
        if(!ccState.complainedAgainst && !ccState.freeTextName) helperStr = "Please select who you are complaining about";
        else if(!ccState.complaintCategory) helperStr = "Please select a complaint category";
        else if(ccState.complaintTitle.trim().length > 0 && !validTitle) helperStr = "Please add a complaint title (min 10 characters)";
        else if(ccState.complaintDescription.trim().length > 0 && !validDesc) helperStr = "Please describe the issue (min 50 characters)";

        let sumStr = "";
        if(ccState.complaintCategory) {
            sumStr = `${CAT_CONF[ccState.complaintCategory].lbl} complaint · ${ccState.priority} priority`;
        }

        // Section 1: Workers
        let wHtml = '';
        if (ccState.hasRouterCtx) {
            const initial = ccState.complainedAgainstName[0]?.toUpperCase() || 'W';
            wHtml = `
                <div class="cc-ro-blk">
                    <div class="cc-ro-av">${initial}</div>
                    <div class="cc-ro-mid">
                        <div class="cc-ro-name">${ccState.complainedAgainstName}</div>
                        <div class="cc-ro-sub">Pre-filled from your booking</div>
                    </div>
                    <button class="cc-ro-chg" id="c-w-chg">Change</button>
                </div>
            `;
        } else if (ccState.workersLoaded) {
            const fWs = ccState.workers.filter(w => (w.firstName+' '+w.lastName).toLowerCase().includes(ccState.workerSearchQuery.toLowerCase()));
            wHtml = `
                <input type="text" class="cc-w-srch" id="c-w-in" placeholder="Search worker name..." value="${ccState.workerSearchQuery}">
                <div class="cc-w-list">
                    ${fWs.length === 0 ? '<div style="text-align:center;color:#9CA3AF;font-size:13px;padding:12px;">No workers found</div>' : ''}
                    ${fWs.slice(0,4).map(w => {
                        const act = ccState.complainedAgainst === w._id;
                        return `
                        <div class="cc-w-row ${act?'active':''}" data-wid="${w._id}">
                            <div class="cc-w-a">${w.firstName[0]}</div>
                            <div class="cc-w-m">
                                <div class="cc-w-n">${w.firstName} ${w.lastName}</div>
                                <div class="cc-w-l">${w.district || 'Location N/A'}</div>
                            </div>
                            <div class="cc-rad"><div class="cc-rad-in"></div></div>
                        </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            wHtml = `
                <input type="text" class="cc-ft-in" id="c-f-in" placeholder="Enter the person's name" value="${ccState.freeTextName}">
                <div style="font-size:12px;color:#6B7280;margin-top:6px;">We'll look them up during review</div>
            `;
        }

        // Section 2: Bookings
        let bHtml = '';
        if (ccState.hasRouterCtx && ccState.selectedBookingId) {
            const shortId = ccState.selectedBookingId.slice(-8);
            const b = ccState.bookings.find(x => x._id === ccState.selectedBookingId);
            const title = b?.job?.jobTitle || `Booking #${shortId}`;
            bHtml = `
                <div class="cc-ro-blk" style="margin-bottom:0">
                    <div style="font-size:20px; color:#4B5563;"><i class="ri-briefcase-4-line"></i></div>
                    <div class="cc-ro-mid">
                        <div class="cc-ro-name">${title}</div>
                        <div class="cc-ro-sub">Linked booking context</div>
                    </div>
                    <button class="cc-ro-chg" id="c-b-chg">Change</button>
                </div>
            `;
        } else {
            bHtml = `
                <div class="cc-bk-none ${!ccState.selectedBookingId?'active':''}" id="c-b-none">None — general complaint</div>
                <div class="cc-bk-list">
                    ${ccState.bookings.length===0 ? '<div style="text-align:center;color:#9CA3AF;font-size:13px;padding:8px;">No completed bookings to link.</div>' : ''}
                    ${ccState.bookings.slice(0,3).map(b => {
                        const act = ccState.selectedBookingId === b._id;
                        return `
                        <div class="cc-bk-row ${act?'active':''}" data-bid="${b._id}">
                            <div class="cc-bk-hdr">
                                <div class="cc-bk-n">Booking #${b._id.slice(-8)}</div>
                            </div>
                            <div class="cc-bk-t">${b.job?.jobTitle || 'N/A'}</div>
                            <div class="cc-bk-d">${new Date(b.scheduledDate).toLocaleDateString()}</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        const tLen = ccState.complaintTitle.length;
        const dLen = ccState.complaintDescription.length;

        appElement.innerHTML = `
            <div class="cc-screen">
                <div class="cc-header">
                    <button class="cc-btn-icon" id="c-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="cc-title-global">File a Complaint</div>
                    <div style="width:44px;"></div>
                </div>

                <div class="cc-err-ban" id="c-err" style="${ccState.error?'display:block':''}">${ccState.error}</div>

                <div class="cc-scroll-content">
                    ${ccState.hasRouterCtx ? `
                        <div class="cc-ctx-ban">
                            <i class="ri-error-warning-line cc-cb-ic"></i>
                            <div class="cc-cb-mid">
                                <div class="cc-cb-lbl">Reporting an issue with:</div>
                                <div class="cc-cb-name">${ccState.complainedAgainstName}</div>
                                ${ccState.selectedBookingId ? `<div class="cc-cb-bkg">Booking #${ccState.selectedBookingId.slice(-8)}</div>` : ''}
                            </div>
                            <button class="cc-cb-cls" id="c-cb-cls">&times;</button>
                        </div>
                    ` : ''}

                    <div class="cc-sec-wrap">
                        <div class="cc-card">
                            <div class="cc-c-lbl">Complaining About</div>
                            <div class="cc-c-hlp">Select the worker or supplier involved</div>
                            ${wHtml}
                            <div class="cc-ferr" id="ce-w">Please select a registered worker from the list</div>
                        </div>

                        <div class="cc-card">
                            <div class="cc-c-lbl">Related Booking (optional)</div>
                            <div class="cc-c-hlp">Linking a booking helps us investigate your complaint faster</div>
                            ${bHtml}
                        </div>

                        <div class="cc-card">
                            <div class="cc-c-lbl">Category</div>
                            <div class="cc-c-hlp">Select the type of issue</div>
                            ${Object.entries(CAT_CONF).map(([k, v]) => `
                                <div class="cc-cat-row ${ccState.complaintCategory===k?'active':''}" data-cat="${k}">
                                    <div class="cc-cat-ic ${v.c}"><i class="${v.ic}"></i></div>
                                    <div class="cc-cat-mid">
                                        <div class="cc-cat-l">${v.lbl}</div>
                                        <div class="cc-cat-s">${v.d}</div>
                                    </div>
                                    <div class="cc-rad"><div class="cc-rad-in"></div></div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="cc-card">
                            <div class="cc-f-g">
                                <div class="cc-f-lbl">Complaint Title</div>
                                <input type="text" class="cc-inp ${(tLen>0 && !validTitle)?'err':''}" id="c-i-t" placeholder="e.g. Worker left job incomplete..." maxlength="100" value="${ccState.complaintTitle}">
                                <div class="cc-cnt ${tLen===100?'red':''}">${tLen} / 100</div>
                            </div>
                            <div class="cc-f-g" style="margin-bottom:0">
                                <div class="cc-f-lbl">Describe the Issue</div>
                                <textarea class="cc-ta ${(dLen>0 && !validDesc)?'err':''}" id="c-i-d" placeholder="Please provide as much detail as possible..." maxlength="1000">${ccState.complaintDescription}</textarea>
                                <div class="cc-cnt ${dLen>=950?'red':(dLen>=800?'amber':'')}">${dLen} / 1000</div>
                            </div>
                            <button class="cc-tips-btn" id="c-t-btn">Tips for a strong complaint ▾</button>
                            <div class="cc-tips-box ${ccState.showTips?'open':''}">
                                <div class="cc-tip">✓ Include specific dates and times</div>
                                <div class="cc-tip">✓ Describe exactly what was promised vs what was delivered</div>
                                <div class="cc-tip">✓ Stay factual — avoid emotional language</div>
                                <div class="cc-tip">✓ Include financial impact if relevant</div>
                            </div>
                        </div>

                        <div class="cc-card">
                            <div class="cc-c-lbl">Priority Level</div>
                            <div class="cc-c-hlp">How urgently does this need to be addressed?</div>
                            <div class="cc-p-grid">
                                <div class="cc-p-chip ${ccState.priority==='low'?'active':''}" data-pr="low"><div class="cc-p-ic"><i class="ri-information-line"></i></div><div class="cc-p-l">Low</div><div class="cc-p-s">Minor inconvenience</div></div>
                                <div class="cc-p-chip ${ccState.priority==='medium'?'active':''}" data-pr="medium"><div class="cc-p-ic"><i class="ri-subtract-line"></i></div><div class="cc-p-l">Medium</div><div class="cc-p-s">Significant issue</div></div>
                                <div class="cc-p-chip ${ccState.priority==='high'?'active':''}" data-pr="high"><div class="cc-p-ic"><i class="ri-error-warning-line"></i></div><div class="cc-p-l">High</div><div class="cc-p-s">Urgent problem</div></div>
                                <div class="cc-p-chip ${ccState.priority==='urgent'?'active':''}" data-pr="urgent"><div class="cc-p-ic"><i class="ri-fire-line"></i></div><div class="cc-p-l">Urgent</div><div class="cc-p-s">Immediate action needed</div></div>
                            </div>
                        </div>

                        <div class="cc-card cc-ev-card">
                            <i class="ri-upload-cloud-2-line cc-ev-ic"></i>
                            <div class="cc-ev-t">Photo upload coming soon</div>
                            <div class="cc-ev-s">You can describe your evidence in the description above.</div>
                        </div>

                        <div class="cc-not">
                            <i class="ri-shield-star-line cc-not-i"></i>
                            <div>
                                <div class="cc-not-t">False Complaints</div>
                                <div class="cc-not-p">Filing a false complaint is a violation of SkillConnect's terms of service and may result in account suspension.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="cc-cta">
                    ${sumStr ? `<div class="cc-cta-sum"><i class="${CAT_CONF[ccState.complaintCategory].ic}"></i> ${sumStr}</div>` : ''}
                    <button class="cc-btn" id="c-sub" ${(!isFormValid || ccState.isSubmitting) ? 'disabled' : ''}>
                        ${ccState.isSubmitting ? `<div class="spinner" style="width:18px;height:18px;border:2px solid;border-top-color:#FFF;border-radius:50%;margin-right:8px;animation:spin 1s infinite;"></div>` : ''}
                        ${ccState.isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                    ${!isFormValid && !ccState.isSubmitting && helperStr ? `<div class="cc-btn-hlp">${helperStr}</div>` : ''}
                </div>

                <!-- Discard Sheet -->
                <div class="cc-bs-bg ${ccState.showDiscardSheet ? 'active' : ''}" id="c-d-bg">
                    <div class="cc-bs" id="c-d-sh">
                        <div class="cc-bs-t">Discard complaint?</div>
                        <div class="cc-bs-s">All the details you've entered will be lost.</div>
                        <button class="cc-bs-b1" id="c-d-y">Discard</button>
                        <button class="cc-bs-b2" id="c-d-n">Keep Writing</button>
                    </div>
                </div>
            </div>
        `;
    }

    async function loadData() {
        ccState.isLoading = true; ccUpdateUI();

        let bProm = api.getMyBookings ? api.getMyBookings('customer') : Promise.resolve({data:{content:[]}});
        let wProm = (!ccState.hasRouterCtx && api.getWorkers) ? api.getWorkers() : Promise.resolve({data:{content:[]}});

        try {
            const [bR, wR] = await Promise.allSettled([bProm, wProm]);
            if (bR.status === 'fulfilled' && bR.value?.data?.content) {
                ccState.bookings = bR.value.data.content.filter(b => b.bookingStatus === 'completed' || b.bookingStatus === 'in_progress');
            }
            if (!ccState.hasRouterCtx) {
                if(wR.status === 'fulfilled' && wR.value?.data?.content) {
                    ccState.workers = wR.value.data.content;
                    ccState.workersLoaded = true;
                } else {
                    ccState.workersLoaded = false;
                }
            }
        } catch(e) {
            console.warn(e);
            ccState.workersLoaded = false;
        }

        ccState.isLoading = false; ccUpdateUI();
    }

    appElement.addEventListener('click', async e => {
        const tg = e.target;

        // Discard Overlay
        if (tg.closest('#c-bck')) {
            const isDirty = ccState.complaintTitle.trim().length > 0 || ccState.complaintDescription.trim().length > 0 || ccState.complaintCategory || ccState.complainedAgainst || ccState.freeTextName;
            if (isDirty) { ccState.showDiscardSheet = true; ccUpdateUI(); } else { navigate(-1); }
        }
        if (tg.closest('#c-d-n') || tg.id === 'c-d-bg') { ccState.showDiscardSheet = false; ccUpdateUI(); }
        if (tg.closest('#c-d-y')) { navigate(-1); }

        // Context Drops
        if (tg.closest('#c-cb-cls')) { ccState.hasRouterCtx = false; ccState.complainedAgainst = ""; ccState.selectedBookingId = ""; loadData(); } // Force reload workers if dropped
        if (tg.closest('#c-w-chg')) { ccState.hasRouterCtx = false; ccState.complainedAgainst = ""; loadData(); }
        if (tg.closest('#c-b-chg')) { ccState.selectedBookingId = ""; ccUpdateUI(); }

        // Mappings
        const wRow = tg.closest('.cc-w-row');
        if (wRow) { ccState.complainedAgainst = wRow.dataset.wid; ccUpdateUI(); }

        const bNone = tg.closest('#c-b-none');
        if (bNone) { ccState.selectedBookingId = ""; ccUpdateUI(); }

        const bRow = tg.closest('.cc-bk-row');
        if (bRow) { ccState.selectedBookingId = bRow.dataset.bid; ccUpdateUI(); }

        const cRow = tg.closest('.cc-cat-row');
        if (cRow) { ccState.complaintCategory = cRow.dataset.cat; ccUpdateUI(); }

        const pChip = tg.closest('.cc-p-chip');
        if (pChip) { ccState.priority = pChip.dataset.pr; ccUpdateUI(); }

        // Tips Collapse
        if (tg.closest('#c-t-btn')) { ccState.showTips = !ccState.showTips; ccUpdateUI(); }
        
        // Success Navs
        if (tg.closest('#c-btn-my')) { navigate('/customer/complaints'); }
        if (tg.closest('#c-btn-hm')) { navigate('/customer/dashboard'); }

        // Submit
        if (tg.closest('#c-sub') && !ccState.isSubmitting) {
            if (!ccState.workersLoaded && !ccState.complainedAgainst && ccState.freeTextName) {
                const errNode = document.getElementById('ce-w');
                if(errNode) errNode.style.display = 'block';
                showToast("Please select a registered user to file a complaint.");
                document.querySelector('.cc-scroll-content').scrollTo({top:0, behavior:'smooth'});
                return;
            }

            ccState.isSubmitting = true; ccState.error = null; ccUpdateUI();
            await new Promise(r => setTimeout(r, 1200)); // Simulate API POST

            ccState.successData = { _id: "cobj" + Math.floor(Math.random()*10000) };
            ccState.isSubmitting = false; ccState.showSuccess = true; ccUpdateUI();
            showToast("Complaint submitted successfully", "success");
        }
    });

    appElement.addEventListener('input', e => {
        if(e.target.id === 'c-i-t') { ccState.complaintTitle = e.target.value; ccUpdateUI(); }
        if(e.target.id === 'c-i-d') { ccState.complaintDescription = e.target.value; ccUpdateUI(); }
        if(e.target.id === 'c-w-in') { ccState.workerSearchQuery = e.target.value; ccUpdateUI(); }
        if(e.target.id === 'c-f-in') { ccState.freeTextName = e.target.value; ccUpdateUI(); }
    });

    loadData();
}
