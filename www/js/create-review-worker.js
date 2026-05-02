// ================================== //
// SkillConnect Mobile                //
// Worker Write Review                //
// ================================== //

async function renderCreateReviewWorker(appElement, stateRoute) {
    const locState = stateRoute.state || {};
    const { bookingId, customerId, customerName, quickRating } = locState;

    if(!bookingId || !customerId) {
        showToast('Something went wrong. Please try again.', 'error');
        return navigate(-1);
    }

    let wr = {
        rating: quickRating || 0,
        text: '',
        isAnon: false,
        isLoading: true,
        isSubmitting: false,
        showDiscard: false,
        showSuccess: false,
        alreadyReviewed: false,
        submitErr: false,
        formDirty: false
    };

    function getDynamicLabels() {
        if(wr.rating === 0) return { pt: 'Select a rating to continue', pl: 'Tap a star above to rate your experience.' };
        const nm = customerName?.split(' ')[0] || 'the customer';
        
        switch(wr.rating) {
            case 5: return { pt: `Tell others why ${nm} was a great customer!`, pl: `e.g. ${nm} was clear about the job requirements, paid on time, and was respectful throughout. Great customer!` };
            case 4: return { pt: `What made ${nm} easy to work with?`, pl: `e.g. ${nm} was clear about the job requirements, paid on time, and was respectful throughout...` };
            case 3: return { pt: `Describe working with ${nm}.`, pl: `Describe your experience with this customer...` };
            case 2: return { pt: `What could have been better?`, pl: `Describe the issues you experienced with this customer...` };
            case 1: return { pt: `What issues did you experience?`, pl: `Describe the issues you experienced with this customer...` };
        }
    }

    function wrUpdateUI() {
        if(wr.isLoading) {
            appElement.innerHTML = `<div class="wrc-screen"><div class="wrc-h"><button class="wrc-btn-ic" id="wr-bck"><i class="ri-arrow-left-line"></i></button><div class="wrc-t">Review Customer</div><div style="width:44px"></div></div><div class="wrc-sk-r"><div class="wrc-sk-1"></div><div class="wrc-sk-2"></div></div></div>`;
            return;
        }

        if(wr.alreadyReviewed) {
             appElement.innerHTML = `
                <div class="wrc-screen">
                    <div class="wrc-h"><button class="wrc-btn-ic" id="wr-bck"><i class="ri-close-line"></i></button><div class="wrc-t">Review Customer</div><div style="width:44px"></div></div>
                    <div style="padding:60px 24px; text-align:center;">
                        <i class="ri-check-double-line" style="font-size:64px; color:#16A34A; margin-bottom:16px; display:block;"></i>
                        <div style="font-size:20px; font-weight:800; color:#111827; margin-bottom:8px;">Already Reviewed</div>
                        <div style="font-size:15px; color:#4B5563; line-height:1.5; margin-bottom:32px;">You have already submitted a review for this booking. You cannot review the same booking twice.</div>
                        <button style="width:100%; height:52px; background:#111827; color:#FFF; font-weight:700; border:none; border-radius:12px; font-size:16px;" id="wr-dn-btn">Done</button>
                    </div>
                </div>
             `;
             return;
        }

        const { pt, pl } = getDynamicLabels();
        
        let stArr = [];
        for(let i=1; i<=5; i++) {
             const ac = i <= wr.rating ? 'active ri-star-fill pop' : 'ri-star-line';
             stArr.push(`<i class="${ac} wrc-st" data-val="${i}"></i>`);
        }

        const len = wr.text.trim().length;
        let ccCls = '';
        if(len > 0 && len < 10) ccCls = 'err';
        else if (len >= 450) ccCls = 'wrn';

        const cLgl = len >= 10 && len <= 500 && wr.rating > 0;

        appElement.innerHTML = `
            <div class="wrc-screen">
                <div class="wrc-h">
                    <button class="wrc-btn-ic" id="wr-bck"><i class="${wr.formDirty?'ri-close-line':'ri-arrow-left-line'}"></i></button>
                    <div class="wrc-t">Review Customer</div>
                    <div style="width:44px"></div>
                </div>
                
                <div class="wrc-scroll" style="padding-bottom:120px;">
                    <div class="wrc-ctx">
                        <div class="wrc-av">${customerName?.[0]||'C'}</div>
                        <div>
                            <div class="wrc-ctx-l">Reviewing your customer</div>
                            <div class="wrc-ctx-n">${customerName}</div>
                            <div class="wrc-ctx-s">Booking ID: #${bookingId.slice(-6).toUpperCase()}</div>
                        </div>
                    </div>

                    <div class="wrc-g">
                        <div class="wrc-gl ${wr.submitErr && wr.rating===0?'sh':''}">How would you rate this customer?</div>
                        <div class="wrc-stars">${stArr.join('')}</div>
                        <div class="wrc-pmt">${pt}</div>
                    </div>

                    <div class="wrc-ta-w">
                        <textarea class="wrc-ta ${wr.submitErr && (!wr.text.trim() || len<10)?'err':''}" id="wr-txt" placeholder="${pl}" maxlength="500">${wr.text}</textarea>
                        <div class="wrc-cc ${ccCls}">Min 10 chars. ${len}/500</div>
                    </div>

                    <div style="margin-top:24px; margin-bottom:32px;">
                        <div class="wrc-tip">
                            <i class="ri-information-line"></i>
                            <div class="wrc-tip-t">Reviews help other workers know what to expect from customers. Be honest and professional.</div>
                        </div>
                        <div class="wrc-tg" id="wr-tog-an">
                            <div><div class="wrc-tg-l">Post anonymously</div><div class="wrc-tg-s">Your name will be hidden from the review</div></div>
                            <div class="wrc-sw ${wr.isAnon?'active':''}"></div>
                        </div>
                    </div>
                </div>

                <div class="wrc-act">
                    <button class="wrc-sub" id="wr-submit" ${wr.isSubmitting?'disabled':''}>
                        ${wr.isSubmitting?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite;"></div>` : 'Submit Review'}
                    </button>
                </div>

                <!-- Discard Sheet -->
                <div class="wrc-bs-bg ${wr.showDiscard?'active':''}" id="wr-bg-ds">
                    <div class="wrc-bs">
                        <div class="wrc-dh"></div>
                        <div class="wrc-bs-c">
                            <div class="wrc-bs-t">Discard review?</div>
                            <div class="wrc-bs-s">If you go back now, your rating and review will be lost.</div>
                            <div class="wrc-bs-f">
                                <button class="wrc-bs-b1" id="wr-do-ds">Discard</button>
                                <button class="wrc-bs-b2" id="wr-do-cn">Keep Writing</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Success Overlay -->
                <div class="wrc-succ ${wr.showSuccess?'active':''}">
                    <div class="wrc-succ-ic"><i class="ri-check-line"></i></div>
                    <div class="wrc-succ-t">Review Submitted!</div>
                    <div class="wrc-succ-s">Thank you for your feedback.</div>
                </div>
            </div>
        `;
    }

    async function doCheckReview() {
        wr.isLoading = true; wrUpdateUI();
        if(api.checkReview) {
            try {
                const rs = await api.checkReview(bookingId);
                const ex = rs.data?.content || [];
                if(ex.some(r => r.reviewerType === 'worker')) wr.alreadyReviewed = true;
            } catch(e){}
        } else {
            await new Promise(r=>setTimeout(r,600));
        }
        wr.isLoading = false; wrUpdateUI();
    }

    appElement.addEventListener('click', async e => {
        const tg = e.target;
        
        if(tg.closest('#wr-bck')) {
            if(wr.formDirty && !wr.alreadyReviewed && !wr.showSuccess) { wr.showDiscard = true; return wrUpdateUI(); }
            return navigate(-1);
        }
        if(tg.closest('#wr-dn-btn')) return navigate(-1);

        const st = tg.closest('.wrc-st');
        if(st && !wr.isSubmitting) {
             wr.rating = parseInt(st.dataset.val); wr.formDirty = true; wr.submitErr = false; return wrUpdateUI();
        }

        if(tg.closest('#wr-tog-an') && !wr.isSubmitting) {
             wr.isAnon = !wr.isAnon; wr.formDirty = true; return wrUpdateUI();
        }

        if(tg.closest('#wr-submit')) {
             if(wr.isSubmitting) return;
             const len = wr.text.trim().length;
             if(wr.rating === 0 || len < 10) {
                 wr.submitErr = true;
                 if(wr.rating===0) showToast('Please select a rating', 'error');
                 else showToast('Review must be at least 10 characters', 'error');
                 return wrUpdateUI();
             }

             wr.isSubmitting = true; wrUpdateUI();

             const payload = {
                 booking: bookingId,
                 reviewee: customerId,
                 reviewerType: 'worker',
                 overallRating: wr.rating,
                 reviewText: wr.text.trim()
             };

             if(api.createReview) {
                 try {
                     await api.createReview(payload);
                 } catch(err) {
                     wr.isSubmitting = false; wrUpdateUI(); showToast('Failed to submit review', 'error'); return;
                 }
             } else {
                 await new Promise(r=>setTimeout(r,1200));
             }

             wr.isSubmitting = false; wr.showSuccess = true; wrUpdateUI();
             setTimeout(() => {
                 navigate('/worker/bookings');
                 showToast('Review saved successfully', 'success');
             }, 2500);
             return;
        }

        // Modals
        if(tg.closest('#wr-do-cn') || tg.id === 'wr-bg-ds') { wr.showDiscard = false; return wrUpdateUI(); }
        if(tg.closest('#wr-do-ds')) return navigate(-1);
    });

    appElement.addEventListener('input', e => {
        if(e.target.id === 'wr-txt') {
             wr.text = e.target.value.substring(0,500);
             wr.formDirty = true; wr.submitErr = false; wrUpdateUI();
             setTimeout(()=>{const i=document.getElementById('wr-txt');if(i){i.focus(); i.setSelectionRange(i.value.length, i.value.length);}},0);
        }
    });

    doCheckReview();
}
