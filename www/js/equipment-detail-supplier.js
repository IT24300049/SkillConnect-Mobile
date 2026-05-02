// ================================== //
// SkillConnect Mobile                //
// Supplier Equipment Detail          //
// ================================== //

async function renderEquipmentDetailSupplier(appElement, stateRoute) {
    const eqId = window.location.pathname.split('/')[3];
    const userId = localStorage.getItem('userId') || 'req_supplier_1';

    let ed = {
        isLoading: true,
        d: null,
        isUpdatingStock: false,
        isTogglingAvail: false,
        sf: { qa: 0, qt: 0 }
    };

    function edUpdateUI() {
        if(ed.isLoading) {
             appElement.innerHTML = `
                <div class="eds-screen"><div class="eds-h"><button class="eds-h-b" id="eds-bck"><i class="ri-arrow-left-line"></i></button></div>
                <div class="eds-sk-tp"></div><div class="eds-sk-p"><div class="pk" style="flex:1;height:40px"></div><div class="pk" style="flex:1;height:40px"></div><div class="pk" style="flex:1;height:40px"></div><div class="pk" style="flex:1;height:40px"></div></div>
                <div style="padding:16px"><div class="pk" style="width:150px;height:24px;margin-bottom:12px"></div><div class="pk" style="width:100px;height:18px;border-radius:12px"></div></div></div>
             `;
             return;
        }

        const dx = ed.d;
        let cnM = cx=>{ const m={'New':'new','Excellent':'exc','Good':'goo','Fair':'fai'}; return m[cx]||'goo'; };

        let dtH = '';
        if(dx.quantityTotal <= 10) {
             for(let i=0; i<dx.quantityTotal; i++) dtH += `<div class="eds-dt ${i<dx.quantityAvailable?'a':''}"></div>`;
        }

        // Mock Analytics
        let vIdStr = parseInt(dx._id.replace(/[^0-9]/g, '') || '0');
        let v_week = (vIdStr % 50) + 10;
        let c_enq = (vIdStr % 20) + 2;

        appElement.innerHTML = `
            <div class="eds-screen">
                <div class="eds-h" id="eds-hd">
                    <button class="eds-h-b" id="eds-bck"><i class="ri-arrow-left-line"></i></button>
                    <div class="eds-t">My Listing</div>
                    <button class="eds-h-b" id="eds-edt" style="font-size:20px"><i class="ri-pencil-line"></i></button>
                </div>

                <div class="eds-scr" id="eds-sc">
                    <div class="eds-img-w">
                        ${dx.imagePath ? `<img src="${dx.imagePath}" class="eds-img" alt="${dx.name}">` : ''}
                        <div class="eds-img-ov">
                            <div class="eds-i-cond ${cnM(dx.condition)}">${dx.condition}</div>
                            <button class="eds-img-btn" id="eds-ap-btn"><i class="ri-add-line" style="font-size:18px"></i> Add Photo</button>
                        </div>
                    </div>
                    
                    <div class="eds-cont">
                        <div class="eds-istp">
                            <div class="eds-isp"><div class="eds-isv p">LKR ${dx.rentalPricePerDay}</div><div class="eds-isl">Per Day</div></div>
                            <div class="eds-isp"><div class="eds-isv">LKR ${dx.depositAmount}</div><div class="eds-isl">Deposit</div></div>
                            <div class="eds-isp"><div class="eds-isv" style="color:${dx.quantityAvailable===0?'#DC2626':'#0D9488'}">${dx.quantityAvailable}</div><div class="eds-isl">Available</div></div>
                            <div class="eds-isp"><div class="eds-isv">${dx.quantityTotal}</div><div class="eds-isl">Total Units</div></div>
                        </div>

                        <div class="eds-bdy">
                            <div class="eds-tl-w">
                                <div class="eds-nm">${dx.name}</div>
                                <div class="eds-cat">${dx.category}</div>
                            </div>

                            <div class="eds-c" style="margin-top:8px">
                                <div class="eds-ct">About this equipment</div>
                                <div class="eds-tx">${dx.description || 'No detailed description provided.'}</div>
                            </div>

                            <div class="eds-c">
                                <div class="eds-ct">Stock Management</div>
                                <div class="eds-dt-r">${dtH}</div>
                                <div class="eds-dt-l" style="margin-bottom:16px">${dx.quantityAvailable} available, ${dx.quantityTotal - dx.quantityAvailable} currently rented</div>

                                <div class="eds-stp-rw">
                                    <div class="eds-stp-b">
                                        <div class="eds-stp-lbl">Available</div>
                                        <div class="eds-stp-c">
                                            <button class="eds-stp-btn b-am" data-v="-1" ${ed.sf.qa<=0?'disabled':''}>&minus;</button>
                                            <div class="eds-stp-v">${ed.sf.qa}</div>
                                            <button class="eds-stp-btn b-am" data-v="1" ${ed.sf.qa>=ed.sf.qt?'disabled':''}>&plus;</button>
                                        </div>
                                    </div>
                                    <div class="eds-stp-b">
                                        <div class="eds-stp-lbl">Total Units</div>
                                        <div class="eds-stp-c">
                                            <button class="eds-stp-btn b-tm" data-v="-1" ${ed.sf.qt<=1?'disabled':''}>&minus;</button>
                                            <div class="eds-stp-v">${ed.sf.qt}</div>
                                            <button class="eds-stp-btn b-tm" data-v="1" ${ed.sf.qt>=50?'disabled':''}>&plus;</button>
                                        </div>
                                    </div>
                                </div>
                                <button class="eds-st-u" id="eds-us" ${ed.sf.qa===dx.quantityAvailable && ed.sf.qt===dx.quantityTotal ? 'disabled':''}>${ed.isUpdatingStock?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#0D9488;border-radius:50%;animation:spin 1s infinite;"></div>` : 'Update Stock'}</button>

                                <div class="eds-st-tg">
                                    <div>
                                        <div class="eds-st-tl">Availability Status</div>
                                        <div class="eds-st-ts">${dx.isAvailable?'Customers can locate this listing':'Listing is visually hidden from customers'}</div>
                                    </div>
                                    <div class="eds-tg ${dx.isAvailable?'active':''}" id="eds-atg"></div>
                                </div>
                            </div>

                            <div class="eds-c">
                                <div class="eds-ct">Listing Performance</div>
                                <div class="eds-pf-r">
                                    <div class="eds-pf-i"><i class="ri-eye-line"></i></div>
                                    <div class="eds-pf-l">Views this week</div>
                                    <div class="eds-pf-v">${v_week}</div>
                                </div>
                                <div class="eds-pf-r">
                                    <div class="eds-pf-i" style="background:#EFF6FF;color:#3B82F6"><i class="ri-message-3-line"></i></div>
                                    <div class="eds-pf-l">Total enquiries</div>
                                    <div class="eds-pf-v">${c_enq}</div>
                                </div>
                                <div class="eds-pf-r">
                                    <div class="eds-pf-i" style="background:#FEF2F2;color:#DC2626"><i class="ri-timer-flash-line"></i></div>
                                    <div class="eds-pf-l">Response rate</div>
                                    <div class="eds-pf-v m">Coming soon</div>
                                </div>
                                <div class="eds-pf-n">Real analytics coming in a future update.</div>
                            </div>

                            <div class="eds-c" style="background:#F0FDFA; border-color:rgba(13,148,136,0.2)">
                                <div class="eds-ct" style="color:#0F766E">Tips to Get More Enquiries</div>
                                <div class="eds-tp-w">
                                    <div class="eds-tp"><i class="ri-check-line"></i> Add photos to increase visibility by 3&times;</div>
                                    <div class="eds-tp"><i class="ri-check-line"></i> Write a detailed description with specs</div>
                                    <div class="eds-tp"><i class="ri-check-line"></i> Set a competitive daily rate</div>
                                    <div class="eds-tp"><i class="ri-check-line"></i> Keep your availability status up to date</div>
                                    <div class="eds-tp"><i class="ri-check-line"></i> Respond to enquiries within 2 hours</div>
                                </div>
                            </div>

                            <button class="eds-cus-l" id="eds-vcv">See how customers view this listing</button>
                        </div>
                    </div>
                </div>

                <div class="eds-act">
                    <button class="eds-btn e" id="eds-eb">Edit Listing</button>
                    ${dx.isAvailable ? 
                        `<button class="eds-btn h" id="eds-ab">${ed.isTogglingAvail?'...':'Hide Listing'}</button>` : 
                        `<button class="eds-btn m" id="eds-ab">${ed.isTogglingAvail?'...':'Make Available'}</button>`
                    }
                </div>
            </div>
        `;

        const s = document.getElementById('eds-sc');
        const h = document.getElementById('eds-hd');
        if(s && h) {
             s.onscroll = () => { if(s.scrollTop > 50) h.classList.add('scrolled'); else h.classList.remove('scrolled'); };
        }
    }

    async function loadData() {
        if(api.getEquipmentById) {
            try {
                const rx = await api.getEquipmentById(eqId);
                let x = rx.data;
                const sid = x.supplier?._id || x.supplier;
                if(sid !== userId) { showToast('Access denied', 'error'); return navigate(-1); }
                
                ed.d = {
                    _id: x._id, name: x.equipmentName || x.name, category: x.category, condition: x.equipmentCondition || x.condition,
                    description: x.equipmentDescription || x.description, rentalPricePerDay: x.rentalPricePerDay, depositAmount: x.depositAmount,
                    quantityAvailable: x.quantityAvailable||0, quantityTotal: x.quantityTotal||1, isAvailable: !!x.isAvailable,
                    imagePath: x.imagePath
                };
            } catch(e) { showToast('Equipment not found', 'error'); return navigate(-1); }
        } else {
            await new Promise(r=>setTimeout(r,600));
            ed.d = { _id: 'e123', name: 'Makita 18V Cordless Drill (Bare Tool)', category: 'Electrical', condition: 'Excellent', description: 'Very reliable heavy duty drill perfect for concrete scaling. Includes 2 spare bits natively attached.', rentalPricePerDay: 1500, depositAmount: 3000, quantityAvailable: 3, quantityTotal: 3, isAvailable: true };
        }
        
        ed.sf.qa = ed.d.quantityAvailable;
        ed.sf.qt = ed.d.quantityTotal;
        ed.isLoading = false; edUpdateUI();
    }


    appElement.addEventListener('click', async e => {
        const tg = e.target;
        if(tg.closest('#eds-bck')) return navigate(-1);
        if(tg.closest('#eds-edt') || tg.closest('#eds-eb')) return navigate(`/supplier/equipment/${eqId}/edit`);
        if(tg.closest('#eds-vcv')) return navigate(`/customer/equipment/${eqId}`); // testing link

        if(tg.closest('#eds-ap-btn')) { showToast('Photo upload coming soon', 'info'); return; }

        if(tg.closest('#eds-atg') || tg.closest('#eds-ab')) {
             if(ed.isTogglingAvail) return;
             ed.isTogglingAvail = true; edUpdateUI();
             const targ = !ed.d.isAvailable;
             
             if(api.updateEquipmentStatus) {
                 try {
                     await api.updateEquipmentStatus(eqId, { isAvailable: targ });
                     ed.d.isAvailable = targ;
                 } catch(er) { showToast('Failed to update availability', 'error'); }
             } else {
                 await new Promise(r=>setTimeout(r,500)); ed.d.isAvailable = targ;
             }
             ed.isTogglingAvail = false; edUpdateUI();
        }

        const bT = tg.closest('.b-tm');
        if(bT) {
             const m = parseInt(bT.dataset.v);
             ed.sf.qt = Math.max(1, Math.min(50, ed.sf.qt + m));
             if(ed.sf.qa > ed.sf.qt) ed.sf.qa = ed.sf.qt;
             return edUpdateUI();
        }

        const bA = tg.closest('.b-am');
        if(bA) {
             const m = parseInt(bA.dataset.v);
             ed.sf.qa = Math.max(0, Math.min(ed.sf.qt, ed.sf.qa + m));
             return edUpdateUI();
        }

        if(tg.closest('#eds-us')) {
             if(ed.isUpdatingStock) return;
             ed.isUpdatingStock = true; edUpdateUI();

             if(api.updateEquipment) {
                 try {
                     await api.updateEquipment(eqId, { quantityAvailable: ed.sf.qa, quantityTotal: ed.sf.qt });
                     ed.d.quantityAvailable = ed.sf.qa; ed.d.quantityTotal = ed.sf.qt;
                     showToast('Stock updated successfully', 'success');
                 } catch(er) { showToast('Failed to update stock', 'error'); }
             } else {
                 await new Promise(r=>setTimeout(r,800)); ed.d.quantityAvailable = ed.sf.qa; ed.d.quantityTotal = ed.sf.qt; showToast('Stock updated successfully', 'success');
             }

             ed.isUpdatingStock = false; edUpdateUI();
        }
    });

    loadData();
}
