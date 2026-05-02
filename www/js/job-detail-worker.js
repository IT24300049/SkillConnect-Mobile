// ============================== //
// SkillConnect Mobile           //
// Worker Job Detail (Apply)     //
// ============================== //

async function renderJobDetailWorker(appElement, stateRoute) {
    const p = window.location.hash.split('/');
    const jobId = p[p.length - 1];

    const userId = localStorage.getItem('userId') || 'worker_me'; // stub
    const workerRate = parseFloat(localStorage.getItem('hourlyRate') || '0');
    let wSkills = [];
    try {
        const d = localStorage.getItem('skills');
        if(d) wSkills = JSON.parse(d).map(s=>s.trim().toLowerCase());
    } catch(e){}
    const workerDistrict = localStorage.getItem('district') || '';

    let st = {
        job: null,
        myApplication: null,
        hasApplied: false,
        isSaved: localStorage.getItem(`saved_job_${jobId}`) === 'true',
        isLoading: true,
        error: null,
        expandedDescription: false,
        showApplicationSheet: false,
        expandedCoverLetter: false,
        showTips: false,
        form: { proposedRate: workerRate ? String(workerRate) : '', coverLetter: '' },
        isSubmitting: false,
        toast: null,
        successVisible: false
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
        if(days===1) return 'Yesterday';
        if(days<30) return `${days}d ago`;
        return new Date(dtStr).toLocaleDateString();
    }

    function mcUpdateUI() {
        if(st.isLoading) {
            appElement.innerHTML = `
                <div class="jdw-screen">
                    <div class="jdw-header">
                        <button class="jdw-btn-icon" id="j-bck"><i class="ri-arrow-left-line"></i></button>
                        <div class="jdw-title">Job Detail</div>
                        <div class="jdw-hr"><button class="jdw-btn-icon"><i class="ri-share-line"></i></button><button class="jdw-btn-icon"><i class="ri-bookmark-line"></i></button></div>
                    </div>
                    <div class="jdw-sk-ub"></div>
                    <div class="jdw-sk-hr"><div class="jdw-sk-t"></div><div class="jdw-sk-s"></div></div>
                    <div class="jdw-sk-cb"><div class="jdw-sk-c1" style="width:160px"></div></div>
                    <div class="jdw-sk-cb"><div class="jdw-sk-c1" style="width:140px"></div></div>
                    <div class="jdw-sk-cb"><div class="jdw-sk-c1" style="width:120px"></div></div>
                    <div class="jdw-sk-cb"><div class="jdw-sk-c1" style="width:100px"></div></div>
                    <div class="jdw-cta"><div class="jdw-cta-st">Loading...</div><button class="jdw-cta-bz" disabled>Apply for this Job</button></div>
                </div>
            `;
            return;
        }

        if(st.error) {
            appElement.innerHTML = `
                <div class="jdw-screen">
                    <div class="jdw-header"><button class="jdw-btn-icon" id="j-bck"><i class="ri-arrow-left-line"></i></button><div class="jdw-title">Error</div><div style="width:44px"></div></div>
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 24px; text-align:center;">
                        <i class="ri-alert-line" style="font-size:48px; color:#F59E0B; margin-bottom:16px;"></i>
                        <h2 style="font-size:18px; color:#111827; margin:0 0 8px;">Couldn't load job</h2>
                        <p style="font-size:14px; color:#6B7280; margin:0 0 24px;">${st.error}</p>
                        <button id="j-ert" style="height:52px; width:100%; max-width:250px; background:#0D9488; color:#FFF; font-weight:600; border-radius:12px; border:none;">Retry</button>
                    </div>
                </div>
            `;
            return;
        }

        const j = st.job;
        
        // Calculations
        const isSkillMatched = wSkills.some(s => (j.category||'').toLowerCase().includes(s));
        const sugRate = Math.round(((j.budgetMin + j.budgetMax)/2) / j.estimatedDurationHours);
        
        const estEar = (parseFloat(st.form.proposedRate) || 0) * j.estimatedDurationHours;
        const inBud = estEar <= j.budgetMax;

        const rateLen = Number(st.form.proposedRate) > 0;
        const cvLen = st.form.coverLetter.trim().length;
        const isValid = rateLen && cvLen >= 30;

        let missingStr = '';
        if(!rateLen) missingStr = 'Enter your proposed rate';
        else if(cvLen < 30) missingStr = 'Cover letter must be at least 30 characters';

        // Urgency Banners
        let urgBx = '', urgCp = '';
        if(j.urgencyLevel === 'emergency') {
            urgBx = `<div class="jdw-ub-mr"><i class="ri-flashlight-fill jdw-ub-ic"></i><div class="jdw-ub-t">Emergency Job — Immediate response needed</div></div>`;
            urgCp = `<div class="jdw-r5-bdg emer"><i class="ri-flashlight-fill"></i> Emergency</div>`;
        } else if(j.urgencyLevel === 'urgent') {
            urgBx = `<div class="jdw-ub-urt"><i class="ri-fire-fill jdw-ub-ic"></i><div class="jdw-ub-t">Urgent — Customer needs help soon</div></div>`;
            urgCp = `<div class="jdw-r5-bdg urg"><i class="ri-fire-fill"></i> Urgent</div>`;
        } else if(j.urgencyLevel === 'standard') {
            urgCp = `<div class="jdw-r5-bdg std"><i class="ri-time-line"></i> Standard</div>`;
        } else {
            urgCp = `<div class="jdw-r5-bdg sch"><i class="ri-calendar-event-line"></i> Scheduled</div>`;
        }

        // Stats
        let cSt = `<span class="jdw-c-gn">0 applied</span>`;
        const aL = j.applications?.length || 0;
        if(aL > 0) {
            if(aL<=3) cSt = `<span class="jdw-c-am">${aL} applied</span>`;
            else cSt = `<span class="jdw-c-rd">${aL} applied</span>`;
        }

        // Expiry 
        let xpWarn = '', xpHero = '';
        if(j.expiryDate && j.jobStatus === 'active') {
             const dys = (new Date(j.expiryDate).getTime() - Date.now()) / (1000*60*60*24);
             if(dys > 0 && dys <= 1) {
                 xpHero = `<div style="font-size:13px; color:#D97706; background:rgba(245,158,11,0.1); border-radius:8px; padding:10px 16px; margin-top:10px;">⚠ This job expires ${Math.floor(dys)===0?'today':'tomorrow'}! Apply now before it's too late.</div>`;
             }
             if(dys > 0 && dys <= 3) {
                 xpWarn = `<div class="jdw-exp-w">⚠ Expires in ${Math.ceil(dys)} days</div>`;
             }
        }

        // Competition Block
        let cpBk = '';
        if(aL === 0) {
            cpBk = `<div class="jdw-cm-b gr"><div class="jdw-cm-r1 gr"><i class="ri-rocket-2-line"></i> Be the first to apply!</div><div class="jdw-cm-sub">No applications yet — apply now for the best chance.</div></div>`;
        } else if(aL <= 3) {
            cpBk = `<div class="jdw-cm-b am"><div class="jdw-cm-r1 am"><i class="ri-group-line"></i> ${aL} worker(s) have applied</div><div class="jdw-cm-sub">Low competition — good time to apply.</div></div>`;
        } else if(aL <= 7) {
            cpBk = `<div class="jdw-cm-b am"><div class="jdw-cm-r1 am"><i class="ri-group-fill"></i> ${aL} workers have applied</div><div class="jdw-cm-sub">Moderate competition — stand out with a strong cover letter.</div></div>`;
        } else {
            cpBk = `<div class="jdw-cm-b rd"><div class="jdw-cm-r1 rd"><i class="ri-group-fill"></i> ${aL} workers have applied</div><div class="jdw-cm-sub">High competition — a detailed proposal may improve your chances.</div></div>`;
        }

        let avHtml = '';
        if(aL > 0) {
             const m = Math.min(aL, 4);
             avHtml += `<div class="jdw-av-rw">`;
             for(let i=0; i<m; i++){ avHtml += `<div class="jdw-av-c"></div>`; }
             if(aL > 4) avHtml += `<div class="jdw-av-tx">+ ${aL-4}</div>`;
             avHtml += `</div>`;
        }

        // Customer
        const d = (str) => new Date(str).toLocaleDateString('en-US',{month:'long',year:'numeric'});

        appElement.innerHTML = `
            <div class="jdw-screen">
                <div class="jdw-header">
                    <button class="jdw-btn-icon" id="j-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="jdw-title">Job Detail</div>
                    <div class="jdw-hr">
                        <button class="jdw-btn-icon" id="j-shr"><i class="ri-share-line"></i></button>
                        <button class="jdw-btn-icon" id="j-bmk"><i class="ri-bookmark-${st.isSaved?'fill':'line'}" style="color:${st.isSaved?'#0D9488':''}"></i></button>
                    </div>
                </div>
                
                ${urgBx}

                <div class="jdw-scroll">
                    <!-- Hero -->
                    <div class="jdw-hero">
                        <div class="jdw-h-r1">
                            <div class="jdw-cat-cp">${j.category}</div>
                            ${isSkillMatched ? `<div class="jdw-sk-cp">✓ Matches your skills</div>` : ''}
                            ${j.district===workerDistrict ? `<div class="jdw-nr-cp">📍 Near you</div>` : ''}
                        </div>
                        <div class="jdw-h-t">${j.jobTitle}</div>
                        <div class="jdw-h-r3">
                            <i class="ri-eye-line"></i> ${j.viewsCount||0} views <span class="jdw-r3-dot">·</span>
                            <i class="ri-group-line"></i> ${cSt} <span class="jdw-r3-dot">·</span>
                            <i class="ri-time-line"></i> Posted ${processRelativeTime(j.createdAt)}
                        </div>
                        
                        <div class="jdw-b-blk">
                            <i class="ri-wallet-3-fill jdw-b-ic"></i>
                            <div class="jdw-b-c">
                                <div class="jdw-b-lb">Budget</div>
                                <div class="jdw-b-v">LKR ${j.budgetMin} – ${j.budgetMax}</div>
                            </div>
                            <div class="jdw-b-h">~${j.estimatedDurationHours}h job</div>
                        </div>

                        ${xpHero}

                        <div class="jdw-h-r5">
                            ${urgCp} <span class="jdw-r3-dot" style="margin:0 4px">·</span>
                            <i class="ri-calendar-event-line"></i> Start: ${new Date(j.preferredStartDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                        </div>
                    </div>

                    <!-- Cards -->
                    <div class="jdw-cp">
                        <div class="jdw-cp-t">What needs to be done</div>
                        <div class="jdw-ds ${st.expandedDescription?'exp':''}">${j.jobDescription}</div>
                        ${(j.jobDescription?.length > 150 && !st.expandedDescription)? `<button class="jdw-rd-mr" id="j-exp-ds">Read more</button>` : ''}
                    </div>

                    <div class="jdw-cp">
                        <div class="jdw-cp-t">Details</div>
                        <div class="jdw-dt-r"><i class="ri-price-tag-3-line jdw-dt-ic"></i><div class="jdw-dt-lbl">Category</div><div class="jdw-dt-v">${j.category}</div></div>
                        <div class="jdw-dt-r"><i class="ri-time-line jdw-dt-ic"></i><div class="jdw-dt-lbl">Duration</div><div class="jdw-dt-v">${j.estimatedDurationHours} hours</div></div>
                        <div class="jdw-dt-r"><i class="ri-calendar-check-line jdw-dt-ic"></i><div class="jdw-dt-lbl">Start</div><div class="jdw-dt-v">${new Date(j.preferredStartDate).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div></div>
                        <div class="jdw-dt-r"><i class="ri-calendar-close-line jdw-dt-ic"></i><div class="jdw-dt-lbl">Expiry</div><div class="jdw-dt-v">${j.expiryDate?new Date(j.expiryDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})+' '+new Date(j.expiryDate).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'None'}${xpWarn}</div></div>
                        <div class="jdw-dt-r"><i class="ri-alarm-warning-line jdw-dt-ic"></i><div class="jdw-dt-lbl">Urgency</div><div class="jdw-dt-v">${urgCp}</div></div>
                    </div>

                    <div class="jdw-cp">
                        <div class="jdw-cp-t">Location</div>
                        <div class="jdw-lc-b"><div class="jdw-lc-l">Address</div><div class="jdw-lc-v">${j.locationAddress}</div></div>
                        <div class="jdw-lc-b"><div class="jdw-lc-l">City</div><div class="jdw-lc-v">${j.city}</div></div>
                        <div class="jdw-lc-b"><div class="jdw-lc-l">District</div><div class="jdw-lc-v">${j.district}</div></div>
                        ${j.district === workerDistrict ? `<div class="jdw-loc-nr">📍 This job is in your area</div>` : ''}
                        <div class="jdw-map-stb"><i class="ri-map-pin-2-fill" style="font-size:24px;margin-bottom:6px"></i>${j.city}, ${j.district}<div style="font-size:11px;font-style:italic;margin-top:4px">Map coming soon</div></div>
                    </div>

                    <div class="jdw-cp">
                        <div class="jdw-cp-t">Budget vs Your Rate</div>
                        ${workerRate > 0 ? `
                            <div class="jdw-ra-r"><div class="jdw-ra-l">Job budget range</div><div class="jdw-ra-v">LKR ${j.budgetMin} – ${j.budgetMax}</div></div>
                            <div class="jdw-ra-r"><div class="jdw-ra-l">Your hourly rate</div><div class="jdw-ra-v" style="color:#0D9488">LKR ${workerRate} / hr</div></div>
                            <div class="jdw-ra-r"><div class="jdw-ra-l">Estimated earnings</div><div class="jdw-ra-v" style="color:#16A34A">LKR ${workerRate * j.estimatedDurationHours}</div></div>
                            ${(workerRate * j.estimatedDurationHours) > j.budgetMax ? `<div class="jdw-ra-wn">⚠ Your rate may exceed the budget</div>` : `<div class="jdw-ra-gn">✓ Within budget range</div>`}
                        ` : `
                            <div class="jdw-no-rt">Add your hourly rate to see how this job compares to your rates.</div>
                            <button class="jdw-edit-lnk" id="j-edit">Update profile →</button>
                        `}
                        <div class="jdw-sug-blk">
                            <div class="jdw-sug-tl">💡 Suggested rate for this job:</div>
                            <div class="jdw-sug-vl">LKR ${sugRate} / hr</div>
                            <div class="jdw-sug-mn">Based on the job's total budget range</div>
                        </div>
                    </div>

                    <div class="jdw-cp">
                        <div class="jdw-cp-t">Application Activity</div>
                        ${cpBk}
                        ${avHtml}
                    </div>

                    <div class="jdw-cp">
                        <div class="jdw-cp-t">Posted by</div>
                        <div class="jdw-cus-r">
                            <div class="jdw-cus-av">${(j.customer?.firstName?.[0]||'')}${(j.customer?.lastName?.[0]||'')}</div>
                            <div>
                                <div class="jdw-cus-nm">${j.customer?.firstName} ${j.customer?.lastName}</div>
                                <div class="jdw-cus-lc">${j.customer?.city}, ${j.customer?.district}</div>
                                ${j.customer?._id ? `<div class="jdw-cus-ms">Member since ${d(j.customer._id)}</div>`:''}
                            </div>
                        </div>
                    </div>

                    ${st.hasApplied ? `
                        <!-- Already Applied block -->
                        <div class="jdw-apr ${st.myApplication?.status==='accepted'?'gr':st.myApplication?.status==='rejected'?'rd':''}">
                            <div class="jdw-cp-t">Your Application</div>
                            <div class="jdw-dt-r"><div class="jdw-dt-lbl">Status</div><div class="jdw-dt-v" style="font-weight:700">${st.myApplication?.status==='accepted'?'<span style="color:#16A34A">Accepted ✓</span>':st.myApplication?.status==='rejected'?'<span style="color:#DC2626">Declined</span>':'<span style="color:#F59E0B">Pending review</span>'}</div></div>
                            <div class="jdw-dt-r"><div class="jdw-dt-lbl">Applied</div><div class="jdw-dt-v">${processRelativeTime(st.myApplication?.appliedAt)}</div></div>
                            <div class="jdw-dt-r"><div class="jdw-dt-lbl">Rate</div><div class="jdw-dt-v" style="color:#0D9488;font-weight:600">LKR ${st.myApplication?.proposedRate} / hr</div></div>
                            
                            <div class="jdw-ap-cv">
                                <div class="jdw-cv-t">Your cover letter</div>
                                <div class="jdw-cv-c ${st.expandedCoverLetter?'exp':''}">${st.myApplication?.coverLetter}</div>
                                ${!st.expandedCoverLetter && st.myApplication?.coverLetter?.length>120 ? `<button class="jdw-rd-mr" id="j-exp-cv">Read more</button>` : ''}
                            </div>
                            
                            ${st.myApplication?.status==='pending' ? `
                                <div class="jdw-wd-r"><button class="jdw-wd-lk" id="j-wd-ap">Withdraw application</button></div>
                            ` : ''}
                        </div>
                    ` : ''}

                    <div style="text-align:center; padding-top:20px; padding-bottom:30px;">
                        <button style="font-size:12px; color:#DC2626; background:transparent; border:none; text-decoration:underline;" id="j-rep">Report this listing</button>
                    </div>
                </div>

                <!-- CTA Matrix -->
                <div class="jdw-cta">
                    ${!st.hasApplied && j.jobStatus==='active' ? `
                        <div class="jdw-cta-st">${aL===0 ? '<span style="color:#16A34A">🚀 Be the first to apply!</span>' : aL<=3 ? `<span style="color:#D97706">${aL} others have applied</span>` : `<span style="color:#DC2626">${aL} have applied — act fast</span>`}</div>
                        <button class="jdw-cta-bz" id="j-c-opn">Apply for this Job</button>
                    ` : st.hasApplied ? `
                        <div class="jdw-ban-tl">
                            <div class="jdw-ban-l"><i class="ri-checkbox-circle-fill" style="font-size:20px"></i> Application Submitted</div>
                            <div class="jdw-ban-r">Status: ${st.myApplication?.status}</div>
                        </div>
                    ` : `
                        <div class="jdw-ban-gy">Applications closed (Status: ${j.jobStatus})</div>
                    ` }
                </div>

                <!-- Bottom Sheet Apply -->
                <div class="jdw-bs-bg ${st.showApplicationSheet?'active':''}" id="j-bs-bg">
                    <div class="jdw-bs" id="j-bs-in">
                        <div class="jdw-bs-h">
                            <div class="jdw-dh"></div>
                            <button class="jdw-bc-x" id="j-bs-cls"><i class="ri-close-line"></i></button>
                            <div class="jdw-bs-tx">Apply for this Job</div>
                            <div class="jdw-bs-jt">${j.jobTitle}</div>
                        </div>
                        <div class="jdw-bs-c">
                            <div class="jdw-bs-sum">
                                <div class="jdw-sum-r">
                                    <div class="jdw-cat-cp">${j.category}</div>
                                    ${urgCp}
                                </div>
                                <div class="jdw-bs-bd">LKR ${j.budgetMin} – ${j.budgetMax}</div>
                                <div style="font-size:12px; color:#6B7280; margin-top:4px;">${j.estimatedDurationHours} hours · Start: ${new Date(j.preferredStartDate).toLocaleDateString()}</div>
                            </div>
                            
                            <div class="jdw-ipt-w">
                                <div class="jdw-ipt-l">Your Proposed Rate (LKR/hr)</div>
                                <div class="jdw-ipt-h">Enter the hourly rate you'd charge for this job</div>
                                <div class="jdw-rt-box">
                                    <div class="jdw-rt-px">LKR</div>
                                    <input type="number" inputmode="numeric" class="jdw-rt-in" id="j-frm-rt" value="${st.form.proposedRate}">
                                    <div class="jdw-rt-sx">/ hr</div>
                                </div>
                                <div class="jdw-guid">
                                    <div class="jdw-g-s">Suggested: LKR ${sugRate} / hr based on budget</div>
                                    <div class="jdw-g-e">Est. total: LKR ${estEar} ${inBud ? '<span class="jdw-e-ok">within budget ✓</span>' : '<span class="jdw-e-wr">may exceed budget ⚠</span>'}</div>
                                </div>
                            </div>

                            <div class="jdw-ipt-w">
                                <div class="jdw-ipt-l">Cover Letter</div>
                                <div class="jdw-ipt-h">Tell the customer why you're the best person for this job</div>
                                <textarea class="jdw-ta" id="j-frm-cl" placeholder="e.g. I have [X] years of experience in ${j.category} and can complete this job safely...">${st.form.coverLetter}</textarea>
                                <div class="jdw-cc ${cvLen>=480?'err':cvLen>=400?'warn':''}">${cvLen} / 500</div>
                                
                                <div class="jdw-tip-w">
                                    <button class="jdw-tip-btn" id="j-tip">Tips for a winning application ${st.showTips?'▴':'▾'}</button>
                                    <div class="jdw-tip-b ${st.showTips?'exp':''}">
                                        <div>✓ Mention relevant experience</div>
                                        <div>✓ Reference the specific job details</div>
                                        <div>✓ State when you can start</div>
                                        <div>✓ Be professional and concise</div>
                                        <div class="jdw-tip-bd">✗ Don't copy-paste generic letters</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="jdw-bs-ft">
                            <button class="jdw-cta-bz" id="j-sub" ${!isValid || st.isSubmitting?'disabled':''}>
                                ${st.isSubmitting ? `<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : 'Submit Application'}
                            </button>
                            ${missingStr ? `<div class="jdw-err-tx">${missingStr}</div>` : '<div class="jdw-err-tx"></div>'}
                        </div>
                    </div>
                </div>

                <!-- Success Overlay -->
                <div class="jdw-suc-bg ${st.successVisible?'active':''}">
                    <i class="ri-checkbox-circle-fill jdw-suc-ic"></i>
                    <div class="jdw-suc-t">Application Submitted!</div>
                    <div class="jdw-suc-s">Your application has been sent to ${j.customer?.firstName}. They'll review and respond to applications soon.</div>
                    <div class="jdw-suc-st">
                        <div class="jdw-st-i">1. Customer reviews your application</div>
                        <div class="jdw-st-i">2. If accepted, a booking will be created</div>
                        <div class="jdw-st-i">3. You'll be notified of the decision</div>
                    </div>
                    <button class="jdw-su-b1" id="j-go-ap">View My Applications</button>
                    <button class="jdw-su-b2" id="j-go-br">Browse More Jobs</button>
                </div>
            </div>
        `;
    }

    async function loadData() {
        st.isLoading = true; mcUpdateUI();
        if(api.getJob) {
             try {
                 const r = await api.getJob(jobId);
                 if(r?.data) st.job = r.data;
             } catch(e) {
                 if(e.response?.status===404) return navigate(-1);
                 if(e.response?.status===401) { localStorage.clear(); return navigate('/login'); }
                 st.error = e.message || 'Failed to connect.';
             }
        } else {
             // Mock fallback simulating detailed fetch perfectly safely
             await new Promise(r=>setTimeout(r,800));
             st.job = { _id: jobId, customer: { _id:'mx', firstName:'Amara', lastName:'Fernando', city:'Negombo', district:'Gampaha'}, jobTitle:'Fix kitchen sink leak', jobDescription:'The kitchen sink has been dripping constantly for 3 days.\nWe need someone to come replace the U-bend pipe completely as it seems to be rusted out. Please bring your own tools.\nLet me know how soon you can arrive. Must be clean and tidy!', category:'Plumbing', locationAddress:'42 Main Street', city:'Negombo', district:'Gampaha', urgencyLevel:'urgent', budgetMin:5000, budgetMax:15000, estimatedDurationHours:3, preferredStartDate:new Date(Date.now()+86400000).toISOString(), jobStatus:'active', viewsCount:24, expiryDate:new Date(Date.now()+86400000*2).toISOString(), createdAt:new Date(Date.now()-86400000).toISOString(), applications:[] };
        }

        if(st.job) {
             st.myApplication = st.job.applications?.find(a => a.worker===userId || a.worker?._id===userId);
             if(st.myApplication) st.hasApplied = true;
        }

        st.isLoading = false; mcUpdateUI();
    }

    appElement.addEventListener('click', async e => {
        const tg = e.target;
        
        if(tg.closest('#j-bck')) return navigate(-1);
        if(tg.closest('#j-edit')) return navigate('/profile/edit');
        if(tg.closest('#j-go-ap')) return navigate('/worker/applications');
        if(tg.closest('#j-go-br')) return navigate('/worker/jobs');

        if(tg.closest('#j-ert')) return loadData();

        if(tg.closest('#j-shr')) {
            showToast('Share coming soon', 'success'); return;
        }

        if(tg.closest('#j-bmk')) {
            st.isSaved = !st.isSaved;
            localStorage.setItem(`saved_job_${jobId}`, String(st.isSaved));
            showToast(st.isSaved?'Job saved':'Job removed', 'success');
            return mcUpdateUI();
        }

        if(tg.closest('#j-exp-ds')) { st.expandedDescription = true; return mcUpdateUI(); }
        if(tg.closest('#j-exp-cv')) { st.expandedCoverLetter = true; return mcUpdateUI(); }

        if(tg.closest('#j-c-opn')) { st.showApplicationSheet = true; return mcUpdateUI(); }
        if(tg.closest('#j-bs-cls') || tg.id === 'j-bs-bg') { st.showApplicationSheet = false; return mcUpdateUI(); }
        if(tg.closest('#j-tip')) { st.showTips = !st.showTips; return mcUpdateUI(); }

        if(tg.closest('#j-rep')) { showToast('Report feature coming soon', 'success'); return; }
        if(tg.closest('#j-wd-ap')) { showToast('Withdrawal feature coming soon. Contact support if needed.', 'success'); return; }

        if(tg.closest('#j-sub') && !st.isSubmitting) {
            st.isSubmitting = true; mcUpdateUI();
            
            // Sim Submission
            if(api.applyForJob) {
                try {
                     await api.applyForJob(jobId, {coverLetter: st.form.coverLetter.trim(), proposedRate: Number(st.form.proposedRate)});
                } catch(err) {
                     st.isSubmitting = false; mcUpdateUI();
                     showToast(err.message||'Failed to submit', 'error'); return;
                }
            } else {
                 await new Promise(r=>setTimeout(r, 1200));
            }

            st.showApplicationSheet = false;
            st.isSubmitting = false;
            
            // Success Overlay State update safely
            st.hasApplied = true;
            st.myApplication = { worker: userId, coverLetter: st.form.coverLetter, proposedRate: Number(st.form.proposedRate), status:'pending', appliedAt: new Date().toISOString() };
            if(!st.job.applications) st.job.applications = [];
            st.job.applications.push(st.myApplication);

            st.successVisible = true;
            mcUpdateUI();
            showToast('Application submitted!', 'success');
        }
    });

    appElement.addEventListener('input', e => {
        if(e.target.id === 'j-frm-rt') {
            st.form.proposedRate = e.target.value; mcUpdateUI();
            // Refocus natively cleanly
            setTimeout(()=>{
                const i=document.getElementById('j-frm-rt');
                if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
            },0);
        }
        if(e.target.id === 'j-frm-cl') {
            const v = e.target.value;
            if(v.length <= 500) st.form.coverLetter = v;
            mcUpdateUI();
            setTimeout(()=>{
                const i=document.getElementById('j-frm-cl');
                if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
            },0);
        }
    });

    loadData();
}
