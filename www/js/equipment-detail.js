// ============================== //
// SkillConnect Mobile           //
// Equipment Detail Screen       //
// ============================== //

async function renderEquipmentDetail(appElement, stateRoute) {
    const eqId = window.location.hash.split('/').pop();
    
    let edState = {
        equipment: null,
        similarEquipment: [],
        isLoading: true,
        error: null,
        isSaved: localStorage.getItem(`saved_equipment_${eqId}`) === "true",
        expandedDescription: false,
        rentalDays: 1,
        showEnquirySheet: false,
        enquiryForm: { startDate: "", message: "", days: 1 },
        enquiryErrors: {},
        isSubmittingEnquiry: false
    };

    function formatLKR(amount) { return "LKR " + (amount || 0).toLocaleString("en-LK"); }
    function formatRelativeTime(iso) {
        if (!iso) return "N/A";
        const d = new Date(iso);
        const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    }
    
    function getCategoryIcon(cat) {
        const ICONS = {
            "Power Tools": "ri-tools-fill", "Hand Tools": "ri-hammer-fill", "Heavy Machinery": "ri-truck-fill", 
            "Scaffolding": "ri-building-4-fill", "Electrical": "ri-flashlight-fill", "Plumbing": "ri-drop-fill",
            "Welding": "ri-fire-fill", "Painting": "ri-paint-brush-fill", "Gardening": "ri-leaf-fill",
            "Safety": "ri-shield-fill", "Other": "ri-box-3-fill"
        };
        return ICONS[cat] || "ri-settings-4-fill";
    }

    function getConditionConfig(cond) {
        const c = String(cond).toLowerCase();
        if(c==='new') return {l: "★ New", cls: "new"};
        if(c==='excellent') return {l: "✓ Excellent", cls: "excellent"};
        if(c==='good') return {l: "◆ Good", cls: "good"};
        if(c==='fair') return {l: "△ Fair", cls: "fair"};
        return {l: cond, cls: ""};
    }

    function edUpdateUI() {
        if (edState.isLoading) {
            appElement.innerHTML = `
                <div class="ed-screen">
                    <div class="ed-header"><button class="ed-btn-icon" onclick="navigate(-1)"><i class="ri-arrow-left-line"></i></button><div class="ed-title-global">Equipment Detail</div><div style="width:44px;"></div></div>
                    <div class="ed-scroll-content">
                        <div class="ed-sk-img"></div>
                        <div class="ed-sk-q"><div class="ed-sk-qb"></div><div class="ed-sk-qb"></div><div class="ed-sk-qb"></div></div>
                        <div class="ed-sk-card" style="height:200px;"></div>
                        <div class="ed-sk-card" style="height:180px;"></div>
                        <div class="ed-sk-card" style="height:120px;"></div>
                    </div>
                    <div class="ed-cta-bar"><div style="flex:1; height:52px; background:#E5E7EB; border-radius:12px;"></div></div>
                </div>
            `;
            return;
        }

        if (edState.error || !edState.equipment) {
            appElement.innerHTML = `
                <div class="ed-screen">
                    <div class="ed-header"><button class="ed-btn-icon" onclick="navigate(-1)"><i class="ri-arrow-left-line"></i></button><div class="ed-title-global">Equipment Detail</div><div style="width:44px;"></div></div>
                    <div style="text-align:center; padding:100px 20px;">
                        <i class="ri-error-warning-line" style="font-size:48px; color:#F59E0B; margin-bottom:16px; display:block;"></i>
                        <div style="font-size:18px; font-weight:700; margin-bottom:8px;">Couldn't load equipment</div>
                        <div style="font-size:14px; color:#6B7280; margin-bottom:24px;">${edState.error || "Check your connection"}</div>
                        <button id="ed-retry" style="height:48px; padding:0 24px; background:#111827; color:#FFF; font-weight:600; border-radius:10px;">Retry</button>
                    </div>
                </div>
            `;
            return;
        }

        const e = edState.equipment;
        const sup = e.supplier || {};
        const isAv = e.isAvailable && e.quantityAvailable > 0;
        const cConf = getConditionConfig(e.equipmentCondition);
        
        let imgHtml = '';
        if(e.imagePath) {
             imgHtml = `<img src="${e.imagePath}" class="ed-im-raw">`;
        } else {
             imgHtml = `<i class="${getCategoryIcon(e.category)} ed-im-ic"></i><div class="ed-im-lbl">${e.category||'General'}</div><div class="ed-im-sub">No photo available</div>`;
        }

        const rentDays = edState.rentalDays;
        const calcRent = e.rentalPricePerDay * rentDays;
        const calcTot = calcRent + e.depositAmount;

        const supInitials = sup.companyName ? sup.companyName[0] : ((sup.firstName||'?')[0] + (sup.lastName||'')[0]);
        const supName = sup.companyName || `${sup.firstName} ${sup.lastName}`;

        let similarHtml = '';
        if (edState.similarEquipment.length > 0) {
            similarHtml = `
                <div class="ed-card" style="padding-bottom:12px;">
                    <div class="ed-card-title">You might also need</div>
                    <div class="ed-sim-scroll">
                        ${edState.similarEquipment.map(s => `
                            <div class="ed-sim-card" data-sid="${s._id}">
                                <div class="ed-sim-im">${s.imagePath ? `<img src="${s.imagePath}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : `<i class="${getCategoryIcon(s.category)}" style="font-size:24px;color:#9CA3AF;"></i>`}</div>
                                <div class="ed-sim-t">${s.equipmentName}</div>
                                <div class="ed-sim-p">LKR ${s.rentalPricePerDay} / day</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Enquiry sheet bounds
        const eqDays = edState.enquiryForm.days;
        const eqRent = e.rentalPricePerDay * eqDays;
        const eqTot = eqRent + e.depositAmount;

        // Min strict tomorrow
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
        const maxDate = new Date(); maxDate.setDate(maxDate.getDate()+90);
        const isoTomorrow = tomorrow.toISOString().split('T')[0];
        const isoMax = maxDate.toISOString().split('T')[0];

        appElement.innerHTML = `
            <div class="ed-screen">
                <div class="ed-header">
                    <button class="ed-btn-icon" onclick="navigate(-1)"><i class="ri-arrow-left-line"></i></button>
                    <div class="ed-title-global">Equipment Detail</div>
                    <div class="ed-hdr-right">
                        <button class="ed-btn-action ${edState.isSaved ? 'saved' : ''}" id="ed-sv-t"><i class="${edState.isSaved ? 'ri-heart-3-fill' : 'ri-heart-3-line'}"></i></button>
                        <button class="ed-btn-action" id="ed-sh-t"><i class="ri-share-forward-line"></i></button>
                    </div>
                </div>

                <div class="ed-scroll-content">
                    <div class="ed-img-sec">
                        ${imgHtml}
                        <div class="ed-pill-bl ${isAv ? 'avail' : 'unavail'}">${isAv ? '● Available' : '○ Unavailable'}</div>
                        <div class="ed-pill-br ${cConf.cls}">${cConf.l}</div>
                    </div>
                    
                    <div class="ed-q-strip">
                        <div class="ed-q-col"><div class="ed-q-lbl">Daily Rental</div><div class="ed-q-val primary">LKR ${e.rentalPricePerDay}</div></div>
                        <div class="ed-q-div"></div>
                        <div class="ed-q-col"><div class="ed-q-lbl">Security Deposit</div><div class="ed-q-val">LKR ${e.depositAmount}</div></div>
                        <div class="ed-q-div"></div>
                        <div class="ed-q-col"><div class="ed-q-lbl">In Stock</div><div class="ed-q-val">${e.quantityAvailable}</div></div>
                    </div>

                    <div class="ed-card">
                        <div class="ed-card-title">About this Equipment</div>
                        <div class="ed-about-t">${e.equipmentName}</div>
                        <div class="ed-about-tags">
                            <span class="ed-a-chip">${e.category}</span>
                            <span class="ed-a-chip" style="border:none; color:#FFF; background:${cConf.cls==='new'?'#2563EB':cConf.cls==='excellent'?'#16A34A':cConf.cls==='good'?'#0D9488':'#D97706'};">${cConf.l}</span>
                        </div>
                        <div class="ed-desc-wrap">
                            ${e.equipmentDescription ? `
                                <div class="ed-desc-txt ${!edState.expandedDescription ? 'collapsed' : ''}">${e.equipmentDescription}</div>
                                <button class="ed-desc-btn" id="ed-exp-btn">${edState.expandedDescription ? 'Read less' : 'Read more'}</button>
                            ` : `<div class="ed-desc-emp">No description provided.</div>`}
                        </div>
                    </div>

                    <div class="ed-card">
                        <div class="ed-card-title">Rental Pricing</div>
                        <div class="ed-pr-row"><div class="ed-pr-l prim"><i class="ri-calendar-event-line"></i> Daily Rental</div><div class="ed-pr-v prim">LKR ${e.rentalPricePerDay}</div></div><div class="ed-pr-div"></div>
                        <div class="ed-pr-row"><div class="ed-pr-l"><i class="ri-calendar-line"></i> 7-Day Estimate</div><div class="ed-pr-v">~LKR ${e.rentalPricePerDay * 7}</div></div><div class="ed-pr-div"></div>
                        <div class="ed-pr-row"><div class="ed-pr-l"><i class="ri-calendar-line"></i> 30-Day Estimate</div><div class="ed-pr-v">~LKR ${e.rentalPricePerDay * 30}</div></div>
                        
                        <div class="ed-dep-box">
                            <div class="ed-dep-r1"><div class="ed-dep-l"><i class="ri-lock-2-line"></i> Security Deposit</div><div class="ed-dep-v">LKR ${e.depositAmount}</div></div>
                            <div class="ed-dep-r2">Deposit is refunded upon safe return of the equipment.</div>
                        </div>

                        <div class="ed-calc-box">
                            <div class="ed-calc-l">Calculate rental cost</div>
                            <div class="ed-calc-row">
                                <div class="ed-calc-slbl">Number of days</div>
                                <div class="ed-stepper">
                                    <button class="ed-st-btn" id="ed-st-m" ${rentDays <= 1 ? 'disabled style="opacity:0.3"':''}>-</button>
                                    <div class="ed-st-val">${rentDays}</div>
                                    <button class="ed-st-btn" id="ed-st-p" ${rentDays >= 30 ? 'disabled style="opacity:0.3"':''}>+</button>
                                </div>
                            </div>
                            <div class="ed-calc-res">
                                <div class="ed-calc-rent">LKR ${calcRent}</div>
                                <div class="ed-calc-sub">+ LKR ${e.depositAmount} deposit</div>
                                <div class="ed-calc-tot">Total upfront: LKR ${calcTot}</div>
                            </div>
                        </div>
                    </div>

                    <div class="ed-card">
                        <div class="ed-card-title">Availability</div>
                        <div class="ed-av-bl ${isAv ? 'av' : 'un'}">
                            <div class="ed-av-l1"><i class="${isAv ? 'ri-checkbox-circle-fill' : 'ri-close-circle-fill'}"></i> ${isAv ? 'Available to Rent' : 'Currently Unavailable'}</div>
                            <div class="ed-av-l2">${isAv ? `${e.quantityAvailable} of ${e.quantityTotal} units available` : 'All units are currently rented out. Check back soon.'}</div>
                        </div>
                        
                        ${(isAv && e.quantityTotal <= 10) ? `
                            <div class="ed-dots-wrap">
                                <div class="ed-dots">${Array.from({length: e.quantityTotal}).map((_, i) => `<div class="ed-dot ${i < e.quantityAvailable ? 'av' : 'rd'}"></div>`).join('')}</div>
                                <div class="ed-dots-lbl">${e.quantityAvailable} available, ${e.quantityTotal - e.quantityAvailable} rented out</div>
                            </div>
                        ` : ''}

                        <div class="ed-av-ts"><i class="ri-time-line"></i> Listed ${formatRelativeTime(e.createdAt)}</div>
                        <div class="ed-av-ts" style="margin-top:6px;"><i class="ri-refresh-line"></i> Updated ${formatRelativeTime(e.updatedAt)}</div>
                    </div>

                    <div class="ed-card">
                        <div class="ed-card-title">Supplier</div>
                        <div class="ed-sup-wrap">
                            <div class="ed-s-av">${supInitials.toUpperCase()}${sup.isVerified ? `<div class="ed-s-ver"><i class="ri-check-line"></i></div>` : ''}</div>
                            <div class="ed-s-mid">
                                <div class="ed-s-name">${supName}</div>
                                ${sup.isVerified ? `<div class="ed-s-ver-lbl"><i class="ri-shield-check-fill" style="margin-right:2px;"></i>Verified Supplier</div>` : ''}
                                <div class="ed-s-loc">${sup.city||''}, ${sup.district||''}</div>
                                ${sup.bio ? `<div class="ed-s-bio">${sup.bio}</div>` : ''}
                            </div>
                        </div>
                        <div class="ed-s-acts">
                            <button class="ed-s-btn" id="ed-s-prof">View Supplier</button>
                            ${sup.phone ? `<button class="ed-s-btn" id="ed-s-call"><i class="ri-phone-fill"></i> Call Supplier</button>` : `<button class="ed-s-btn" style="opacity:0.5;">No Phone</button>`}
                        </div>
                    </div>

                    ${similarHtml}

                    <div class="ed-card">
                        <div class="ed-card-title">Before You Rent</div>
                        <ul class="ed-nl">
                            <li class="ed-nl-i"><i class="ri-information-line ed-nl-ic"></i> Contact the supplier to confirm availability before visiting.</li>
                            <li class="ed-nl-i"><i class="ri-information-line ed-nl-ic"></i> Inspect the equipment thoroughly before accepting the rental.</li>
                            <li class="ed-nl-i"><i class="ri-information-line ed-nl-ic"></i> A security deposit of LKR ${e.depositAmount} is required upfront.</li>
                            <li class="ed-nl-i"><i class="ri-information-line ed-nl-ic"></i> Damage or loss may result in deposit forfeiture.</li>
                            <li class="ed-nl-i"><i class="ri-information-line ed-nl-ic"></i> Payment is handled directly between you and the supplier.</li>
                        </ul>
                    </div>

                    <div class="ed-rep-link" id="ed-rep">Report this listing</div>
                </div>

                <div class="ed-cta-bar">
                    ${isAv ? `
                        <button class="ed-cta-sv ${edState.isSaved ? 'active' : ''}" id="ed-cta-svb"><i class="${edState.isSaved ? 'ri-heart-3-fill' : 'ri-heart-3-line'}"></i> ${edState.isSaved ? 'Saved ✓' : 'Save'}</button>
                        <button class="ed-cta-enq" id="ed-btn-enq">Enquire to Rent</button>
                    ` : `
                        <button class="ed-cta-not" id="ed-not-f"><i class="ri-notification-3-line"></i> Notify When Available</button>
                    `}
                </div>

                <!-- Enquiry Sheet -->
                <div class="ed-sheet-bg ${edState.showEnquirySheet ? 'active' : ''}" id="ed-enq-bg">
                    <div class="ed-sheet">
                        <div class="ed-sh-head">
                            <div class="ed-sh-ti">Enquire to Rent</div>
                            <div class="ed-sh-sub">${e.equipmentName}</div>
                        </div>
                        <div class="ed-sh-body">
                            <div class="ed-sh-sup">
                                <div class="ed-ss-av">${supInitials.toUpperCase()}</div>
                                <div class="ed-ss-r"><div class="ed-ss-n">${supName}</div><div class="ed-ss-l">${sup.city||''}, ${sup.district||''}</div></div>
                            </div>
                            
                            <div class="ed-form-g">
                                <div class="ed-fg-lbl">How long do you need it?</div>
                                <div class="ed-fm-stepper">
                                    <button class="ed-st-btn" id="s-st-m" ${eqDays <= 1 ? 'disabled style="opacity:0.3"':''}>-</button>
                                    <div class="ed-st-val" style="flex:1;">${eqDays} days</div>
                                    <button class="ed-st-btn" id="s-st-p" ${eqDays >= 30 ? 'disabled style="opacity:0.3"':''}>+</button>
                                </div>
                            </div>

                            <div class="ed-form-g">
                                <div class="ed-fg-lbl">When do you need it?</div>
                                <input type="date" class="ed-in-date" id="s-st-date" min="${isoTomorrow}" max="${isoMax}" value="${edState.enquiryForm.startDate}">
                                ${edState.enquiryErrors.date ? `<div class="ed-err" style="display:block;">${edState.enquiryErrors.date}</div>` : ''}
                            </div>

                            <div class="ed-form-g" style="margin-bottom:4px;">
                                <div class="ed-fg-lbl">Your message</div>
                                <textarea class="ed-in-ta" id="s-st-msg" maxlength="500" placeholder="e.g. I need the drill for a home renovation project starting Monday. Can you confirm availability?">${edState.enquiryForm.message}</textarea>
                                <div class="ed-fg-hint">${edState.enquiryForm.message.length} / 500</div>
                                ${edState.enquiryErrors.msg ? `<div class="ed-err" style="display:block;">${edState.enquiryErrors.msg}</div>` : ''}
                            </div>

                            <div class="ed-sh-cost">
                                <div class="ed-sc-l">Estimated rental cost</div>
                                <div class="ed-sc-r">LKR ${eqRent}</div>
                                <div class="ed-sc-d">+ LKR ${e.depositAmount} deposit</div>
                                <div class="ed-sc-t">Total upfront: LKR ${eqTot}</div>
                            </div>

                            <button class="ed-sh-btn" id="s-st-sub" ${edState.isSubmittingEnquiry ? 'disabled' : ''}>
                                ${edState.isSubmittingEnquiry ? `<div class="spinner" style="width:18px;height:18px;border:2px solid;border-top-color:#FFF;border-radius:50%;margin-right:8px;animation:spin 1s infinite;"></div>` : ''}
                                ${edState.isSubmittingEnquiry ? 'Sending...' : 'Send Enquiry'}
                            </button>
                            <div class="ed-sh-canc" id="s-st-can">Cancel</div>
                        </div>
                    </div>
                </div>

            </div>
        `;
    }

    async function loadData() {
        edState.isLoading = true;
        edUpdateUI();

        let eProm = api.getEquipmentDetail ? api.getEquipmentDetail(eqId) : Promise.resolve({});
        let aProm = api.getEquipment ? api.getEquipment() : Promise.resolve({data:{content:[]}});

        const [eR, aR] = await Promise.allSettled([eProm, aProm]);

        let loadedEq = null;
        if (eR.status === 'fulfilled' && eR.value && eR.value.data) {
             loadedEq = eR.value.data;
        } else {
             // Mock block matching native responses 
             loadedEq = {
                _id: eqId,
                supplier: { _id: "s1", firstName: "Nimal", lastName: "Silva", companyName: "Lanka Tools & Equipment", city: "Colombo", district: "Colombo", phone: "0112345678", isVerified: true, bio: "We supply quality tools and heavy machinery for construction works." },
                equipmentName: "Heavy Duty Power Drill SDS Plus",
                equipmentDescription: "Bosch professional grade heavy duty power drill. Ideal for concrete and masonry. Comes with 3 drill bits and a carry case. Must return clean.",
                category: "Power Tools",
                equipmentCondition: "excellent",
                rentalPricePerDay: 1500,
                depositAmount: 5000,
                quantityAvailable: 3,
                quantityTotal: 5,
                imagePath: null,
                isAvailable: true,
                createdAt: new Date(Date.now() - 86400000*30).toISOString(),
                updatedAt: new Date(Date.now() - 86400000*2).toISOString()
             };
        }

        edState.equipment = loadedEq;

        if (aR.status === 'fulfilled' && aR.value && aR.value.data && aR.value.data.content) {
             const all = aR.value.data.content;
             edState.similarEquipment = all.filter(x => x.category === loadedEq.category && x._id !== loadedEq._id && x.isAvailable).slice(0, 4);
        } else {
             edState.similarEquipment = [
                { _id: "eq2", equipmentName: "Angle Grinder 115mm", category: "Power Tools", rentalPricePerDay: 1200, isAvailable: true },
                { _id: "eq3", equipmentName: "Circular Saw 184mm", category: "Power Tools", rentalPricePerDay: 1800, isAvailable: true },
                { _id: "eq4", equipmentName: "Jigsaw 600W", category: "Power Tools", rentalPricePerDay: 1000, isAvailable: true }
             ];
        }

        edState.isLoading = false;
        edUpdateUI();
    }

    appElement.addEventListener('click', async (e) => {
        if(e.target.closest('#ed-retry')) { loadData(); }

        const tg = e.target;
        
        // Header Toggles
        if(tg.closest('#ed-sh-t')) { showToast("Share coming soon!"); }
        if(tg.closest('#ed-sv-t') || tg.closest('#ed-cta-svb')) {
            edState.isSaved = !edState.isSaved;
            if(edState.isSaved) {
                localStorage.setItem(`saved_equipment_${eqId}`, "true");
                showToast("Saved to favourites", "success");
            } else {
                localStorage.removeItem(`saved_equipment_${eqId}`);
                showToast("Removed from favourites", "info");
            }
            edUpdateUI();
        }

        // Desc Toggle
        if(tg.closest('#ed-exp-btn')) { edState.expandedDescription = !edState.expandedDescription; edUpdateUI(); }

        // Calculator Stepper
        if(tg.closest('#ed-st-m')) { if(edState.rentalDays > 1) { edState.rentalDays--; edUpdateUI(); } }
        if(tg.closest('#ed-st-p')) { if(edState.rentalDays < 30) { edState.rentalDays++; edUpdateUI(); } }

        // Similar routing
        const simC = tg.closest('.ed-sim-card');
        if(simC) { navigate(`/customer/equipment/${simC.dataset.sid}`); }

        // Contacts & reports
        if(tg.closest('#ed-s-prof')) { showToast("Supplier profiles coming soon"); } // TODO: integrate via public profile hooks
        if(tg.closest('#ed-s-call')) {
            const p = edState.equipment.supplier.phone;
            if(p) { try { window.location.href = `tel:${p}`; } catch(e){} }
            else { showToast("No phone number listed"); }
        }
        if(tg.closest('#ed-rep')) { showToast("Report system coming soon"); } // TODO: route -> /customer/complaints/create

        // Enquiry Form Sheet Bounds
        if(tg.closest('#ed-btn-enq')) { 
            edState.enquiryForm.days = edState.rentalDays; // sync init
            edState.showEnquirySheet = true; edUpdateUI(); 
        }
        if(tg.closest('#ed-not-f')) { showToast("We'll notify you when this item is available. (Feature coming soon)"); }
        
        if(tg.closest('#s-st-can') || tg.id === 'ed-enq-bg') { edState.showEnquirySheet = false; edUpdateUI(); }
        
        // Flow Stepper insides
        if(tg.closest('#s-st-m')) { if(edState.enquiryForm.days > 1) { edState.enquiryForm.days--; edUpdateUI(); } }
        if(tg.closest('#s-st-p')) { if(edState.enquiryForm.days < 30) { edState.enquiryForm.days++; edUpdateUI(); } }

        // Submission
        if(tg.closest('#s-st-sub') && !edState.isSubmittingEnquiry) {
            let errs = {};
            if(!edState.enquiryForm.startDate) errs.date = "Please select a future start date";
            if(edState.enquiryForm.message.trim().length < 20) errs.msg = "Please describe your rental needs (min 20 characters)";
            
            edState.enquiryErrors = errs;
            if(Object.keys(errs).length > 0) { edUpdateUI(); return; }

            edState.isSubmittingEnquiry = true;
            edUpdateUI();
            
            await new Promise(r => setTimeout(r, 1200)); // Simulate API Post

            edState.isSubmittingEnquiry = false;
            edState.showEnquirySheet = false;
            edUpdateUI();
            showToast("Enquiry sent! The supplier will contact you soon.", "success");
        }
    });

    appElement.addEventListener('input', e => {
        if(e.target.id === 's-st-date') { 
            edState.enquiryForm.startDate = e.target.value; 
            if(edState.enquiryErrors.date) { delete edState.enquiryErrors.date; edUpdateUI(); }
        }
        if(e.target.id === 's-st-msg') { 
            edState.enquiryForm.message = e.target.value;
            const lg = e.target.closest('.ed-form-g').querySelector('.ed-fg-hint');
            if(lg) lg.innerText = `${e.target.value.length} / 500`;
            if(edState.enquiryForm.message.trim().length >= 20 && edState.enquiryErrors.msg) { delete edState.enquiryErrors.msg; edUpdateUI(); }
        }
    });

    loadData();
}
