// ================================== //
// SkillConnect Mobile                //
// All Complaints Admin Dashboard     //
// ================================== //

async function renderAllComplaintsAdmin(appElement, stateRoute) {
    const role = localStorage.getItem('role') || 'admin';
    if(role !== 'admin') {
         showToast('Access denied', 'error');
         return navigate('/');
    }

    let ac = {
        isLoading: true,
        c: [], // all complaints
        fc: [], // filtered complaints
        q: '',
        qT: null,
        tb: 'all',
        pk: 'all',
        sh: false,
        
        fR: 'all',
        fS: [], // Filter statuses
        fP: [], // Filter priorities
        fC: [], // Category
        sB: 'most_urgent', // Sort by

        sc: { t:0, n:0, rs:0, rj:0 }, // Stats
        up: [], // Urgent pending

        // DOM nodes
        nLs: null
    };

    function rlt(d) {
        const diff = Date.now() - new Date(d).getTime();
        const m = Math.floor(diff/60000), h = Math.floor(m/60), dy = Math.floor(h/24);
        if(m<1) return 'Just now';
        if(m<60) return `${m}m ago`;
        if(h<24) return `${h}h ago`;
        if(dy===1) return 'Yesterday';
        if(dy<=30) return `${dy}d ago`;
        return new Date(d).toLocaleDateString();
    }

    function avClr(r) { return r==='customer'?'customer':r==='worker'?'worker':'supplier'; }

    function runDerivations() {
        // 1. Tab Status
        let res = ac.c;
        if(ac.tb !== 'all') {
             if(ac.tb === 'pending') res = res.filter(x=>x.complaintStatus==='pending');
             else if(ac.tb === 'investigating') res = res.filter(x=>x.complaintStatus==='investigating');
             else if(ac.tb === 'resolved') res = res.filter(x=>x.complaintStatus==='resolved');
             else if(ac.tb === 'rejected') res = res.filter(x=>x.complaintStatus==='rejected');
        }

        // 2. Chip Priority
        if(ac.pk !== 'all') { res = res.filter(x=>x.priority === ac.pk); }

        // 3. Search Query
        if(ac.q) {
             const qs = ac.q.toLowerCase();
             res = res.filter(x => 
                 x.complaintTitle.toLowerCase().includes(qs) || 
                 (x.complainant?.firstName+' '+x.complainant?.lastName).toLowerCase().includes(qs) ||
                 (x.complainedAgainst?.firstName+' '+x.complainedAgainst?.lastName).toLowerCase().includes(qs) ||
                 x._id.slice(-8).includes(qs)
             );
        }

        // 4. Sheet Filters
        if(ac.fR !== 'all') {
             const rT = ac.fR.replace('complaints','').trim();
             res = res.filter(x=>x.complainant?.role === rT);
        }
        if(ac.fS.length) res = res.filter(x=>ac.fS.includes(x.complaintStatus));
        if(ac.fP.length) res = res.filter(x=>ac.fP.includes(x.priority));
        if(ac.fC.length) res = res.filter(x=>ac.fC.includes(x.complaintCategory));

        // 5. Sort
        if(ac.sB === 'most_urgent') {
             const pM = { urgent:4, high:3, medium:2, low:1 };
             const sM = { pending:3, investigating:2, resolved:1, rejected:1 };
             res.sort((a,b) => {
                 if(pM[b.priority||'low'] !== pM[a.priority||'low']) return pM[b.priority||'low'] - pM[a.priority||'low'];
                 if(sM[b.complaintStatus] !== sM[a.complaintStatus]) return sM[b.complaintStatus] - sM[a.complaintStatus];
                 return new Date(b.createdAt) - new Date(a.createdAt);
             });
        } else if(ac.sB === 'newest') { res.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); }
        else if(ac.sB === 'oldest') { res.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)); }
        else if(ac.sB === 'recent_update') { res.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)); }

        // Split groupings if Tab is All
        let h = '';
        if(res.length===0) {
             h = `<div class="aca-emp"><i class="ri-shield-check-line aca-emp-i"></i><div class="aca-emp-t">${ac.q||ac.pk!=='all'||ac.tb!=='all'?'No matching complaints':'No complaints filed'}</div><div class="aca-emp-s">${ac.q||ac.pk!=='all'||ac.tb!=='all'?'Try adjusting your filters or clearing your search query.':'The platform is running smoothly. No complaints have been filed by users.'}</div>${ac.q||ac.pk!=='all'||ac.tb!=='all'?`<button class="aca-emp-l" id="btn-clr">Clear filters</button>`:''}</div>`;
        } else {
             if(ac.tb === 'all' && ac.sB === 'most_urgent') {
                 const nd = res.filter(x=>['pending','investigating'].includes(x.complaintStatus));
                 const cl = res.filter(x=>['resolved','rejected'].includes(x.complaintStatus));
                 if(nd.length) { h += `<div class="aca-gh am"><i class="ri-notification-3-fill"></i> Needs Action</div>`; nd.forEach(x=> h += bldCd(x)); }
                 if(cl.length) { h += `<div class="aca-gh" style="margin-top:16px">Closed</div>`; cl.forEach(x=> h += bldCd(x)); }
             } else {
                 res.forEach(x=> h += bldCd(x));
             }
        }
        
        if(ac.nLs) ac.nLs.innerHTML = h;
    }

    function bldCd(x) {
        let pc = '', pt = '';
        if(x.priority==='urgent'){ pc='p-urg'; pt=`<div class="aca-ppill urg">🔥 Urgent</div>`; }
        else if(x.priority==='high'){ pc='p-hi'; pt=`<div class="aca-ppill hi">⚡ High</div>`; }
        else if(x.priority==='medium'){ pc='p-md'; pt=`<div class="aca-ppill md">● Medium</div>`; }
        else { pc='low'; pt=`<div class="aca-ppill low">○ Low</div>`; }

        let sc = '', st = '';
        if(x.complaintStatus==='pending'){ sc='pending'; st=`<i class="ri-time-line"></i> Pending`; }
        else if(x.complaintStatus==='investigating'){ sc='investigating'; st=`<i class="ri-search-line"></i> Investigating`; }
        else if(x.complaintStatus==='resolved'){ sc='resolved'; st=`<i class="ri-check-line"></i> Resolved`; }
        else { sc='rejected'; st=`<i class="ri-close-line"></i> Rejected`; }

        let cc = (x.complainant?.firstName||'')+' '+(x.complainant?.lastName||'');
        let ca = (x.complainedAgainst?.firstName||'')+' '+(x.complainedAgainst?.lastName||'');
        
        let bk = '';
        if(x.booking) bk = `<div class="aca-bk"><i class="ri-briefcase-4-line"></i> Re: ${x.booking.jobTitle||'Booking'}</div>`;

        let act = '';
        if(x.complaintStatus==='pending' || x.complaintStatus==='investigating') {
            act = `<div class="aca-act"><button class="aca-abtn" data-id="${x._id}">Review & Resolve</button></div>`;
        } else {
            let ft = x.complaintStatus==='resolved' ? 'rs' : 'rj';
            act = `<div class="aca-ft-r ${ft}"><i class="ri-${x.complaintStatus==='resolved'?'check':'close'}-line"></i> ${x.complaintStatus==='resolved'?'Resolved':'Rejected'} ${rlt(x.resolvedAt||x.updatedAt)}</div>`;
        }

        return `
            <div class="aca-cd ${pc}" data-id="${x._id}">
                <div class="aca-cr1">${pt}<div class="aca-sp ${sc}">${st}</div><div class="aca-dt">${rlt(x.createdAt)}</div></div>
                <div class="aca-tl">${x.complaintTitle}</div>
                <div class="aca-cg">${x.complaintCategory.replace(/_/g,' ')}</div>

                <div class="aca-pt-w">
                    <div class="aca-pt-c">
                        <div class="aca-pt-l">Complainant</div>
                        <div class="aca-pt-rw">
                            <div class="aca-av ${avClr(x.complainant?.role)}">${cc.substring(0,1)}</div>
                            <div style="min-width:0;flex:1"><div class="aca-pt-n">${cc}</div><span class="aca-rl-p ${avClr(x.complainant?.role)}">${Math.random()>0.5?x.complainant?.role:'Customer'}</span></div>
                        </div>
                    </div>
                    <div class="aca-pt-c">
                        <div class="aca-pt-l">Against</div>
                        <div class="aca-pt-rw">
                            <div class="aca-av ${avClr(x.complainedAgainst?.role)}">${ca.substring(0,1)}</div>
                            <div style="min-width:0;flex:1"><div class="aca-pt-n">${ca}</div><span class="aca-rl-p ${avClr(x.complainedAgainst?.role)}">${Math.random()>0.5?x.complainedAgainst?.role:'Worker'}</span></div>
                        </div>
                    </div>
                </div>
                ${bk}
                ${act}
            </div>
        `;
    }

    function acUpdateUI() {
        if(ac.isLoading) {
             appElement.innerHTML = `
                <div class="aca-screen"><div class="aca-h"><div class="aca-bck"><i class="ri-arrow-left-line"></i></div><div class="aca-t">Complaints</div><div class="aca-fl-b"><i class="ri-equalizer-line"></i></div></div>
                <div class="aca-st-g"><div class="aca-st-q pk"></div><div class="aca-st-q pk"></div><div class="aca-st-q pk"></div><div class="aca-st-q pk"></div></div>
                <div class="aca-lst"><div class="aca-sk-c"><div class="pk" style="width:120px;height:20px;border-radius:12px"></div><div class="pk" style="width:80%;height:16px"></div><div class="pk" style="width:60px;height:16px;border-radius:6px"></div><div class="aca-sk-h"><div class="pk" style="flex:1;height:40px"></div><div class="pk" style="flex:1;height:40px"></div></div></div></div></div>
             `;
             return;
        }

        let ubn = '';
        if(ac.up.length > 0) {
             ubn = `<div class="aca-ubn" id="btn-urg"><i class="ri-fire-fill aca-ubn-i"></i><div><div class="aca-ubn-tl">${ac.up.length} urgent complaint${ac.up.length>1?'s':''} need${ac.up.length===1?'s':''} immediate attention</div><div class="aca-ubn-sl">Tap to view urgent complaints</div></div></div>`;
        }

        let flD = '';
        if(ac.sh) {
             flD = `<div class="aca-sbg active" id="fsh-bg"><div class="aca-sht"><div class="aca-dh"></div><div class="aca-sh-t">Filter & Sort Complaints</div><div class="aca-sh-scr">
                <div><div class="aca-sh-ct">Sort By</div>
                    <label class="aca-rad"><input type="radio" name="fsb" value="most_urgent" ${ac.sB==='most_urgent'?'checked':''}> Most urgent first</label>
                    <label class="aca-rad"><input type="radio" name="fsb" value="newest" ${ac.sB==='newest'?'checked':''}> Newest first</label>
                    <label class="aca-rad"><input type="radio" name="fsb" value="oldest" ${ac.sB==='oldest'?'checked':''}> Oldest first</label>
                    <label class="aca-rad"><input type="radio" name="fsb" value="recent_update" ${ac.sB==='recent_update'?'checked':''}> Most recently updated</label>
                </div>
                <div><div class="aca-sh-ct">Role</div>
                    <label class="aca-rad"><input type="radio" name="fro" value="all" ${ac.fR==='all'?'checked':''}> All parties</label>
                    <label class="aca-rad"><input type="radio" name="fro" value="customer complaints" ${ac.fR==='customer complaints'?'checked':''}> Customer complaints</label>
                    <label class="aca-rad"><input type="radio" name="fro" value="worker complaints" ${ac.fR==='worker complaints'?'checked':''}> Worker complaints</label>
                    <label class="aca-rad"><input type="radio" name="fro" value="supplier complaints" ${ac.fR==='supplier complaints'?'checked':''}> Supplier complaints</label>
                </div>
                <div><div class="aca-sh-ct">Status</div>
                    <label class="aca-chk"><input type="checkbox" name="fss" value="pending" ${ac.fS.includes('pending')?'checked':''}> Pending</label>
                    <label class="aca-chk"><input type="checkbox" name="fss" value="investigating" ${ac.fS.includes('investigating')?'checked':''}> Investigating</label>
                    <label class="aca-chk"><input type="checkbox" name="fss" value="resolved" ${ac.fS.includes('resolved')?'checked':''}> Resolved</label>
                    <label class="aca-chk"><input type="checkbox" name="fss" value="rejected" ${ac.fS.includes('rejected')?'checked':''}> Rejected</label>
                </div>
             </div><div class="aca-sht-b"><button class="aca-sh-re" id="btn-srst">Reset</button><button class="aca-sh-ap" id="btn-sap">Apply Filters</button></div></div></div>`;
        }

        appElement.innerHTML = `
            <div class="aca-screen" id="aca-scr">
                <div class="aca-h">
                    <button class="aca-bck" id="eds-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="aca-t">Complaints</div>
                    <button class="aca-fl-b" id="btn-fl"><i class="ri-equalizer-line"></i>${ac.up.length>0?`<div class="aca-fl-dt"></div>`:''}</button>
                </div>

                <div class="aca-st-g">
                    <div class="aca-st-q"><div class="aca-st-l">Total Complaints</div><div class="aca-st-v aca-c-dk">${ac.sc.t}</div></div>
                    <div class="aca-st-q"><div class="aca-st-l">Needs Action</div><div class="aca-st-v aca-c-am">${ac.sc.n>0?`<div class="aca-dot"></div>`:''}${ac.sc.n}</div></div>
                    <div class="aca-st-q"><div class="aca-st-l">Resolved</div><div class="aca-st-v aca-c-gr sm">${ac.sc.rs}</div></div>
                    <div class="aca-st-q"><div class="aca-st-l">Rejected</div><div class="aca-st-v aca-c-rd sm">${ac.sc.rj}</div></div>
                </div>

                ${ubn}

                <div class="aca-tb-w">
                    <button class="aca-tb ${ac.tb==='all'?'active':''}" data-t="all">All <span class="aca-bdg">${ac.sc.t}</span></button>
                    <button class="aca-tb ${ac.tb==='pending'?'active':''}" data-t="pending">Pending <span class="aca-bdg">${ac.c.filter(x=>x.complaintStatus==='pending').length}</span></button>
                    <button class="aca-tb ${ac.tb==='investigating'?'active':''}" data-t="investigating">Investigating <span class="aca-bdg">${ac.c.filter(x=>x.complaintStatus==='investigating').length}</span></button>
                    <button class="aca-tb ${ac.tb==='resolved'?'active':''}" data-t="resolved">Resolved <span class="aca-bdg">${ac.sc.rs}</span></button>
                    <button class="aca-tb ${ac.tb==='rejected'?'active':''}" data-t="rejected">Rejected <span class="aca-bdg">${ac.sc.rj}</span></button>
                </div>

                <div class="aca-pk-w">
                    <button class="aca-pk ${ac.pk==='all'?'active':''}" data-p="all">All Priorities</button>
                    <button class="aca-pk ${ac.pk==='urgent'?'active':''}" data-p="urgent">Urgent</button>
                    <button class="aca-pk ${ac.pk==='high'?'active':''}" data-p="high">High</button>
                    <button class="aca-pk ${ac.pk==='medium'?'active':''}" data-p="medium">Medium</button>
                    <button class="aca-pk ${ac.pk==='low'?'active':''}" data-p="low">Low</button>
                </div>

                <div class="aca-sr-w">
                    <div style="position:relative">
                        <i class="ri-search-line aca-sr-i"></i>
                        <input type="text" class="aca-sr" id="aca-si" placeholder="Search by title, name, or ID..." value="${ac.q}">
                    </div>
                </div>

                <div class="aca-lst" id="aca-list"></div>
                ${flD}
            </div>
        `;

        ac.nLs = document.getElementById('aca-list');
        runDerivations();
    }

    async function loadData() {
        if(api.getAllComplaints) {
            try {
                const rx = await api.getAllComplaints();
                ac.c = rx.data?.content || rx.data || [];
            } catch(e) { showToast('Failed to load complaints', 'error'); ac.c = []; }
        } else {
            await new Promise(r=>setTimeout(r,800));
            // Mock Data
            ac.c = [
                 {_id:'c111', complainant:{firstName:'Amara', lastName:'Silva', role:'customer'}, complainedAgainst:{firstName:'Kasun', lastName:'Perera', role:'worker'}, booking:{jobTitle:'Deep Clean'}, complaintTitle:'Worker arrived 3 hours late and drunk', complaintCategory:'inappropriate_behaviour', complaintStatus:'pending', priority:'urgent', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
                 {_id:'c222', complainant:{firstName:'Saman', lastName:'Kumara', role:'worker'}, complainedAgainst:{firstName:'Ruwan', lastName:'Silva', role:'customer'}, complaintTitle:'Customer refuses to pay extra hours', complaintCategory:'payment_issue', complaintStatus:'investigating', priority:'high', createdAt:new Date(Date.now()-86400000).toISOString(), updatedAt:new Date(Date.now()-86400000).toISOString() },
                 {_id:'c333', complainant:{firstName:'Kamal', lastName:'Raj', role:'supplier'}, complainedAgainst:{firstName:'Jane', lastName:'Doe', role:'customer'}, complaintTitle:'Returned drill physically broken', complaintCategory:'fraud', complaintStatus:'resolved', priority:'medium', createdAt:new Date(Date.now()-186400000).toISOString(), updatedAt:new Date(Date.now()-86400000).toISOString(), resolvedAt:new Date().toISOString() },
            ];
        }

        ac.sc.t = ac.c.length;
        ac.sc.n = ac.c.filter(x=>['pending','investigating'].includes(x.complaintStatus)).length;
        ac.sc.rs = ac.c.filter(x=>x.complaintStatus==='resolved').length;
        ac.sc.rj = ac.c.filter(x=>x.complaintStatus==='rejected').length;
        
        ac.up = ac.c.filter(x=>x.priority==='urgent' && x.complaintStatus==='pending');

        ac.isLoading = false; acUpdateUI();
    }

    appElement.addEventListener('input', e => {
        if(e.target.id === 'aca-si') {
             if(ac.qT) clearTimeout(ac.qT);
             ac.qT = setTimeout(() => { ac.q = e.target.value; runDerivations(); }, 300);
        }
    });

    appElement.addEventListener('click', e => {
        const tg = e.target;
        if(tg.closest('#eds-bck')) return navigate(-1);

        const tb = tg.closest('.aca-tb');
        if(tb) { ac.tb = tb.dataset.t; return acUpdateUI(); }

        const pk = tg.closest('.aca-pk');
        if(pk) { ac.pk = pk.dataset.p; return acUpdateUI(); }

        if(tg.closest('#btn-urg')) { ac.pk = 'urgent'; ac.tb = 'pending'; return acUpdateUI(); }
        if(tg.closest('#btn-clr')) { ac.q=''; ac.pk='all'; ac.tb='all'; ac.fR='all'; ac.fS=[]; ac.fP=[]; ac.fC=[]; ac.sB='most_urgent'; return acUpdateUI(); }

        if(tg.closest('#btn-fl')) { ac.sh = true; return acUpdateUI(); }
        if(tg.id === 'fsh-bg') { ac.sh = false; return acUpdateUI(); }
        if(tg.closest('#btn-srst')) { ac.fR='all'; ac.fS=[]; ac.fP=[]; ac.fC=[]; ac.sB='most_urgent'; return acUpdateUI(); }
        
        if(tg.closest('#btn-sap')) {
             const r = document.querySelector('input[name="fsb"]:checked'); if(r) ac.sB = r.value;
             const ro = document.querySelector('input[name="fro"]:checked'); if(ro) ac.fR = ro.value;
             
             ac.fS = Array.from(document.querySelectorAll('input[name="fss"]:checked')).map(x=>x.value);
             ac.sh = false; return acUpdateUI();
        }

        const cd = tg.closest('.aca-cd');
        if(cd && !tg.closest('.aca-abtn')) return navigate(`/admin/complaints/${cd.dataset.id}`);

        if(tg.closest('.aca-abtn')) return navigate(`/admin/complaints/${tg.closest('.aca-abtn').dataset.id}`);
    });

    loadData();
}
