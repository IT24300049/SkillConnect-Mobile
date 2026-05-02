// ================================== //
// SkillConnect Mobile                //
// User Detail Admin                  //
// ================================== //

async function renderUserDetailAdmin(appElement, stateRoute) {
    const role = localStorage.getItem('role') || 'admin';
    if(role !== 'admin') {
         showToast('Access denied', 'error'); return navigate('/');
    }

    const uId = window.location.pathname.split('/')[3];

    let ud = {
        isLoading: true,
        u: null,
        sMn: false, // menu
        sv: false, // show verify sheet
        sd: false, // show deactivate sheet
        dr: '', // deactivate reason
        iD: false, // is deactivating
        iV: false // is verifying
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

    function avClr(r) { return r==='customer'?'cu':r==='worker'?'wk':'su'; }

    function udUpdateUI() {
        if(ud.isLoading) {
             appElement.innerHTML = `
                <div class="uda-screen"><div class="uda-h"><div class="uda-bck"><i class="ri-arrow-left-line"></i></div><div class="uda-t">User Profile</div><div class="uda-mn-b"><i class="ri-more-2-fill"></i></div></div>
                <div class="uda-sk-h"><div class="pk" style="width:90px;height:90px;border-radius:50%;margin:24px auto"></div><div class="pk" style="width:200px;height:24px;margin:12px auto"></div><div class="pk" style="width:140px;height:16px;margin:12px auto"></div></div>
                <div class="uda-sk-w"><div class="uda-sk-c"><div class="pk" style="width:100%;height:100px"></div></div></div></div>
             `;
             return;
        }

        const x = ud.u;
        const avl = (x.firstName||'U').substring(0,1);
        const nm = (x.firstName||'') + ' ' + (x.lastName||'');
        
        let skls = '';
        if(x.skills && x.skills.length) { x.skills.forEach(s => skls += `<div class="uda-cp">${s}</div>`); }
        else skls = `<div class="uda-cx">No skills listed</div>`;

        // Account Status Badge
        let abg = '', atx = '';
        if(x.isActive && x.isVerified) { abg = 'grn'; atx = '<i class="ri-checkbox-circle-fill"></i> Active · Verified'; }
        else if(x.isActive && !x.isVerified) { abg = 'amb'; atx = '<i class="ri-information-fill"></i> Active · Unverified'; }
        else { abg = 'red'; atx = '<i class="ri-close-circle-fill"></i> Inactive'; }

        // Mocks for rating
        const rT = (Math.random()*(5-4)+4).toFixed(1);
        const rC = Math.floor(Math.random()*50)+10;

        // Admin Account Info
        let ast = '';
        if(x.isVerified) ast += `<div class="uda-ar"><div class="uda-arl">Verified</div><div class="uda-icr"><i class="ri-check-line"></i> Verified</div></div>`;
        else ast += `<div class="uda-ar"><div class="uda-arl">Verified</div><div class="uda-icu"><i class="ri-information-line"></i> Not Verified</div></div>`;

        if(x.isActive) ast += `<div class="uda-ar"><div class="uda-arl">Status</div><div class="uda-icr"><i class="ri-user-smile-fill"></i> Active</div></div>`;
        else ast += `<div class="uda-ar"><div class="uda-arl">Status</div><div class="uda-icf"><i class="ri-user-forbid-fill"></i> Inactive</div></div>`;

        // Action Buttons Top
        let aAct = '';
        if(!x.isVerified) {
             aAct += `
                <div class="uda-ax1">
                    <div class="uda-axt">Verify this user</div>
                    <div class="uda-axd">Grant verified badge to this account</div>
                    <button class="uda-aob" id="btn-vvf">Verify User</button>
                </div>
             `;
        } else {
             aAct += `
                <div class="uda-ax1">
                    <div class="uda-aok"><i class="ri-check-double-line" style="font-size:18px"></i> This user is verified</div>
                    <div style="text-align:right;margin-top:6px"><button class="uda-are" id="btn-uvf">Remove Verification</button></div>
                </div>
             `;
        }
        
        if(x.isActive) {
            aAct += `
                <div class="uda-ax2">
                    <div class="uda-axt r">Deactivate Account</div>
                    <div class="uda-axd r">The user will no longer be able to access SkillConnect.</div>
                    <button class="uda-ara" id="btn-vda">Deactivate</button>
                </div>
            `;
        }

        // Bottom Actions
        let btB = '';
        if(x.isActive && !x.isVerified) {
             btB = `<div class="uda-bbtn vf" id="btn-vf2">Verify User</div><div class="uda-bbtn da" id="btn-da2">Deactivate</div>`;
        } else if(x.isActive && x.isVerified) {
             btB = `<div class="uda-bbtn da" id="btn-da2" style="width:100%">Deactivate</div>`;
        } else {
             btB = `<button class="uda-bbtn ra" id="btn-ra2" style="width:100%"><i class="ri-restart-line" style="margin-right:8px;font-size:18px"></i> Reactivate</button>`;
        }

        let vsht = '';
        if(ud.sv) {
             vsht = `
                <div class="uda-sbg active" id="vr-bg">
                    <div class="uda-sht">
                        <div class="uda-dh"></div>
                        <div style="padding:0 20px 20px">
                            <div style="font-size:20px;font-weight:800;color:#111827;margin-bottom:8px">Verify ${x.firstName}?</div>
                            <div style="font-size:14px;color:#6B7280;margin-bottom:20px;line-height:1.5">This will mark ${x.firstName} as a verified worker on SkillConnect. They will receive a verified badge on their profile.</div>
                            
                            <div class="uda-ar" style="background:#F3F4F6;border-radius:12px;padding:16px;margin-bottom:24px;border:none">
                                <div class="uda-av-w" style="width:40px;height:40px;margin:0"><div class="uda-av ${avClr(x.role)}" style="font-size:16px">${avl}</div></div>
                                <div style="flex:1;text-align:left;padding-left:12px">
                                    <div style="font-size:15px;font-weight:700;color:#111827">${nm}</div>
                                    <div class="uda-rol ${avClr(x.role)}" style="margin-top:4px">${x.role}</div>
                                </div>
                            </div>

                            <button class="uda-fb gr" id="btn-svf" style="display:flex;align-items:center;justify-content:center"><i class="ri-shield-check-fill" style="margin-right:8px;font-size:20px"></i> Verify User</button>
                            <button class="uda-fl" id="btn-cvf">Cancel</button>
                        </div>
                    </div>
                </div>
             `;
        }

        let dsht = '';
        if(ud.sd) {
             dsht = `
                <div class="uda-sbg active" id="ds-bg">
                    <div class="uda-sht">
                        <div class="uda-dh"></div>
                        <div class="uda-sh-t">Deactivate ${x.firstName}'s account?</div>
                        <div class="uda-sh-s">The user will be logged out and unable to access SkillConnect until reactivated.</div>
                        <div class="uda-wrn">⚠ This affects all active jobs and bookings associated with this account.</div>
                        <div class="uda-lbl">Reason for deactivation</div>
                        <textarea class="uda-ta" id="in-dr" placeholder="e.g. Multiple complaints received, suspected fraud..." maxlength="300">${ud.dr}</textarea>
                        <button class="uda-fb rd" id="ds-do" ${ud.dr.trim().length<20?'disabled':''}>Deactivate Account</button>
                        <button class="uda-fl" id="ds-cn">Cancel</button>
                    </div>
                </div>
             `;
        }

        appElement.innerHTML = `
            <div class="uda-screen">
                <div class="uda-h">
                    <button class="uda-bck" id="uda-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="uda-t">User Profile</div>
                    <button class="uda-mn-b" id="btn-mnu"><i class="ri-more-2-fill"></i>
                        <div class="uda-mnu ${ud.sMn?'active':''}" id="uda-mn">
                            ${x.isActive?`<div class="uda-mi rd" id="mn-dact">Deactivate Account</div>`:`<div class="uda-mi" id="mn-ract" style="color:#16A34A">Reactivate Account</div>`}
                            <div class="uda-mi" id="mn-warn">Send Warning</div>
                            <div class="uda-mi" id="mn-cmp">View Complaints</div>
                        </div>
                    </button>
                </div>

                <div class="uda-amb"><i class="ri-shield-star-fill" style="color:#0D9488"></i> <div class="uda-amb-t">Admin View — ${nm}'s Profile</div></div>

                <div class="uda-scr">
                    <div class="uda-her">
                        <div class="uda-av-w"><div class="uda-av ${avClr(x.role)}">${avl}</div>${x.isVerified?`<div class="uda-vb"><i class="ri-check-line"></i></div>`:''}</div>
                        <div class="uda-nm">${nm}</div>
                        <div class="uda-lc"><i class="ri-map-pin-line"></i> ${x.location?.city||'Unknown'}, ${x.location?.district||'Unknown'} · <i class="ri-calendar-event-line" style="margin-left:4px"></i> Joined ${new Date(x.createdAt||0).getFullYear()}</div>
                        <div class="uda-ast-c"><div class="uda-ast ${abg}">${atx}</div></div>

                        <div class="uda-stt-g">
                            <div class="uda-stt-i"><div class="uda-stt-n rt"><i class="ri-star-fill"></i> ${rT}</div><div class="uda-stt-l">(${rC} Reviews)</div></div>
                            <div class="uda-stt-i"><div class="uda-stt-n">LKR ${x.hourlyRate||0}</div><div class="uda-stt-l">Per Hour</div></div>
                            <div class="uda-stt-i"><div class="uda-stt-n">${x.skills?.length||0}</div><div class="uda-stt-l">Core Skills</div></div>
                        </div>
                    </div>

                    <div class="uda-c-w">
                        <div class="uda-c"><div class="uda-ct">About</div><div class="uda-cx">${x.aboutMe || 'No description provided.'}</div></div>
                        <div class="uda-c"><div class="uda-ct">Skills & Rates</div><div class="uda-cw">${skls}</div><div class="uda-cx" style="margin-top:12px;display:flex;justify-content:space-between"><span>Base Hourly Rate:</span><span style="font-weight:700">LKR ${x.hourlyRate||0}</span></div></div>
                        
                        <div class="uda-c">
                            <div class="uda-ct">Account Information</div>
                            <div class="uda-ar"><div class="uda-arl">User ID</div><div class="uda-arv"><div class="uda-ari" id="btn-cp-id" data-id="${x._id}"><i class="ri-file-copy-line"></i> ${x._id}</div></div></div>
                            <div class="uda-ar"><div class="uda-arl">Role</div><div class="uda-arv"><div class="uda-rol ${avClr(x.role)}">${x.role}</div></div></div>
                            <div class="uda-ar"><div class="uda-arl">Email</div><div class="uda-arv">${x.email}</div></div>
                            <div class="uda-ar"><div class="uda-arl">Phone</div><div class="uda-arv">${x.phone||'N/A'}</div></div>
                            <div class="uda-ar"><div class="uda-arl">Joined</div><div class="uda-arv">${new Date(x.createdAt||0).toLocaleString()}</div></div>
                            <div class="uda-ar"><div class="uda-arl">Last updated</div><div class="uda-arv">${rlt(x.updatedAt)}</div></div>
                            ${ast}
                        </div>

                        <div class="uda-c"><div class="uda-ct">Location</div><div class="uda-cx"><i class="ri-map-pin-2-line" style="margin-right:6px"></i>${x.location?.address||'Unknown'}, ${x.location?.city||'Unknown'}</div></div>

                        <div class="uda-c">
                            <div class="uda-ct">Complaint History</div>
                            <div class="uda-cb">
                                <i class="ri-folder-warning-line uda-ci"></i>
                                <div class="uda-cbt">View complaints involving this user in the complaints dashboard.</div>
                                <button class="uda-cbtn" id="btn-vcp">View Complaints</button>
                            </div>
                        </div>

                        <div class="uda-c">
                            <div class="uda-ct">Admin Actions</div>
                            ${aAct}
                        </div>
                    </div>
                </div>

                <div class="uda-bb">${btB}</div>
                ${vsht}
                ${dsht}
            </div>
        `;
    }

    async function loadData() {
        if(api.getWorkerById) {
            try {
                // Fetch using worker endpoint first.
                const rx = await api.getWorkerById(uId);
                ud.u = rx.data?.content || rx.data;
            } catch(e) {
                showToast('User not found or limited access', 'error');
                return navigate(-1);
            }
        } else {
            await new Promise(r=>setTimeout(r,800));
            ud.u = {_id: uId, firstName:'Kasun', lastName:'Perera', email:'kasun.p@example.com', phone:'+94711234567', role:'worker', isVerified:false, isActive:true, aboutMe:'Professional plumber...', location:{address:'No 12, Galle Rd', city:'Colombo 03', district:'Colombo'}, skills:['Plumbing','Electrical'], hourlyRate:1500, createdAt:new Date(Date.now()-864000000).toISOString(), updatedAt:new Date().toISOString()};
        }
        
        ud.isLoading = false; udUpdateUI();
    }

    appElement.addEventListener('input', e => {
        if(e.target.id === 'in-dr') { ud.dr = e.target.value; udUpdateUI(); }
    });

    appElement.addEventListener('click', e => {
        const tg = e.target;
        if(tg.closest('#uda-bck')) return navigate(-1);

        if(tg.closest('#btn-mnu')) { ud.sMn = !ud.sMn; return udUpdateUI(); }
        if(!tg.closest('#uda-mn') && ud.sMn) { ud.sMn = false; return udUpdateUI(); }

        if(tg.id === 'mn-dact' || tg.closest('#btn-vda') || tg.closest('#btn-da2')) { ud.sd = true; ud.sMn=false; return udUpdateUI(); }
        if(tg.id === 'mn-warn') { showToast('Warning system coming soon', 'info'); ud.sMn=false; return udUpdateUI(); }
        if(tg.id === 'mn-cmp' || tg.closest('#btn-vcp')) {
            // Note: Router state passing is handled implicitly or via history in a real app.
            showToast('Filtering complaints...', 'info');
            return setTimeout(()=> navigate('/admin/complaints'), 500); 
        }

        if(tg.closest('#btn-vvf') || tg.closest('#btn-vf2')) { ud.sv = true; ud.sMn=false; return udUpdateUI(); }
        if(tg.id === 'btn-uvf') return showToast('Feature coming in admin v2', 'info');
        
        if(tg.id === 'mn-ract' || tg.closest('#btn-ra2')) {
             showToast('Reactivation coming in admin v2', 'info');
             ud.u.isActive = true; return udUpdateUI();
        }

        // Clip string
        if(tg.closest('#btn-cp-id')) {
             navigator.clipboard.writeText(tg.closest('#btn-cp-id').dataset.id);
             return showToast('ID copied to clipboard', 'success');
        }

        // Verify
        if(tg.closest('#btn-cvf') || tg.id==='vr-bg') { ud.sv=false; return udUpdateUI(); }
        if(tg.closest('#btn-svf')) {
             showToast('User verification is managed server-side. Feature coming in admin v2.', 'info');
             ud.sv = false; ud.u.isVerified = true; return udUpdateUI();
             // TODO: POST /api/admin/users/:id/verify when endpoint exists
        }

        // Deactivate
        if(tg.closest('#ds-cn') || tg.id==='ds-bg') { ud.sd=false; return udUpdateUI(); }
        if(tg.closest('#ds-do')) {
             showToast('Account deactivation is managed server-side. Feature coming in admin v2.', 'error');
             ud.sd = false; ud.u.isActive = false; ud.dr = ''; return udUpdateUI();
             // TODO: PATCH /api/admin/users/:id
        }
    });

    loadData();
}
