// ============================== //
// SkillConnect Mobile           //
// Worker Browse Jobs            //
// ============================== //

async function renderBrowseJobs(appElement, stateRoute) {
    // Read Context
    const dist = localStorage.getItem('district') || '';
    const city = localStorage.getItem('city') || '';
    let wSkills = [];
    try {
        const p = localStorage.getItem('skills');
        if(p) wSkills = JSON.parse(p).map(s=>s.trim().toLowerCase());
    } catch(e){}
    const userId = localStorage.getItem('userId') || 'worker_me'; // stub 

    let bjState = {
        jobs: [],
        isLoading: true,
        error: null,
        searchQueryRaw: "",
        searchQuery: "",
        activeCategory: "all",
        activeDistrict: dist, // default pre-selection
        sortBy: "most_urgent",
        budgetMin: "",
        budgetMax: "",
        maxDuration: null,
        selectedSkills: [],
        showFilterSheet: false,
        appliedJobIds: new Set(),
        greetVisible: true
    };

    let debounceTimer;

    const CATS = ["All","Plumbing","Electrical","Carpentry","Painting","Masonry","Welding","Roofing","Landscaping","Cleaning","Moving","Other"];
    
    // Sort logic mapping
    const SORT_CONF = {
        most_urgent: "Most Urgent",
        highest_budget: "Highest Budget",
        newest: "Newest First",
        expiring_soon: "Expiring Soon",
        fewest_applicants: "Fewest Applicants",
        nearest: "Nearest to Me"
    };

    const isSkillMatch = (jb) => {
        if(wSkills.length === 0) return false;
        const c = (jb.category||'').toLowerCase();
        if(wSkills.includes(c)) return true;
        const tDesc = ((jb.jobTitle||'') + ' ' + (jb.jobDescription||'')).toLowerCase();
        return wSkills.some(s => tDesc.includes(s));
    };

    function processRelativeTime(dtStr) {
        if(!dtStr) return '';
        const ms = Date.now() - new Date(dtStr).getTime();
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        if(days === 0) {
            const hrs = Math.floor(ms / (1000 * 60 * 60));
            if(hrs===0) return 'Just now';
            return `${hrs}h ago`;
        }
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days}d ago`;
        return new Date(dtStr).toLocaleDateString();
    }

    function getUrgencyConf(urg) {
        const u = {
            emergency: { lbl: '🚨 Emergency', c: 'emer' },
            urgent: { lbl: '⚡ Urgent', c: 'urg' },
            standard: { lbl: '', c: '' },
            scheduled: { lbl: '', c: ''}
        };
        return u[urg] || u.standard;
    }

    function mcUpdateUI() {
        // 1. Client filtering
        let fJobs = bjState.jobs.filter(j => j.jobStatus === 'active');
        
        // Search
        if(bjState.searchQuery) {
            const sq = bjState.searchQuery.toLowerCase();
            fJobs = fJobs.filter(j => 
                (j.jobTitle||'').toLowerCase().includes(sq) ||
                (j.jobDescription||'').toLowerCase().includes(sq) ||
                (j.category||'').toLowerCase().includes(sq) ||
                (j.city||'').toLowerCase().includes(sq)
            );
        }

        // Budget
        const bMin = parseInt(bjState.budgetMin) || 0;
        const bMax = parseInt(bjState.budgetMax) || Infinity;
        if(bMin > 0 || bMax !== Infinity) {
            fJobs = fJobs.filter(j => (j.budgetMax >= bMin) && (j.budgetMin <= bMax));
        }

        // Duration
        if(bjState.maxDuration !== null) {
            fJobs = fJobs.filter(j => j.estimatedDurationHours <= bjState.maxDuration);
        }

        // Skill Filters
        if(bjState.selectedSkills.length > 0) {
            fJobs = fJobs.filter(j => {
                const cat = (j.category||'').toLowerCase();
                return bjState.selectedSkills.some(s => cat === s || cat.includes(s));
            });
        }

        // 2. Client sorting
        const urgMap = { emergency:0, urgent:1, standard:2, scheduled:3 };
        fJobs.sort((a,b) => {
            if(bjState.sortBy === 'most_urgent') {
                const uA = urgMap[a.urgencyLevel] ?? 9;
                const uB = urgMap[b.urgencyLevel] ?? 9;
                if(uA !== uB) return uA - uB;
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if(bjState.sortBy === 'highest_budget') return (b.budgetMax || 0) - (a.budgetMax || 0);
            if(bjState.sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if(bjState.sortBy === 'fewest_applicants') return (a.applications?.length||0) - (b.applications?.length||0);
            if(bjState.sortBy === 'expiring_soon') {
                if(!a.expiryDate && !b.expiryDate) return 0;
                if(!a.expiryDate) return 1;
                if(!b.expiryDate) return -1;
                return new Date(a.expiryDate) - new Date(b.expiryDate);
            }
            if(bjState.sortBy === 'nearest') {
                const nA = a.district === dist ? 1 : 0;
                const nB = b.district === dist ? 1 : 0;
                if(nA !== nB) return nB - nA;
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return 0;
        });

        // 3. Spotlight
        let spotlightHtml = '';
        if(wSkills.length > 0 && !bjState.searchQuery && bjState.activeCategory === 'all' && fJobs.length > 0) {
            const sJobs = fJobs.filter(isSkillMatch).slice(0, 5);
            if(sJobs.length > 0) {
                spotlightHtml = `
                    <div class="bj-spot-wrap">
                        <div class="bj-spot-t">Jobs matching your skills</div>
                        <div class="bj-spot-row">
                            ${sJobs.map(j => {
                                const u = getUrgencyConf(j.urgencyLevel);
                                return `
                                    <div class="bj-scrd" data-jid="${j._id}">
                                        ${u.c ? `<div class="bj-urg-bar ${u.c}"></div>` : ''}
                                        <div class="bj-scrd-t">${j.jobTitle}</div>
                                        <div class="bj-scrd-m">${j.category} · LKR ${j.budgetMin}-${j.budgetMax}</div>
                                        <div class="bj-scrd-l"><i class="ri-map-pin-line"></i> ${j.city}${j.district===dist?' <span style="color:#16A34A;font-weight:600">· Near you</span>':''}</div>
                                        <button class="bj-scrd-bt">Apply</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        }

        // 4. List mapping
        let listHtml = '';
        if(bjState.isLoading) {
            listHtml = Array(4).fill(`
                <div class="bj-sk">
                    <div class="bj-sk-b"></div>
                    <div class="bj-sk-r1"><div class="bj-sk-p1"></div><div class="bj-sk-p2"></div></div>
                    <div class="bj-sk-r2"><div class="bj-sk-p3"></div><div class="bj-sk-p4"></div></div>
                    <div class="bj-sk-r3"></div>
                </div>
            `).join('');
        } else if(bjState.jobs.length === 0) {
            listHtml = `
                <div class="bj-emp">
                    <i class="ri-briefcase-line bj-em-ic"></i>
                    <div class="bj-em-t">No active jobs right now</div>
                    <div class="bj-em-s">There are no active job postings at the moment. Pull down to refresh or check back later.</div>
                    <button class="bj-em-btn" id="b-e-ref">Refresh</button>
                </div>
            `;
        } else if(fJobs.length === 0) {
            if(bjState.searchQuery) {
                listHtml = `
                    <div class="bj-emp">
                        <i class="ri-search-line bj-em-ic"></i>
                        <div class="bj-em-t">No results for "${bjState.searchQuery}"</div>
                        <div class="bj-em-s">Try different keywords or browse by category.</div>
                        <button class="bj-em-btn" id="b-e-clr-s">Clear search</button>
                    </div>
                `;
            } else if(bjState.activeCategory !== 'all') {
                listHtml = `
                    <div class="bj-emp">
                        <i class="ri-price-tag-3-line bj-em-ic e-tl"></i>
                        <div class="bj-em-t">No ${bjState.activeCategory} jobs</div>
                        <div class="bj-em-s">No active ${bjState.activeCategory} jobs found. Try browsing all categories.</div>
                        <button class="bj-em-btn" id="b-e-clr-c">Browse all</button>
                    </div>
                `;
            } else if(bjState.activeDistrict) {
                listHtml = `
                    <div class="bj-emp">
                        <i class="ri-map-pin-line bj-em-ic e-tl"></i>
                        <div class="bj-em-t">No jobs in ${bjState.activeDistrict}</div>
                        <div class="bj-em-s">No active jobs found in ${bjState.activeDistrict}. Try browsing all districts.</div>
                        <button class="bj-em-btn" id="b-e-clr-d">Show all districts</button>
                    </div>
                `;
            } else {
                 listHtml = `
                    <div class="bj-emp">
                        <i class="ri-tools-line bj-em-ic e-tl"></i>
                        <div class="bj-em-t">No jobs match your selected skills</div>
                        <div class="bj-em-s">Try selecting different skills or browse all jobs.</div>
                        <button class="bj-em-btn" id="b-e-clr-f">Clear skill filter</button>
                    </div>
                `;               
            }
        } else {
            listHtml = fJobs.map(j => {
                const u = getUrgencyConf(j.urgencyLevel);
                const sm = isSkillMatch(j);
                
                // applications processing
                const aL = j.applications?.length || 0;
                let cStr = `<div class="bj-c-cmp gr">Be the first to apply!</div>`;
                if(aL > 0) {
                    if(aL <= 2) cStr = `<div class="bj-c-cmp tl">${aL} applied</div>`;
                    else if(aL <= 5) cStr = `<div class="bj-c-cmp am">${aL} applied</div>`;
                    else cStr = `<div class="bj-c-cmp rd">${aL} applied — high competition</div>`;
                }

                // bleeding banners
                let appliedBan = '';
                if(bjState.appliedJobIds.has(j._id)) {
                    appliedBan = '<div class="bj-c-ab">✓ You applied to this job</div>';
                }
                
                let expBan = '';
                if(!appliedBan && j.expiryDate) {
                    const daysEx = (new Date(j.expiryDate).getTime() - Date.now()) / (1000*60*60*24);
                    if(daysEx > 0 && daysEx <= 2) {
                        const dL = Math.floor(daysEx);
                        expBan = `<div class="bj-c-xb">⚠ ${dL===0 ? 'Expires today' : `Expires in ${dL} day(s)`}</div>`;
                    }
                }

                return `
                    <div class="bj-card ${sm?'match':''}" data-jid="${j._id}">
                        ${u.c ? `<div class="bj-urg-bar ${u.c}"></div>` : ''}
                        <div class="bj-c-r1">
                            <div class="bj-c-t">${j.jobTitle}</div>
                            ${u.lbl ? `<div class="bj-c-ub ${u.c}">${u.lbl}</div>` : ''}
                        </div>
                        <div class="bj-c-r2">
                            <div class="bj-c-cat">${j.category}</div>
                            ${sm ? '<div class="bj-c-sm">✓ Matches your skills</div>' : ''}
                        </div>
                        <div class="bj-c-r3">
                            <i class="ri-map-pin-line"></i> ${j.city}, ${j.district}
                            ${j.district === dist ? '<div class="bj-c-nr">· Near you</div>' : ''}
                        </div>
                        <div class="bj-c-r4">
                            <div class="bj-c-bdg"><i class="ri-wallet-3-line"></i> LKR ${j.budgetMin}-${j.budgetMax}</div>
                            <div class="bj-c-sep">·</div>
                            <div class="bj-c-dur"><i class="ri-time-line"></i> ${j.estimatedDurationHours}h</div>
                        </div>
                        <div class="bj-c-r5">
                            <i class="ri-calendar-event-line"></i> Start: ${new Date(j.preferredStartDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                            <div class="bj-c-sep">·</div>
                            <i class="ri-team-line"></i> ${cStr}
                        </div>
                        <div class="bj-c-ft">
                            <div class="bj-c-cus">
                                <div class="bj-c-cav">${(j.customer?.firstName?.[0]||'')}${(j.customer?.lastName?.[0]||'')}</div>
                                by ${j.customer?.firstName} ${j.customer?.lastName}
                            </div>
                            <div class="bj-c-tm">${processRelativeTime(j.createdAt)}</div>
                        </div>
                        ${appliedBan}
                        ${expBan}
                    </div>
                `;
            }).join('');
        }

        const hasFilter = (bjState.activeDistrict && bjState.activeDistrict !== dist) || bjState.budgetMin || bjState.budgetMax || bjState.maxDuration !== null || bjState.selectedSkills.length > 0 || bjState.sortBy !== 'most_urgent';

        appElement.innerHTML = `
            <div class="bj-screen">
                <div class="bj-header">
                    <button class="bj-btn-icon" id="b-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="bj-title">Find Jobs</div>
                    <button class="bj-flt-btn ${hasFilter?'active':''}" id="b-h-flt">
                        <i class="ri-equalizer-line"></i>
                        <div class="bj-flt-dot"></div>
                    </button>
                </div>

                <div class="bj-greet ${bjState.greetVisible ? '' : 'hide'}" id="b-grt">
                    <div class="bj-gr-l">
                        <div class="bj-gr-t">👋 Jobs near ${city||dist||'you'}</div>
                        <div class="bj-gr-s">${bjState.jobs.length} active jobs found</div>
                    </div>
                    <button class="bj-sk-btn" id="b-sk">My Skills</button>
                </div>

                <div class="bj-search-wrap">
                    <div class="bj-sb">
                        <i class="ri-search-line"></i>
                        <input type="text" id="b-ipt" placeholder="Search by job title or keyword..." value="${bjState.searchQueryRaw}">
                        <button class="bj-clr" id="b-clr"><i class="ri-close-circle-fill"></i></button>
                    </div>
                </div>

                <div class="bj-tabs">
                    ${CATS.map(c => {
                        const cid = c.toLowerCase();
                        return `<button class="bj-tab ${bjState.activeCategory===cid?'active':''}" data-cat="${cid}">${c}</button>`;
                    }).join('')}
                </div>

                <div class="bj-sum">
                    <div class="bj-sum-c">${fJobs.length} jobs available</div>
                    <div class="bj-sum-r">
                        ${bjState.activeDistrict ? `<button class="bj-chip dist" id="b-cp-d">${bjState.activeDistrict} <i class="ri-close-line"></i></button>` : ''}
                        <button class="bj-chip" id="b-cp-s">${SORT_CONF[bjState.sortBy]} <i class="ri-arrow-down-line"></i></button>
                    </div>
                </div>

                <div class="bj-scroll" id="b-scr">
                    <div class="bj-ptr" id="b-ptr"><i class="ri-refresh-line bj-ptr-ic"></i></div>
                    ${spotlightHtml}
                    <div class="bj-lt">
                        ${listHtml}
                    </div>
                </div>

                <!-- Bottom Sheet -->
                <div class="bj-s-bg ${bjState.showFilterSheet?'active':''}" id="b-f-bg">
                    <div class="bj-sh" id="b-f-sh" onclick="event.stopPropagation()">
                        <div class="bj-sh-h">
                            <div class="bj-sh-t">Filter & Sort Jobs</div>
                            <button class="bj-sh-rs" id="b-f-res">Reset</button>
                        </div>
                        <div class="bj-sh-c">
                            <!-- District -->
                            <div class="bj-sh-lbl">District</div>
                            <div class="bj-cg">
                                <button class="bj-cp ${bjState.activeDistrict===''?'active':''}" data-fp="dist" data-fv="">All Districts</button>
                                <button class="bj-cp ${bjState.activeDistrict==='Colombo'?'active':''}" data-fp="dist" data-fv="Colombo">Colombo</button>
                                <button class="bj-cp ${bjState.activeDistrict==='Gampaha'?'active':''}" data-fp="dist" data-fv="Gampaha">Gampaha</button>
                                <button class="bj-cp ${bjState.activeDistrict==='Kandy'?'active':''}" data-fp="dist" data-fv="Kandy">Kandy</button>
                            </div>

                            <!-- Sort -->
                            <div class="bj-sh-lbl">Sort by</div>
                            ${Object.keys(SORT_CONF).map(k => `
                                <div class="bj-sh-rd ${bjState.sortBy===k?'active':''}" data-srt="${k}">
                                    <div class="bj-rad"><div class="bj-rad-in"></div></div>
                                    <div class="bj-rd-l">${SORT_CONF[k]}</div>
                                </div>
                            `).join('')}

                            <!-- Budget -->
                            <div class="bj-sh-lbl">Budget Range (LKR)</div>
                            <div class="bj-b-g">
                                <input type="number" inputmode="numeric" class="bj-b-in" id="b-bmn" placeholder="0" value="${bjState.budgetMin}">
                                <input type="number" inputmode="numeric" class="bj-b-in" id="b-bmx" placeholder="Any" value="${bjState.budgetMax}">
                            </div>

                            <!-- Duration -->
                            <div class="bj-sh-lbl">Max Duration (hours)</div>
                            <div class="bj-cg">
                                ${[null, 1,2,3,4,6,8].map(d => `<button class="bj-cp ${bjState.maxDuration===d?'active':''}" data-fp="dur" data-fv="${d}">${d?d+'h':'Any'}</button>`).join('')}
                            </div>

                            <!-- Skills -->
                            <div class="bj-sh-lbl">Filter by your skills</div>
                            ${wSkills.length > 0 ? `
                                <div class="bj-cg">
                                    ${wSkills.map(s => `<button class="bj-cp ${bjState.selectedSkills.includes(s)?'active':''}" data-fp="skl" data-fv="${s}">${s}</button>`).join('')}
                                </div>
                            ` : `
                                <div class="bj-mute-t">
                                    Add skills to your profile to use this filter
                                    <a href="#" class="bj-lnk" id="b-f-ep">Edit Profile</a>
                                </div>
                            `}
                        </div>
                        <div class="bj-sh-cta">
                            <button class="bj-btn" id="b-f-aply">Show Jobs</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Restore Input Focus natively simulating state hold
        const focusInput = document.getElementById('b-ipt');
        if(focusInput && document.activeElement && document.activeElement.id === 'b-ipt') {
            const v = focusInput.value; focusInput.value=''; focusInput.value=v; focusInput.focus();
        }
    }

    async function loadData() {
        bjState.isLoading = true; mcUpdateUI();
        if(api.getJobs) {
             const res = await api.getJobs({
                 category: bjState.activeCategory !== 'all' ? bjState.activeCategory : undefined,
                 district: bjState.activeDistrict || undefined,
                 status: 'active'
             });
             if(res?.data?.content) {
                 bjState.jobs = res.data.content;
             }
        } else {
             // Mock limit fallbacks imitating API behavior constraints securely
             const mj = [
                { _id: 'j1', customer: {firstName:'Amara', lastName:'Fernando', district:'Colombo', city:'Colombo'}, jobTitle:'Fix kitchen sink leak', jobDescription:'The sink drips heavily underneath the pipe. Need a plumber asap.', category:'Plumbing', locationAddress:'42 Main', city:'Negombo', district:'Gampaha', urgencyLevel:'urgent', budgetMin:5000, budgetMax:15000, estimatedDurationHours:3, preferredStartDate:new Date().toISOString(), jobStatus:'active', applications:[], createdAt:new Date().toISOString() },
                { _id: 'j2', customer: {firstName:'K', lastName:'L', district:'Kandy'}, jobTitle:'Whole house painting', jobDescription:'Repaint interior exactly white', category:'Painting', city:'Kandy', district:'Kandy', urgencyLevel:'scheduled', budgetMin:40000, budgetMax:80000, estimatedDurationHours:8, preferredStartDate:new Date(Date.now()+86400000*3).toISOString(), jobStatus:'active', applications:[{worker:userId}], expiryDate:new Date(Date.now()+86400000*5).toISOString(), createdAt:new Date(Date.now()-86400000*2).toISOString() },
                { _id: 'j3', customer: {firstName:'J', lastName:'Doe'}, jobTitle:'Short circuit in breaker', jobDescription:'Power trippling out frequently', category:'Electrical', city:'Colombo', district:'Colombo', urgencyLevel:'emergency', budgetMin:10000, budgetMax:20000, estimatedDurationHours:1, preferredStartDate:new Date().toISOString(), jobStatus:'active', applications:[{},{},{},{},{},{},{}], createdAt:new Date().toISOString(), expiryDate:new Date(Date.now()+86400000).toISOString() }
             ];
             bjState.jobs = mj.filter(j => 
                 (bjState.activeCategory==='all' || j.category.toLowerCase()===bjState.activeCategory) &&
                 (!bjState.activeDistrict || j.district===bjState.activeDistrict)
             );
        }

        // Generate Applied set locally based on array matches recursively holding User parameters
        bjState.appliedJobIds = new Set(
            bjState.jobs.flatMap(j => (j.applications||[]).map(a => ({a, jid:j._id})))
                        .filter(x => x.a.worker === userId || x.a.worker?._id === userId)
                        .map(x => x.jid)
        );

        bjState.isLoading = false; mcUpdateUI();
    }

    appElement.addEventListener('click', e => {
        const tg = e.target;
        
        if(tg.closest('#b-bck')) return navigate(-1);
        
        // Navigation cards
        const cd = tg.closest('.bj-card') || tg.closest('.bj-scrd');
        if(cd && !tg.closest('#b-f-bg')) { // ensure we aren't intercepting the sheet
            return navigate(`/worker/jobs/${cd.dataset.jid}`);
        }

        // Tabbing Re-fetches
        const tb = tg.closest('.bj-tab');
        if(tb) {
            bjState.activeCategory = tb.dataset.cat;
            return loadData(); // Requires fetch!
        }

        // Top Triggers
        if(tg.closest('#b-h-flt') || tg.closest('#b-cp-s') || tg.closest('#b-sk')) {
            bjState.showFilterSheet = true;
            return mcUpdateUI();
        }

        // Direct clear mechanisms (Chips / Empties)
        if(tg.closest('#b-cp-d') || tg.closest('#b-e-clr-d')) {
            bjState.activeDistrict = ''; return loadData(); 
        }
        if(tg.closest('#b-e-clr-c')) {
            bjState.activeCategory = 'all'; return loadData();
        }
        if(tg.closest('#b-e-ref')) return loadData();
        if(tg.closest('#b-e-clr-s')) {
            bjState.searchQueryRaw = ''; bjState.searchQuery = '';
            const ipt = document.getElementById('b-ipt'); if(ipt) ipt.value='';
            return mcUpdateUI();
        }
        if(tg.closest('#b-e-clr-f')) { bjState.selectedSkills=[]; return mcUpdateUI(); }
        if(tg.closest('#b-clr')) {
            bjState.searchQueryRaw = ''; bjState.searchQuery = '';
            document.getElementById('b-ipt').value=''; return mcUpdateUI();
        }

        // Filter Sheet Mechanics
        if(tg.closest('#b-f-ep')) return navigate('/profile/edit');

        if(tg.id === 'b-f-bg' || tg.closest('.bj-sh-cls') || tg.closest('#b-f-aply')) {
            // Apply bounds natively caching string limits checking inputs manually
            const bmin = document.getElementById('b-bmn');
            const bmx = document.getElementById('b-bmx');
            if(bmin) bjState.budgetMin = bmin.value;
            if(bmx) bjState.budgetMax = bmx.value;
            
            bjState.showFilterSheet = false;
            return mcUpdateUI();
        }

        if(tg.closest('#b-f-res')) {
            bjState.sortBy='most_urgent'; bjState.budgetMin=''; bjState.budgetMax=''; bjState.maxDuration=null; bjState.selectedSkills=[]; bjState.activeDistrict='';
            bjState.showFilterSheet = false; 
            return loadData(); // Reset requires full API reload matching `''` parameters smoothly
        }

        // Sheet Toggles
        const rd = tg.closest('.bj-sh-rd');
        if(rd) { bjState.sortBy = rd.dataset.srt; return mcUpdateUI(); }

        const cp = tg.closest('.bj-cp');
        if(cp) {
            const p = cp.dataset.fp;
            const v = cp.dataset.fv;
            if(p==='dist') {
                bjState.activeDistrict = v; bjState.showFilterSheet = false; return loadData(); // dist requires refetch
            }
            if(p==='dur') { bjState.maxDuration = v==='null'?null: parseInt(v); return mcUpdateUI(); }
            if(p==='skl') {
                if(bjState.selectedSkills.includes(v)) bjState.selectedSkills = bjState.selectedSkills.filter(s=>s!==v);
                else bjState.selectedSkills.push(v);
                return mcUpdateUI();
            }
        }
    });

    appElement.addEventListener('input', e => {
        if(e.target.id === 'b-ipt') {
            bjState.searchQueryRaw = e.target.value;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                bjState.searchQuery = bjState.searchQueryRaw;
                mcUpdateUI();
            }, 300);
        }
    });

    // Sub-Scroll Tracking (hide greeting organically)
    appElement.addEventListener('scroll', e => {
        if(e.target.id === 'b-scr') {
            const st = e.target.scrollTop;
            if(st > 60 && bjState.greetVisible) { bjState.greetVisible=false; mcUpdateUI();}
        }
    }, true);

    // Pull to refresh mapping
    let startY = 0; let refreshing = false;
    appElement.addEventListener('touchstart', e => {
        const scr = document.getElementById('b-scr');
        if(scr && scr.scrollTop === 0) startY = e.touches[0].clientY;
    }, {passive:true});

    appElement.addEventListener('touchmove', e => {
        if(startY > 0 && !refreshing) {
            if(e.touches[0].clientY - startY > 80) {
                const ptr = document.getElementById('b-ptr');
                if(ptr) ptr.classList.add('refreshing');
            }
        }
    }, {passive:true});

    appElement.addEventListener('touchend', async e => {
        if(startY > 0 && !refreshing) {
            if(e.changedTouches[0].clientY - startY > 80) {
                refreshing = true;
                await loadData();
                const ptr = document.getElementById('b-ptr');
                if(ptr) ptr.classList.remove('refreshing');
                refreshing = false;
            }
        }
        startY = 0;
    }, {passive:true});

    // Boot
    loadData();
}
