// ================================== //
// SkillConnect Mobile                //
// Supplier Edit Equipment            //
// ================================== //

async function renderEditEquipment(appElement, stateRoute) {
    const eqId = window.location.pathname.split('/')[3];
    const userId = localStorage.getItem('userId') || 'req_supplier_1';

    const CATA = ['Power Tools', 'Hand Tools', 'Heavy Machinery', 'Scaffolding', 'Electrical', 'Plumbing', 'Welding', 'Painting', 'Gardening', 'Safety', 'Other'];
    const COND = {
         'New': {ic:'ri-star-fill', d:'Brand new, unused', c:'new'},
         'Excellent': {ic:'ri-check-double-line', d:'Like new condition', c:'exc'},
         'Good': {ic:'ri-thumb-up-line', d:'Minor wear, fully functional', c:'goo'},
         'Fair': {ic:'ri-information-line', d:'Visible wear, still works well', c:'fai'}
    };

    let ee = {
        isLoading: true,
        f: {
            equipmentName: '', category: '', condition: '', description: '',
            rentalPrice: '', deposit: '', quantityTotal: 1, quantityAvailable: 1, isAvailable: true
        },
        o: null,
        errs: {},
        isSubmitting: false,
        showDiscard: false,
        showDelete: false,
        isDeleting: false,
        formTouched: false
    };

    function validate() {
        ee.errs = {};
        if(!ee.f.equipmentName.trim() || ee.f.equipmentName.trim().length < 3) ee.errs.en = 'Name must be at least 3 characters';
        if(!ee.f.category) ee.errs.ca = 'Please select a category';
        if(!ee.f.condition) ee.errs.co = 'Please select a condition';
        
        const pr = parseFloat(ee.f.rentalPrice);
        if(isNaN(pr) || pr <= 0) ee.errs.pr = 'Enter a valid daily rate';
        
        const dp = parseFloat(ee.f.deposit);
        if(isNaN(dp) || dp < 0) ee.errs.dp = 'Enter a valid deposit amount';

        return Object.keys(ee.errs).length === 0;
    }

    function isDirty() { return ee.o ? JSON.stringify(ee.f) !== JSON.stringify(ee.o) : false; }

    function eeUpdateUI() {
        if(ee.isLoading) {
             appElement.innerHTML = `
                <div class="ee-screen"><div class="ee-h"><button class="ee-bck" id="ee-bck">Cancel</button><div class="ee-t">Edit Listing</div><button class="ee-sav" disabled>Save</button></div>
                <div class="ee-skw"><div class="ee-skc"><div class="pk" style="width:120px;height:16px;margin-bottom:4px"></div><div class="pk" style="width:100%;height:52px;border-radius:10px"></div><div class="pk" style="width:120px;height:16px;margin-top:12px;margin-bottom:4px"></div><div class="pk" style="width:100px;height:32px;border-radius:16px"></div><div class="pk" style="width:120px;height:16px;margin-top:12px;margin-bottom:4px"></div><div style="display:flex;gap:10px"><div class="pk" style="flex:1;height:80px;border-radius:10px"></div><div class="pk" style="flex:1;height:80px;border-radius:10px"></div></div></div></div></div>
             `;
             return;
        }

        const dirty = isDirty();
        const pr = parseFloat(ee.f.rentalPrice) || 0;
        const dp = parseFloat(ee.f.deposit) || 0;
        
        const wk = pr * 7;
        const mo = pr * 30;
        const lowD = (dp > 0 && pr > 0 && dp < pr * 2);

        let cndH = '';
        for(let k in COND) {
             const cx = COND[k];
             cndH += `<div class="ee-cnd ${cx.c} ${ee.f.condition===k?'active':''}" data-cnd="${k}"><i class="${cx.ic} ee-cnd-i"></i><div class="ee-cnd-t">${k}</div><div class="ee-cnd-s">${cx.d}</div></div>`;
        }

        let dtH = '';
        if(ee.f.quantityTotal <= 10) {
             for(let i=0; i<ee.f.quantityTotal; i++) dtH += `<div class="ee-dt ${i<ee.f.quantityAvailable?'a':''}"></div>`;
        }

        let cnM = cx=>cx==='New'?'new':cx==='Excellent'?'exc':cx==='Good'?'goo':'fai';

        let dsM = '';
        if(ee.showDiscard) {
             dsM = `<div class="ee-sbg active" id="da-bg"><div class="ee-sht" style="padding-bottom:max(24px,env(safe-area-inset-bottom,24px))"><div class="ee-dh"></div><div class="ee-sht-t">Discard changes?</div><div class="ee-sht-s">Your unsaved changes will be lost.</div><button class="ee-sht-fb" id="da-do">Discard</button><button class="ee-sht-fl" id="da-cn">Keep Editing</button></div></div>`;
        }

        let dlM = '';
        if(ee.showDelete) {
             dlM = `<div class="ee-sbg active" id="dl-bg"><div class="ee-sht" style="padding-bottom:max(24px,env(safe-area-inset-bottom,24px))"><div class="ee-dh"></div><div class="ee-sht-t">Remove this listing?</div><div class="ee-sht-s">This will permanently remove the item from the platform. Customers will no longer connect with it.</div><div class="ee-sht-bx">${ee.f.equipmentName}</div><div class="ee-sht-wr"><i class="ri-error-warning-fill" style="margin-top:2px;"></i><div>Only remove listings that are no longer available. Consider hiding it instead by toggling availability off.</div></div><button class="ee-sht-fb" id="dl-do">${ee.isDeleting?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : 'Remove Listing'}</button><button class="ee-sht-fl" id="dl-cn">Keep Listing</button></div></div>`;
        }


        appElement.innerHTML = `
            <div class="ee-screen">
                <div class="ee-h">
                    <button class="ee-bck" id="ee-bck">Cancel</button>
                    <div class="ee-t">Edit Listing</div>
                    <button class="ee-sav" id="btn-sub-t" ${!dirty?'disabled':''}>${ee.isSubmitting?'...':'Save'}</button>
                </div>
                
                <div class="ee-scr" id="ee-cx">
                    <div class="ee-c">
                        <div class="ee-in-w">
                            <div class="ee-lbl">Equipment Name <span class="ee-req">*</span></div>
                            <input type="text" class="ee-in ${ee.formTouched&&ee.errs.en?'err':''}" id="in-nm" placeholder="e.g. Heavy Duty Power Drill" value="${ee.f.equipmentName}" maxlength="100">
                            <div class="ee-cc">${ee.f.equipmentName.length} / 100</div>
                            ${ee.formTouched&&ee.errs.en?`<div class="ee-err-m">${ee.errs.en}</div>`:''}
                        </div>
                        
                        <div class="ee-in-w">
                            <div class="ee-lbl">Category <span class="ee-req">*</span></div>
                            <div class="ee-cg">
                                ${CATA.map(c => `<button class="ee-cp ${ee.f.category===c?'active':''}" data-cat="${c}">${c}</button>`).join('')}
                            </div>
                            ${ee.formTouched&&ee.errs.ca?`<div class="ee-err-m">${ee.errs.ca}</div>`:''}
                        </div>

                        <div class="ee-in-w">
                            <div class="ee-lbl">Condition <span class="ee-req">*</span></div>
                            <div class="ee-cnd-g">${cndH}</div>
                            ${ee.formTouched&&ee.errs.co?`<div class="ee-err-m">${ee.errs.co}</div>`:''}
                        </div>

                        <div class="ee-in-w" style="margin-bottom:0">
                            <div class="ee-lbl">Description</div>
                            <textarea class="ee-ta" id="in-ds" placeholder="Describe the equipment in detail..." maxlength="1000">${ee.f.description}</textarea>
                            <div class="ee-cc">${ee.f.description.length} / 1000</div>
                            <div class="ee-hp">A detailed description gets more enquiries</div>
                        </div>
                    </div>

                    <div class="ee-c">
                        <div class="ee-in-w">
                            <div class="ee-lbl">Daily Rental Price (LKR) <span class="ee-req">*</span></div>
                            <div class="ee-num-w">
                                <span class="ee-num-p">LKR</span>
                                <input type="number" inputmode="numeric" class="ee-in ee-num-i ${ee.formTouched&&ee.errs.pr?'err':''}" id="in-pr" placeholder="e.g. 1500" value="${ee.f.rentalPrice}">
                            </div>
                            ${ee.formTouched&&ee.errs.pr?`<div class="ee-err-m">${ee.errs.pr}</div>`:''}
                            <div class="ee-hp">Set a competitive daily rate to attract more customers</div>
                            
                            <div class="ee-est">
                                <div class="ee-est-l">Weekly estimate: ~LKR ${wk}</div>
                                <div class="ee-est-l" style="opacity:0.8">Monthly estimate: ~LKR ${mo}</div>
                            </div>
                        </div>

                        <div class="ee-in-w" style="margin-bottom:0">
                            <div class="ee-lbl">Security Deposit (LKR) <span class="ee-req">*</span></div>
                            <div class="ee-num-w">
                                <span class="ee-num-p">LKR</span>
                                <input type="number" inputmode="numeric" class="ee-in ee-num-i ${ee.formTouched&&ee.errs.dp?'err':''}" id="in-dp" placeholder="e.g. 5000" value="${ee.f.deposit}">
                            </div>
                            ${ee.formTouched&&ee.errs.dp?`<div class="ee-err-m">${ee.errs.dp}</div>`:''}
                            <div class="ee-hp">Refundable deposit to protect against damage or loss</div>
                            
                            <div class="ee-dg">&#128161; Typical deposit: 3–5&times; the daily rate</div>
                            ${lowD ? `<div class="ee-dw">&#9888; Low deposit — consider increasing to protect against loss</div>`:''}
                        </div>
                    </div>

                    <div class="ee-c">
                        <div class="ee-in-w">
                            <div class="ee-lbl">Total Units You Own <span class="ee-req">*</span></div>
                            <div class="ee-stp-w">
                                <div class="ee-stp-c">
                                    <button class="ee-stp-btn b-tm" data-v="-1" ${ee.f.quantityTotal<=1?'disabled':''}>&minus;</button>
                                    <div class="ee-stp-v">${ee.f.quantityTotal}</div>
                                    <button class="ee-stp-btn b-tm" data-v="1" ${ee.f.quantityTotal>=50?'disabled':''}>&plus;</button>
                                </div>
                            </div>
                        </div>

                        <div class="ee-in-w">
                            <div class="ee-lbl">Currently Available for Rent <span class="ee-req">*</span></div>
                            <div class="ee-stp-w">
                                <div class="ee-stp-c">
                                    <button class="ee-stp-btn b-am" data-v="-1" ${ee.f.quantityAvailable<=0?'disabled':''}>&minus;</button>
                                    <div class="ee-stp-v">${ee.f.quantityAvailable}</div>
                                    <button class="ee-stp-btn b-am" data-v="1" ${ee.f.quantityAvailable>=ee.f.quantityTotal?'disabled':''}>&plus;</button>
                                </div>
                            </div>
                            <div class="ee-dt-r">${dtH}</div>
                            <div class="ee-dt-l">${ee.f.quantityAvailable} available, ${ee.f.quantityTotal - ee.f.quantityAvailable} currently rented</div>
                            <div class="ee-hp" style="margin-top:8px">Set lower if some units are already rented out</div>
                        </div>

                        <div class="ee-t-row">
                            <div style="flex:1">
                                <div class="ee-lbl" style="margin-bottom:2px">List as available</div>
                                <div class="ee-hp" style="margin:0">${ee.f.isAvailable?'Customers can find and enquire about this equipment':'This listing will be hidden from customers'}</div>
                            </div>
                            <div class="ee-t-tg ${ee.f.isAvailable?'active':''}" id="btn-tg"></div>
                        </div>
                    </div>

                    <div class="ee-ph"><i class="ri-camera-fill ee-ph-i"></i><div class="ee-ph-t">Add photos (coming soon)</div></div>
                    
                    <div>
                        <div class="ee-prv-s">How customers will see this</div>
                        <div class="ee-prv-l">Preview</div>
                        <div class="ee-prv-w">
                            <div class="ee-c-cd ${!ee.f.isAvailable?'u':''}">
                                <div class="ee-cv-nm">${ee.f.equipmentName||'Equipment name...'}</div>
                                <div class="ee-cv-rw2">
                                    <div class="ee-p-cp">${ee.f.category||'Category'}</div>
                                    ${ee.f.condition?`<div class="ee-p-cd ${cnM(ee.f.condition)}">${ee.f.condition}</div>`:''}
                                </div>
                                <div class="ee-cv-rw3">
                                    <i class="ri-wallet-3-line" style="color:#0D9488"></i>
                                    <div class="ee-v-pr">LKR ${ee.f.rentalPrice||'0'} / day</div>
                                    <div class="ee-v-sep">&middot;</div>
                                    <div class="ee-v-dp">LKR ${ee.f.deposit||'0'} deposit</div>
                                </div>
                                <div class="ee-cv-rw4">
                                    ${ee.f.quantityTotal<=10 ? Array.from({length:ee.f.quantityTotal}).map((_,i)=>`<div class="ee-v-d ${i<ee.f.quantityAvailable?'a':''}"></div>`).join('') : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="ee-c dng" style="margin-bottom:16px">
                        <div>
                            <div class="ee-dng-t">Danger Zone</div>
                            <div class="ee-dng-h">Delete this listing</div>
                            <div class="ee-dng-s">Permanently removes this equipment</div>
                        </div>
                        <button class="ee-dbtn" id="btn-del">Delete</button>
                    </div>
                </div>

                <div class="ee-act">
                    <button class="ee-sub" id="btn-sub" ${!dirty?'disabled':''}>${ee.isSubmitting?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite;"></div>` : 'Save Changes'}</button>
                </div>
                ${dsM}
                ${dlM}
            </div>
        `;
    }

    async function loadData() {
        if(api.getEquipmentById) {
            try {
                const rx = await api.getEquipmentById(eqId);
                const d = rx.data;
                const sid = d.supplier?._id || d.supplier;
                if(sid !== userId) { showToast('Access denied', 'error'); return navigate('/supplier/equipment'); }

                ee.f = {
                    equipmentName: d.equipmentName || d.name || '',
                    category: d.category || '',
                    condition: d.condition || d.equipmentCondition || '',
                    description: d.description || d.equipmentDescription || '',
                    rentalPrice: String(d.rentalPricePerDay || ''),
                    deposit: String(d.depositAmount || ''),
                    quantityTotal: d.quantityTotal || 1,
                    quantityAvailable: typeof d.quantityAvailable==='number' ? d.quantityAvailable : 1,
                    isAvailable: !!d.isAvailable
                };
            } catch(e) {
                showToast('Equipment not found', 'error'); return navigate(-1);
            }
        } else {
            await new Promise(r=>setTimeout(r,800));
            ee.f = {
                equipmentName: 'Makita 18V Cordless Drill (Bare Tool)',
                category: 'Electrical',
                condition: 'Excellent',
                description: 'Heavy duty drill perfect for household contracting and structural framework. Compatible with all Makita 18V LXT batteries.',
                rentalPrice: '1500',
                deposit: '3000',
                quantityTotal: 3,
                quantityAvailable: 3,
                isAvailable: true
            };
        }
        
        ee.o = JSON.parse(JSON.stringify(ee.f));
        ee.isLoading = false; eeUpdateUI();
    }


    appElement.addEventListener('input', e => {
        const tg = e.target;
        if(tg.id === 'in-nm') { ee.f.equipmentName = tg.value; eeUpdateUI(); }
        if(tg.id === 'in-ds') { ee.f.description = tg.value; eeUpdateUI(); }
        if(tg.id === 'in-pr') { ee.f.rentalPrice = tg.value; eeUpdateUI(); }
        if(tg.id === 'in-dp') { ee.f.deposit = tg.value; eeUpdateUI(); }
    });

    appElement.addEventListener('click', async e => {
        const tg = e.target;

        if(tg.closest('#ee-bck')) {
            if(isDirty()) { ee.showDiscard = true; return eeUpdateUI(); }
            return navigate(-1);
        }

        if(tg.closest('#da-cn') || tg.id === 'da-bg') { ee.showDiscard = false; return eeUpdateUI(); }
        if(tg.closest('#da-do')) return navigate(-1);

        const ctg = tg.closest('.ee-cp');
        if(ctg) { ee.f.category = ctg.dataset.cat; return eeUpdateUI(); }

        const cnd = tg.closest('.ee-cnd');
        if(cnd) { ee.f.condition = cnd.dataset.cnd; return eeUpdateUI(); }

        const bT = tg.closest('.b-tm');
        if(bT) {
             const m = parseInt(bT.dataset.v);
             ee.f.quantityTotal = Math.max(1, Math.min(50, ee.f.quantityTotal + m));
             if(ee.f.quantityAvailable > ee.f.quantityTotal) ee.f.quantityAvailable = ee.f.quantityTotal;
             return eeUpdateUI();
        }

        const bA = tg.closest('.b-am');
        if(bA) {
             const m = parseInt(bA.dataset.v);
             ee.f.quantityAvailable = Math.max(0, Math.min(ee.f.quantityTotal, ee.f.quantityAvailable + m));
             return eeUpdateUI();
        }

        if(tg.closest('#btn-tg')) { ee.f.isAvailable = !ee.f.isAvailable; return eeUpdateUI(); }

        if(tg.closest('#btn-del')) { ee.showDelete = true; return eeUpdateUI(); }
        if(tg.closest('#dl-cn') || tg.id === 'dl-bg') { ee.showDelete = false; return eeUpdateUI(); }
        if(tg.closest('#dl-do')) {
             if(ee.isDeleting) return;
             ee.isDeleting = true; eeUpdateUI();
             
             if(api.deleteEquipment) {
                 try { await api.deleteEquipment(eqId); } catch(er){}
             } else await new Promise(r=>setTimeout(r,800));
             
             showToast('Equipment deleted', 'success');
             return navigate('/supplier/equipment');
        }

        if(tg.closest('#btn-sub') || tg.closest('#btn-sub-t')) {
             if(!isDirty()) return;

             ee.formTouched = true;
             if(!validate()) {
                 eeUpdateUI(); showToast('Please check the highlighted fields', 'error');
                 const cr = document.getElementById('ee-cx'); if(cr) cr.scrollTo({top:0, behavior:'smooth'});
                 return;
             }

             if(ee.isSubmitting) return;
             ee.isSubmitting = true; eeUpdateUI();

             const payload = {
                 equipmentName: ee.f.equipmentName.trim(),
                 equipmentDescription: ee.f.description.trim(),
                 category: ee.f.category,
                 equipmentCondition: ee.f.condition,
                 rentalPricePerDay: parseFloat(ee.f.rentalPrice),
                 depositAmount: parseFloat(ee.f.deposit),
                 quantityAvailable: ee.f.quantityAvailable,
                 quantityTotal: ee.f.quantityTotal,
                 isAvailable: ee.f.isAvailable
             };

             if(api.updateEquipment) {
                 try {
                     await api.updateEquipment(eqId, payload);
                     showToast('Listing updated successfully!', 'success');
                     setTimeout(() => navigate('/supplier/equipment'), 600);
                 } catch(er) {
                     ee.isSubmitting = false; eeUpdateUI();
                     showToast(er.response?.data?.message || 'Connection failed. Check your network.', 'error');
                 }
             } else {
                 await new Promise(r=>setTimeout(r,1200));
                 showToast('Listing updated successfully!', 'success');
                 setTimeout(() => navigate('/supplier/equipment'), 600);
             }
        }
    });

    loadData();
}
