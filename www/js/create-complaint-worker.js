// ================================== //
// SkillConnect Mobile                //
// Worker Create Complaint            //
// ================================== //

async function renderCreateComplaintWorker(appElement, stateRoute) {
    const locState = stateRoute.state || {};
    const { bookingId, customerId, customerName } = locState;

    let wc = {
        bookingId: bookingId || null,
        targetId: customerId || null,
        targetName: customerName || '',
        category: '',
        priority: '',
        subject: '',
        desc: '',
        isSubmitting: false,
        showDiscard: false,
        showSuccess: false,
        formDirty: false,
        errObj: {}
    };

    const cCats = [
        { v: 'service_quality', l: 'Job Quality Issue', t: 'Job was misrepresented, unsafe conditions, or scope changed' },
        { v: 'inappropriate_behavior', l: 'Inappropriate Behaviour', t: 'Rude, threatening, or unprofessional customer conduct' },
        { v: 'fraud', l: 'Fraud / Non-payment', t: 'Customer refused to pay, disputed agreed amount, or scammed' },
        { v: 'payment_issue', l: 'Payment Dispute', t: 'Disagreement about cost, withheld payment, or deposit issue' },
        { v: 'other', l: 'Other', t: 'Any other issue not listed above' }
    ];

    function wcUpdateUI() {
        if(wc.showSuccess) {
            appElement.innerHTML = `
                <div class="wcw-screen">
                    <div class="wcw-succ active">
                        <div class="wcw-si"><i class="ri-shield-check-fill"></i></div>
                        <div class="wcw-st">Complaint Filed<br>Successfully</div>
                        <div class="wcw-ss">Our trust and safety team will review your report within 24-48 hours. We will contact you if more information is needed.</div>
                        <div class="wcr-bd">
                            <button class="wcr-b-1" id="wc-go-ls">View My Complaints</button>
                            <button class="wcr-b-2" id="wc-go-hm">Back to Home</button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        let idHtml = '';
        if(wc.targetId) {
             idHtml = `
                <div class="wcw-ctx">
                    <div class="wcw-ctx-l">
                        <div class="wcw-av">${wc.targetName?.[0]||'C'}</div>
                        <div><div class="wcw-ctx-s">Reporting an issue with</div><div class="wcw-ctx-n">${wc.targetName}</div></div>
                    </div>
                </div>
             `;
        } else {
             // Fallback string manually explicitly handling missing Context bindings seamlessly logic natively properly wrapping missing structures safely.
             idHtml = `
                <div class="wcw-in-w">
                    <div class="wcw-lbl" style="color:${wc.errObj.id?'#DC2626':''}">Who are you complaining about?</div>
                    <div class="wcw-sb">Enter the customer's name. Our team will locate their account.</div>
                    <input type="text" class="wcw-in ${wc.errObj.id?'err':''}" id="in-cn" placeholder="e.g. Nimal Perera" value="${wc.targetName}" autocomplete="off">
                </div>
             `;
        }

        let catHtml = cCats.map(c => `
             <div class="wcw-c-box ${wc.category === c.v ? 'active':''}" data-cv="${c.v}">
                 <div class="wcr-rd"></div>
                 <div><div class="wcw-c-bx-t">${c.l}</div><div class="wcw-c-bx-s">${c.t}</div></div>
             </div>
        `).join('');

        let desL = wc.desc.trim().length;

        appElement.innerHTML = `
            <div class="wcw-screen">
                <div class="wcw-h">
                    <button class="wcw-btn-ic" id="wc-bck"><i class="${wc.formDirty?'ri-close-line':'ri-arrow-left-line'}"></i></button>
                    <div class="wcw-t">File a Complaint</div>
                    <div style="width:44px"></div>
                </div>

                <div class="wcw-scroll" style="padding-bottom:120px;">
                    <div class="wcw-wn">
                        <i class="ri-alert-fill"></i>
                        <div class="wcw-wn-t">Filing a false complaint against a customer may result in your account being suspended.</div>
                    </div>

                    ${idHtml}

                    <div class="wcw-cb-w">
                        <div class="wcw-lbl" style="color:${wc.errObj.cat?'#DC2626':''}">What type of issue is this?</div>
                        <div class="wcw-cx">${catHtml}</div>
                    </div>

                    <div class="wcw-in-w">
                        <div class="wcw-lbl" style="color:${wc.errObj.sub?'#DC2626':''}">Complaint Title</div>
                        <input type="text" class="wcw-in ${wc.errObj.sub?'err':''}" id="in-sub" placeholder="e.g. Customer refused to pay agreed amount" value="${wc.subject}" autocomplete="off">
                    </div>

                    <div class="wcw-in-w">
                        <div class="wcw-lbl" style="color:${wc.errObj.pri?'#DC2626':''}">Priority Level</div>
                        <div class="wcw-sb">How urgently does this need review?</div>
                        <div class="wcw-pg">
                            <button class="wcw-pb p-l ${wc.priority==='low'?'active':''}" data-pv="low">Low</button>
                            <button class="wcw-pb p-m ${wc.priority==='medium'?'active':''}" data-pv="medium">Medium</button>
                            <button class="wcw-pb p-h ${wc.priority==='high'?'active':''}" data-pv="high">High</button>
                        </div>
                    </div>

                    <div class="wcw-ta-w">
                        <div class="wcw-lbl" style="color:${wc.errObj.des?'#DC2626':''}">Description of the Issue</div>
                        <div class="wcw-sb">Please describe what happened in detail. Include the agreed payment, what the customer said, and any evidence you have...</div>
                        <textarea class="wcw-ta ${wc.errObj.des?'err':''}" id="in-des" placeholder="Describe the incident...">${wc.desc}</textarea>
                        <div class="wcw-cc ${wc.errObj.des?'err':''}">${desL}/1000</div>
                    </div>

                    <div class="wcw-ev">
                        <i class="ri-upload-cloud-2-line wcw-ev-ic"></i>
                        <div class="wcw-ev-t">Supporting Evidence (Optional)</div>
                        <div class="wcw-ev-s">Upload screenshots, photos, or documents</div>
                        <button class="wcw-ev-b">Select Files</button>
                    </div>
                </div>

                <div class="wcw-act">
                    <button class="wcw-sub" id="wc-do-sub" ${wc.isSubmitting?'disabled':''}>
                        ${wc.isSubmitting?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite;"></div>` : 'Submit Complaint'}
                    </button>
                </div>

                <!-- Discard Sheet -->
                <div class="wcw-bs-bg ${wc.showDiscard?'active':''}" id="wcd-bg">
                    <div class="wcw-bs"><div class="wcr-dh"></div>
                        <div class="wcw-bs-c">
                            <div class="wcw-bs-t">Discard complaint?</div>
                            <div class="wwc-bs-s">Your report will not be saved or sent to our safety team.</div>
                            <div class="wcw-bs-f">
                                <button class="wcw-bs-b1" id="wcd-do">Discard Report</button>
                                <button class="wcw-bs-b2" id="wcd-cn">Keep Writing</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    appElement.addEventListener('click', async e => {
        const tg = e.target;
        if(tg.closest('#wc-bck')) {
            if(wc.formDirty && !wc.showSuccess) { wc.showDiscard = true; return wcUpdateUI(); }
            return navigate(-1);
        }

        const cb = tg.closest('.wcw-c-box');
        if(cb && !wc.isSubmitting) { wc.category = cb.dataset.cv; wc.formDirty = true; wc.errObj.cat = false; return wcUpdateUI(); }

        const pb = tg.closest('.wcw-pb');
        if(pb && !wc.isSubmitting) { wc.priority = pb.dataset.pv; wc.formDirty = true; wc.errObj.pri = false; return wcUpdateUI(); }

        // Discard Handling
        if(tg.closest('#wcd-cn') || tg.id === 'wcd-bg') { wc.showDiscard = false; return wcUpdateUI(); }
        if(tg.closest('#wcd-do')) return navigate(-1);

        // Success Handling
        if(tg.closest('#wc-go-ls')) return navigate('/worker/complaints');
        if(tg.closest('#wc-go-hm')) return navigate('/worker/dashboard'); // Or '/worker/bookings'

        if(tg.closest('#wc-do-sub')) {
             if(wc.isSubmitting) return;

             wc.errObj = {};
             let hErr = false;
             if(!wc.targetId && !wc.targetName.trim()) { wc.errObj.id = true; hErr = true; }
             if(!wc.category) { wc.errObj.cat = true; hErr = true; }
             if(!wc.priority) { wc.errObj.pri = true; hErr = true; }
             if(!wc.subject.trim() || wc.subject.trim().length < 5) { wc.errObj.sub = true; hErr = true; }
             if(!wc.desc.trim() || wc.desc.trim().length < 20) { wc.errObj.des = true; hErr = true; }

             if(hErr) { showToast('Please complete all required fields correctly', 'error'); return wcUpdateUI(); }

             // TODO: Real API handling mappings mapping dynamically. 
             if(!wc.targetId) {
                  showToast('Please contact support to file a complaint against a specific customer: support@skillconnect.lk', 'error');
                  return;
             }

             wc.isSubmitting = true; wcUpdateUI();

             const pl = {
                 category: wc.category,
                 priority: wc.priority,
                 subject: wc.subject.trim(),
                 description: wc.desc.trim(),
                 complainedAgainst: wc.targetId,
                 booking: wc.bookingId || undefined
             };

             if(api.createComplaint) {
                  try { await api.createComplaint(pl); }
                  catch(er) { wc.isSubmitting = false; wcUpdateUI(); showToast('Failed to file complaint', 'error'); return; }
             } else {
                  await new Promise(r=>setTimeout(r,1200));
             }

             wc.isSubmitting = false; wc.showSuccess = true; wcUpdateUI();
        }
    });

    appElement.addEventListener('input', e => {
        if(wc.isSubmitting) return;
        if(e.target.id === 'in-sub') { wc.subject = e.target.value.substring(0,60); wc.formDirty = true; wc.errObj.sub = false; }
        if(e.target.id === 'in-des') { wc.desc = e.target.value.substring(0,1000); wc.formDirty = true; wc.errObj.des = false; wcUpdateUI(); setTimeout(()=>{const i=document.getElementById('in-des');if(i){i.focus(); i.setSelectionRange(i.value.length, i.value.length);}},0); }
        if(e.target.id === 'in-cn') { wc.targetName = e.target.value; wc.formDirty = true; wc.errObj.id = false; }
    });

    wcUpdateUI();
}
