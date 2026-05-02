// ================================== //
// SkillConnect Mobile                //
// Worker Booking Detail              //
// ================================== //

async function renderBookingDetailWorker(appElement, stateRoute) {
    const bookingId = stateRoute.params.id;
    const userId = localStorage.getItem('userId') || 'worker_me';

    let bd = {
        booking: null,
        customerReview: null,
        isLoading: true,
        error: null,
        showMoreSheet: false,
        showAcceptSheet: false,
        showDeclineSheet: false,
        showStartSheet: false,
        showCompleteSheet: false,
        showCancelSheet: false,
        actionReason: '',
        finalCost: '',
        isUpdating: false
    };

    function processRelativeTime(dStr) {
        if(!dStr) return '';
        const d = new Date(dStr);
        const ms = Date.now() - d.getTime();
        const df = ms / (1000*60*60*24);
        if(df < 1) return 'Today';
        if(df < 2) return 'Yesterday';
        if(df < 7) return `${Math.floor(df)}d ago`;
        return d.toLocaleDateString();
    }

    function bdUpdateUI() {
        if(bd.isLoading) {
            appElement.innerHTML = `<div class="wbd-screen"><div class="wbd-h"><button class="wbd-h-btn" id="wb-bk-btn"><i class="ri-arrow-left-line"></i></button><div class="wbd-t">Booking Detail</div><button class="wbd-h-r"><i class="ri-more-2-fill"></i></button></div><div class="wbd-skc"><div class="wbd-sl1"></div><div class="wbd-sl1"></div></div></div>`;
            return;
        }

        if(bd.error || !bd.booking) {
            appElement.innerHTML = `<div class="wbd-screen"><div class="wbd-h"><button class="wbd-h-btn" id="wb-bk-btn"><i class="ri-arrow-left-line"></i></button><div class="wbd-t">Error</div><div style="width:44px"></div></div><div style="padding:40px 20px;text-align:center;color:#6B7280">${bd.error||'Booking not found.'}</div></div>`;
            return;
        }

        const b = bd.booking;
        const st = b.bookingStatus;
        
        let shCls = '', shIc = '', shT = '', shS = '', shSb = '';
        if(st === 'requested') {
             shCls = 'req'; shIc = 'ri-notification-3-fill'; shT = 'Awaiting Your Response'; shS = 'Please accept or decline this booking request.';
             shSb = `<div class="wbd-sh-wa"><i class="ri-timer-line"></i> Please respond promptly.</div>`;
        } else if(st === 'accepted') {
             shCls = 'acc'; shIc = 'ri-checkbox-circle-fill'; shT = 'Booking Confirmed'; shS = 'You have confirmed this booking.';
             const sd = new Date(b.scheduledDate);
             const dif = Math.ceil((sd.getTime() - new Date().setHours(0,0,0,0)) / (1000*60*60*24));
             if(dif === 0) shSb = `<div class="wbd-sh-cx" style="background:rgba(255,255,255,0.3)"><i class="ri-flashlight-fill"></i> Work starts today!</div>`;
             else if(dif > 0) shSb = `<div class="wbd-sh-cx"><i class="ri-calendar-event-line"></i> ${dif} days until work starts</div>`;
        } else if(st === 'in_progress') {
             shCls = 'inp'; shIc = 'ri-tools-fill'; shT = 'Work In Progress'; shS = 'You have started work on this job.';
             shSb = `<div class="wbd-sh-cx"><div class="pls"></div> Work in progress</div>`;
        } else if(st === 'completed') {
             shCls = 'com'; shIc = 'ri-checkbox-circle-fill'; shT = 'Job Completed'; shS = 'This job has been marked complete.';
             shSb = `<div class="wbd-sh-cx"><i class="ri-check-double-line"></i> Completed ${processRelativeTime(b.completedAt || b.updatedAt)}</div>`;
        } else if(st === 'cancelled') {
             shCls = 'can'; shIc = 'ri-close-circle-fill'; shT = 'Cancelled'; shS = 'This booking was cancelled.';
        } else if(st === 'rejected') {
             shCls = 'rej'; shIc = 'ri-user-unfollow-fill'; shT = 'You Declined This Booking'; shS = 'This booking request was declined.';
        }

        const hrR = b.job?.hourlyRate || b.customer?.hourlyRate || 2500;
        const estR = hrR * (b.estimatedDurationHours||0);

        // Timeline
        let tlHtml = '';
        const dCr = new Date(b.createdAt).toLocaleDateString();
        tlHtml += `
            <div class="wbd-ti dn">
                <div class="wbd-ti-dt"></div>
                <div class="wbd-ti-t">Requested</div>
                <div class="wbd-ti-s">${dCr}</div>
            </div>
        `;
        
        if(st === 'requested') {
             tlHtml += `
                 <div class="wbd-ti ac"><div class="wbd-ti-dt"></div><div class="wbd-ti-t" style="color:#D97706">Waiting for your response</div></div>
                 <div class="wbd-ti pd"><div class="wbd-ti-dt"></div><div class="wbd-ti-t">Work Started</div></div>
             `;
             if(b.cancellationReason) { tlHtml += `<div class="wbd-ti pd"><div class="wbd-ti-dt"></div><div class="wbd-ti-t">Reason</div><div class="wbd-ti-s">${b.cancellationReason}</div></div>`; }
        } else if(st === 'rejected' || st === 'cancelled') {
             tlHtml += `<div class="wbd-ti dn"><div class="wbd-ti-dt"></div><div class="wbd-ti-t">You ${st==='rejected'?'declined':'cancelled'}</div><div class="wbd-ti-s">${processRelativeTime(b.updatedAt)}</div></div>`;
             if(b.cancellationReason) { tlHtml += `<div class="wbd-ti dn"><div class="wbd-ti-dt" style="border-color:#F9FAFB"></div><div class="wbd-ti-t">Reason</div><div class="wbd-ti-s">${b.cancellationReason}</div></div>`; }
        } else {
             tlHtml += `<div class="wbd-ti dn"><div class="wbd-ti-dt"></div><div class="wbd-ti-t">You confirmed</div></div>`;
             if(st === 'accepted') {
                 tlHtml += `
                     <div class="wbd-ti pd"><div class="wbd-ti-dt"></div><div class="wbd-ti-t">Scheduled</div><div class="wbd-ti-s">${new Date(b.scheduledDate).toLocaleDateString()}</div></div>
                     <div class="wbd-ti pd"><div class="wbd-ti-dt"></div><div class="wbd-ti-t">Job Completed</div></div>
                 `;
             } else if(st === 'in_progress') {
                 tlHtml += `
                     <div class="wbd-ti dn"><div class="wbd-ti-dt"></div><div class="wbd-ti-t">You started work</div></div>
                     <div class="wbd-ti pd"><div class="wbd-ti-dt"></div><div class="wbd-ti-t">Job Completed</div></div>
                 `;
             } else if(st === 'completed') {
                 tlHtml += `
                     <div class="wbd-ti dn"><div class="wbd-ti-dt"></div><div class="wbd-ti-t">You started work</div></div>
                     <div class="wbd-ti dn"><div class="wbd-ti-dt"></div><div class="wbd-ti-t">You completed the job</div><div class="wbd-ti-s">${processRelativeTime(b.completedAt||b.updatedAt)}</div></div>
                 `;
             }
        }

        // Actions
        let aBarHtml = '', btmPad = '100px';
        if(st === 'requested') {
             aBarHtml = `<div class="wbd-act"><button class="wbd-btn ro" id="wb-sho-dec"><i class="ri-close-line"></i> Decline</button><button class="wbd-btn g" id="wb-sho-acc"><i class="ri-check-line"></i> Accept</button></div>`;
        } else if(st === 'accepted') {
             aBarHtml = `<div class="wbd-act"><button class="wbd-btn ro" id="wb-sho-can" style="flex:0.5">Cancel</button><button class="wbd-btn t" id="wb-sho-str" style="flex:1.5">Start Work</button></div>`;
        } else if(st === 'in_progress') {
             aBarHtml = `<div class="wbd-act"><button class="wbd-btn g" id="wb-sho-com">Mark Job Complete</button></div>`;
        } else if(st === 'completed') {
             aBarHtml = `<div class="wbd-act" style="flex-direction:column; gap:4px;"><div class="wbd-inf cg"><i class="ri-check-double-line"></i> Job Complete</div><div class="wbd-sub-i">Customer can rebook you from your profile.</div></div>`;
             btmPad = '120px';
        } else if(st === 'cancelled' || st === 'rejected') {
             aBarHtml = `<div class="wbd-act"><div class="wbd-inf"><i class="ri-prohibited-line"></i> This booking is no longer active.</div></div>`;
        }


        // Modals
        let mH = '';
        if(bd.showAcceptSheet) {
             mH = `<div class="wbd-bs-bg active" id="wx-bg-acc"><div class="wbd-bs"><div class="wbd-dh"></div><div class="wbd-bs-h"><div class="wbd-bs-t">Accept this booking?</div></div>
                 <div class="wbd-bs-c">
                     <div class="wbd-bs-cb"><div class="wbd-bs-ct">${b.customer?.firstName} ${b.customer?.lastName}</div><div class="wbd-bs-cd">${new Date(b.scheduledDate).toLocaleDateString()}, ${b.scheduledTime||'TBD'}</div><div class="wbd-bs-cd">${b.estimatedDurationHours} hours</div>${b.notes?`<div class="wbd-bs-cn">Customer notes: ${b.notes}</div>`:''}</div>
                     <div class="wbd-bs-ern"><div class="wbd-bs-ea">Est. earnings:</div><div class="wbd-bs-ev">LKR ${estR}</div></div>
                 </div>
                 <div class="wbd-bs-f"><button class="wbd-bs-b1" style="background:#16A34A" id="wx-acc-sb">${bd.isUpdating?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : 'Accept Booking'}</button><button class="wbd-bs-b2" id="wx-cls">Not Now</button></div>
             </div></div>`;
        } else if (bd.showDeclineSheet || bd.showCancelSheet) {
             const mMod = bd.showCancelSheet ? 'Cancel' : 'Decline';
             mH = `<div class="wbd-bs-bg active" id="wx-bg-dec"><div class="wbd-bs"><div class="wbd-dh"></div><div class="wbd-bs-h"><div class="wbd-bs-t">${mMod} this booking?</div><div class="wbd-bs-s">The customer will be notified.</div></div>
                 <div class="wbd-bs-c">
                     <div class="wbd-bs-cb" style="margin-top:0"><div class="wbd-bs-ct">${b.customer?.firstName} ${b.customer?.lastName}</div><div class="wbd-bs-cd">${new Date(b.scheduledDate).toLocaleDateString()}</div></div>
                     <div class="wbd-ta-w"><div class="wbd-ta-lbl">Reason (optional)</div><textarea class="wbd-ta" id="wx-rsn-in" placeholder="e.g. Not available on this date...">${bd.actionReason}</textarea><div class="wbd-ta-cc">${bd.actionReason.length}/200</div></div>
                 </div>
                 <div class="wbd-bs-f"><button class="wbd-bs-b1" style="background:#DC2626" id="${bd.showCancelSheet?'wx-can-sb':'wx-dec-sb'}">${bd.isUpdating?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : mMod}</button><button class="wbd-bs-b2" id="wx-cls">Close</button></div>
             </div></div>`;
        } else if (bd.showStartSheet) {
             mH = `<div class="wbd-bs-bg active" id="wx-bg-str"><div class="wbd-bs"><div class="wbd-dh"></div><div class="wbd-bs-h"><div class="wbd-bs-t">Start work on this booking?</div><div class="wbd-bs-s">This will notify the customer that you've started the job.</div></div>
                 <div class="wbd-bs-c"><div class="wbd-bs-cb" style="margin-top:0"><div class="wbd-bs-ct">${b.customer?.firstName} ${b.customer?.lastName}</div><div class="wbd-bs-cd">${new Date(b.scheduledDate).toLocaleDateString()}</div></div></div>
                 <div class="wbd-bs-f"><button class="wbd-bs-b1" style="background:#0D9488" id="wx-str-sb">${bd.isUpdating?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : 'Start Work'}</button><button class="wbd-bs-b2" id="wx-cls">Not Yet</button></div>
             </div></div>`;
        } else if (bd.showCompleteSheet) {
             mH = `<div class="wbd-bs-bg active" id="wx-bg-com"><div class="wbd-bs"><div class="wbd-dh"></div><div class="wbd-bs-h"><div class="wbd-bs-t">Mark this job as complete?</div><div class="wbd-bs-s">The customer will be notified and can leave a review.</div></div>
                 <div class="wbd-bs-c">
                     <div class="wbd-bs-cb" style="margin-top:0"><div class="wbd-bs-ct">${b.customer?.firstName} ${b.customer?.lastName}</div><div class="wbd-bs-cd">Est. target was LKR ${estR}</div></div>
                     <div class="wbd-ic-w"><div class="wbd-ic-lbl">Final Cost (LKR)</div><div class="wbd-ic-sb">Enter the actual cost if different from the estimate</div><input type="number" inputmode="numeric" class="wbd-in-bx" id="wx-fc-in" placeholder="${estR}" value="${bd.finalCost}"></div>
                 </div>
                 <div class="wbd-bs-f"><button class="wbd-bs-b1" style="background:#16A34A" id="wx-com-sb">${bd.isUpdating?`<div class="spinner" style="width:20px;height:20px;border:2px solid;border-top-color:#FFF;border-radius:50%;animation:spin 1s infinite; margin:0 auto;"></div>` : 'Mark Complete'}</button><button class="wbd-bs-b2" id="wx-cls">Not Yet</button></div>
             </div></div>`;
        }

        appElement.innerHTML = `
            <div class="wbd-screen">
                <div class="wbd-h">
                    <button class="wbd-h-btn" id="wb-bk-btn"><i class="ri-arrow-left-line"></i></button>
                    <div class="wbd-t">Booking Detail</div>
                    <button class="wbd-h-r" id="wb-mo-btn"><i class="ri-more-2-fill"></i></button>
                </div>

                <div class="wbd-scroll" style="padding-bottom:${btmPad}">
                    <div class="wbd-sh ${shCls}">
                        <i class="${shIc} wbd-sh-ic"></i>
                        <div class="wbd-sh-t">${shT}</div>
                        <div class="wbd-sh-s">${shS}</div>
                        ${shSb}
                        <div class="wbd-sh-id">#${b._id.slice(-8).toUpperCase()}</div>
                    </div>

                    <div class="wbd-cw">
                        <div class="wbd-c">
                            <div class="wbd-ct">Schedule</div>
                            <div class="wbd-rw"><div class="wbd-rl">Date</div><div class="wbd-rr">${new Date(b.scheduledDate).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'short',day:'numeric'})}</div></div>
                            <div class="wbd-rw"><div class="wbd-rl">Time</div><div class="wbd-rr">${b.scheduledTime || 'TBD'}</div></div>
                            <div class="wbd-rw"><div class="wbd-rl">Est. Duration</div><div class="wbd-rr">${b.estimatedDurationHours} hours</div></div>
                            <div class="wbd-rw"><div class="wbd-rl">Last Updated</div><div class="wbd-rr">${new Date(b.updatedAt||b.createdAt).toLocaleDateString()}</div></div>
                        </div>

                        <div class="wbd-c">
                            <div class="wbd-ct">Earnings</div>
                            <div class="wbd-rw"><div class="wbd-rl">Hourly Rate</div><div class="wbd-rr">LKR ${hrR} / hr</div></div>
                            <div class="wbd-rw"><div class="wbd-rl">Estimated</div><div class="wbd-rr am">~LKR ${estR}</div></div>
                            ${b.finalCost ? `<div class="wbd-rw"><div class="wbd-rl">Final Cost</div><div class="wbd-rr gr">LKR ${b.finalCost}</div></div>` : ''}
                            <div class="wbd-rw"><div class="wbd-rl">Payment</div><div class="wbd-rr" style="text-transform:capitalize">${b.paymentStatus}</div></div>
                            <div class="wbd-p-b"><i class="ri-information-line"></i> Payment is handled directly between you and the customer.</div>
                        </div>

                        <div class="wbd-c">
                            <div class="wbd-ct">Customer</div>
                            <div class="wbd-c-b">
                                <div class="wbd-c-av">${b.customer?.firstName?.[0]||''}${b.customer?.lastName?.[0]||''}</div>
                                <div>
                                    <div class="wbd-c-nm">${b.customer?.firstName} ${b.customer?.lastName}</div>
                                    <div class="wbd-c-lx">${b.customer?.city}, ${b.customer?.district}</div>
                                    <div class="wbd-c-ms">Member since ${new Date(b.customer?.createdAt||Date.now()).getFullYear()}</div>
                                </div>
                            </div>
                            <div class="wbd-c-ac">
                                ${b.customer?.phone ? `<button class="wbd-c-ab" id="wb-cl-c"><i class="ri-phone-fill" style="color:#16A34A"></i> Call Customer</button>` : ''}
                                ${b.job ? `<button class="wbd-c-ab" id="wb-vw-j">View Job</button>` : ''}
                            </div>
                        </div>

                        ${b.job ? `
                            <div class="wbd-c">
                                <div class="wbd-ct">Related Job</div>
                                <div class="wbd-jb-bx" id="wb-vw-j2">
                                    <div class="wbd-jb-l">
                                        <i class="ri-briefcase-4-fill"></i>
                                        <div><div class="wbd-jb-t">${b.job.jobTitle}</div><div class="wbd-jb-c">${b.job.category}</div></div>
                                    </div>
                                    <i class="ri-arrow-right-s-line" style="color:#9CA3AF"></i>
                                </div>
                            </div>
                        ` : ''}

                        <div class="wbd-c">
                            <div class="wbd-ct">Job Instructions</div>
                            ${b.notes ? `<div class="wbd-nt">${b.notes}</div>` : `<div class="wbd-nt emp">No instructions provided.</div>`}
                        </div>

                        <div class="wbd-c">
                            <div class="wbd-ct">Booking Timeline</div>
                            <div class="wbd-tl">${tlHtml}</div>
                        </div>

                        ${(st === 'completed') ? `
                            <div class="wbd-c">
                                <div class="wbd-ct">Review from Customer</div>
                                ${bd.customerReview ? `
                                    <div class="wbd-rv-p">
                                        <div class="wbd-rv-t"><i class="ri-check-line"></i> Customer left you a review</div>
                                        <div class="wbd-rv-st">${Array.from({length:5}).map((_,i)=>`<i class="${i<bd.customerReview.rating?'ri-star-fill':'ri-star-line'}"></i>`).join('')}</div>
                                        <div class="wbd-rv-tx">"${bd.customerReview.comment}"</div>
                                    </div>
                                ` : `<div class="wbd-rv-mp">Customer hasn't left a review yet.</div>`}
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${aBarHtml}
                ${mH}

                <div class="wbd-m-bg ${bd.showMoreSheet?'active':''}" id="wbm-bg">
                    <div class="wbd-m">
                        ${b.customer?.phone ? `<button class="wbd-m-b" id="wb-cl-c2"><i class="ri-phone-line"></i> Contact Customer</button>` : ''}
                        ${b.job ? `<button class="wbd-m-b" id="wb-vw-j3"><i class="ri-briefcase-line"></i> View Job</button>` : ''}
                        ${(st === 'accepted' || st === 'requested') ? `<button class="wbd-m-b rd" id="wb-sho-can-opt"><i class="ri-close-circle-line"></i> Cancel Booking</button>` : ''}
                        <button class="wbd-m-b" id="wbm-cls-x"><i class="ri-close-line"></i> Close Menu</button>
                    </div>
                </div>

            </div>
        `;
    }

    async function loadData() {
        bd.isLoading = true; bdUpdateUI();
        if(api.getBooking) {
            try {
                const res = await api.getBooking(bookingId);
                const dt = res.data;
                // Ownership Guard natively verifying identity properly mirroring logic explicitly avoiding unauthorized bounds cleanly
                if(dt.worker !== userId && dt.worker?._id !== userId) {
                    showToast('Access denied', 'error');
                    return navigate('/worker/bookings');
                }
                bd.booking = dt;

                if(dt.bookingStatus === 'completed' && api.checkReview) {
                    try {
                        const rvq = await api.checkReview(bookingId);
                        if(rvq.data?.content?.length>0) {
                             const fx = rvq.data.content.find(r => r.reviewerType==='customer');
                             if(fx) bd.customerReview = fx;
                        }
                    } catch(e) {}
                }
            } catch(e) { bd.error = e.status === 404 ? 'Booking not found.' : 'Failed to load booking'; }
        } else {
            await new Promise(r=>setTimeout(r,800)); // mock
            const Tm = Date.now();
            bd.booking = {
                _id: bookingId,
                bookingStatus: 'requested',
                scheduledDate: new Date(Tm+86400000).toISOString(),
                scheduledTime: '09:00',
                estimatedDurationHours: 3,
                paymentStatus: 'pending',
                notes: 'Please bring tools.',
                createdAt: new Date(Tm-3600000).toISOString(),
                updatedAt: new Date(Tm-3600000).toISOString(),
                worker: userId,
                customer: { _id:'c1', firstName:'Amara', lastName:'Fernando', city:'Negombo', district:'Gampaha', phone:'0771234567', createdAt: new Date(Tm-31536000000).toISOString() },
                job: { _id:'j1', jobTitle:'Fix kitchen sink leak', category:'Plumbing', hourlyRate: 3500 }
            };
        }
        bd.isLoading = false; bdUpdateUI();
    }

    async function submitPatch(pStatus, sMsg) {
        bd.isUpdating = true; bdUpdateUI();

        let pl = { status: pStatus };
        if(pStatus === 'completed' && bd.finalCost) pl.finalCost = parseFloat(bd.finalCost);
        if((pStatus === 'rejected' || pStatus === 'cancelled') && bd.actionReason) pl.cancellationReason = bd.actionReason;

        if(api.updateBookingStatus) {
            try { await api.updateBookingStatus(bookingId, pl); }
            catch(e) { bd.isUpdating = false; bdUpdateUI(); showToast('Failed to update', 'error'); return; }
        } else {
            await new Promise(r=>setTimeout(r,800)); // mock
        }

        // Optimistic State
        bd.booking.bookingStatus = pStatus;
        if(pl.cancellationReason) bd.booking.cancellationReason = pl.cancellationReason;
        if(pl.finalCost) bd.booking.finalCost = pl.finalCost;
        bd.booking.updatedAt = new Date().toISOString();
        if(pStatus === 'completed') bd.booking.completedAt = new Date().toISOString();

        bd.isUpdating = false;
        bd.showAcceptSheet = false; bd.showDeclineSheet = false; bd.showStartSheet = false; bd.showCompleteSheet=false; bd.showCancelSheet=false;
        bd.actionReason = ''; bd.finalCost = '';
        showToast(sMsg, 'success');
        bdUpdateUI();
    }


    appElement.addEventListener('click', e => {
        const tg = e.target;
        if(tg.closest('#wb-bk-btn')) return navigate(-1);
        
        // More Menu
        if(tg.closest('#wb-mo-btn')) { bd.showMoreSheet = true; return bdUpdateUI(); }
        if(tg.id === 'wbm-bg' || tg.closest('#wbm-cls-x')) { bd.showMoreSheet = false; return bdUpdateUI(); }
        
        if(tg.closest('#wb-cl-c') || tg.closest('#wb-cl-c2')) {
            if(bd.booking?.customer?.phone) window.location.href = `tel:${bd.booking.customer.phone}`;
            bd.showMoreSheet = false; return bdUpdateUI();
        }
        if(tg.closest('#wb-vw-j') || tg.closest('#wb-vw-j2') || tg.closest('#wb-vw-j3')) {
            if(bd.booking?.job?._id) return navigate(`/worker/jobs/${bd.booking.job._id}`);
        }

        // Reveal Modals
        if(tg.closest('#wb-sho-acc')) { bd.showAcceptSheet = true; return bdUpdateUI(); }
        if(tg.closest('#wb-sho-dec')) { bd.showDeclineSheet = true; return bdUpdateUI(); }
        if(tg.closest('#wb-sho-str')) { bd.showStartSheet = true; return bdUpdateUI(); }
        if(tg.closest('#wb-sho-com')) { bd.showCompleteSheet = true; return bdUpdateUI(); }
        if(tg.closest('#wb-sho-can') || tg.closest('#wb-sho-can-opt')) {
             bd.showMoreSheet = false; bd.showCancelSheet = true; return bdUpdateUI();
        }

        // Close Modals
        if(tg.closest('#wx-cls') || tg.classList.contains('wbd-bs-bg')) {
            if(bd.isUpdating) return;
            bd.showAcceptSheet = false; bd.showDeclineSheet = false; bd.showStartSheet = false; bd.showCompleteSheet=false; bd.showCancelSheet=false;
            bd.actionReason = ''; bd.finalCost=''; return bdUpdateUI();
        }

        // Submissions
        if(tg.closest('#wx-acc-sb')) return submitPatch('accepted', 'Booking accepted!');
        if(tg.closest('#wx-dec-sb')) return submitPatch('rejected', 'Booking declined.');
        if(tg.closest('#wx-can-sb')) return submitPatch('cancelled', 'Booking cancelled.');
        if(tg.closest('#wx-str-sb')) return submitPatch('in_progress', 'Status updated — work in progress.');
        if(tg.closest('#wx-com-sb')) return submitPatch('completed', 'Job marked complete! 🎉');

    });

    appElement.addEventListener('input', e => {
         if(e.target.id === 'wx-rsn-in') { bd.actionReason = e.target.value.substring(0,200); bdUpdateUI(); setTimeout(()=>{const i=document.getElementById('wx-rsn-in');if(i){i.focus(); i.setSelectionRange(i.value.length, i.value.length);}},0); }
         if(e.target.id === 'wx-fc-in') { bd.finalCost = e.target.value; bdUpdateUI(); setTimeout(()=>{const i=document.getElementById('wx-fc-in');if(i){i.focus(); i.setSelectionRange(i.value.length, i.value.length);}},0); }
    });


    loadData();
}
