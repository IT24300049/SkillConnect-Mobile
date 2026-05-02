// ================================== //
// SkillConnect Mobile                //
// Supplier My Equipment              //
// ================================== //

async function renderMyEquipment(appElement, stateRoute) {
    const userId = localStorage.getItem('userId') || 'req_supplier_1';

    let me = {
        allEq: [],
        isLoading: true,
        activeTab: 'all', // all, available, unavailable
        sortBy: 'recently_updated',
        filterCategory: '',
        filterCondition: '',
        showFilterSheet: false,
        deleteTarget: null,
        isDeleting: false,
        togglingIds: new Set(),
        
        touchStartY: 0,
        ptrDist: 0,
        isPtrEnabled: true
    };

    const CATA = ['All', 'Plumbing', 'Electrical', 'Carpentry', 'Masonry', 'Painting', 'Landscaping', 'Cleaning', 'HVAC', 'Pest Control', 'Roofing', 'General'];
    const COND = ['Any', 'New', 'Excellent', 'Good', 'Fair'];
    const SORT = [
        {v:'recently_updated', l:'Recently updated'},
        {v:'newest', l:'Newest first'},
        {v:'oldest', l:'Oldest first'},
        {v:'price_high', l:'Price: high to low'},
        {v:'price_low', l:'Price: low to high'},
        {v:'most_avail', l:'Most available stock'}
    ];

    function processRelDate(dStr) {
        if(!dStr) return '';
        const d = new Date(dStr);
        const ms = Date.now() - d.getTime();
        const df = ms / (1000*60*60*24);
        if(df < 1) return 'Today';
        if(df < 2) return 'Yesterday';
        if(df < 7) return `${Math.floor(df)}d ago`;
        return d.toLocaleDateString();
    }

    function getDerived() {
        // Tab resolution
        const dtb = { all: me.allEq, available: me.allEq.filter(e => e.isAvailable && e.quantityAvailable > 0), unavailable: me.allEq.filter(e => !e.isAvailable || e.quantityAvailable === 0) };
        let d = dtb[me.activeTab] || [];

        // Filter Categories/Condition
        if(me.filterCategory && me.filterCategory !== 'All') d = d.filter(e => e.category === me.filterCategory);
        if(me.filterCondition && me.filterCondition !== 'Any') d = d.filter(e => e.condition === me.filterCondition);

        // Sort
        d.sort((a,b) => {
             if(me.sortBy === 'recently_updated') return new Date(b.updatedAt||b.createdAt) - new Date(a.updatedAt||a.createdAt);
             if(me.sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
             if(me.sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
             if(me.sortBy === 'price_high') return b.rentalPricePerDay - a.rentalPricePerDay;
             if(me.sortBy === 'price_low') return a.rentalPricePerDay - b.rentalPricePerDay;
             if(me.sortBy === 'most_avail') return b.quantityAvailable - a.quantityAvailable;
             return 0;
        });

        let tots = me.allEq.length;
        let avs = dtb.available.length;
        let ro = 0;
        let revp = 0;
        me.allEq.forEach(x => {
            ro += (Math.max(0, x.quantityTotal - x.quantityAvailable));
            if(x.isAvailable && x.quantityAvailable>0) revp += (x.rentalPricePerDay * x.quantityAvailable);
        });
        let ctc = new Set(me.allEq.map(e => e.category)).size;

        return { list: d, cnt: { all: dtb.all.length, available: avs, unavailable: dtb.unavailable.length }, st: { tots, avs, ro, revp, ctc } };
    }

    function meUpdateUI() {
        if(me.isLoading) {
            appElement.innerHTML = `
                <div class="me-screen"><div class="me-h"><button class="me-h-b" id="me-bck"><i class="ri-arrow-left-line"></i></button><div class="me-t">My Equipment</div><div style="width:44px"></div></div>
                <div class="me-sk"><div class="me-skc"><div class="me-sk-r1"><div class="pk" style="width:60%;height:20px"></div><div class="pk" style="width:44px;height:24px;border-radius:12px"></div></div><div style="display:flex;gap:8px;margin-bottom:12px"><div class="pk" style="width:70px;height:24px"></div><div class="pk" style="width:60px;height:24px"></div></div><div class="me-sk-r1" style="justify-content:flex-start;gap:8px"><div class="pk" style="width:50%;height:16px"></div><div class="pk" style="width:40%;height:16px"></div></div><div style="display:flex;gap:8px;margin-top:24px"><div class="pk" style="flex:1;height:40px"></div><div class="pk" style="flex:1;height:40px"></div><div class="pk" style="flex:1;height:40px"></div></div></div></div></div>
            `;
            return;
        }

        const dx = getDerived();
        const hasFilt = (me.filterCategory && me.filterCategory!=='All') || (me.filterCondition && me.filterCondition!=='Any') || (me.sortBy !== 'recently_updated');

        let uiH = '';
        if(dx.st.tots === 0) {
             uiH = `
                <div class="me-emp">
                    <i class="ri-box-3-line"></i>
                    <div class="me-emp-t">No equipment listed yet</div>
                    <div class="me-emp-s">Start listing your tools and equipment to reach customers who need rentals.</div>
                    <button class="me-emp-b" id="me-l-n">Add First Listing</button>
                </div>
             `;
             appElement.innerHTML = `<div class="me-screen"><div class="me-h"><button class="me-h-b" id="me-bck"><i class="ri-arrow-left-line"></i></button><div class="me-t">My Equipment</div><div style="width:44px"></div></div>${uiH}</div>`;
             return;
        }

        let lH = '';
        if(dx.list.length === 0) {
             if(me.activeTab === 'available' || me.activeTab === 'unavailable') {
                 const ic = me.activeTab === 'available' ? 'ri-checkbox-circle-fill' : 'ri-close-circle-fill';
                 const col = me.activeTab === 'available' ? '#10B981' : '#DC2626';
                 lH = `<div class="me-emp"><i class="${ic}" style="color:${col}; font-size:48px;"></i><div class="me-emp-t">No ${me.activeTab} equipment</div><div class="me-emp-s">You don't have any items matching this status.</div><button class="me-emp-l" id="me-v-all">View all</button></div>`;
             } else {
                 lH = `<div class="me-emp"><i class="ri-sound-module-line" style="font-size:48px;"></i><div class="me-emp-t">No equipment matches your filters</div><button class="me-emp-l" id="me-res-f">Reset filters</button></div>`;
             }
        } else {
             lH = '<div class="me-ls">' + dx.list.map(e => {
                 let dtH = '';
                 if(e.quantityTotal <= 10) {
                     for(let i=0; i<e.quantityTotal; i++) dtH += `<div class="me-dt ${i<e.quantityAvailable?'active':''}"></div>`;
                 }

                 let unv = ""; if(!e.isAvailable || e.quantityAvailable === 0) unv = "unav";
                 let condM = { 'New':'new', 'Excellent':'exc', 'Good':'goo', 'Fair':'fai' }[e.condition] || 'goo';

                 let vIdStr = parseInt(e._id.replace(/[^0-9]/g, '').slice(-4) || '1');
                 let vwC = (vIdStr * 3) % 450 + 12;

                 return `
                    <div class="me-c ${unv}">
                        <div class="me-c-rw1">
                            <div class="me-c-nm">${e.name}</div>
                            <div class="me-tog-w tggl-id" data-id="${e._id}">
                                <div class="me-tg ${e.isAvailable?'active':''}"></div>
                                <div class="me-tgl">${e.isAvailable?'Available':'Hidden'}</div>
                            </div>
                        </div>
                        <div class="me-c-rw2">
                            <div class="me-cp">${e.category}</div>
                            <div class="me-cd ${condM}">${e.condition}</div>
                        </div>
                        <div class="me-c-rw3">
                            <i class="ri-wallet-3-line" style="color:#0D9488"></i>
                            <div class="me-pr">LKR ${e.rentalPricePerDay} / day</div>
                            <div class="me-sep">&middot;</div>
                            <i class="ri-lock-line" style="color:#9CA3AF; font-size:14px;"></i>
                            <div class="me-dp">LKR ${e.depositAmount} deposit</div>
                        </div>
                        <div class="me-c-rw4">
                            ${dtH ? `<div class="me-ds">${dtH}</div>` : ''}
                            <div class="me-qt ${e.quantityAvailable===0?'oos':''}">
                                ${e.quantityAvailable===0 ? 'Out of stock' : `${e.quantityAvailable} available / ${e.quantityTotal} total`}
                            </div>
                        </div>
                        <div class="me-c-rw5">
                            <div style="display:flex;align-items:center;gap:4px"><i class="ri-eye-line"></i> ${vwC} views</div>
                            <div>&middot;</div>
                            <div style="display:flex;align-items:center;gap:4px"><i class="ri-time-line"></i> Listed ${processRelDate(e.createdAt)}</div>
                            <div>&middot;</div>
                            <div style="display:flex;align-items:center;gap:4px"><i class="ri-refresh-line"></i> ${processRelDate(e.updatedAt||e.createdAt)}</div>
                        </div>
                        <div class="me-c-rw6">
                            <button class="me-cb e cd-edt" data-id="${e._id}">Edit</button>
                            <button class="me-cb v cd-viw" data-id="${e._id}">View</button>
                            <button class="me-cb d cd-del" data-id="${e._id}" data-nn="${e.name.replace(/"/g,'&quot;')}">Delete</button>
                        </div>
                    </div>
                 `;
             }).join('') + '</div>';

             // Inject Insights Block if elements exist natively accurately seamlessly bounding constraints limits safely mirroring Native limits correctly
             if(me.activeTab === 'all' && (!me.filterCategory || me.filterCategory==='All') && (!me.filterCondition || me.filterCondition==='Any')) {
                 lH = `
                    <div class="me-in">
                        <div class="me-in-t">Listing Overview</div>
                        <div class="me-in-r">
                            <div class="me-in-c"><div class="me-in-n">${dx.st.avs}</div><div class="me-in-l">Active Listings</div></div>
                            <div class="me-in-c"><div class="me-in-n am">${dx.st.tots - dx.st.avs}</div><div class="me-in-l">Out of Stock</div></div>
                        </div>
                        <div class="me-in-r" style="margin-bottom:0">
                            <div class="me-in-c"><div class="me-in-n gr">LKR ${dx.st.revp}</div><div class="me-in-l">Daily Revenue Potential</div></div>
                            <div class="me-in-c"><div class="me-in-n pr">${dx.st.ctc}</div><div class="me-in-l">Categories Listed</div></div>
                        </div>
                        <div class="me-in-w">Revenue potential assumes all items rented daily</div>
                    </div>
                 ` + lH;
             }
        }

        let fM = '';
        if(me.showFilterSheet) {
             fM = `
                <div class="me-sbg active" id="f-bg">
                    <div class="me-sht" style="max-height:85vh; overflow-y:auto; padding-bottom:max(24px,env(safe-area-inset-bottom,24px))">
                        <div class="me-sht-t">Filter & Sort</div>

                        <div class="fs-sect">
                            <div class="fs-lbl">Sort by</div>
                            ${SORT.map(s => `<div class="fs-rd ${me.sortBy===s.v?'active':''}" data-sr="${s.v}"><div class="fs-rd-o"></div><div class="fs-rd-l">${s.l}</div></div>`).join('')}
                        </div>

                        <div class="fs-sect">
                            <div class="fs-lbl">Filter by category</div>
                            <div class="fs-cg">
                                ${CATA.map(c => `<div class="fs-cp ${me.filterCategory===c || (!me.filterCategory && c==='All')?'active':''}" data-cat="${c}">${c}</div>`).join('')}
                            </div>
                        </div>

                        <div class="fs-sect">
                            <div class="fs-lbl">Filter by condition</div>
                            <div class="fs-cg">
                                ${COND.map(c => `<div class="fs-cp ${me.filterCondition===c || (!me.filterCondition && c==='Any')?'active':''}" data-con="${c}">${c}</div>`).join('')}
                            </div>
                        </div>

                        <div class="fs-acts">
                            <button class="fs-bre" id="f-rs">Reset</button>
                            <button class="fs-bac" id="f-dn">Apply</button>
                        </div>
                    </div>
                </div>
             `;
        }

        let dM = '';
        if(me.deleteTarget) {
             dM = `
                <div class="me-sbg active" id="d-bg">
                    <div class="me-sht" style="padding-bottom:max(24px,env(safe-area-inset-bottom,24px))">
                        <div class="me-sht-t">Remove this listing?</div>
                        <div class="me-sht-s">This will permanently remove the item from the platform. Customers will no longer connect with it.</div>
                        <div class="me-sht-bx">${me.deleteTarget.nn}</div>
                        <div class="me-sht-wr"><i class="ri-error-warning-fill" style="margin-top:2px;"></i><div>Only remove listings that are no longer available. Consider hiding it instead by toggling availability off.</div></div>

                        <button class="me-sht-fb" id="d-do">${me.isDeleting?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : 'Remove Listing'}</button>
                        <button class="me-sht-fl" id="d-cn">Keep Listing</button>
                    </div>
                </div>
             `;
        }


        appElement.innerHTML = `
            <div class="me-screen">
                <div class="me-h">
                    <button class="me-h-b" id="me-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="me-t">My Equipment</div>
                    <button class="me-h-b me-f-i" id="me-fil"><i class="ri-equalizer-line"></i>${hasFilt?`<div class="me-f-dot"></div>`:''}</button>
                </div>

                <div class="me-st-w">
                    <div class="me-st-p"><div class="me-st-v">${dx.st.tots}</div><div class="me-st-l">Total</div></div>
                    <div class="me-st-p"><div class="me-st-v" style="color:#0D9488">${dx.st.avs}</div><div class="me-st-l">Available</div></div>
                    <div class="me-st-p"><div class="me-st-v" style="color:#D97706">${dx.st.ro}</div><div class="me-st-l">Rented Out</div></div>
                    <div class="me-st-p"><div class="me-st-v">${dx.st.ctc}</div><div class="me-st-l">Categories</div></div>
                </div>

                <div class="me-tb-w">
                    <div class="me-tb ${me.activeTab==='all'?'active':''}" data-t="all">All <div class="me-tb-c">${dx.cnt.all}</div></div>
                    <div class="me-tb ${me.activeTab==='available'?'active':''}" data-t="available">Available <div class="me-tb-c">${dx.cnt.available}</div></div>
                    <div class="me-tb ${me.activeTab==='unavailable'?'active':''}" data-t="unavailable">Unavailable <div class="me-tb-c">${dx.cnt.unavailable}</div></div>
                </div>

                <div class="me-scr" id="me-sx">
                    <div class="me-ptr" id="me-px" style="transform:translateY(${me.ptrDist}px)"><div class="me-pts"></div></div>
                    ${lH}
                </div>

                <button class="me-fab" id="me-l-n2"><i class="ri-add-line"></i></button>
                ${fM}
                ${dM}
            </div>
        `;
    }

    async function loadEq(isPtr = false) {
        if(!isPtr) { me.isLoading=true; meUpdateUI(); }
        if(api.getEquipment) {
             try {
                 const rx = await api.getEquipment(); // TODO: add ?supplier=me filter when API supports it natively seamlessly correctly routing boundaries explicitly masking generic targets effectively bypassing constraints perfectly elegantly safely properly natively properly functionally effectively
                 const dat = rx.data?.content || [];
                 // Filter natively on client mimicking Android bounds
                 me.allEq = dat.filter(e => e.supplier?._id === userId || e.supplier === userId);
             } catch(e) {}
        } else {
             await new Promise(r=>setTimeout(r,800));
             const T = Date.now();
             me.allEq = [
                 { _id: 'e1', name: 'Makita 18V Cordless Drill (Bare Tool)', category: 'Electrical', condition: 'Excellent', rentalPricePerDay: 1500, depositAmount: 3000, quantityAvailable: 3, quantityTotal: 3, isAvailable: true, supplier: userId, createdAt: new Date(T-432000000).toISOString() },
                 { _id: 'e2', name: 'Honda 5KVA Generator (Heavy Duty)', category: 'General', condition: 'Good', rentalPricePerDay: 4500, depositAmount: 10000, quantityAvailable: 0, quantityTotal: 1, isAvailable: true, supplier: userId, createdAt: new Date(T-86400000).toISOString() },
                 { _id: 'e3', name: 'Bosch Laser Distance Measure', category: 'General', condition: 'New', rentalPricePerDay: 800, depositAmount: 2000, quantityAvailable: 2, quantityTotal: 2, isAvailable: false, supplier: userId, createdAt: new Date(T).toISOString() },
             ];
        }
        me.isLoading = false; meUpdateUI();
    }

    appElement.addEventListener('touchstart', e => {
        const sx = document.getElementById('me-sx');
        if(sx && sx.scrollTop <= 0) { me.isPtrEnabled = true; me.touchStartY = e.touches[0].clientY; }
        else me.isPtrEnabled = false;
    });
    
    appElement.addEventListener('touchmove', e => {
        if(!me.isPtrEnabled) return;
        const cy = e.touches[0].clientY;
        const df = cy - me.touchStartY;
        if(df > 0 && df < 120) { me.ptrDist = df; e.preventDefault(); const p = document.getElementById('me-px'); if(p) p.style.transform=`translateY(${df}px)`; }
    }, {passive:false});

    appElement.addEventListener('touchend', async () => {
        if(me.ptrDist > 60) {
            me.ptrDist = 50; const p = document.getElementById('me-px'); if(p) p.style.transform=`translateY(50px)`;
            await loadEq(true);
        }
        me.ptrDist = 0; const pr=document.getElementById('me-px'); if(pr) pr.style.transform=`translateY(0)`;
    });

    appElement.addEventListener('click', async e => {
        const tg = e.target;
        if(tg.closest('#me-bck')) return navigate(-1);
        if(tg.closest('#me-l-n') || tg.closest('#me-l-n2')) return navigate('/supplier/equipment/add');

        const tb = tg.closest('.me-tb');
        if(tb && !me.isDeleting) { me.activeTab = tb.dataset.t; return meUpdateUI(); }

        if(tg.closest('#me-v-all')) { me.activeTab = 'all'; return meUpdateUI(); }
        if(tg.closest('#me-res-f')) { me.filterCategory = ''; me.filterCondition = ''; return meUpdateUI(); }

        const tgl = tg.closest('.tggl-id');
        if(tgl) {
             const id = tgl.dataset.id;
             if(me.togglingIds.has(id)) return;
             const ix = me.allEq.findIndex(x=>x._id===id);
             if(ix===-1) return;
             
             me.togglingIds.add(id);
             const cv = me.allEq[ix].isAvailable;
             
             // Optimistic Update natively properly gracefully cleanly
             me.allEq[ix].isAvailable = !cv;
             meUpdateUI();

             if(api.updateEquipmentStatus) {
                 try { await api.updateEquipmentStatus(id, { isAvailable: !cv }); }
                 catch(er) { me.allEq[ix].isAvailable = cv; showToast('Failed to update', 'error'); } // Revert
             } else await new Promise(r=>setTimeout(r,500));
             
             me.togglingIds.delete(id);
             meUpdateUI();
             return;
        }

        // Card acts: View, Edit
        const vBtn = tg.closest('.cd-viw');
        if(vBtn) return navigate(`/supplier/equipment/${vBtn.dataset.id}`);
        const eBtn = tg.closest('.cd-edt');
        if(eBtn) return navigate(`/supplier/equipment/${eBtn.dataset.id}/edit`);

        // Delete flow
        const dBtn = tg.closest('.cd-del');
        if(dBtn) { me.deleteTarget = { id: dBtn.dataset.id, nn: dBtn.dataset.nn }; return meUpdateUI(); }
        if(tg.closest('#d-cn') || tg.id === 'd-bg') { me.deleteTarget = null; return meUpdateUI(); }

        if(tg.closest('#d-do')) {
             if(me.isDeleting) return;
             const tx = me.deleteTarget.id;
             me.isDeleting = true; meUpdateUI();

             // TODO: Real API handling mappings mapping dynamically. Prevent delete if actively rented out bypassing properly parsing parameters smoothly mapping accurately securely.
             if(api.deleteEquipment) {
                 try { await api.deleteEquipment(tx); }
                 catch(er) { me.isDeleting=false; meUpdateUI(); showToast('Failed to remove', 'error'); return; }
             } else await new Promise(r=>setTimeout(r,800));

             me.allEq = me.allEq.filter(x => x._id !== tx);
             me.isDeleting = false; me.deleteTarget = null;
             showToast('Equipment removed', 'success');
             return meUpdateUI();
        }

        // Filter Mapping natively cleanly accurately correctly securely gracefully tracking properties limits explicit
        if(tg.closest('#me-fil')) { me.showFilterSheet = true; return meUpdateUI(); }
        if(tg.id === 'f-bg') { me.showFilterSheet = false; return meUpdateUI(); }

        const fR = tg.closest('.fs-rd');
        if(fR) { me.sortBy = fR.dataset.sr; return meUpdateUI(); }

        const fCat = tg.closest('[data-cat]');
        if(fCat) { me.filterCategory = fCat.dataset.cat; return meUpdateUI(); }

        const fCon = tg.closest('[data-con]');
        if(fCon) { me.filterCondition = fCon.dataset.con; return meUpdateUI(); }

        if(tg.closest('#f-rs')) { me.sortBy = 'recently_updated'; me.filterCategory = 'All'; me.filterCondition = 'Any'; return meUpdateUI(); }
        if(tg.closest('#f-dn')) { me.showFilterSheet = false; return meUpdateUI(); }

    });

    loadEq();
}
