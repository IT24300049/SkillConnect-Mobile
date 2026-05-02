// ================================== //
// SkillConnect Mobile                //
// Complaint Detail Admin             //
// ================================== //

async function renderComplaintDetailAdmin(appElement, stateRoute) {
    const role = localStorage.getItem('role') || 'admin';
    if(role !== 'admin') {
         showToast('Access denied', 'error'); return navigate('/');
    }

    const cpId = window.location.pathname.split('/')[3];

    let cd = {
        isLoading: true,
        d: null,
        rn: '', // resolution notes
        sRsv: false, // show resolve sheet
        sRej: false, // show reject sheet
        iRsv: false, // is resolving
        iRej: false, // is rejecting
        iUpd: false, // is updating
        sMn: false   // show menu
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

    function avClr(r) { return r==='customer'?'customer':r==='worker'?'worker':'supplier'; }

    function cdUpdateUI() {
        if(cd.isLoading) {
             appElement.innerHTML = `
                <div class="cda-screen"><div class="cda-h"><div class="cda-bck"><i class="ri-arrow-left-line"></i></div><div class="cda-t">Complaint Detail</div><div class="cda-h-mb"><i class="ri-more-2-fill"></i></div></div>
                <div class="cda-sk-h pk"></div>
                <div class="cda-sk-w"><div class="cda-sk-c"><div class="pk" style="width:120px;height:16px"></div><div class="pk" style="width:100%;height:40px"></div><div class="pk" style="width:100px;height:16px;margin:10px auto"></div><div class="pk" style="width:100%;height:40px"></div></div><div class="cda-sk-c"><div class="pk" style="width:120px;height:16px"></div><div class="pk" style="width:100%;height:100px;margin-top:10px"></div></div></div></div>
             `;
             return;
        }

        const x = cd.d;

        let pc='', pt=''; 
        if(x.priority==='urgent'){ pc='urg'; pt=`<div class="cda-pp urg">🔥 Urgent</div>`; }
        else if(x.priority==='high'){ pc='hi'; pt=`<div class="cda-pp hi">⚡ High</div>`; }
        else if(x.priority==='medium'){ pc='md'; pt=`<div class="cda-pp md">● Medium</div>`; }
        else { pc='low'; pt=`<div class="cda-pp low">○ Low</div>`; }

        let sc='', st='';
        if(x.complaintStatus==='pending'){ sc='nd'; st=`<i class="ri-time-line"></i> Pending`; }
        else if(x.complaintStatus==='investigating'){ sc='in'; st=`<i class="ri-search-line"></i> Investigating`; }
        else if(x.complaintStatus==='resolved'){ sc='rs'; st=`<i class="ri-check-line"></i> Resolved`; }
        else { sc='rj'; st=`<i class="ri-close-line"></i> Rejected`; }

        let sDsc = '';
        if(x.complaintStatus==='pending') sDsc = `<div class="cda-hi nd"><i class="ri-information-line" style="font-size:16px"></i> ⏱ This complaint is awaiting admin review.</div>`;
        else if(x.complaintStatus==='investigating') sDsc = `<div class="cda-hi in"><i class="ri-search-line" style="font-size:16px"></i> 🔍 This complaint is under investigation.</div>`;
        else if(x.complaintStatus==='resolved') sDsc = `<div class="cda-hi rs"><i class="ri-checkbox-circle-fill" style="font-size:16px"></i> ✓ Resolved ${rlt(x.resolvedAt||x.updatedAt)}</div>`;
        else sDsc = `<div class="cda-hi rj"><i class="ri-close-circle-fill" style="font-size:16px"></i> ✗ Rejected ${rlt(x.resolvedAt||x.updatedAt)}</div>`;

        let cc = (x.complainant?.firstName||'')+' '+(x.complainant?.lastName||'');
        let ca = (x.complainedAgainst?.firstName||'')+' '+(x.complainedAgainst?.lastName||'');

        let bk = '';
        if(x.booking) {
             bk = `
                <div class="cda-c">
                    <div class="cda-ct">Related Booking</div>
                    <div class="cda-bk-w" id="btn-vbk">
                        <div>
                            <div style="display:flex;align-items:center;gap:6px"><i class="ri-briefcase-4-fill" style="color:#6B7280"></i> <div class="cda-b-nm">${x.booking.jobTitle||'Booking'}</div></div>
                            <div class="cda-b-id">#${x.booking._id?.slice(-8)}</div>
                        </div>
                        <i class="ri-arrow-right-s-line cda-b-lk"></i>
                    </div>
                </div>
             `;
        }

        // Timeline
        let ts2='', tc2='';
        if(x.complaintStatus==='pending'){ ts2='a'; tc2='Under Review'; } else { ts2='c'; tc2='Reviewed'; }
        
        let ts3='', tc3='';
        if(x.complaintStatus==='investigating'){ ts3='a'; tc3='Investigation'; } else if(['resolved','rejected'].includes(x.complaintStatus)){ ts3='c'; tc3='Investigation Complete'; } else { ts3=''; tc3='Investigation'; }

        let ts4='', tc4='';
        if(x.complaintStatus==='resolved'){ ts4='c'; tc4=`Resolved ${rlt(x.resolvedAt||x.updatedAt)}`; } else if(x.complaintStatus==='rejected'){ ts4='f'; tc4=`Rejected ${rlt(x.resolvedAt||x.updatedAt)}`; } else { ts4=''; tc4='Resolution'; }

        // Resolution
        let resB = '';
        if(x.resolutionNotes || ['resolved','rejected'].includes(x.complaintStatus)) {
             if(x.resolutionNotes) {
                 resB = `
                    <div class="cda-c">
                        <div class="cda-ct">Resolution</div>
                        <div class="cda-res-w ${sc}">
                            <div class="cda-rn-t">${x.resolutionNotes}</div>
                            <div class="cda-rn-mt" style="margin-top:6px">${x.complaintStatus==='resolved'?'Resolved':'Rejected'} ${rlt(x.resolvedAt||x.updatedAt)}</div>
                        </div>
                    </div>
                 `;
             } else {
                 resB = `<div class="cda-c"><div class="cda-ct">Resolution</div><div class="cda-rn-mt">Resolution notes will appear here once the complaint is resolved.</div></div>`;
             }
        } else if(['pending','investigating'].includes(x.complaintStatus)) {
             resB = `<div class="cda-c"><div class="cda-ct">Resolution</div><div class="cda-rn-mt">Resolution notes will appear here once the complaint is resolved.</div></div>`;
        }

        // Admin Actions
        let aAct = '';
        if(x.complaintStatus==='pending') {
             aAct = `
                <div class="cda-c">
                    <div class="cda-ct">Admin Actions</div>
                    <button class="cda-ab-btn rs" id="btn-sinv" style="width:100%;background:#2563EB">${cd.iUpd?'...':'Start Investigation'}</button>
                </div>
             `;
        } else if(x.complaintStatus==='investigating') {
             aAct = `
                <div class="cda-c" id="cda-ax">
                    <div class="cda-ct">Admin Actions</div>
                    <div class="cda-lbl">Resolution Notes <span class="cda-req">*</span></div>
                    <textarea class="cda-ta" id="in-rn" placeholder="Describe the outcome and any actions taken. Both parties will see this note." maxlength="500">${cd.rn}</textarea>
                    <div class="cda-cc">${cd.rn.length} / 500</div>
                    <div class="cda-ab-rw">
                        <button class="cda-ab-btn rs" id="btn-rsv">Resolve Complaint</button>
                        <button class="cda-ab-btn rj" id="btn-rjc">Reject Complaint</button>
                    </div>
                </div>
             `;
        } else {
             aAct = `<div class="cda-c"><div class="cda-cl-w">This complaint has been closed.<br>No further actions available.</div></div>`;
        }

        // Bottom sheets
        let shRsv = '';
        if(cd.sRsv) {
             shRsv = `<div class="cda-sbg active" id="sr-bg"><div class="cda-sht"><div class="cda-dh"></div><div class="cda-sh-t">Resolve this complaint?</div><div class="cda-sh-s">Both parties will be notified that this complaint has been resolved.</div>
                ${cd.rn.trim()?`<div class="cda-prv">${cd.rn.substring(0,100)}${cd.rn.length>100?'...':''}</div>`:`<div class="cda-prv err">Please add resolution notes before resolving.</div>`}
                <button class="cda-sh-fb gr" id="sr-do" ${!cd.rn.trim()?'disabled':''}>${cd.iRsv?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite;margin:0 auto"></div>`:'Confirm Resolution'}</button>
                <button class="cda-sh-fl" id="sr-cn">Cancel</button>
             </div></div>`;
        }

        let shRej = '';
        if(cd.sRej) {
             shRej = `<div class="cda-sbg active" id="sj-bg"><div class="cda-sht"><div class="cda-dh"></div><div class="cda-sh-t">Reject this complaint?</div><div class="cda-sh-s">The complaint will be marked as rejected. The complainant will be notified that no action will be taken.</div>
                <div class="cda-wrn">⚠ Only reject if the complaint is found to be false, duplicate, or without merit.</div>
                ${cd.rn.trim()?`<div class="cda-prv">${cd.rn.substring(0,100)}${cd.rn.length>100?'...':''}</div>`:`<div class="cda-prv err">Please add resolution notes before rejecting.</div>`}
                <button class="cda-sh-fb rd" id="sj-do" ${!cd.rn.trim()?'disabled':''}>${cd.iRej?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite;margin:0 auto"></div>`:'Confirm Rejection'}</button>
                <button class="cda-sh-fl" id="sj-cn">Cancel</button>
             </div></div>`;
        }

        // Action bar
        let btB = '';
        if(x.complaintStatus==='pending') {
             btB = `<div class="cda-bb"><button class="cda-bbtn blue" id="btn-sinv2">${cd.iUpd?'...':'Start Investigation'}</button></div>`;
        } else if(x.complaintStatus==='investigating') {
             btB = `<div class="cda-bb"><button class="cda-ab-btn rs" id="btn-rsv2" style="flex:1">Resolve</button><button class="cda-ab-btn rj" id="btn-rjc2" style="flex:1">Reject</button></div>`;
        } else {
             btB = `<div class="cda-bb"><div class="cda-bi ${sc}"><i class="ri-${x.complaintStatus==='resolved'?'check':'close'}-line"></i> Complaint ${x.complaintStatus==='resolved'?'Resolved':'Rejected'}</div></div>`;
        }

        appElement.innerHTML = `
            <div class="cda-screen" id="cda-scx">
                <div class="cda-h">
                    <button class="cda-bck" id="cda-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="cda-t">Complaint Detail</div>
                    <button class="cda-h-mb" id="btn-mnu"><i class="ri-more-2-fill"></i>
                        <div class="cda-mnu ${cd.sMn?'active':''}" id="cda-mn">
                            <div class="cda-mi" data-id="${x.complainant?._id}">View Complainant Profile</div>
                            <div class="cda-mi" data-id="${x.complainedAgainst?._id}">View Accused Profile</div>
                            ${x.complaintStatus==='pending'?`<div class="cda-mi" id="mn-in">Mark as Investigating</div>`:''}
                            ${x.booking?`<div class="cda-mi" id="mn-bk">View Linked Booking</div>`:''}
                        </div>
                    </button>
                </div>

                <div class="cda-scr" id="cda-sb">
                    <div class="cda-her ${pc}" style="margin:-16px -16px 0 -16px">
                        <div class="cda-tr">${pt}<div class="cda-sp ${sc}">${st}</div><div class="cda-id">#${x._id.slice(-8)}</div></div>
                        <div class="cda-ht">${x.complaintTitle}</div>
                        <div class="cda-hc">${x.complaintCategory.replace(/_/g,' ')}</div>
                        <div class="cda-hf">Filed ${rlt(x.createdAt)}</div>
                        ${sDsc}
                    </div>

                    <div class="cda-c" style="margin-top:16px">
                        <div class="cda-ct">Parties Involved</div>
                        
                        <div class="cda-p-bl">
                            <div class="cda-plb">Filed By</div>
                            <div class="cda-pw">
                                <div class="aca-av ${avClr(x.complainant?.role)}">${cc.substring(0,1)}</div>
                                <div><div class="cda-p-nm">${cc}</div><div class="aca-rl-p ${avClr(x.complainant?.role)}">${Math.random()>0.5?x.complainant?.role:'Customer'}</div></div>
                            </div>
                            <button class="cda-vp" data-id="${x.complainant?._id}">View Profile</button>
                        </div>

                        <div class="cda-vs-w"><div class="cda-vs-l"></div><div class="cda-vs-t">VS</div><div class="cda-vs-l"></div></div>

                        <div class="cda-p-bl">
                            <div class="cda-plb">Complaint Against</div>
                            <div class="cda-pw">
                                <div class="aca-av ${avClr(x.complainedAgainst?.role)}">${ca.substring(0,1)}</div>
                                <div><div class="cda-p-nm">${ca}</div><div class="aca-rl-p ${avClr(x.complainedAgainst?.role)}">${Math.random()>0.5?x.complainedAgainst?.role:'Worker'}</div></div>
                            </div>
                            <button class="cda-vp" data-id="${x.complainedAgainst?._id}">View Profile</button>
                        </div>
                    </div>

                    <div class="cda-c">
                        <div class="cda-ct">Complaint</div>
                        <div class="cda-ds-l">Full Description</div>
                        <div class="cda-tx">${x.complaintDescription}</div>
                    </div>

                    ${bk}

                    <div class="cda-c">
                        <div class="cda-ct">Complaint Timeline</div>
                        <div class="cda-tl-w">
                            <div class="cda-tl-st c"><div class="cda-tl-l"></div><div class="cda-tl-d"></div><div class="cda-tl-t">Complaint Filed</div><div class="cda-tl-s">${rlt(x.createdAt)}</div></div>
                            <div class="cda-tl-st ${ts2}"><div class="cda-tl-l"></div><div class="cda-tl-d"></div><div class="cda-tl-t">${tc2}</div></div>
                            <div class="cda-tl-st ${ts3}"><div class="cda-tl-l"></div><div class="cda-tl-d"></div><div class="cda-tl-t">${tc3}</div></div>
                            <div class="cda-tl-st ${ts4}"><div class="cda-tl-l"></div><div class="cda-tl-d"></div><div class="cda-tl-t">${tc4}</div></div>
                        </div>
                    </div>

                    ${resB}
                    ${aAct}
                </div>

                ${btB}
                ${shRsv}
                ${shRej}
            </div>
        `;
    }

    async function loadData() {
        if(api.getAllComplaints) {
            try {
                const rx = await api.getAllComplaints();
                const mx = (rx.data?.content || rx.data || []).find(c=>c._id === cpId);
                if(!mx) { showToast('Not found', 'error'); return navigate(-1); }
                cd.d = mx;
                cd.rn = mx.resolutionNotes || '';
            } catch(e) { showToast('Not found', 'error'); return navigate(-1); }
        } else {
            await new Promise(r=>setTimeout(r,800));
            // Mock Data
            cd.d = {_id: cpId, complainant:{_id:'u1', firstName:'Amara', lastName:'Silva', role:'customer'}, complainedAgainst:{_id:'u2', firstName:'Kasun', lastName:'Perera', role:'worker'}, booking:{_id:'b1', jobTitle:'Deep Clean Kitchen'}, complaintTitle:'Worker arrived 3 hours late and drunk', complaintDescription:'Worker showed up 3 hours after the scheduled time, requested advance money immediately, and was clearly under the influence of alcohol. He yelled at my neighbors.', complaintCategory:'inappropriate_behaviour', complaintStatus:'investigating', priority:'urgent', createdAt:new Date(Date.now()-86400000).toISOString(), updatedAt:new Date().toISOString()};
            cd.rn = '';
        }
        cd.isLoading = false; cdUpdateUI();
    }


    appElement.addEventListener('input', e => {
        if(e.target.id === 'in-rn') { cd.rn = e.target.value; cdUpdateUI(); }
    });

    appElement.addEventListener('click', async e => {
        const tg = e.target;
        if(tg.closest('#cda-bck')) return navigate(-1);

        if(tg.closest('#btn-mnu')) { cd.sMn = !cd.sMn; return cdUpdateUI(); }
        if(!tg.closest('#cda-mn') && cd.sMn) { cd.sMn = false; return cdUpdateUI(); }

        const mv = tg.closest('.cda-mi');
        if(mv && mv.dataset.id) return navigate(`/admin/users/${mv.dataset.id}`);
        if(mv && mv.id === 'mn-in') {
             cd.iUpd = true; cd.sMn=false; cdUpdateUI();
             if(api.updateComplaintStatus) { try { await api.updateComplaintStatus(cpId, { status: 'investigating', resolutionNotes: '' }); } catch(er){} } else await new Promise(r=>setTimeout(r,600));
             cd.iUpd = false; cd.d.complaintStatus = 'investigating'; cd.d.updatedAt = new Date().toISOString(); showToast('Status updated to Investigating', 'success'); return cdUpdateUI();
        }
        if(mv && mv.id === 'mn-bk' || tg.closest('#btn-vbk')) { showToast('Booking detail coming soon for admin', 'info'); return; }
        if(tg.closest('.cda-vp')) return navigate(`/admin/users/${tg.closest('.cda-vp').dataset.id}`);


        if(tg.closest('#btn-sinv') || tg.closest('#btn-sinv2')) {
             if(cd.iUpd) return;
             cd.iUpd = true; cdUpdateUI();
             if(api.updateComplaintStatus) { try { await api.updateComplaintStatus(cpId, { status: 'investigating', resolutionNotes: '' }); } catch(er){} } else await new Promise(r=>setTimeout(r,600));
             cd.iUpd = false; cd.d.complaintStatus = 'investigating'; cd.d.updatedAt = new Date().toISOString(); showToast('Status updated to Investigating', 'success'); return cdUpdateUI();
        }

        if(tg.closest('#btn-rsv') || tg.closest('#btn-rsv2')) {
             if(!cd.rn.trim()) { 
                 const ac = document.getElementById('cda-ax'); if(ac) ac.scrollIntoView({behavior:'smooth'});
                 return;
             }
             cd.sRsv = true; return cdUpdateUI();
        }

        if(tg.closest('#sr-cn') || tg.id==='sr-bg') { cd.sRsv=false; return cdUpdateUI(); }

        if(tg.closest('#sr-do')) {
             if(cd.iRsv) return;
             cd.iRsv = true; cdUpdateUI();
             if(api.updateComplaintStatus) { try { await api.updateComplaintStatus(cpId, { status: 'resolved', resolutionNotes: cd.rn.trim() }); } catch(er){} } else await new Promise(r=>setTimeout(r,800));
             cd.iRsv = false; cd.sRsv = false; cd.d.complaintStatus = 'resolved'; cd.d.resolutionNotes = cd.rn.trim(); cd.d.resolvedAt = new Date().toISOString();
             showToast('Complaint resolved ✓', 'success'); cdUpdateUI();
             const sb = document.getElementById('cda-sb'); if(sb) sb.scrollTo({top:0,behavior:'smooth'}); return;
        }

        if(tg.closest('#btn-rjc') || tg.closest('#btn-rjc2')) {
             if(!cd.rn.trim()) { 
                 const ac = document.getElementById('cda-ax'); if(ac) ac.scrollIntoView({behavior:'smooth'});
                 return;
             }
             cd.sRej = true; return cdUpdateUI();
        }

        if(tg.closest('#sj-cn') || tg.id==='sj-bg') { cd.sRej=false; return cdUpdateUI(); }

        if(tg.closest('#sj-do')) {
             if(cd.iRej) return;
             cd.iRej = true; cdUpdateUI();
             if(api.updateComplaintStatus) { try { await api.updateComplaintStatus(cpId, { status: 'rejected', resolutionNotes: cd.rn.trim() }); } catch(er){} } else await new Promise(r=>setTimeout(r,800));
             cd.iRej = false; cd.sRej = false; cd.d.complaintStatus = 'rejected'; cd.d.resolutionNotes = cd.rn.trim(); cd.d.resolvedAt = new Date().toISOString();
             showToast('Complaint rejected', 'error'); cdUpdateUI();
             const sb = document.getElementById('cda-sb'); if(sb) sb.scrollTo({top:0,behavior:'smooth'}); return;
        }
    });

    loadData();
}
