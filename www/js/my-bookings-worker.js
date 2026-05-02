// ============================== //
// SkillConnect Mobile           //
// Worker My Bookings            //
// ============================== //

async function renderMyBookingsWorker(appElement, stateRoute) {
    let mb = {
        bookings: [],
        isLoading: true,
        error: null,
        activeTab: 'all',
        sortBy: 'action_first',
        filterStatus: ['requested','accepted','in_progress','completed','cancelled','rejected'],
        showFilterSheet: false,
        acceptTarget: null,
        declineTarget: null,
        startTarget: null,
        completeTarget: null,
        actionReason: '',
        finalCost: '',
        isUpdating: false
    };

    function calculateDerived() {
        mb.tabCounts = { new:0, active:0, done:0, requested:0, accepted:0, in_progress:0, completed:0, cancelled:0, all: mb.bookings.length };

        mb.bookings.forEach(b => {
            const st = b.bookingStatus;
            if(st === 'requested') { mb.tabCounts.new++; mb.tabCounts.requested++; }
            if(st === 'accepted') { mb.tabCounts.active++; mb.tabCounts.accepted++; }
            if(st === 'in_progress') { mb.tabCounts.active++; mb.tabCounts.in_progress++; }
            if(st === 'completed') { mb.tabCounts.done++; mb.tabCounts.completed++; }
            if(st === 'cancelled' || st === 'rejected') { mb.tabCounts.cancelled++; }
        });

        let list = mb.bookings;

        // Tabs
        if(mb.activeTab !== 'all') {
            if(mb.activeTab === 'cancelled') list = list.filter(b => b.bookingStatus === 'cancelled' || b.bookingStatus === 'rejected');
            else list = list.filter(b => b.bookingStatus === mb.activeTab);
        }

        // Deep Filters
        list = list.filter(b => {
             const mt = b.bookingStatus==='rejected'?'cancelled':b.bookingStatus;
             return mb.filterStatus.includes(mt);
        });

        // Sort
        list.sort((a,b) => {
            if(mb.sortBy === 'action_first') {
                const wA = a.bookingStatus==='requested'?3:a.bookingStatus==='accepted'?2:a.bookingStatus==='in_progress'?1:0;
                const wB = b.bookingStatus==='requested'?3:b.bookingStatus==='accepted'?2:b.bookingStatus==='in_progress'?1:0;
                if(wA !== wB) return wB - wA;
                return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
            }
            if(mb.sortBy === 'soonest') return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
            if(mb.sortBy === 'most_recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if(mb.sortBy === 'highest_earnings') {
                const eA = (a.job?.hourlyRate?(a.job.hourlyRate*a.estimatedDurationHours):0);
                const eB = (b.job?.hourlyRate?(b.job.hourlyRate*b.estimatedDurationHours):0);
                return eB - eA;
            }
            return 0;
        });

        mb.filtered = list;

        mb.reqGrp = mb.filtered.filter(b => b.bookingStatus === 'requested');
        mb.upcGrp = mb.filtered.filter(b => (b.bookingStatus === 'accepted' || b.bookingStatus === 'in_progress') && new Date(b.scheduledDate) >= new Date(new Date().setHours(0,0,0,0)));
        mb.pstGrp = mb.filtered.filter(b => b.bookingStatus === 'completed' || b.bookingStatus === 'cancelled' || b.bookingStatus === 'rejected' || ((b.bookingStatus === 'accepted' || b.bookingStatus === 'in_progress') && new Date(b.scheduledDate) < new Date(new Date().setHours(0,0,0,0))));
    }

    function relativeDate(dStr) {
        if(!dStr) return '';
        const d = new Date(dStr);
        const df = (Date.now() - d.getTime()) / (1000*60*60*24);
        if(df < 1) return 'Today';
        if(df < 2) return 'Yesterday';
        if(df < 7) return `${Math.floor(df)}d ago`;
        return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    }

    function mcUpdateUI() {
        if(mb.isLoading) {
            appElement.innerHTML = `
                <div class="wmb-screen">
                    <div class="wmb-header"><button class="wmb-btn-icon" id="w-bck"><i class="ri-arrow-left-line"></i></button><div class="wmb-title">My Bookings</div><button class="wmb-flt"><i class="ri-list-settings-line"></i></button></div>
                    <div class="wmb-sum-strip"><div class="wmb-sk-strip"></div><div class="wmb-sk-strip"></div><div class="wmb-sk-strip"></div></div>
                    <div class="wmb-scroll" style="padding-top:16px;">
                        <div class="wmb-sk-c"><div class="wmb-sk-r1"><div class="wmb-sk-b1"></div><div class="wmb-sk-b2"></div></div><div class="wmb-sk-t"></div><div class="wmb-sk-s"></div></div>
                        <div class="wmb-sk-c"><div class="wmb-sk-r1"><div class="wmb-sk-b1"></div><div class="wmb-sk-b2"></div></div><div class="wmb-sk-t"></div><div class="wmb-sk-s"></div></div>
                    </div>
                </div>
            `;
            return;
        }

        calculateDerived();
        const hasFilters = mb.sortBy!=='action_first' || mb.filterStatus.length !== 6;

        let urgBanHtml = '';
        if(mb.tabCounts.new > 0) {
             urgBanHtml = `
                <div class="wmb-urg-bn" id="w-go-urg">
                    <i class="ri-notification-3-fill wmb-urg-ic"></i>
                    <div>
                        <div class="wmb-urg-t">${mb.tabCounts.new} new booking request(s) need your response</div>
                        <div class="wmb-urg-s">Tap a request below to accept or decline</div>
                    </div>
                </div>
             `;
        }

        function buildCard(b) {
            const st = b.bookingStatus;
            let cdCls = '', bdgHtml = '';
            
            if(st==='requested'){ cdCls='req'; bdgHtml=`<div class="wmb-st-b wmb-st-req"><i class="ri-notification-3-fill"></i> New Request</div>`; }
            else if(st==='accepted'){ cdCls='acc'; bdgHtml=`<div class="wmb-st-b wmb-st-acc"><i class="ri-checkbox-circle-fill"></i> Confirmed</div>`; }
            else if(st==='in_progress'){ cdCls='inp'; bdgHtml=`<div class="wmb-st-b wmb-st-inp"><i class="ri-tools-fill"></i> In Progress</div>`; }
            else if(st==='completed'){ cdCls='com'; bdgHtml=`<div class="wmb-st-b wmb-st-com"><i class="ri-checkbox-circle-fill"></i> Completed</div>`; }
            else if(st==='cancelled'){ cdCls='can'; bdgHtml=`<div class="wmb-st-b wmb-st-can"><i class="ri-close-circle-fill"></i> Cancelled</div>`; }
            else if(st==='rejected'){ cdCls='can'; bdgHtml=`<div class="wmb-st-b wmb-st-rej"><i class="ri-close-circle-fill"></i> Rejected</div>`; }

            const sDt = new Date(b.scheduledDate);
            const ts = sDt.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
            let tm = 'TBD';
            if(b.scheduledTime){ const pt = b.scheduledTime.split(':'); tm = new Date(0,0,0,pt[0],pt[1]).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}); }

            const hR = b.job?.hourlyRate || b.customer?.hourlyRate || 2500; // Mock fallback mapping
            const est = hR * (b.estimatedDurationHours||0);

            let actHtml = '';
            if(st === 'requested') {
                 actHtml = `
                    <div class="wmb-ar">
                        <button class="wmb-b-f o" data-tj="${b._id}" data-act="decline"><i class="ri-close-line"></i> Decline</button>
                        <button class="wmb-b-f g" data-tj="${b._id}" data-act="accept"><i class="ri-check-line"></i> Accept</button>
                    </div>
                 `;
            } else if(st === 'accepted') {
                 actHtml = `
                    <div class="wmb-ar"><button class="wmb-b-f t" data-tj="${b._id}" data-act="start">Start Work</button></div>
                 `;
            } else if(st === 'in_progress') {
                 actHtml = `
                    <div class="wmb-ar"><button class="wmb-b-f g" data-tj="${b._id}" data-act="complete">Mark as Complete</button></div>
                 `;
            } else if(st === 'completed') {
                 // Check if reviewed... mocked
                 actHtml = `<div class="wmb-awt">Awaiting customer review</div>`;
            } else if(st === 'cancelled' || st === 'rejected') {
                 if(b.cancellationReason) actHtml = `<div class="wmb-cx">Reason: ${b.cancellationReason}</div>`;
            }

            return `
                <div class="wmb-c ${cdCls}" data-id="${b._id}">
                    ${st==='in_progress'?`<div class="wmb-dot"></div>`:``}
                    <div class="wmb-r1">
                        ${bdgHtml}
                        <div class="wmb-dt-st"><div class="wmb-dt-d">${ts}</div><div class="wmb-dt-t">${tm}</div></div>
                    </div>
                    <div class="wmb-r2">
                        <div class="wmb-c-av">${b.customer?.firstName?.[0]||''}${b.customer?.lastName?.[0]||''}</div>
                        <div>
                            <div class="wmb-c-n">${b.customer?.firstName} ${b.customer?.lastName}</div>
                            <div class="wmb-c-l">${b.customer?.city}, ${b.customer?.district}</div>
                        </div>
                        <div class="wmb-e-p">~LKR ${est}</div>
                    </div>
                    ${b.job ? `<div class="wmb-r3"><i class="ri-briefcase-4-fill" style="color:#9CA3AF; margin-right:4px"></i>Re: ${b.job.jobTitle}</div>` : ''}
                    <div class="wmb-r4">
                        <i class="ri-time-line"></i> ${b.estimatedDurationHours||0}h <span class="wmb-r4-d">·</span>
                        <i class="ri-calendar-check-line"></i> Booked ${relativeDate(b.createdAt)} <span class="wmb-r4-d">·</span>
                        <i class="ri-wallet-3-fill"></i> ${b.finalCost?`Final: LKR ${b.finalCost}`:`Est: LKR ${est}`}
                    </div>
                    ${actHtml}
                </div>
            `;
        }

        let lsHtml = '';
        if(mb.bookings.length === 0) {
            lsHtml = `
                <div class="wmb-emp">
                    <i class="ri-calendar-todo-line"></i>
                    <div class="wmb-emp-t">No bookings yet</div>
                    <div class="wmb-emp-s">When customers book you directly or accept your job applications, bookings will appear here.</div>
                    <button class="wmb-em-b" id="w-go-br">Browse Jobs</button>
                </div>
            `;
        } else if(mb.filtered.length === 0) {
            lsHtml = `
                <div class="wmb-emp">
                    <i class="ri-filter-off-line" style="color:#9CA3AF"></i>
                    <div class="wmb-emp-t">No matching bookings</div>
                    <div class="wmb-emp-s">Clear your filters to see your work.</div>
                    <button class="wmb-em-l" id="w-clr-t">View all</button>
                </div>
            `;
        } else {
            if(mb.reqGrp.length > 0) {
                lsHtml += `<div class="wmb-gh act"><i class="ri-notification-3-fill"></i> Action Required</div>`;
                lsHtml += mb.reqGrp.map(b => buildCard(b)).join('');
            }
            if(mb.upcGrp.length > 0) {
                lsHtml += `<div class="wmb-gh up"><i class="ri-calendar-event-line"></i> Upcoming</div>`;
                lsHtml += mb.upcGrp.map(b => buildCard(b)).join('');
            }
            if(mb.pstGrp.length > 0) {
                lsHtml += `<div class="wmb-gh pa"><i class="ri-history-line"></i> Past & Closed</div>`;
                lsHtml += mb.pstGrp.map(b => buildCard(b)).join('');
            }
        }

        // Sort Settings
        const sx = [
            {v:'action_first', l:'Action required first'}, {v:'soonest', l:'Soonest date first'}, 
            {v:'most_recent', l:'Most recent booking'}, {v:'highest_earnings', l:'Highest earnings'}
        ];
        let srHtml = sx.map(o => `
            <div class="wmb-fs-rd ${mb.sortBy === o.v ? 'active':''}" data-sv="${o.v}">
                <div class="wmb-fs-rl">${o.l}</div><div class="wmb-fs-rb"></div>
            </div>
        `).join('');

        const fx = [
            {v:'requested', l:'New Requests'}, {v:'accepted', l:'Confirmed'}, {v:'in_progress', l:'In Progress'}, 
            {v:'completed', l:'Completed'}, {v:'cancelled', l:'Cancelled'}
        ];
        let frHtml = fx.map(o => `
            <div class="wmb-fs-cx ${mb.filterStatus.includes(o.v)?'active':''}" data-fv="${o.v}">
                <div class="wmb-fs-cb"><i class="ri-check-line"></i></div>
                <div class="wmb-fs-rl">${o.l}</div>
            </div>
        `).join('');

        // Action Sheets Render
        let shtAct = '';
        if(mb.acceptTarget) {
             const t = mb.acceptTarget; const hR = t.job?.hourlyRate || t.customer?.hourlyRate || 2500;
             shtAct = `<div class="wmb-bs-bg active" id="wbb-acc">
                 <div class="wmb-bs">
                     <div class="wmb-dh"></div><div class="wmb-bs-h"><div class="wmb-bs-t">Accept this booking?</div></div>
                     <div class="wmb-bs-c">
                         <div class="wmb-bs-cb"><div class="wmb-bs-ct">${t.customer?.firstName} ${t.customer?.lastName}</div><div class="wmb-bs-cd">${new Date(t.scheduledDate).toLocaleDateString()}, ${t.scheduledTime||'TBD'}</div><div class="wmb-bs-cd">${t.estimatedDurationHours} hours</div>${t.notes?`<div class="wmb-bs-cn">Customer notes: ${t.notes}</div>`:''}</div>
                         <div class="wmb-bs-ern"><div class="wmb-bs-ea">Est. earnings:</div><div class="wmb-bs-ev">LKR ${hR * (t.estimatedDurationHours||0)}</div></div>
                     </div>
                     <div class="wmb-bs-f"><button class="wmb-bs-b1" style="background:#16A34A" id="w-c-acc">${mb.isUpdating?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : 'Accept Booking'}</button><button class="wmb-bs-b2" id="w-c-cls">Not Now</button></div>
                 </div></div>`;
        } else if(mb.declineTarget) {
             const t = mb.declineTarget;
             shtAct = `<div class="wmb-bs-bg active" id="wbb-dec">
                 <div class="wmb-bs">
                     <div class="wmb-dh"></div><div class="wmb-bs-h"><div class="wmb-bs-t">Decline this booking?</div><div class="wmb-bs-s">The customer will be notified.</div></div>
                     <div class="wmb-bs-c">
                         <div class="wmb-bs-cb" style="margin-top:0"><div class="wmb-bs-ct">${t.customer?.firstName} ${t.customer?.lastName}</div><div class="wmb-bs-cd">${new Date(t.scheduledDate).toLocaleDateString()}</div></div>
                         <div class="wmb-ta-w"><div class="wmb-ta-lbl">Reason (optional)</div><textarea class="wmb-ta" id="w-c-rsn" placeholder="e.g. Not available on this date...">${mb.actionReason}</textarea><div class="wmb-ta-cc">${mb.actionReason.length}/200</div></div>
                     </div>
                     <div class="wmb-bs-f"><button class="wmb-bs-b1" style="background:#DC2626" id="w-c-dec">${mb.isUpdating?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : 'Decline'}</button><button class="wmb-bs-b2" id="w-c-cls">Cancel</button></div>
                 </div></div>`;
        } else if(mb.startTarget) {
             const t = mb.startTarget;
             shtAct = `<div class="wmb-bs-bg active" id="wbb-str">
                 <div class="wmb-bs">
                     <div class="wmb-dh"></div><div class="wmb-bs-h"><div class="wmb-bs-t">Start work on this booking?</div><div class="wmb-bs-s">This will notify the customer that you've started the job.</div></div>
                     <div class="wmb-bs-c"><div class="wmb-bs-cb" style="margin-top:0"><div class="wmb-bs-ct">${t.customer?.firstName} ${t.customer?.lastName}</div><div class="wmb-bs-cd">${new Date(t.scheduledDate).toLocaleDateString()}</div></div></div>
                     <div class="wmb-bs-f"><button class="wmb-bs-b1" style="background:#0D9488" id="w-c-str">${mb.isUpdating?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : 'Start Work'}</button><button class="wmb-bs-b2" id="w-c-cls">Not Yet</button></div>
                 </div></div>`;
        } else if(mb.completeTarget) {
             const t = mb.completeTarget; const hR = t.job?.hourlyRate || t.customer?.hourlyRate || 2500; const est = hR * (t.estimatedDurationHours||0);
             shtAct = `<div class="wmb-bs-bg active" id="wbb-com">
                 <div class="wmb-bs">
                     <div class="wmb-dh"></div><div class="wmb-bs-h"><div class="wmb-bs-t">Mark this job as complete?</div><div class="wmb-bs-s">The customer will be notified and can leave a review.</div></div>
                     <div class="wmb-bs-c">
                         <div class="wmb-bs-cb" style="margin-top:0"><div class="wmb-bs-ct">${t.customer?.firstName} ${t.customer?.lastName}</div><div class="wmb-bs-cd">Est. target was LKR ${est}</div></div>
                         <div class="wmb-ic-w"><div class="wmb-ic-lbl">Final Cost (LKR)</div><div class="wmb-ic-sb">Enter the actual cost if different from the estimate</div><input type="number" inputmode="numeric" class="wmb-in-bx" id="w-c-fc" placeholder="${est}" value="${mb.finalCost}"></div>
                     </div>
                     <div class="wmb-bs-f"><button class="wmb-bs-b1" style="background:#16A34A" id="w-c-com">${mb.isUpdating?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : 'Mark Complete'}</button><button class="wmb-bs-b2" id="w-c-cls">Not Yet</button></div>
                 </div></div>`;
        }


        appElement.innerHTML = `
            <div class="wmb-screen">
                <div class="wmb-header"><button class="wmb-btn-icon" id="w-bck"><i class="ri-arrow-left-line"></i></button><div class="wmb-title">My Bookings</div><button class="wmb-flt ${hasFilters?'active':''}" id="w-opn-fl"><i class="ri-list-settings-line"></i></button></div>
                ${urgBanHtml}
                <div class="wmb-sum-strip">
                    <div class="wmb-pill"><span class="wmb-pill-num">${mb.tabCounts.all}</span> Total</div>
                    <div class="wmb-pill"><span class="wmb-pill-num" style="color:#D97706">${mb.tabCounts.new}</span> New</div>
                    <div class="wmb-pill"><span class="wmb-pill-num" style="color:#0D9488">${mb.tabCounts.active}</span> Active</div>
                    <div class="wmb-pill"><span class="wmb-pill-num" style="color:#16A34A">${mb.tabCounts.done}</span> Done</div>
                </div>
                <div class="wmb-tabs">
                    <button class="wmb-tab ${mb.activeTab==='all'?'active':''}" data-tab="all">All</button>
                    <button class="wmb-tab ${mb.activeTab==='requested'?'active':''}" data-tab="requested">New Requests <span class="wmb-tab-bdg">${mb.tabCounts.requested}</span></button>
                    <button class="wmb-tab ${mb.activeTab==='accepted'?'active':''}" data-tab="accepted">Confirmed <span class="wmb-tab-bdg">${mb.tabCounts.accepted}</span></button>
                    <button class="wmb-tab ${mb.activeTab==='in_progress'?'active':''}" data-tab="in_progress">In Progress <span class="wmb-tab-bdg">${mb.tabCounts.in_progress}</span></button>
                    <button class="wmb-tab ${mb.activeTab==='completed'?'active':''}" data-tab="completed">Completed <span class="wmb-tab-bdg">${mb.tabCounts.completed}</span></button>
                    <button class="wmb-tab ${mb.activeTab==='cancelled'?'active':''}" data-tab="cancelled">Cancelled <span class="wmb-tab-bdg">${mb.tabCounts.cancelled}</span></button>
                </div>
                <div class="wmb-scroll">${lsHtml}</div>

                <!-- Filter Sheet -->
                <div class="wmb-bs-bg ${mb.showFilterSheet?'active':''}" id="w-bg-flt">
                    <div class="wmb-bs" id="w-in-flt">
                        <div class="wmb-bs-h" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #F3F4F6;"><div class="wmb-fs-t">Filter & Sort</div><button class="wmb-fs-r" id="w-rst-fl">Reset</button></div>
                        <div class="wmb-bs-c" style="padding-top:20px;">
                            <div class="wmb-fs-l">Sort by</div>${srHtml}
                            <div class="wmb-fs-l" style="margin-top:24px;">Filter by Status</div>
                            <div class="wmb-fs-cx ${mb.filterStatus.length===6?'active':''}" data-fa="all"><div class="wmb-fs-cb"><i class="ri-check-line"></i></div><div class="wmb-fs-rl">All</div></div>
                            ${frHtml}
                        </div>
                        <div class="wmb-bs-f"><button class="wmb-bs-b1" style="background:#0D9488" id="w-apy-fl">Apply</button></div>
                    </div>
                </div>

                ${shtAct}
            </div>
        `;
    }

    async function loadData() {
        mb.isLoading = true; mcUpdateUI();
        if(api.getMyBookingsWorker) {
            try {
                const r = await api.getMyBookingsWorker();
                mb.bookings = r.data?.content || [];
            } catch(e) { mb.error = 'Failed to load'; }
        } else {
            await new Promise(r=>setTimeout(r,800)); // Mock
            const T = Date.now();
            mb.bookings = [
                { _id:'b1', bookingStatus:'requested', scheduledDate: new Date(T+86400000).toISOString(), scheduledTime:'09:00', estimatedDurationHours:3, created_At: new Date(T-3600000).toISOString(), customer: { firstName:'Amara', lastName:'F', city:'Negombo', district:'Gampaha'}, job: { jobTitle:'Fix kitchen sink', hourlyRate: 3500 }, notes:'Please bring tools.' },
                { _id:'b2', bookingStatus:'in_progress', scheduledDate: new Date(T+3600000).toISOString(), scheduledTime:'14:00', estimatedDurationHours:5, created_At: new Date(T-86400000).toISOString(), customer: { firstName:'Kamal', lastName:'P', city:'Colombo 03', district:'Colombo'}, job: { jobTitle:'Paint bedroom', hourlyRate: 2000 } },
                { _id:'b3', bookingStatus:'accepted', scheduledDate: new Date(T+172800000).toISOString(), scheduledTime:'10:00', estimatedDurationHours:2, created_At: new Date(T-172800000).toISOString(), customer: { firstName:'Nimal', lastName:'Silva', city:'Wattala', district:'Gampaha'}, job: { jobTitle:'Repair chairs', hourlyRate: 2500 } },
                { _id:'b4', bookingStatus:'completed', scheduledDate: new Date(T-86400000).toISOString(), scheduledTime:'08:00', estimatedDurationHours:4, created_At: new Date(T-86400000*3).toISOString(), customer: { firstName:'Sunil', lastName:'P', city:'Kelaniya', district:'Gampaha'}, finalCost: 10000 }
            ];
        }
        mb.isLoading = false; mcUpdateUI();
    }

    async function doUpdate(id, payload, successMsg) {
        mb.isUpdating = true; mcUpdateUI();

        if(api.updateBookingStatus) {
            try { await api.updateBookingStatus(id, payload); }
            catch(e) { mb.isUpdating = false; mcUpdateUI(); showToast('Failed to update', 'error'); return; }
        } else {
            await new Promise(r=>setTimeout(r,800)); // Simulating
        }

        // Optimistic State Update
        mb.bookings = mb.bookings.map(b => b._id === id ? { ...b, bookingStatus: payload.status, cancellationReason: payload.cancellationReason||null, completedAt: payload.status==='completed'?new Date().toISOString():null, finalCost: payload.finalCost||b.finalCost } : b);
        
        mb.isUpdating = false;
        mb.acceptTarget = null; mb.declineTarget = null; mb.startTarget = null; mb.completeTarget = null;
        mb.actionReason = ''; mb.finalCost = '';
        
        showToast(successMsg, 'success');
        mcUpdateUI();
    }

    appElement.addEventListener('click', e => {
        const tg = e.target;
        if(tg.closest('#w-bck')) return navigate(-1);
        if(tg.closest('#w-go-br')) return navigate('/worker/jobs');
        
        if(tg.closest('#w-go-urg')) { mb.activeTab = 'requested'; return mcUpdateUI(); }

        const tb = tg.closest('.wmb-tab');
        if(tb) { mb.activeTab = tb.dataset.tab; return mcUpdateUI(); }

        if(tg.closest('#w-clr-t')) { mb.activeTab = 'all'; mb.filterStatus = ['requested','accepted','in_progress','completed','cancelled','rejected']; mb.sortBy='action_first'; return mcUpdateUI(); }

        // Cards Action Target Mapping natively evaluating limits boundaries successfully bridging logic securely.
        const cr = tg.closest('.wmb-c'); 
        const ac = tg.closest('.wmb-b-f');
        if(ac) {
            e.stopPropagation();
            const id = ac.dataset.tj; const act = ac.dataset.act;
            const b = mb.bookings.find(x => x._id === id);
            if(act === 'accept') mb.acceptTarget = b;
            if(act === 'decline') mb.declineTarget = b;
            if(act === 'start') mb.startTarget = b;
            if(act === 'complete') mb.completeTarget = b;
            return mcUpdateUI();
        } else if(cr && !tg.closest('.wmb-bs-bg')) {
            const id = cr.dataset.id;
            if(id) return navigate(`/worker/bookings/${id}`);
        }

        // Bottom Sheets Closings
        if(tg.closest('#w-c-cls') || tg.id === 'wbb-acc' || tg.id==='wbb-dec' || tg.id==='wbb-str' || tg.id==='wbb-com') {
             if(mb.isUpdating) return;
             mb.acceptTarget = null; mb.declineTarget = null; mb.startTarget = null; mb.completeTarget = null;
             mb.actionReason = ''; mb.finalCost = ''; return mcUpdateUI();
        }

        // Submissions 
        if(tg.closest('#w-c-acc')) return doUpdate(mb.acceptTarget._id, {status:'accepted'}, 'Booking accepted!');
        if(tg.closest('#w-c-dec')) return doUpdate(mb.declineTarget._id, {status:'rejected', cancellationReason: mb.actionReason||undefined}, 'Booking declined');
        if(tg.closest('#w-c-str')) return doUpdate(mb.startTarget._id, {status:'in_progress'}, 'Status updated — work in progress');
        if(tg.closest('#w-c-com')) return doUpdate(mb.completeTarget._id, {status:'completed', finalCost: mb.finalCost ? parseFloat(mb.finalCost) : undefined}, 'Job marked complete! 🎉');

        // Filter Grid Logic
        if(tg.closest('#w-opn-fl')) { mb.showFilterSheet = true; return mcUpdateUI(); }
        if(tg.id === 'w-bg-flt') { mb.showFilterSheet = false; return mcUpdateUI(); }
        if(tg.closest('#w-apy-fl')) { mb.showFilterSheet = false; return mcUpdateUI(); }
        
        const sf = tg.closest('.wmb-fs-rd');
        if(sf) { mb.sortBy = sf.dataset.sv; return mcUpdateUI(); }
        
        const cf = tg.closest('.wmb-fs-cx');
        if(cf) {
             const v = cf.dataset.fv;
             if(v === 'all') {
                  if(mb.filterStatus.length === 6) mb.filterStatus = [];
                  else mb.filterStatus = ['requested','accepted','in_progress','completed','cancelled','rejected'];
             } else {
                  if(mb.filterStatus.includes(v)) {
                      mb.filterStatus = mb.filterStatus.filter(x => x!==v);
                      if(v==='cancelled') mb.filterStatus = mb.filterStatus.filter(x => x!=='rejected');
                  } else {
                      mb.filterStatus.push(v);
                      if(v==='cancelled') mb.filterStatus.push('rejected');
                  }
             }
             return mcUpdateUI();
        }
        if(tg.closest('#w-rst-fl')) { mb.sortBy='action_first'; mb.filterStatus=['requested','accepted','in_progress','completed','cancelled','rejected']; return mcUpdateUI(); }
    });

    appElement.addEventListener('input', e => {
         if(e.target.id === 'w-c-rsn') { mb.actionReason = e.target.value.substring(0,200); mcUpdateUI(); setTimeout(()=>{const i=document.getElementById('w-c-rsn');if(i){i.focus(); i.setSelectionRange(i.value.length, i.value.length);}},0); }
         if(e.target.id === 'w-c-fc') { mb.finalCost = e.target.value; mcUpdateUI(); setTimeout(()=>{const i=document.getElementById('w-c-fc');if(i){i.focus(); i.setSelectionRange(i.value.length, i.value.length);}},0); }
    });

    loadData();
}
