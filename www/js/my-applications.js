// ============================== //
// SkillConnect Mobile           //
// Worker My Applications        //
// ============================== //

async function renderMyApplications(appElement, stateRoute) {
    const userId = localStorage.getItem('userId') || 'worker_me'; // stub

    let wState = {
        allApplications: [],
        isLoading: true,
        error: null,
        activeTab: 'all',
        sortBy: 'most_recent',
        filterCats: [],
        showFilterSheet: false
    };

    const categories = ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Painting', 'Masonry', 'Landscaping', 'Pest Control', 'HVAC', 'Roofing', 'General Labor'];

    function processRelativeTime(dtStr) {
        if(!dtStr) return '';
        const ms = Date.now() - new Date(dtStr).getTime();
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        if(days === 0) {
            const hrs = Math.floor(ms / (1000 * 60 * 60));
            if(hrs===0) return 'Just now';
            return `${hrs}h ago`;
        }
        if(days===1) return 'Yesterday';
        if(days<30) return `${days}d ago`;
        return new Date(dtStr).toLocaleDateString();
    }

    function calculateDerived() {
        // Tab Counts
        wState.tabCounts = { pending:0, accepted:0, rejected:0, all: wState.allApplications.length };
        
        let acceptedApps = [];
        let totalEst = 0;

        wState.allApplications.forEach(a => {
            if(a.application.status === 'pending') wState.tabCounts.pending++;
            if(a.application.status === 'accepted') {
                wState.tabCounts.accepted++;
                acceptedApps.push(a);
                totalEst += (a.application.proposedRate * (a.job.estimatedDurationHours || 0));
            }
            if(a.application.status === 'rejected') wState.tabCounts.rejected++;
        });

        wState.totalEstimatedEarnings = totalEst;
        wState.acceptedCount = wState.tabCounts.accepted;

        // Filtering
        let list = wState.allApplications;
        
        if(wState.activeTab !== 'all') {
            list = list.filter(a => a.application.status === wState.activeTab);
        }

        if(wState.filterCats.length > 0) {
            list = list.filter(a => wState.filterCats.includes(a.job.category));
        }

        // Sorting
        list.sort((a,b) => {
            const tA = new Date(a.application.appliedAt).getTime();
            const tB = new Date(b.application.appliedAt).getTime();
            
            if(wState.sortBy === 'most_recent') return tB - tA;
            if(wState.sortBy === 'oldest') return tA - tB;
            if(wState.sortBy === 'highest_rate') return b.application.proposedRate - a.application.proposedRate;
            if(wState.sortBy === 'highest_budget') return (b.job.budgetMax||0) - (a.job.budgetMax||0);
            return 0;
        });

        wState.filteredApps = list;
    }

    function mcUpdateUI() {
        if(wState.isLoading) {
            appElement.innerHTML = `
                <div class="wap-screen">
                    <div class="wap-header">
                        <button class="wap-btn-icon" id="w-bck"><i class="ri-arrow-left-line"></i></button>
                        <div class="wap-title">My Applications</div>
                        <button class="wap-flt"><i class="ri-list-settings-line"></i></button>
                    </div>
                    <div class="wap-sum-strip">
                        <div class="wap-sk-strip"></div><div class="wap-sk-strip"></div><div class="wap-sk-strip"></div>
                    </div>
                    <div class="wap-scroll">
                        <div class="wap-sk-c"><div class="wap-sk-r1"><div class="wap-sk-b1"></div><div class="wap-sk-b2"></div></div><div class="wap-sk-t"></div><div class="wap-sk-s"></div></div>
                        <div class="wap-sk-c"><div class="wap-sk-r1"><div class="wap-sk-b1"></div><div class="wap-sk-b2"></div></div><div class="wap-sk-t"></div><div class="wap-sk-s"></div></div>
                        <div class="wap-sk-c"><div class="wap-sk-r1"><div class="wap-sk-b1"></div><div class="wap-sk-b2"></div></div><div class="wap-sk-t"></div><div class="wap-sk-s"></div></div>
                    </div>
                </div>
            `;
            return;
        }

        calculateDerived();
        const hasFilters = wState.sortBy!=='most_recent' || wState.filterCats.length>0;

        let earningStr = '';
        if(wState.acceptedCount > 0) {
             earningStr = `
                <div class="wap-ear-c">
                    <div class="wap-ear-t">Accepted Work Summary</div>
                    <div class="wap-ear-rw">
                        <div>
                            <div class="wap-ear-l">Accepted Jobs</div>
                            <div class="wap-ear-v gn">${wState.acceptedCount}</div>
                        </div>
                        <div style="text-align:right">
                            <div class="wap-ear-l">Est. Total Earnings</div>
                            <div class="wap-ear-v br">LKR ${wState.totalEstimatedEarnings.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="wap-ear-n">Estimates based on your proposed rates and job durations</div>
                </div>
             `;
        }

        let listHtml = '';
        if(wState.allApplications.length === 0) {
             listHtml = `
                <div class="wap-emp">
                    <i class="ri-briefcase-4-line"></i>
                    <div class="wap-emp-t">No applications yet</div>
                    <div class="wap-emp-s">Browse active jobs and apply to start getting work.</div>
                    <button class="wap-em-btn" id="w-go-br">Browse Jobs</button>
                </div>
             `;
        } else if(wState.filteredApps.length === 0) {
             const ic = wState.activeTab==='pending'?'time-line':wState.activeTab==='accepted'?'checkbox-circle-line':'close-circle-line';
             listHtml = `
                <div class="wap-emp">
                    <i class="ri-${ic}" style="color:#9CA3AF"></i>
                    <div class="wap-emp-t">No ${wState.activeTab} applications</div>
                    <div class="wap-emp-s">You don't have any applications matching the current filters.</div>
                    <button class="wap-em-lk" id="w-clr-fl">View all</button>
                </div>
             `;
        } else {
             listHtml += earningStr;
             wState.filteredApps.forEach(a => {
                  const j = a.job; const ap = a.application;

                  let stBadge = '', cdAcc = '';
                  if(ap.status === 'accepted') { stBadge = `<div class="wap-st-bdg acc"><i class="ri-check-line"></i> Accepted</div>`; cdAcc = 'gr'; }
                  else if(ap.status === 'rejected'){ stBadge = `<div class="wap-st-bdg rej"><i class="ri-close-line"></i> Declined</div>`; cdAcc = 'rd'; }
                  else { stBadge = `<div class="wap-st-bdg pen"><i class="ri-time-line"></i> Under Review</div>`; }

                  let jsPill = '';
                  if(j.jobStatus !== 'active') {
                      if(j.jobStatus === 'assigned') {
                          if(ap.status === 'accepted') jsPill = `<div class="wap-jb-ctx" style="color:#16A34A; background:rgba(22,163,74,0.1)">Job Assigned to You</div>`;
                          else jsPill = `<div class="wap-jb-ctx">Job Assigned to Another</div>`;
                      } else if(j.jobStatus === 'completed') {
                          jsPill = `<div class="wap-jb-ctx">Job Completed</div>`;
                      } else if(j.jobStatus === 'cancelled') {
                          jsPill = `<div class="wap-jb-ctx">Job Cancelled</div>`;
                      } else if(j.jobStatus === 'expired') {
                          jsPill = `<div class="wap-jb-ctx">Job Expired</div>`;
                      }
                  }

                  let r6 = '';
                  if(ap.status==='accepted') {
                      r6 = `<div class="wap-r6-a">✓ Accepted — Est. earnings: LKR ${ap.proposedRate * (j.estimatedDurationHours||0)}</div>`;
                  } else if(ap.status==='rejected'){
                      r6 = `<div class="wap-r6-r">Application was not selected for this job.</div>`;
                  }

                  let urgBtn = '';
                  if(j.urgencyLevel === 'emergency') urgBtn = `<div class="wap-urg-b emer"><i class="ri-flashlight-fill"></i>Emergency</div>`;
                  else if(j.urgencyLevel === 'urgent') urgBtn = `<div class="wap-urg-b urgent"><i class="ri-fire-fill"></i>Urgent</div>`;

                  listHtml += `
                      <div class="wap-card ${cdAcc}" data-jid="${j._id}">
                          <div class="wap-r1">
                              ${stBadge}
                              ${jsPill}
                              <div class="wap-r1-dt">Applied ${processRelativeTime(ap.appliedAt)}</div>
                          </div>
                          
                          <div class="wap-c-tl">${j.jobTitle}</div>
                          
                          <div class="wap-r3">
                              <div class="wap-cat-cp">${j.category}</div>
                              ${urgBtn}
                          </div>
                          
                          <div class="wap-r4">
                              <i class="ri-map-pin-2-fill"></i> ${j.city}, ${j.district} <span class="wap-dot">·</span> 
                              <i class="ri-wallet-3-fill"></i> LKR ${j.budgetMin}–${j.budgetMax}
                          </div>

                          <div class="wap-r5">
                              <i class="ri-price-tag-3-fill"></i> My rate: LKR ${ap.proposedRate}/hr <span class="wap-dot">·</span> 
                              <span><i class="ri-time-line"></i> ${j.estimatedDurationHours}h</span>
                          </div>
                          
                          ${r6}

                          <div class="wap-ft">
                              <div class="wap-cus-r">
                                  <div class="wap-cus-av">${j.customer?.firstName?.[0]||''}${j.customer?.lastName?.[0]||''}</div>
                                  by ${j.customer?.firstName || 'Customer'}
                              </div>
                              <div class="wap-js-c">${j.jobStatus.replace(/^./, str => str.toUpperCase())}</div>
                          </div>

                          ${(ap.status==='pending' && j.jobStatus==='active') ? `
                              <div class="wap-ac-r">
                                  <button class="wap-btn-ou" data-tj="${j._id}">View Job</button>
                              </div>
                          ` : ''}
                      </div>
                  `;
             });
        }

        // Filter Sheet Maps
        const sortOpts = [
             {v:'most_recent', l:'Most recent'}, {v:'oldest', l:'Oldest first'},
             {v:'highest_rate', l:'Highest rate'}, {v:'highest_budget', l:'Highest budget'}
        ];
        let srHtml = sortOpts.map(o => `
            <div class="wfs-rd-r ${wState.sortBy === o.v ? 'active':''}" data-sv="${o.v}">
                <div class="wfs-rd-l">${o.l}</div><div class="wfs-rd-bx"></div>
            </div>
        `).join('');

        let catHtml = categories.map(c => `
             <button class="wfs-cp ${wState.filterCats.includes(c)?'active':''}" data-cv="${c}">${c}</button>
        `).join('');


        appElement.innerHTML = `
            <div class="wap-screen">
                <div class="wap-header">
                    <button class="wap-btn-icon" id="w-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="wap-title">My Applications</div>
                    <button class="wap-flt ${hasFilters?'active':''}" id="w-opn-flt"><i class="ri-list-settings-line"></i></button>
                </div>

                <div class="wap-sum-strip">
                    <div class="wap-pill"><span class="wap-pill-num">${wState.tabCounts.all}</span> Total</div>
                    <div class="wap-pill"><span class="wap-pill-num" style="color:#D97706">${wState.tabCounts.pending}</span> Pending</div>
                    <div class="wap-pill"><span class="wap-pill-num" style="color:#16A34A">${wState.tabCounts.accepted}</span> Accepted</div>
                    <div class="wap-pill"><span class="wap-pill-num" style="color:#DC2626">${wState.tabCounts.rejected}</span> Declined</div>
                </div>

                <div class="wap-tabs">
                    <button class="wap-tab ${wState.activeTab==='all'?'active':''}" data-tab="all">All <span class="wap-tab-bdg">${wState.tabCounts.all}</span></button>
                    <button class="wap-tab ${wState.activeTab==='pending'?'active':''}" data-tab="pending">Under Review <span class="wap-tab-bdg">${wState.tabCounts.pending}</span></button>
                    <button class="wap-tab ${wState.activeTab==='accepted'?'active':''}" data-tab="accepted">Accepted <span class="wap-tab-bdg">${wState.tabCounts.accepted}</span></button>
                    <button class="wap-tab ${wState.activeTab==='rejected'?'active':''}" data-tab="rejected">Declined <span class="wap-tab-bdg">${wState.tabCounts.rejected}</span></button>
                </div>

                <div class="wap-scroll" id="w-pl">
                    ${listHtml}
                </div>

                <!-- Filter Sheet -->
                <div class="wfs-bg ${wState.showFilterSheet?'active':''}" id="w-fs-bg">
                    <div class="wfs-sheet" id="w-fs-in">
                        <div class="wfs-h">
                            <div class="wfs-t">Filter & Sort</div>
                            <button class="wfs-rst" id="w-fs-rst">Reset</button>
                        </div>
                        <div class="wfs-c">
                            <div class="wfs-lb">Sort by</div>
                            ${srHtml}
                            <div class="wfs-lb" style="margin-top:24px">Filter by Job Category</div>
                            <div class="wfs-ch-g">${catHtml}</div>
                        </div>
                        <div class="wfs-f">
                            <button class="wfs-b" id="w-flt-ap">Apply</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async function fetchData() {
        wState.isLoading = true; mcUpdateUI();
        
        // TODO: replace with dedicated GET /api/applications/my when endpoint exists
        if(api.getJobs) {
            try {
                 // Mocking fetch logic overriding seamlessly
                 const res = await api.getJobs();
                 let dt = res.data?.content || [];
                 
                 // Process
                 wState.allApplications = dt.filter(j => j.applications?.some(a=>a.worker===userId || a.worker?._id===userId)).map(j => ({
                     job: j, application: j.applications.find(a=>a.worker===userId || a.worker?._id===userId)
                 }));
            } catch(e) {
                 console.log(e);
                 wState.error = 'Failed to load';
            }
        } else {
             await new Promise(r=>setTimeout(r,800)); // mock network
             const dNow = Date.now();
             wState.allApplications = [
                 {
                     job: { _id:'j1', customer: { firstName:'Amara' }, jobTitle:'Fix kitchen sink leak', category:'Plumbing', city:'Negombo', district:'Gampaha', budgetMin:4000, budgetMax:8000, estimatedDurationHours:2, urgencyLevel:'urgent', jobStatus:'active' },
                     application: { status:'pending', proposedRate: 3500, appliedAt: new Date(dNow - 3600000).toISOString() }
                 },
                 {
                     job: { _id:'j2', customer: { firstName:'Kamal' }, jobTitle:'Paint living room walls', category:'Painting', city:'Colombo 03', district:'Colombo', budgetMin:15000, budgetMax:20000, estimatedDurationHours:8, urgencyLevel:'standard', jobStatus:'assigned' },
                     application: { status:'accepted', proposedRate: 2000, appliedAt: new Date(dNow - 86400000).toISOString() }
                 },
                 {
                     job: { _id:'j3', customer: { firstName:'Nimal' }, jobTitle:'Repair wooden dining chair', category:'Carpentry', city:'Wattala', district:'Gampaha', budgetMin:2000, budgetMax:4000, estimatedDurationHours:2, urgencyLevel:'standard', jobStatus:'completed' },
                     application: { status:'rejected', proposedRate: 1500, appliedAt: new Date(dNow - 172800000).toISOString() }
                 }
             ];
        }

        wState.isLoading = false; mcUpdateUI();
    }

    appElement.addEventListener('click', e => {
        const tg = e.target;
        
        if(tg.closest('#w-bck')) return navigate(-1);
        if(tg.closest('#w-go-br')) return navigate('/worker/jobs');
        
        const tb = tg.closest('.wap-tab');
        if(tb) { wState.activeTab = tb.dataset.tab; return mcUpdateUI(); }

        if(tg.closest('#w-clr-fl')) {
             wState.activeTab = 'all'; wState.filterCats = []; wState.sortBy='most_recent'; return mcUpdateUI();
        }

        const cd = tg.closest('.wap-card') || tg.closest('.wap-btn-ou');
        if(cd) {
            const jid = cd.dataset.tj || cd.closest('.wap-card')?.dataset.jid;
            if(jid) return navigate(`/worker/jobs/${jid}`);
        }

        // Filtering
        if(tg.closest('#w-opn-flt')) { wState.showFilterSheet = true; return mcUpdateUI(); }
        if(tg.id === 'w-fs-bg') { wState.showFilterSheet = false; return mcUpdateUI(); }
        
        const sr = tg.closest('.wfs-rd-r');
        if(sr) { wState.sortBy = sr.dataset.sv; return mcUpdateUI(); }

        const cp = tg.closest('.wfs-cp');
        if(cp){
             const v = cp.dataset.cv;
             if(wState.filterCats.includes(v)) wState.filterCats = wState.filterCats.filter(c=>c!==v);
             else wState.filterCats.push(v);
             return mcUpdateUI();
        }

        if(tg.closest('#w-fs-rst')) {
             wState.sortBy = 'most_recent'; wState.filterCats = []; return mcUpdateUI();
        }

        if(tg.closest('#w-flt-ap')) {
             wState.showFilterSheet = false; return mcUpdateUI();
        }
    });

    fetchData();
}
