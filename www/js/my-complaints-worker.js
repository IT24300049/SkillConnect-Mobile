// ================================== //
// SkillConnect Mobile                //
// Worker My Complaints               //
// ================================== //

async function renderMyComplaintsWorker(appElement, stateRoute) {
    let mc = {
        complaints: [],
        filter: 'all', // all, pending, investigating, action_taken, resolved
        isLoading: true,
        expandedCards: new Set(),
        showWithdrawId: null,
        isUpdating: false,
        touchStartY: 0,
        ptrDist: 0,
        isPtrEnabled: true
    };

    function processRelDate(dStr) {
        const df = (Date.now() - new Date(dStr).getTime()) / (1000*60*60*24);
        if(df < 1) return 'Today';
        if(df < 2) return 'Yesterday';
        if(df < 7) return `${Math.floor(df)}d ago`;
        return new Date(dStr).toLocaleDateString();
    }

    function catLabel(c) {
        const m = { service_quality: 'Job Quality Issue', inappropriate_behavior: 'Inappropriate Behaviour', fraud: 'Fraud / Non-payment', payment_issue: 'Payment Dispute', other: 'Other' };
        return m[c] || 'Other';
    }

    function mcUpdateUI() {
        if(mc.isLoading) {
            appElement.innerHTML = `<div class="mcw-screen"><div class="mcw-h"><button class="mcw-btn-ic" id="mc-bck"><i class="ri-arrow-left-line"></i></button><div class="mcw-t">My Complaints</div><div style="width:44px"></div></div><div class="mcw-sk"><div class="mcw-sk-c"></div><div class="mcw-sk-c"></div><div class="mcw-sk-c"></div></div></div>`;
            return;
        }

        const ls = mc.filter === 'all' ? mc.complaints : mc.complaints.filter(c => c.status === mc.filter);
        
        let cHtml = '';
        if(ls.length === 0) {
             const m = mc.filter==='all' ? "You haven't filed any complaints." : `No ${mc.filter.replace('_',' ')} complaints found.`;
             cHtml = `
                <div class="mcw-emp">
                    <i class="ri-shield-check-line mcw-emp-i"></i>
                    <div class="mcw-emp-t">${m}</div>
                    <div class="mcw-emp-s">If you have an issue with a customer or booking, you can file a complaint here.</div>
                    ${mc.filter==='all' ? `<button class="mcw-emp-b" id="mc-go-jobs">Browse Jobs</button>` : ''}
                </div>
             `;
        } else {
             cHtml = '<div class="mcw-ls">' + ls.map(c => {
                 const ex = mc.expandedCards.has(c._id);
                 const tn = c.complainedAgainst ? `${c.complainedAgainst.firstName} ${c.complainedAgainst.lastName}` : 'System / Unknown';
                 
                 // Progress Bar logic
                 const stSeq = ['pending', 'investigating', 'action_taken', 'resolved'];
                 const curIx = Math.max(0, stSeq.indexOf(c.status));
                 let pbH = '';
                 for(let i=0; i<4; i++) pbH += `<div class="mcw-tls ${i<=curIx?'ac':''}"></div>`;
                 
                 // Bottom action
                 let abH = '';
                 if(c.status === 'pending') {
                      abH = `<div class="mcw-c-act"><button class="mcw-b-rd c-wth" data-id="${c._id}">Withdraw Complaint</button></div>`;
                 }

                 return `
                    <div class="mcw-c ${ex?'exp':''}">
                        <div class="mcw-c-h">
                            <div class="mcw-c-id">#${c._id.slice(-6).toUpperCase()}</div>
                            <div class="mcw-bdg ${c.status}">${c.status.replace('_',' ')}</div>
                        </div>
                        <div class="mcw-c-t">${c.subject}</div>
                        <div class="mcw-c-at">
                            <div class="mcw-c-at-l">Reported:</div>
                            <div class="mcw-av">${tn[0]||'C'}</div>
                            <div class="mcw-c-at-n">${tn}</div>
                        </div>
                        
                        <div class="mcw-c-exp">
                            <div class="mcw-c-r"><div class="mcw-c-l">Category</div><div class="mcw-c-v">${catLabel(c.category)}</div></div>
                            <div class="mcw-c-r"><div class="mcw-c-l">Priority</div><div class="mcw-c-v" style="text-transform:capitalize">${c.priority}</div></div>
                            <div class="mcw-c-r"><div class="mcw-c-l">Filed On</div><div class="mcw-c-v">${new Date(c.createdAt).toLocaleDateString()}</div></div>
                            <div class="mcw-c-d">${c.description}</div>
                            
                            <div class="mcw-tl">${pbH}</div>
                            <div class="mcw-tl-l">
                                <span style="flex:1;text-align:left">Submitted</span>
                                <span style="flex:1;text-align:center">In Review</span>
                                <span style="flex:1;text-align:right">Resolved</span>
                            </div>

                            ${abH}
                        </div>
                        
                        <div style="border-top:1px solid #F3F4F6; margin-top:12px; padding-top:12px; text-align:center; font-size:13px; font-weight:600; color:#0D9488;" class="c-tg-exp" data-id="${c._id}">
                            ${ex ? 'Show Less' : 'View Details'}
                        </div>
                    </div>
                 `;
             }).join('') + '</div>';
        }

        const tP = mc.complaints.filter(x=>x.status==='pending').length;
        const tI = mc.complaints.filter(x=>x.status==='investigating').length;

        let wMod = '';
        if(mc.showWithdrawId) {
             const cx = mc.complaints.find(c=>c._id === mc.showWithdrawId);
             if(cx) {
                  wMod = `
                    <div class="mcw-wbg active" id="mwd-bg">
                        <div class="mcw-ws">
                            <div class="mcw-ws-t">Withdraw complaint?</div>
                            <div class="mcw-ws-s">This will permanently close your report. It will be marked as resolved.</div>
                            <div class="mcw-ws-cb"><strong>Subject:</strong> ${cx.subject}</div>
                            <div class="mcw-ws-f">
                                <button class="mcw-ws-b1" id="mwd-do">${mc.isUpdating?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : 'Withdraw Report'}</button>
                                <button class="mcw-ws-b2" id="mwd-cn">Keep Open</button>
                            </div>
                        </div>
                    </div>
                  `;
             }
        }

        appElement.innerHTML = `
            <div class="mcw-screen">
                <div class="mcw-h">
                    <button class="mcw-btn-ic" id="mc-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="mcw-t">My Complaints</div>
                    <div style="width:44px"></div>
                </div>

                <div class="mcw-stt">
                    <div class="mcw-st-p"><div class="mcw-st-p-v">${mc.complaints.length}</div><div class="mcw-st-p-l">Total</div></div>
                    <div class="mcw-st-p"><div class="mcw-st-p-v" style="color:#D97706">${tP}</div><div class="mcw-st-p-l">Pending</div></div>
                    <div class="mcw-st-p"><div class="mcw-st-p-v" style="color:#4F46E5">${tI}</div><div class="mcw-st-p-l">In Review</div></div>
                </div>

                <div class="mcw-f">
                    ${['all','pending','investigating','action_taken','resolved'].map(f => `<button class="mcw-f-b ${mc.filter===f?'active':''}" data-f="${f}">${f.replace('_',' ')}</button>`).join('')}
                </div>

                <div class="mcw-scroll" id="mc-scr">
                    <div class="mcw-ptr" id="mc-ptr" style="transform:translateY(${mc.ptrDist}px)"><div class="mcw-ptr-sp"></div></div>
                    ${cHtml}
                </div>

                <button class="mcw-fab" id="mc-fab"><i class="ri-add-line"></i></button>
                ${wMod}
            </div>
        `;
    }

    async function loadData(isPtr = false) {
        if(!isPtr) { mc.isLoading = true; mcUpdateUI(); }
        if(api.getMyComplaints) {
            try {
                const rs = await api.getMyComplaints();
                mc.complaints = rs.data?.content || [];
                mc.complaints.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            } catch(e) {}
        } else {
            // Mock
            await new Promise(r=>setTimeout(r,800));
            const t = Date.now();
            mc.complaints = [
                { _id: 'mc1', status: 'pending', subject: 'Customer refused to pay deposit', priority: 'high', category: 'fraud', description: 'Amara agreed to pay 50% upfront but stopped responding after I arrived.', complainedAgainst: { firstName:'Amara', lastName:'Fernando' }, createdAt: new Date(t-86400000).toISOString() },
                { _id: 'mc2', status: 'action_taken', subject: 'Customer was rude and threatening', priority: 'medium', category: 'inappropriate_behavior', description: 'Very hostile communication regarding project scopes that were never previously agreed upon.', complainedAgainst: { firstName:'Nimal', lastName:'Perera' }, createdAt: new Date(t-432000000).toISOString() }
            ];
        }
        mc.isLoading = false; mcUpdateUI();
    }

    // Touch logic (Pull to refresh)
    appElement.addEventListener('touchstart', e => {
        const sc = document.getElementById('mc-scr');
        if(sc && sc.scrollTop <= 0) { mc.isPtrEnabled = true; mc.touchStartY = e.touches[0].clientY; }
        else mc.isPtrEnabled = false;
    });

    appElement.addEventListener('touchmove', e => {
        if(!mc.isPtrEnabled) return;
        const cy = e.touches[0].clientY;
        const dif = cy - mc.touchStartY;
        if(dif > 0 && dif < 120) { mc.ptrDist = dif; e.preventDefault(); const p=document.getElementById('mc-ptr'); if(p) p.style.transform = `translateY(${dif}px)`; }
    }, {passive:false});

    appElement.addEventListener('touchend', async () => {
        if(mc.ptrDist > 60) {
            mc.ptrDist = 50; const p=document.getElementById('mc-ptr'); if(p) p.style.transform = `translateY(50px)`;
            await loadData(true);
        }
        mc.ptrDist = 0; const pr=document.getElementById('mc-ptr'); if(pr) pr.style.transform = `translateY(0)`;
    });


    appElement.addEventListener('click', async e => {
        const tg = e.target;
        if(tg.closest('#mc-bck')) return navigate(-1);
        if(tg.closest('#mc-fab') || tg.closest('#mc-new')) return navigate('/worker/complaints/create');
        if(tg.closest('#mc-go-jobs')) return navigate('/worker/jobs');

        const fb = tg.closest('.mcw-f-b');
        if(fb && !mc.isUpdating) { mc.filter = fb.dataset.f; mc.expandedCards.clear(); return mcUpdateUI(); }

        const tx = tg.closest('.c-tg-exp');
        if(tx && !mc.isUpdating) {
            const id = tx.dataset.id;
            if(mc.expandedCards.has(id)) mc.expandedCards.delete(id);
            else mc.expandedCards.add(id);
            return mcUpdateUI();
        }

        const wt = tg.closest('.c-wth');
        if(wt) { mc.showWithdrawId = wt.dataset.id; return mcUpdateUI(); }

        if(tg.closest('#mwd-cn') || tg.id === 'mwd-bg') { mc.showWithdrawId = null; return mcUpdateUI(); }

        if(tg.closest('#mwd-do')) {
             if(mc.isUpdating) return;
             mc.isUpdating = true; mcUpdateUI();
             
             // In real app, call PATCH endpoint. For now mock locally.
             if(api.updateComplaint) {
                 try { await api.updateComplaint(mc.showWithdrawId, {status:'resolved'}); } catch(e){}
             } else await new Promise(r=>setTimeout(r,800));

             const cx = mc.complaints.find(x=>x._id===mc.showWithdrawId);
             if(cx) { cx.status = 'resolved'; cx.updatedAt = new Date().toISOString(); }
             
             mc.isUpdating = false; mc.showWithdrawId = null; 
             showToast('Complaint withdrawn successfully', 'success');
             return mcUpdateUI();
        }
    });

    loadData();
}
