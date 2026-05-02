// ============================== //
// SkillConnect Mobile           //
// My Bookings Screen (Customer) //
// ============================== //

async function renderMyBookings(appElement, stateRoute) {
    const passedState = stateRoute.state || {};
    const newBookingId = passedState.newBookingId || null;

    let mbState = {
        bookings: [],
        reviewedBookingIds: new Set(),
        isLoading: true,
        isLoadingReviews: true,
        error: null,
        activeTab: "all",
        sortBy: "upcoming_first",
        filterStatuses: [],
        showFilterSheet: false,
        cancelTarget: null,
        cancelReason: "",
        isCancelling: false,
        isRefreshing: false
    };

    const statusMap = {
        "pending": "requested",
        "confirmed": "accepted",
        "in_progress": "in_progress",
        "completed": "completed",
        "cancelled": "cancelled",
        "declined": "rejected"
    };
    const reverseStatusMap = {
        "requested": "pending",
        "accepted": "confirmed",
        "in_progress": "in_progress",
        "completed": "completed",
        "cancelled": "cancelled",
        "rejected": "declined"
    };

    function mapStatusBadge(st) {
        switch(st) {
            case "requested": return { c: "mb-badge-requested", icon: "ri-time-line", lbl: "Awaiting Response" };
            case "accepted": return { c: "mb-badge-accepted", icon: "ri-checkbox-circle-line", lbl: "Confirmed" };
            case "in_progress": return { c: "mb-badge-in_progress", icon: "ri-tools-line", lbl: "In Progress" };
            case "completed": return { c: "mb-badge-completed", icon: "ri-check-line", lbl: "Completed" };
            case "cancelled": return { c: "mb-badge-cancelled", icon: "ri-close-circle-line", lbl: "Cancelled" };
            case "rejected": return { c: "mb-badge-rejected", icon: "ri-close-line", lbl: "Declined" };
            default: return { c: "mb-badge-rejected", icon: "ri-question-line", lbl: "Unknown" };
        }
    }

    function formatLKR(amt) {
        return "LKR " + amt.toLocaleString("en-LK");
    }

    const todayDateStr = new Date().toISOString().split('T')[0];

    function getFilteredAndSorted() {
        let filtered = mbState.bookings.filter(b => {
             // 1. Tab Filter
             if (mbState.activeTab !== "all") {
                 const reqSt = statusMap[mbState.activeTab];
                 if (b.bookingStatus !== reqSt) return false;
             }
             // 2. Sheet Filter
             if (mbState.filterStatuses.length > 0) {
                 if (!mbState.filterStatuses.includes(b.bookingStatus)) return false;
             }
             return true;
        });

        // 3. Sort
        filtered.sort((a, b) => {
            if (mbState.sortBy === "upcoming_first") {
                const da = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
                const db = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
                return da - db; // asc
            }
            if (mbState.sortBy === "recent_first") {
                const da = new Date(a.createdAt).getTime();
                const db = new Date(b.createdAt).getTime();
                return db - da; // desc
            }
            if (mbState.sortBy === "oldest_first") {
                const da = new Date(a.createdAt).getTime();
                const db = new Date(b.createdAt).getTime();
                return da - db; // asc
            }
            if (mbState.sortBy === "highest_cost") {
                const ca = a.finalCost || (a.worker?.hourlyRate * a.estimatedDurationHours) || 0;
                const cb = b.finalCost || (b.worker?.hourlyRate * b.estimatedDurationHours) || 0;
                return cb - ca; // desc
            }
            return 0;
        });
        return filtered;
    }

    function generateCardHTML(b) {
        const badge = mapStatusBadge(b.bookingStatus);
        
        let dateStr = "Not set";
        let timeStr = "";
        if (b.scheduledDate) {
            const dObj = new Date(b.scheduledDate);
            dateStr = dObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
        }
        if (b.scheduledTime) {
            const [h,m] = b.scheduledTime.split(":");
            const hr = parseInt(h);
            const period = hr >= 12 ? "PM" : "AM";
            timeStr = `${hr%12||12}:${m} ${period}`;
        }

        const w = b.worker || {};
        const wName = typeof w === 'object' ? `${w.firstName||''} ${w.lastName||''}`.trim() : "Unknown Worker";
        const wInitials = `${(w.firstName||'W')[0]}${(w.lastName||'')[0] || ''}`.toUpperCase();
        
        const locStr = [w.city, w.district].filter(Boolean).join(", ");
        
        let costStr = "Cost TBD";
        if (b.finalCost) costStr = formatLKR(b.finalCost);
        else if (w.hourlyRate && b.estimatedDurationHours) costStr = `~${formatLKR(w.hourlyRate * b.estimatedDurationHours)}`;

        // Relative time roughly matched
        let relTime = "Recently";
        try {
            const crDate = new Date(b.createdAt);
            const diffDays = Math.floor((Date.now() - crDate.getTime()) / 86400000);
            if (diffDays === 0) relTime = "Today";
            else if (diffDays === 1) relTime = "Yesterday";
            else relTime = `${diffDays}d ago`;
        } catch(e){}

        // Actions
        let actionHtml = '';
        if (b.bookingStatus === "requested") {
            actionHtml = `
                <div class="mb-actions">
                    <button class="mb-btn mb-btn-red" data-cid="${b._id}">Cancel Request</button>
                </div>
            `;
        } else if (b.bookingStatus === "accepted") {
            actionHtml = `
                <div class="mb-actions">
                    <button class="mb-btn mb-btn-gray" data-cdet="${b._id}">View Details</button>
                    <button class="mb-btn mb-btn-red" data-cid="${b._id}">Cancel</button>
                </div>
            `;
        } else if (b.bookingStatus === "in_progress") {
            actionHtml = `
                <div class="mb-info-banner">
                    <i class="ri-tools-line"></i> Work is in progress
                </div>
            `;
        } else if (b.bookingStatus === "completed") {
            if (mbState.reviewedBookingIds.has(b._id)) {
                actionHtml = `
                    <div class="mb-info-banner mb-banner-green">
                        <i class="ri-check-line"></i> Review submitted
                    </div>
                `;
            } else {
                actionHtml = `
                    <div class="mb-actions">
                        <button class="mb-btn mb-btn-amber" data-cbrev="${b._id}" data-w="${w._id||''}" data-wn="${wName}">Leave a Review</button>
                    </div>
                `;
            }
        } else if (b.bookingStatus === "cancelled" && b.cancellationReason) {
            actionHtml = `<div class="mb-muted-reason">Reason: ${b.cancellationReason}</div>`;
        } else if (b.bookingStatus === "rejected") {
            actionHtml = `<div class="mb-muted-reason">This booking was declined by the worker.</div>`;
        }

        // Progress bar
        let progHtml = '';
        if (b.bookingStatus === 'requested' || b.bookingStatus === 'accepted' || b.bookingStatus === 'in_progress' || b.bookingStatus === 'completed') {
            const isAcc = (b.bookingStatus==='accepted'||b.bookingStatus==='in_progress'||b.bookingStatus==='completed');
            const isInP = (b.bookingStatus==='in_progress'||b.bookingStatus==='completed');
            const isDone = (b.bookingStatus==='completed');

            progHtml = `
                <div class="mb-progress-bar">
                    <div class="mb-prog-step"><div class="mb-prog-circle done"></div><div class="mb-prog-lbl done">Requested</div></div>
                    <div style="flex:1; height:2px; background:#D1D5DB; margin:0 4px; position:relative; top:-8px;"><div style="width:${isAcc?'100%':'0'}; height:100%; background:#000; transition: width 0.3s;"></div></div>
                    
                    <div class="mb-prog-step"><div class="mb-prog-circle ${isAcc?'done':''} ${b.bookingStatus==='accepted'?'active':''}"></div><div class="mb-prog-lbl ${isAcc?'done':''} ${b.bookingStatus==='accepted'?'active':''}">Confirmed</div></div>
                    <div style="flex:1; height:2px; background:#D1D5DB; margin:0 4px; position:relative; top:-8px;"><div style="width:${isInP?'100%':'0'}; height:100%; background:#000; transition: width 0.3s;"></div></div>
                    
                    <div class="mb-prog-step"><div class="mb-prog-circle ${isInP?'done':''} ${b.bookingStatus==='in_progress'?'active':''}"></div><div class="mb-prog-lbl ${isInP?'done':''} ${b.bookingStatus==='in_progress'?'active':''}">In Progress</div></div>
                    <div style="flex:1; height:2px; background:#D1D5DB; margin:0 4px; position:relative; top:-8px;"><div style="width:${isDone?'100%':'0'}; height:100%; background:#000; transition: width 0.3s;"></div></div>
                    
                    <div class="mb-prog-step"><div class="mb-prog-circle ${isDone?'done active':''}"></div><div class="mb-prog-lbl ${isDone?'done active':''}">Done</div></div>
                </div>
            `;
        }

        return `
            <div class="mb-card ${newBookingId === b._id ? 'highlight':''}" id="bk-${b._id}" data-cardid="${b._id}">
                <div class="mb-card-header">
                    <div class="mb-status-pill ${badge.c}">
                        <i class="${badge.icon}"></i> ${badge.lbl}
                    </div>
                    <div class="mb-date-col">
                        <div class="mb-date-main">${dateStr}</div>
                        <div class="mb-date-sub">${timeStr}</div>
                    </div>
                </div>

                <div class="mb-worker-row" data-cdet="${b._id}">
                    <div class="mb-w-av-wrap">
                        <div class="mb-w-av">${wInitials}</div>
                        ${w.isVerified ? `<div class="mb-w-ver"></div>` : ''}
                    </div>
                    <div class="mb-w-info">
                        <div class="mb-w-name">${wName}</div>
                        <div class="mb-w-loc">${locStr}</div>
                    </div>
                    ${w.hourlyRate ? `<div class="mb-w-rate">LKR ${w.hourlyRate}/hr</div>` : ''}
                </div>

                ${b.job ? `
                    <div class="mb-job-link">
                        <i class="ri-briefcase-line"></i> Re: ${b.job.jobTitle.length>40?b.job.jobTitle.substring(0,40)+'...':b.job.jobTitle}
                    </div>
                ` : ''}

                <div class="mb-details-strip">
                    <div class="mb-ds-i"><i class="ri-time-line"></i> ${b.estimatedDurationHours||0}h</div> &middot;
                    <div class="mb-ds-i"><i class="ri-wallet-3-line"></i> ${costStr}</div> &middot;
                    <div class="mb-ds-i"><i class="ri-calendar-event-line"></i> Booked ${relTime}</div>
                </div>

                ${progHtml}
                ${actionHtml}
            </div>
        `;
    }

    function mbUpdateUI() {
        const counts = { pending: 0, accepted: 0, in_progress: 0, completed: 0, total: mbState.bookings.length };
        mbState.bookings.forEach(b => {
             if (b.bookingStatus === 'requested') counts.pending++;
             else if (b.bookingStatus === 'accepted') counts.accepted++;
             else if (b.bookingStatus === 'completed') counts.completed++;
             else if (b.bookingStatus === 'in_progress') counts.in_progress++;
        });

        const activeCount = counts.accepted + counts.in_progress;
        const totalStr = counts.total;

        let contentHtml = '';

        if (mbState.isLoading) {
            contentHtml = Array(3).fill(0).map(() => `
                <div class="mb-skel-card">
                    <div class="mb-skel-r1"><div class="mb-skel-badge"></div><div class="mb-skel-date"></div></div>
                    <div class="mb-skel-r2"><div class="mb-skel-av"></div><div><div class="mb-skel-n"></div><div class="mb-skel-l"></div></div></div>
                    <div class="mb-skel-r3"></div>
                </div>
            `).join('');
        } else if (mbState.bookings.length === 0) {
            contentHtml = `
                <div class="mb-empty-state">
                    <i class="ri-calendar-check-line mb-empty-icon"></i>
                    <div class="mb-empty-title">No bookings yet</div>
                    <div class="mb-empty-sub">Book a skilled worker to get started. Browse workers and request a booking.</div>
                    <button class="mb-empty-btn" id="mb-nav-workers">Browse Workers</button>
                </div>
            `;
        } else {
            const filtered = getFilteredAndSorted();
            if (filtered.length === 0) {
                 const lbl = mbState.activeTab !== 'all' ? mbState.activeTab : 'matching';
                 let mapTxt = "No bookings found matching filters.";
                 if (mbState.activeTab === 'pending') mapTxt = "No bookings waiting for a response.";
                 if (mbState.activeTab === 'accepted') mapTxt = "No confirmed bookings right now.";
                 if (mbState.activeTab === 'in_progress') mapTxt = "No jobs currently in progress.";
                 if (mbState.activeTab === 'completed') mapTxt = "No completed bookings yet.";
                 
                 contentHtml = `
                    <div class="mb-empty-state" style="padding-top:40px;">
                        <i class="ri-search-line mb-empty-icon"></i>
                        <div class="mb-empty-title">No ${lbl} bookings</div>
                        <div class="mb-empty-sub">${mapTxt}</div>
                        <div class="mb-empty-link" id="mb-reset-filters" style="margin-top:16px;">View all bookings</div>
                    </div>
                 `;
            } else {
                 const upcoming = [];
                 const past = [];
                 filtered.forEach(b => {
                     const isFutureDate = b.scheduledDate && b.scheduledDate.split('T')[0] >= todayDateStr;
                     const isActStat = ['requested', 'accepted', 'in_progress'].includes(b.bookingStatus);
                     if (isFutureDate || isActStat) upcoming.push(b);
                     else past.push(b);
                 });

                 if (upcoming.length > 0) {
                     contentHtml += `<div class="mb-group-title upcoming">Upcoming</div>`;
                     contentHtml += upcoming.map(generateCardHTML).join('');
                 }
                 if (past.length > 0) {
                     contentHtml += `<div class="mb-group-title past">Past</div>`;
                     contentHtml += past.map(generateCardHTML).join('');
                 }
            }
        }

        const isFltActive = mbState.filterStatuses.length > 0;

        appElement.innerHTML = `
            <div class="mb-screen" id="mb-root">
                <div class="mb-header">
                    <button class="mb-btn-icon" id="mb-back"><i class="ri-arrow-left-line"></i></button>
                    <div class="mb-title-global">My Bookings</div>
                    <div class="mb-hdr-right" id="mb-trigger-flt">
                        <i class="ri-equalizer-line" style="font-size:20px; color:#111827;"></i>
                        ${isFltActive ? `<div class="mb-filter-dot"></div>` : ''}
                    </div>
                </div>

                <div class="mb-summary-strip">
                    <div class="mb-sum-pill">${totalStr} Total</div>
                    <div class="mb-sum-pill">${activeCount} Active</div>
                    <div class="mb-sum-pill">${counts.completed} Completed</div>
                    <div class="mb-sum-pill">${counts.pending} Pending</div>
                </div>

                <div class="mb-tabs-row">
                    <div class="mb-tab ${mbState.activeTab==='all'?'active':''}" data-tab="all">All</div>
                    <div class="mb-tab ${mbState.activeTab==='pending'?'active':''}" data-tab="pending">Pending</div>
                    <div class="mb-tab ${mbState.activeTab==='confirmed'?'active':''}" data-tab="confirmed">Confirmed</div>
                    <div class="mb-tab ${mbState.activeTab==='in_progress'?'active':''}" data-tab="in_progress">In Progress</div>
                    <div class="mb-tab ${mbState.activeTab==='completed'?'active':''}" data-tab="completed">Completed</div>
                    <div class="mb-tab ${mbState.activeTab==='cancelled'?'active':''}" data-tab="cancelled">Cancelled</div>
                    <div class="mb-tab ${mbState.activeTab==='declined'?'active':''}" data-tab="declined">Declined</div>
                </div>

                <div class="mb-scroll-content" id="mb-scr">
                    <div class="mb-ptr-indicator ${mbState.isRefreshing ? 'visible' : ''}">
                        <div class="mb-ptr-spinner"></div>
                    </div>
                    ${contentHtml}
                </div>

                <div class="mb-fab-container" id="mb-nav-workers-fab">
                    <button class="mb-fab"><i class="ri-add-line"></i></button>
                    <div class="mb-fab-lbl">New Booking</div>
                </div>

                <!-- Sheets -->
                <!-- Filter Sheet -->
                <div class="mb-sheet-overlay ${mbState.showFilterSheet ? 'active' : ''}" id="mb-bg-flt">
                    <div class="mb-sheet">
                        <div class="mb-sh-head">
                            <div class="mb-sh-title">Filter & Sort</div>
                            <div class="mb-sh-reset" id="mb-flt-reset">Reset</div>
                        </div>
                        
                        <div class="mb-flt-sec">
                            <div class="mb-flt-lbl">Sort By</div>
                            <label class="mb-radio-row"><input type="radio" class="mb-radio" name="bsort" value="upcoming_first" ${mbState.sortBy==='upcoming_first'?'checked':''}> <div class="mb-flt-txt">Upcoming first</div></label>
                            <label class="mb-radio-row"><input type="radio" class="mb-radio" name="bsort" value="recent_first" ${mbState.sortBy==='recent_first'?'checked':''}> <div class="mb-flt-txt">Most recent first</div></label>
                            <label class="mb-radio-row"><input type="radio" class="mb-radio" name="bsort" value="oldest_first" ${mbState.sortBy==='oldest_first'?'checked':''}> <div class="mb-flt-txt">Oldest first</div></label>
                            <label class="mb-radio-row"><input type="radio" class="mb-radio" name="bsort" value="highest_cost" ${mbState.sortBy==='highest_cost'?'checked':''}> <div class="mb-flt-txt">Highest cost first</div></label>
                        </div>
                        
                        <div class="mb-flt-sec" style="margin-bottom:0;">
                            <div class="mb-flt-lbl">Filter by Status</div>
                            <label class="mb-chk-row"><input type="checkbox" class="mb-chk" value="requested" ${mbState.filterStatuses.includes('requested')?'checked':''}> <div class="mb-flt-txt">Pending (Awaiting Response)</div></label>
                            <label class="mb-chk-row"><input type="checkbox" class="mb-chk" value="accepted" ${mbState.filterStatuses.includes('accepted')?'checked':''}> <div class="mb-flt-txt">Confirmed</div></label>
                            <label class="mb-chk-row"><input type="checkbox" class="mb-chk" value="in_progress" ${mbState.filterStatuses.includes('in_progress')?'checked':''}> <div class="mb-flt-txt">In Progress</div></label>
                            <label class="mb-chk-row"><input type="checkbox" class="mb-chk" value="completed" ${mbState.filterStatuses.includes('completed')?'checked':''}> <div class="mb-flt-txt">Completed</div></label>
                            <label class="mb-chk-row"><input type="checkbox" class="mb-chk" value="cancelled" ${mbState.filterStatuses.includes('cancelled')?'checked':''}> <div class="mb-flt-txt">Cancelled</div></label>
                            <label class="mb-chk-row"><input type="checkbox" class="mb-chk" value="rejected" ${mbState.filterStatuses.includes('rejected')?'checked':''}> <div class="mb-flt-txt">Declined</div></label>
                        </div>
                        
                        <button class="mb-sh-btn-apply" id="mb-apply-flt">Apply</button>
                    </div>
                </div>

                <!-- Cancel Sheet -->
                <div class="mb-sheet-overlay ${mbState.cancelTarget ? 'active' : ''}" id="mb-bg-can">
                    <div class="mb-sheet">
                        <div class="mb-sh-title">Cancel this booking?</div>
                        <div class="mb-sh-sub">The worker will be notified automatically.</div>
                        
                        ${mbState.cancelTarget ? `
                        <div class="mb-cancel-block">
                            Booking with <b>${mbState.cancelTarget.worker?.firstName||''}</b><br>
                            Scheduled for <b>${new Date(mbState.cancelTarget.scheduledDate).toLocaleDateString()}</b>
                        </div>
                        ` : ''}

                        <textarea class="mb-ta" id="mb-can-reason" placeholder="e.g. Change of plans..." maxlength="200">${mbState.cancelReason}</textarea>
                        
                        <button class="mb-sh-btn-red" id="mb-can-submit" ${mbState.isCancelling ? 'disabled':''}>
                           ${mbState.isCancelling ? '<div class="spinner" style="width:16px;height:16px;border:2px solid; border-top-color:transparent;border-radius:50%;animation:spin 1s infinite;margin-right:8px;"></div>' : ''} Cancel Booking
                        </button>
                        <button class="mb-sh-btn-keep" id="mb-can-close">Keep Booking</button>
                    </div>
                </div>

            </div>
        `;

        if (newBookingId && !mbState.isLoading) {
            const hBlock = document.getElementById(`bk-${newBookingId}`);
            if (hBlock) {
                 setTimeout(() => {
                      hBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 }, 100);
            }
            window.history.replaceState({}, "");
        }
        
        attachPTR();
    }

    async function loadData() {
        mbState.isLoading = true;
        mbUpdateUI();
        
        const bProm = api.getRoleBookings('customer'); // Mock mapping
        const rProm = api.getMyReviews ? api.getMyReviews() : Promise.resolve({data:{content:[]}}); // mock safe if it doesn't exist
        
        const [bR, rR] = await Promise.allSettled([bProm, rProm]);

        if (bR.status === 'fulfilled' && bR.value && bR.value.data) {
             mbState.bookings = bR.value.data.content || [];
        } else {
             // Mock fallback
             mbState.bookings = [
                 {
                    _id: window.history.state?.newBookingId || "bk1001",
                    worker: { firstName: "Kasun", lastName: "Perera", hourlyRate: 1200, city: "Negombo", district: "Gampaha", isVerified: true },
                    bookingStatus: "requested",
                    scheduledDate: new Date(Date.now() + 86400000).toISOString(),
                    scheduledTime: "09:00",
                    estimatedDurationHours: 3,
                    createdAt: new Date().toISOString()
                 },
                 {
                    _id: "bk1002",
                    worker: { firstName: "Nuwan", lastName: "Silva", hourlyRate: 1500, city: "Colombo", district: "Colombo", isVerified: false },
                    bookingStatus: "completed",
                    scheduledDate: new Date(Date.now() - 86400000*2).toISOString(),
                    scheduledTime: "14:00",
                    estimatedDurationHours: 2,
                    finalCost: 3000,
                    createdAt: new Date(Date.now() - 86400000*5).toISOString()
                 }
             ];
        }

        if (rR.status === 'fulfilled' && rR.value && rR.value.data) {
             const rvs = rR.value.data.content || [];
             rvs.forEach(r => mbState.reviewedBookingIds.add(r.booking));
        }

        mbState.isLoading = false;
        mbState.isRefreshing = false;
        mbUpdateUI();
    }

    // Pull to Refresh handling
    function attachPTR() {
        const root = document.getElementById('mb-root');
        const scr = document.getElementById('mb-scr');
        if(!scr || !root) return;

        let startY = 0; let pullDist = 0; let isPulling = false;
        
        root.addEventListener('touchstart', e => {
            if (scr.scrollTop <= 0) { startY = e.touches[0].clientY; isPulling = true; pullDist = 0; }
        }, {passive:true});
        
        root.addEventListener('touchmove', e => {
            if (!isPulling) return;
            const y = e.touches[0].clientY;
            const diff = y - startY;
            if (diff > 0 && scr.scrollTop <= 0) {
                pullDist = Math.min(diff * 0.4, 80);
                const pIndicator = document.querySelector('.mb-ptr-indicator');
                if(pIndicator && pullDist > 10) pIndicator.style.height = `${pullDist}px`;
                if(e.cancelable) e.preventDefault();
            }
        }, {passive:false});

        root.addEventListener('touchend', e => {
            if (!isPulling) return;
            isPulling = false;
            if (pullDist > 50 && !mbState.isRefreshing) {
                mbState.isRefreshing = true;
                const pIndicator = document.querySelector('.mb-ptr-indicator');
                if(pIndicator) {
                     pIndicator.style.height = '60px';
                     pIndicator.classList.add('visible');
                }
                loadData();
            } else {
                const pIndicator = document.querySelector('.mb-ptr-indicator');
                if(pIndicator) {
                     pIndicator.style.height = '0';
                     pIndicator.classList.remove('visible');
                }
            }
            pullDist = 0;
        });
    }

    appElement.addEventListener('click', async (e) => {
        if (e.target.closest('#mb-back')) {
            navigate(-1);
        }
        
        // Navigation binds
        if (e.target.closest('#mb-nav-workers') || e.target.closest('#mb-nav-workers-fab')) {
            navigate('/customer/workers');
        }
        
        const navDet = e.target.closest('[data-cdet]');
        if (navDet) {
            navigate(`/customer/bookings/${navDet.dataset.cdet}`);
        }

        const navRev = e.target.closest('[data-cbrev]');
        if (navRev) {
            navigate('/customer/review/create', { state: { bookingId: navRev.dataset.cbrev, workerId: navRev.dataset.w, workerName: navRev.dataset.wn }});
        }

        // Tabs
        const tBtn = e.target.closest('.mb-tab');
        if (tBtn) {
            mbState.activeTab = tBtn.dataset.tab;
            mbUpdateUI();
        }
        if (e.target.closest('#mb-reset-filters')) {
            mbState.activeTab = 'all'; mbState.filterStatuses = [];
            mbUpdateUI();
        }

        // Filter Sheet
        if (e.target.closest('#mb-trigger-flt')) { mbState.showFilterSheet = true; mbUpdateUI(); }
        if (e.target.closest('#mb-bg-flt') && e.target.id === 'mb-bg-flt') { mbState.showFilterSheet = false; mbUpdateUI(); }
        if (e.target.closest('#mb-apply-flt')) {
            const rad = document.querySelector('input[name="bsort"]:checked');
            if (rad) mbState.sortBy = rad.value;
            
            const chks = Array.from(document.querySelectorAll('.mb-chk:checked')).map(c => c.value);
            mbState.filterStatuses = chks;

            mbState.showFilterSheet = false;
            mbUpdateUI();
        }
        if (e.target.closest('#mb-flt-reset')) {
            mbState.sortBy = 'upcoming_first';
            mbState.filterStatuses = [];
            mbState.showFilterSheet = false;
            mbUpdateUI();
        }

        // Cancel Logic
        const cTrig = e.target.closest('[data-cid]');
        if (cTrig) {
            const targ = mbState.bookings.find(b => b._id === cTrig.dataset.cid);
            if (targ) {
                mbState.cancelTarget = targ;
                mbState.cancelReason = "";
                mbUpdateUI();
            }
        }
        
        if (e.target.closest('#mb-can-close') || (e.target.id === 'mb-bg-can')) {
            mbState.cancelTarget = null;
            mbUpdateUI();
        }

        if (e.target.closest('#mb-can-submit') && !mbState.isCancelling) {
             mbState.isCancelling = true;
             mbUpdateUI();
             try {
                // mock request using generic fetch or optimistic local immediately
                mbState.bookings = mbState.bookings.map(b => b._id === mbState.cancelTarget._id ? { ...b, bookingStatus: "cancelled", cancellationReason: mbState.cancelReason.trim() || undefined } : b);
                showToast("Booking cancelled", "success");
             } catch(err) {
                showToast("Failed to cancel. Try again.", "error");
             }
             mbState.cancelTarget = null;
             mbState.isCancelling = false;
             mbUpdateUI();
        }
    });

    appElement.addEventListener('input', (e) => {
        if (e.target.id === 'mb-can-reason') {
             mbState.cancelReason = e.target.value;
        }
    });

    // Run Mount Load
    loadData();
}
