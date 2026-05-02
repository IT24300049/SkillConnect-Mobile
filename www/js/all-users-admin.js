// ================================== //
// SkillConnect Mobile                //
// All Users Admin                    //
// ================================== //

async function renderAllUsersAdmin(appElement, stateRoute) {
    const role = localStorage.getItem('role') || 'admin';
    if(role !== 'admin') {
         showToast('Access denied', 'error'); return navigate('/');
    }

    let au = {
        isLoading: true,
        u: [], // all users
        fu: [], // filtered
        qRaw: '',
        q: '',
        qT: null,
        tb: 'workers',
        sb: 'newest',
        vf: 'all',
        df: '', // district
        sfl: false, // show filters
        svr: null, // target user to verify
        st: { t: 0, v: 0, u: 0 },
        nLs: null
    };

    function rlt(d) {
        if(!d) return '';
        const diff = Date.now() - new Date(d).getTime();
        const m = Math.floor(diff/60000), h = Math.floor(m/60), dy = Math.floor(h/24);
        if(m<1) return 'Just now';
        if(m<60) return `${m}m ago`;
        if(h<24) return `${h}h ago`;
        if(dy===1) return 'Yesterday';
        if(dy<=30) return `${dy}d ago`;
        return new Date(d).toLocaleDateString();
    }

    function runDerivations() {
        let res = au.u;

        // Note: Currently we only fetch workers. Role tab filtering is mocked for UI.
        if(au.tb !== 'all') {
             // If we had other roles, we'd filter here. Currently they are all workers anyway.
             res = res.filter(x => x.role === 'worker'); 
        }

        if(au.vf === 'verified') res = res.filter(x => x.isVerified);
        else if(au.vf === 'unverified') res = res.filter(x => !x.isVerified);

        if(au.df) res = res.filter(x => x.location?.district === au.df);

        if(au.q) {
             const qs = au.q.toLowerCase();
             res = res.filter(x => 
                 (x.firstName+' '+x.lastName).toLowerCase().includes(qs) ||
                 (x.skills && x.skills.some(s=>s.toLowerCase().includes(qs)))
             );
        }

        if(au.sb === 'newest') res.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
        else if(au.sb === 'oldest') res.sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));
        else if(au.sb === 'high') res.sort((a,b)=>(b.hourlyRate||0)-(a.hourlyRate||0));
        else if(au.sb === 'low') res.sort((a,b)=>(a.hourlyRate||0)-(b.hourlyRate||0));
        else if(au.sb === 'az') res.sort((a,b)=>(a.firstName||'').localeCompare(b.firstName||''));

        let h = '';
        if(res.length===0) {
             h = `<div class="aua-emp"><i class="${au.q?'ri-search-line':'ri-shield-user-line'} aua-emp-i"></i><div class="aua-emp-t">${au.q?'No results for "'+au.qRaw+'"':'No users found'}</div><div class="aua-emp-s">${au.q?'Try adjusting your search or filters to find what you are looking for.':'There are currently no active users.'}</div>${au.q||au.vf!=='all'||au.df?`<button class="aua-emp-l" id="btn-clr">Clear filters</button>`:''}</div>`;
        } else {
             res.forEach(x => {
                 let skls = '';
                 if(x.skills && x.skills.length) {
                     const f3 = x.skills.slice(0,3);
                     f3.forEach(s=> skls += `<div class="aua-skp">${s}</div>`);
                     if(x.skills.length > 3) skls += `<div class="aua-skp mr">+ ${x.skills.length-3} more</div>`;
                 }

                 h += `
                    <div class="aua-cd" data-id="${x._id}">
                        <div class="aua-c-r1">
                            <div class="aua-av-w"><div class="aua-av">${(x.firstName||'W').substring(0,1)}</div>${x.isVerified?`<div class="aua-vb"><i class="ri-check-line"></i></div>`:''}</div>
                            <div class="aua-n-w">
                                <div class="aua-nm">${x.firstName} ${x.lastName}</div>
                                <div class="aua-rl">${x.role}</div> <span class="aua-st-b" style="float:right"><div class="aua-st-d ${x.isActive?'on':'off'}"></div> ${x.isActive?'Active':'Inactive'}</span>
                                <div class="aua-lc">${x.location?.city||'Unknown'}, ${x.location?.district||'Unknown'}</div>
                            </div>
                        </div>
                        <div class="aua-sk-w">${skls}</div>
                        <div class="aua-stt">
                            <i class="ri-time-line"></i> ${x.experience||'0'} yrs <span class="aua-s-dt">·</span> <i class="ri-wallet-3-line"></i> LKR ${x.hourlyRate||0}/hr <span class="aua-s-dt">·</span> <i class="ri-calendar-event-line"></i> Joined ${rlt(x.createdAt)}
                        </div>
                        <div class="aua-ax">
                            ${!x.isVerified?`<button class="aua-abtn vf">Verify User</button>`:''}
                            <button class="aua-abtn vp">View Profile</button>
                        </div>
                    </div>
                 `;
             });
        }
        if(au.nLs) au.nLs.innerHTML = h;
    }

    function auUpdateUI() {
        if(au.isLoading) {
             appElement.innerHTML = `
                <div class="aua-screen"><div class="aua-h"><div class="aua-bck"><i class="ri-arrow-left-line"></i></div><div class="aua-t">All Users</div><div class="aua-fl-b"><i class="ri-equalizer-line"></i></div></div>
                <div class="aua-st-w"><div class="aua-st-p" style="width:80px"></div><div class="aua-st-p" style="width:80px"></div><div class="aua-st-p" style="width:80px"></div></div>
                <div class="aua-sk-w"><div class="aua-sk-c"><div class="aua-sk-p" style="height:50px;width:100%"></div><div class="aua-sk-p" style="height:20px;width:60%"></div></div><div class="aua-sk-c"><div class="aua-sk-p" style="height:50px;width:100%"></div></div></div></div>
             `;
             return;
        }

        const dts = [...new Set(au.u.map(x=>x.location?.district).filter(Boolean))];

        let flt = '';
        if(au.sfl) {
             let dc = `<div class="aua-ck ${!au.df?'active':''}" data-d="">All Districts</div>`;
             dts.forEach(d => dc += `<div class="aua-ck ${au.df===d?'active':''}" data-d="${d}">${d}</div>`);

             flt = `
                <div class="aua-sbg active" id="fl-bg">
                    <div class="aua-sht">
                        <div class="aua-dh"></div>
                        <div class="aua-sh-h">Filter & Sort Users</div>
                        <div class="aua-sh-b">
                            <div class="aua-sh-bx">
                                <div class="aua-sh-bx-t">Sort By</div>
                                <label class="aua-rad"><input type="radio" name="fsb" value="newest" ${au.sb==='newest'?'checked':''}> Newest members</label>
                                <label class="aua-rad"><input type="radio" name="fsb" value="oldest" ${au.sb==='oldest'?'checked':''}> Oldest members</label>
                                <label class="aua-rad"><input type="radio" name="fsb" value="high" ${au.sb==='high'?'checked':''}> Highest rate</label>
                                <label class="aua-rad"><input type="radio" name="fsb" value="low" ${au.sb==='low'?'checked':''}> Lowest rate</label>
                                <label class="aua-rad"><input type="radio" name="fsb" value="az" ${au.sb==='az'?'checked':''}> Name A-Z</label>
                            </div>
                            <div class="aua-sh-bx">
                                <div class="aua-sh-bx-t">Verification Status</div>
                                <label class="aua-rad"><input type="radio" name="fvf" value="all" ${au.vf==='all'?'checked':''}> All users</label>
                                <label class="aua-rad"><input type="radio" name="fvf" value="verified" ${au.vf==='verified'?'checked':''}> Verified only</label>
                                <label class="aua-rad"><input type="radio" name="fvf" value="unverified" ${au.vf==='unverified'?'checked':''}> Unverified only</label>
                            </div>
                            <div class="aua-sh-bx">
                                <div class="aua-sh-bx-t">District</div>
                                <div class="aua-ck-w" id="dt-mx">${dc}</div>
                            </div>
                        </div>
                        <div class="aua-sh-f">
                            <button class="aua-s-re" id="btn-re">Reset</button>
                            <button class="aua-s-ap" id="btn-ap">Apply</button>
                        </div>
                    </div>
                </div>
             `;
        }

        let vsht = '';
        if(au.svr) {
             const tv = au.svr;
             let skls = '';
             if(tv.skills && tv.skills.length) { const f2 = tv.skills.slice(0,2); f2.forEach(s=> skls += `<div class="aua-skp" style="background:#FFF">${s}</div>`); if(tv.skills.length > 2) skls += `<div class="aua-skp" style="background:#FFF">+${tv.skills.length-2}</div>`; }
             
             vsht = `
                <div class="aua-sbg active" id="vr-bg">
                    <div class="aua-sht">
                        <div class="aua-dh"></div>
                        <div style="padding:0 20px 20px">
                            <div style="font-size:20px;font-weight:800;color:#111827;margin-bottom:8px">Verify ${tv.firstName}?</div>
                            <div style="font-size:14px;color:#6B7280;margin-bottom:20px;line-height:1.5">This will mark ${tv.firstName} as a verified worker on SkillConnect. They will receive a verified badge on their profile.</div>
                            
                            <div class="aua-vwr">
                                <div class="aua-av" style="width:40px;height:40px;font-size:16px">${(tv.firstName||'A').substring(0,1)}</div>
                                <div style="flex:1">
                                    <div style="font-size:15px;font-weight:700;color:#111827">${tv.firstName} ${tv.lastName}</div>
                                    <div class="aua-sk-w">${skls}</div>
                                </div>
                            </div>

                            <button class="aua-s-ap" id="btn-svf" style="width:100%;margin-bottom:12px;display:flex;align-items:center;justify-content:center;font-size:16px"><i class="ri-shield-check-fill" style="margin-right:8px;font-size:20px"></i> Verify User</button>
                            <button class="aua-s-re" id="btn-cvf" style="width:100%;font-size:16px">Cancel</button>
                        </div>
                    </div>
                </div>
             `;
        }

        const hAct = au.sb!=='newest' || au.vf!=='all' || au.df!=='' ? true : false;


        appElement.innerHTML = `
            <div class="aua-screen">
                <div class="aua-h">
                    <button class="aua-bck" id="aua-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="aua-t">All Users</div>
                    <button class="aua-fl-b" id="btn-fl"><i class="ri-equalizer-line"></i>${hAct?`<div class="aua-fl-dt"></div>`:''}</button>
                </div>

                <div class="aua-st-w">
                    <div class="aua-st-p"><i class="ri-group-line"></i> ${au.st.t} Total Users</div>
                    <div class="aua-st-p vt"><i class="ri-shield-check-fill"></i> ${au.st.v} Verified</div>
                    <div class="aua-st-p vu"><i class="ri-shield-line"></i> ${au.st.u} Unverified</div>
                </div>

                <div class="aua-sr-w">
                    <div class="aua-sr-c">
                        <i class="ri-search-line aua-sr-i"></i>
                        <input type="text" class="aua-sr" id="aua-si" placeholder="Search by name or skills..." value="${au.qRaw}">
                    </div>
                </div>

                <div class="aua-tb-w">
                    <button class="aua-tb ${au.tb==='all'?'active':''}" data-t="all">All</button>
                    <button class="aua-tb ${au.tb==='workers'?'active':''}" data-t="workers">Workers</button>
                    <button class="aua-tb" id="t-cu">Customers</button>
                    <button class="aua-tb" id="t-su">Suppliers</button>
                </div>

                <div class="aua-wn"><i class="ri-information-fill"></i><div>Showing active workers. Full user management coming in admin v2.</div></div>

                <div class="aua-scr" id="aua-lst"></div>

                ${flt}
                ${vsht}
            </div>
        `;

        au.nLs = document.getElementById('aua-lst');
        runDerivations();
    }

    async function loadData() {
        if(api.getWorkers) {
            try {
                // Fetching workers as primary source since full users endpoint doesn't exist yet
                const rx = await api.getWorkers();
                au.u = rx.data?.content || rx.data || [];
            } catch(e) { showToast('Load fails', 'error'); au.u = []; }
        } else {
            await new Promise(r=>setTimeout(r,800));
            au.u = [
                 {_id:'w1', firstName:'Kasun', lastName:'Perera', role:'worker', isVerified:true, isActive:true, location:{city:'Colombo 03', district:'Colombo'}, skills:['Plumbing','Electrical','Carpentry'], experience:5, hourlyRate:1500, createdAt:new Date(Date.now()-864000000).toISOString()},
                 {_id:'w2', firstName:'Amara', lastName:'Silva', role:'worker', isVerified:false, isActive:true, location:{city:'Kandy Central', district:'Kandy'}, skills:['Cleaning','Gardening'], experience:2, hourlyRate:1000, createdAt:new Date(Date.now()-1864000000).toISOString()},
                 {_id:'w3', firstName:'Ruwan', lastName:'Kumara', role:'worker', isVerified:true, isActive:false, location:{city:'Galle Fort', district:'Galle'}, skills:['Masonry','Painting'], experience:8, hourlyRate:2000, createdAt:new Date(Date.now()-3864000000).toISOString()}
            ];
        }

        au.st.t = au.u.length;
        au.st.v = au.u.filter(x=>x.isVerified).length;
        au.st.u = au.u.filter(x=>!x.isVerified).length;

        au.isLoading = false; auUpdateUI();
    }

    appElement.addEventListener('input', e => {
        if(e.target.id === 'aua-si') {
             au.qRaw = e.target.value;
             if(au.qT) clearTimeout(au.qT);
             au.qT = setTimeout(() => { au.q = au.qRaw; runDerivations(); }, 300);
        }
    });

    appElement.addEventListener('click', e => {
        const tg = e.target;
        if(tg.closest('#aua-bck')) return navigate(-1);

        const tb = tg.closest('.aua-tb');
        if(tb) {
             if(tb.id === 't-cu' || tb.id === 't-su') return showToast('Coming soon in admin v2', 'info');
             if(tb.dataset.t) { au.tb = tb.dataset.t; return runDerivations(); }
        }

        if(tg.closest('#btn-clr')) { au.q=''; au.qRaw=''; au.vf='all'; au.df=''; au.sb='newest'; au.tb='workers'; return auUpdateUI(); }

        if(tg.closest('#btn-fl')) { au.sfl = true; return auUpdateUI(); }
        if(tg.id === 'fl-bg') { au.sfl = false; return auUpdateUI(); }
        
        const dtx = tg.closest('.aua-ck');
        if(dtx && dtx.closest('#dt-mx')) {
             document.querySelectorAll('#dt-mx .aua-ck').forEach(c=>c.classList.remove('active'));
             dtx.classList.add('active');
             au.df = dtx.dataset.d; return;
        }

        if(tg.closest('#btn-re')) { au.sb='newest'; au.vf='all'; au.df=''; return auUpdateUI(); }
        if(tg.closest('#btn-ap')) {
             const rsb = document.querySelector('input[name="fsb"]:checked'); if(rsb) au.sb = rsb.value;
             const rvf = document.querySelector('input[name="fvf"]:checked'); if(rvf) au.vf = rvf.value;
             au.sfl = false; return auUpdateUI();
        }

        const cd = tg.closest('.aua-cd');
        if(cd && !tg.closest('.aua-ax')) return navigate(`/admin/users/${cd.dataset.id}`);

        if(tg.closest('.aua-abtn.vp')) return navigate(`/admin/users/${tg.closest('.aua-cd').dataset.id}`);
        if(tg.closest('.aua-abtn.vf')) {
             const usr = au.u.find(x=>x._id === tg.closest('.aua-cd').dataset.id);
             if(usr) { au.svr = usr; return auUpdateUI(); }
        }

        if(tg.closest('#btn-cvf') || tg.id==='vr-bg') { au.svr = null; return auUpdateUI(); }
        if(tg.closest('#btn-svf')) {
             showToast('User verification is managed server-side. Feature coming in admin v2.', 'info');
             // Optimistic lock
             au.u = au.u.map(x => x._id === au.svr._id ? { ...x, isVerified: true } : x);
             au.st.v++; au.st.u--;
             au.svr = null; return auUpdateUI();
             // TODO: replace with POST /api/admin/users/:id/verify when endpoint exists
        }

    });

    loadData();
}
