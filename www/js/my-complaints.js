// ============================== //
// SkillConnect Mobile           //
// My Complaints Screen          //
// ============================== //

async function renderMyComplaints(appElement, stateRoute) {
    let mcState = {
        complaints: [],
        isLoading: true,
        error: null,
        activeTab: "all",
        expandedIds: new Set(),
        withdrawTarget: null,
        isDeleting: false
    };

    const TABS = [
        { id: "all", lbl: "All" },
        { id: "pending", lbl: "Under Review" },
        { id: "investigating", lbl: "Investigating" },
        { id: "resolved", lbl: "Resolved" },
        { id: "rejected", lbl: "Rejected" }
    ];

    const CAT_CONF = {
        service_quality: { lbl: "Service Quality", c: "b-gr" }, // using similar bdg colors locally
        inappropriate_behavior: { lbl: "Behaviour", c: "b-rd" },
        fraud: { lbl: "Fraud", c: "b-rd" },
        payment_issue: { lbl: "Payment", c: "b-am" },
        other: { lbl: "Other", c: "b-bl" } // fallback muted color mapping
    };
    
    // Mapping explicitly for category chips (custom border styles from mockup)
    const chipStyle = (cat) => {
        const cx = { service_quality:'color:#0D9488;border-color:#0D9488;background:rgba(13,148,136,0.05)', inappropriate_behavior:'color:#DC2626;border-color:#DC2626;background:rgba(220,38,38,0.05)', fraud:'color:#DC2626;border-color:#DC2626;background:rgba(220,38,38,0.05)', payment_issue:'color:#D97706;border-color:#D97706;background:rgba(217,119,6,0.05)', other:'color:#6B7280;border-color:#9CA3AF;background:rgba(107,114,128,0.05)'};
        return cx[cat] || cx.other;
    };

    const ST_CONF = {
        pending: { lbl: "Under Review", c: "b-am", ic: "ri-time-line" },
        investigating: { lbl: "Investigating", c: "b-bl", ic: "ri-search-line" },
        resolved: { lbl: "Resolved", c: "b-gr", ic: "ri-check-line" },
        rejected: { lbl: "Rejected", c: "b-rd", ic: "ri-close-line" }
    };

    const PR_CONF = {
        low: { lbl: "Low", c: "b-bl" }, // generic mapping
        medium: { lbl: "Medium", c: "b-bl" },
        high: { lbl: "High", c: "b-am" },
        urgent: { lbl: "Urgent", c: "b-rd" }
    };

    function processRelativeTime(dtStr) {
        if(!dtStr) return '';
        const ms = Date.now() - new Date(dtStr).getTime();
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days}d ago`;
        return new Date(dtStr).toLocaleDateString('en-US',{month:'short',day:'numeric'});
    }

    function renderProgress(st) {
        // Steps: 1:Filed, 2:Under Review, 3:Investigating, 4:Res/Rej
        let s2='', s3='', s4='';
        let l1='', l2='', l3='';

        // Default all false, evaluate upward
        l1='done'; // Always filed
        if(st === 'pending') {
            s2 = 'act'; 
        } else if(st === 'investigating') {
            s2 = 'done'; l2 = 'done'; s3 = 'act';
        } else if(st === 'resolved') {
            s2 = 'done'; l2 = 'done'; s3 = 'done'; l3 = 'done'; s4 = 'done';
        } else if(st === 'rejected') {
            s2 = 'done'; l2 = 'done'; s3 = 'done'; l3 = 'done'; s4 = 'rej'; // Red terminal
        }

        return `
            <div class="mc-r5">
                <div class="mc-p-st done"></div><div class="mc-p-ln ${l1}"></div>
                <div class="mc-p-st ${s2}"></div><div class="mc-p-ln ${l2}"></div>
                <div class="mc-p-st ${s3}"></div><div class="mc-p-ln ${l3}"></div>
                <div class="mc-p-st ${s4}"></div>
            </div>
        `;
    }

    function mcUpdateUI() {
        const counts = {
            total: mcState.complaints.length,
            pending: mcState.complaints.filter(c => c.complaintStatus === 'pending').length,
            investigating: mcState.complaints.filter(c => c.complaintStatus === 'investigating').length,
            resolved: mcState.complaints.filter(c => c.complaintStatus === 'resolved').length
        };

        const fList = mcState.activeTab === 'all' ? mcState.complaints : mcState.complaints.filter(c => c.complaintStatus === mcState.activeTab);

        let listHtml = '';
        if (mcState.isLoading) {
            listHtml = Array(3).fill(`
                <div class="mc-sk">
                    <div class="mc-sk-r1">
                        <div class="mc-sk-p1"></div><div class="mc-sk-p2"></div><div class="mc-sk-p3"></div>
                    </div>
                    <div class="mc-sk-t"></div>
                    <div class="mc-sk-r3"><div class="mc-sk-p4"></div><div class="mc-sk-p5"></div></div>
                    <div class="mc-sk-bar"></div>
                </div>
            `).join('');
        } else if (mcState.complaints.length === 0) {
            listHtml = `
                <div class="mc-emp">
                    <i class="ri-shield-star-line mc-em-ic"></i>
                    <div class="mc-em-t">No complaints filed</div>
                    <div class="mc-em-s">If you experience an issue with a worker or supplier, you can file a complaint here and our admin team will investigate.</div>
                    <button class="mc-em-btn" id="m-e-new">File a Complaint</button>
                </div>
            `;
        } else if (fList.length === 0) {
            const ctxs = {
                pending: { ic: 'ri-time-line e-am', t: 'No under review complaints', s: 'No complaints awaiting review.'},
                investigating: { ic: 'ri-search-line e-bl', t: 'No investigating complaints', s: 'No complaints under investigation.'},
                resolved: { ic: 'ri-check-line e-gr', t: 'No resolved complaints', s: 'No resolved complaints yet.'},
                rejected: { ic: 'ri-close-line e-rd', t: 'No rejected complaints', s: 'No rejected complaints.'}
            };
            const ctx = ctxs[mcState.activeTab];
            listHtml = `
                <div class="mc-emp">
                    <i class="${ctx.ic} mc-em-ic"></i>
                    <div class="mc-em-t">${ctx.t}</div>
                    <div class="mc-em-s">${ctx.s}</div>
                    <button class="mc-em-lnk" id="m-e-all">View all complaints</button>
                </div>
            `;
        } else {
            listHtml = fList.map(c => {
                const isOp = mcState.expandedIds.has(c._id);
                const stConf = ST_CONF[c.complaintStatus] || ST_CONF.pending;
                const prConf = PR_CONF[c.priority] || PR_CONF.medium;
                const catLbl = CAT_CONF[c.complaintCategory]?.lbl || "Other";
                
                let bkgHtml = '';
                if(c.booking?.jobTitle) {
                    bkgHtml = `<div class="mc-r4"><i class="ri-briefcase-4-line"></i><div class="mc-r4-txt">${c.booking.jobTitle}</div></div>`;
                }

                let expHtml = '';
                if (isOp) {
                    let resHtml = '';
                    if (c.resolutionNotes) {
                        if (c.complaintStatus === 'rejected') {
                            resHtml = `
                                <div class="mc-r-b mc-rej-b">
                                    <div class="mc-e-lbl">Rejection Notes</div>
                                    <div class="mc-e-txt">${c.resolutionNotes}</div>
                                    ${c.resolvedAt ? `<div class="mc-rdt">Rejected ${processRelativeTime(c.resolvedAt)}</div>` : ''}
                                </div>
                            `;
                        } else {
                            resHtml = `
                                <div class="mc-r-b mc-res-b">
                                    <div class="mc-e-lbl">Resolution Notes</div>
                                    <div class="mc-e-txt">${c.resolutionNotes}</div>
                                    ${c.resolvedAt ? `<div class="mc-rdt">Resolved ${processRelativeTime(c.resolvedAt)}</div>` : ''}
                                </div>
                            `;
                        }
                    }

                    expHtml = `
                        <div class="mc-in">
                            <div class="mc-ex-b">
                                <div class="mc-e-lbl">Description</div>
                                <div class="mc-e-txt">${c.complaintDescription}</div>
                            </div>
                            ${resHtml}
                            <div class="mc-tl">
                                <div class="mc-tl-i"><div class="mc-tl-dot"></div> Filed ${processRelativeTime(c.createdAt)}</div>
                                ${(c.updatedAt !== c.createdAt) ? `<div class="mc-tl-i"><div class="mc-tl-dot"></div> Status updated ${processRelativeTime(c.updatedAt)}</div>` : ''}
                                ${c.resolvedAt ? `<div class="mc-tl-i"><div class="mc-tl-dot"></div> Completed ${processRelativeTime(c.resolvedAt)}</div>` : ''}
                            </div>
                            <div class="mc-act-r">
                                ${c.complaintStatus === 'pending' ? `<button class="mc-btn-w" data-id="${c._id}">Withdraw Complaint</button>` : '<div></div>'}
                                <button class="mc-btn-l" id="m-a-new">File New Complaint</button>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="mc-card" data-cid="${c._id}">
                        <div class="mc-r1">
                            <div class="mc-bdg ${stConf.c}"><i class="${stConf.ic}"></i> ${stConf.lbl}</div>
                            <div class="mc-pr-bdg ${prConf.c}">${prConf.lbl}</div>
                            <div class="mc-d-lbl">Filed ${processRelativeTime(c.createdAt)}</div>
                        </div>
                        <div class="mc-r2-title">${c.complaintTitle}</div>
                        <div class="mc-r3">
                            <div class="mc-cat-chp" style="${chipStyle(c.complaintCategory)}">${catLbl}</div>
                            <div class="mc-r3-sbj">Re: ${c.complainedAgainst?.firstName} ${c.complainedAgainst?.lastName}</div>
                        </div>
                        ${bkgHtml}
                        ${renderProgress(c.complaintStatus)}
                        
                        <div class="mc-exp ${isOp?'open':''}">${expHtml}</div>
                        
                        <div class="mc-chev"><i class="ri-arrow-${isOp?'up':'down'}-s-line" style="color:${isOp?'#0D9488':'#9CA3AF'}"></i></div>
                    </div>
                `;
            }).join('');
        }

        appElement.innerHTML = `
            <div class="mc-screen">
                <div class="mc-header">
                    <button class="mc-btn-icon" id="m-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="mc-title">My Complaints</div>
                    <button class="mc-hdr-act" id="m-h-new"><i class="ri-add-line"></i></button>
                </div>

                <div class="mc-summary-strip">
                    <div class="mc-sum-pill">Total <span class="mc-sum-val">${counts.total}</span></div>
                    <div class="mc-sum-pill">Under Review <span class="mc-sum-val">${counts.pending}</span></div>
                    <div class="mc-sum-pill">Investigating <span class="mc-sum-val">${counts.investigating}</span></div>
                    <div class="mc-sum-pill">Resolved <span class="mc-sum-val">${counts.resolved}</span></div>
                </div>

                <div class="mc-tabs">
                    ${TABS.map(t => {
                        const cnt = mcState.complaints.filter(c => t.id==='all' ? true : c.complaintStatus===t.id).length;
                        return `<button class="mc-tab ${mcState.activeTab===t.id?'active':''}" data-tab="${t.id}">${t.lbl} (${cnt})</button>`;
                    }).join('')}
                </div>

                <div class="mc-list-wrap" id="m-ls">
                    <div class="mc-ptr" id="m-ptr"><i class="ri-refresh-line mc-ptr-ic"></i></div>
                    ${listHtml}
                </div>

                ${mcState.complaints.length > 0 ? `<button class="mc-fab show" id="m-fab"><i class="ri-add-line"></i></button>` : ''}

                <!-- Withdraw Sheet -->
                <div class="mc-ws-bg ${mcState.withdrawTarget ? 'active' : ''}" id="m-w-bg">
                    <div class="mc-ws" id="m-w-sh">
                        <div class="mc-ws-t">Withdraw this complaint?</div>
                        <div class="mc-ws-s">This will permanently remove your complaint. This action cannot be undone.</div>
                        <div class="mc-ws-blk">${mcState.withdrawTarget?.complaintTitle || 'Complaint details...'}</div>
                        <div class="mc-ws-wn">⚠ Only withdraw if the issue has been resolved directly with the worker or was filed in error.</div>
                        <button class="mc-ws-b1" id="m-w-y" ${mcState.isDeleting?'disabled':''}>
                            ${mcState.isDeleting ? `<div class="spinner" style="width:18px;height:18px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite;"></div>` : 'Withdraw'}
                        </button>
                        <button class="mc-ws-b2" id="m-w-n">Keep Complaint</button>
                    </div>
                </div>
            </div>
        `;
    }

    async function loadData() {
        mcState.isLoading = true; mcUpdateUI();
        if(api.getMyComplaints) {
            try {
                const res = await api.getMyComplaints('customer');
                if(res?.data?.content) {
                    mcState.complaints = res.data.content.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
                }
            } catch(e) { console.warn(e); }
        } else {
            // Mock Fallback
            mcState.complaints = [
                { _id: 'c1', complainant: 'me', complainedAgainst: {firstName:'Kasun',lastName:'Perera'}, booking:{jobTitle:'Plumbing fix'}, complaintCategory:'service_quality', complaintTitle:'Worker left job incomplete and messy.', complaintDescription:'They arrived late and did not finish the job...', complaintStatus:'pending', priority:'high', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
                { _id: 'c2', complainant: 'me', complainedAgainst: {firstName:'Nimal',lastName:'Silva'}, booking:null, complaintCategory:'other', complaintTitle:'No show', complaintDescription:'Worker did not arrive', complaintStatus:'investigating', priority:'medium', createdAt:new Date(Date.now()-86400000*2).toISOString(), updatedAt:new Date(Date.now()-86400000).toISOString() },
                { _id: 'c3', complainant: 'me', complainedAgainst: {firstName:'Sunil',lastName:'Fernando'}, booking:{jobTitle:'AC Repair'}, complaintCategory:'payment_issue', complaintTitle:'Overcharged for parts', complaintDescription:'Charged double the market rate', complaintStatus:'resolved', priority:'low', resolutionNotes:'Refunded difference to wallet.', resolvedAt:new Date(Date.now()-86400000*5).toISOString(), createdAt:new Date(Date.now()-86400000*7).toISOString(), updatedAt:new Date(Date.now()-86400000*5).toISOString() }
            ];
        }
        mcState.isLoading = false; mcUpdateUI();
    }

    appElement.addEventListener('click', async e => {
        const tg = e.target;

        if(tg.closest('#m-bck')) return navigate(-1);
        if(tg.closest('#m-h-new') || tg.closest('#m-e-new') || tg.closest('#m-a-new') || tg.closest('#m-fab')) {
            return navigate('/customer/complaints/create');
        }

        // Tabs
        const tb = tg.closest('.mc-tab');
        if(tb) { mcState.activeTab = tb.dataset.tab; return mcUpdateUI(); }

        if(tg.closest('#m-e-all')) { mcState.activeTab = 'all'; return mcUpdateUI(); }

        // Withdraw Buttons
        const wBtn = tg.closest('.mc-btn-w');
        if(wBtn) {
            const id = wBtn.dataset.id;
            mcState.withdrawTarget = mcState.complaints.find(c => c._id === id);
            return mcUpdateUI();
        }

        // Discard Overlay
        if(tg.closest('#m-w-n') || tg.id === 'm-w-bg') { mcState.withdrawTarget = null; return mcUpdateUI(); }
        
        if(tg.closest('#m-w-y') && !mcState.isDeleting) {
            mcState.isDeleting = true; mcUpdateUI();
            
            // Sim DELETE Delay
            await new Promise(r => setTimeout(r, 800));
            
            mcState.complaints = mcState.complaints.filter(x => x._id !== mcState.withdrawTarget._id);
            mcState.withdrawTarget = null;
            mcState.isDeleting = false;
            mcUpdateUI();
            showToast("Complaint withdrawn", "success");
            return;
        }

        // Expand inline
        const crd = tg.closest('.mc-card');
        if(crd) {
            if(tg.closest('.mc-act-r')) return; // Ignore clicks inside action area entirely to prevent bubbling loops
            const id = crd.dataset.cid;
            if(mcState.expandedIds.has(id)) mcState.expandedIds.delete(id);
            else mcState.expandedIds.add(id);
            mcUpdateUI();
        }
    });

    // Touch handlers for pull to refresh
    let startY = 0; let refreshing = false;
    appElement.addEventListener('touchstart', e => {
        const ls = document.getElementById('m-ls');
        if(ls && ls.scrollTop === 0) { startY = e.touches[0].clientY; }
    }, {passive:true});

    appElement.addEventListener('touchmove', e => {
        if(startY > 0 && !refreshing) {
            const y = e.touches[0].clientY;
            if(y - startY > 80) {
                const ptr = document.getElementById('m-ptr');
                if(ptr) ptr.classList.add('refreshing');
            }
        }
    }, {passive:true});

    appElement.addEventListener('touchend', async e => {
        if(startY > 0 && !refreshing) {
            const y = e.changedTouches[0].clientY;
            if(y - startY > 80) {
                refreshing = true;
                await loadData();
                const ptr = document.getElementById('m-ptr');
                if(ptr) ptr.classList.remove('refreshing');
                refreshing = false;
            }
        }
        startY = 0;
    }, {passive:true});

    loadData();
}
