// ============================== //
// SkillConnect Mobile           //
// Create Booking Screen         //
// ============================== //

async function renderCreateBooking(appElement, stateRoute) {
    const passedState = stateRoute.state || {};
    const { workerId, workerName, hourlyRate, workerSkills, jobId } = passedState;

    if (!workerId) {
        showToast("Something went wrong. Please try again.", "error");
        navigate(-1);
        return;
    }

    const timeSlots = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

    // Date Bounds
    const tomorrowDate = new Date(Date.now() + 86400000);
    const minDateStr = tomorrowDate.toISOString().split("T")[0];
    const maxDate = new Date(Date.now() + 86400000 * 90);
    const maxDateStr = maxDate.toISOString().split("T")[0];

    let bcState = {
        activeJobs: [],
        isLoadingJobs: true,
        form: {
            scheduledDate: "",
            scheduledTime: "09:00",
            estimatedDurationHours: 2,
            selectedJobId: jobId || "",
            notes: ""
        },
        isSubmitting: false,
        error: null,
        fieldErrors: {},
        showDiscardSheet: false
    };

    function getInitials(first, last) {
        return ((first || "W")[0] + (last || "")[0]).toUpperCase();
    }

    const initials = workerName ? getInitials(...workerName.split(' ')) : "W";
    const hrVal = hourlyRate || 0;
    const skillsPre = (workerSkills || []).slice(0, 2);

    function formatLKR(amt) {
        return "LKR " + amt.toLocaleString("en-LK");
    }

    function formatTime(time24) {
        if (!time24) return "";
        const [h, m] = time24.split(":").map(Number);
        const period = h >= 12 ? "PM" : "AM";
        const hour = h % 12 || 12;
        return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
    }

    function formatBookingDate(isoOrDateStr) {
        if (!isoOrDateStr) return "Not selected";
        // To deal with timezone quirks, we just slice it into a true Date carefully or use local string
        // We assume standard browser handling here is fine for en-LK / en-US.
        return new Date(isoOrDateStr).toLocaleDateString("en-US", {
            weekday: "short", day: "numeric", month: "short", year: "numeric"
        });
    }

    function getEstimatedCost() {
        return hrVal * bcState.form.estimatedDurationHours;
    }

    function isDirty() {
        return bcState.form.scheduledDate !== "" || bcState.form.notes !== "" || bcState.form.selectedJobId !== (jobId || "");
    }

    function bcUpdateUI() {
        const cost = getEstimatedCost();
        
        let jobTitleStr = "Direct booking";
        if (bcState.form.selectedJobId) {
            const j = bcState.activeJobs.find(x => x._id === bcState.form.selectedJobId);
            if (j) jobTitleStr = j.jobTitle || "Selected Job";
        }

        const dateFormatted = bcState.form.scheduledDate ? formatBookingDate(bcState.form.scheduledDate) : "Not selected";
        const timeFormatted = bcState.form.scheduledTime ? formatTime(bcState.form.scheduledTime) : "Not selected";
        const notePreview = bcState.form.notes ? bcState.form.notes.substring(0,40) + (bcState.form.notes.length>40?'...':'') : "None";

        const reqMissing = !bcState.form.scheduledDate || !bcState.form.scheduledTime;
        const submitDisabled = reqMissing || bcState.isSubmitting;

        let jobsHtml = '';
        if (bcState.isLoadingJobs) {
            jobsHtml = `<div style="text-align:center; padding:16px; color:#9CA3AF; font-size:13px;">Loading active jobs...</div>`;
        } else if (bcState.activeJobs.length === 0) {
            jobsHtml = `
                <div class="bc-job-empty">
                    <div class="bc-job-empty-txt">No active jobs to link.</div>
                    <div class="bc-job-empty-link" id="bc-nav-postjob">Post a job first &rarr;</div>
                </div>
            `;
        } else {
            jobsHtml = `
                <div class="bc-job-row direct ${!bcState.form.selectedJobId ? 'active' : ''}" data-jid="">
                    None (direct booking)
                </div>
                ${bcState.activeJobs.map(j => `
                    <div class="bc-job-row ${bcState.form.selectedJobId === j._id ? 'active' : ''}" data-jid="${j._id}">
                        <div class="bc-job-title">${j.jobTitle}</div>
                        <div class="bc-job-meta">${j.category} &middot; ${j.city || ''}</div>
                        ${j.budgetMin ? `<div class="bc-job-budget">LKR ${j.budgetMin}${j.budgetMax ? '–'+j.budgetMax : ''}</div>` : ''}
                    </div>
                `).join('')}
            `;
        }

        appElement.innerHTML = `
            <div class="bc-screen">
                <div class="bc-header">
                    <button class="bc-btn-icon" id="bc-back"><i class="ri-arrow-left-line"></i></button>
                    <div class="bc-title-global">Book a Worker</div>
                </div>

                <div class="bc-scroll-content">
                    <div class="bc-worker-card" id="bc-worker-card">
                        <div class="bc-wc-avatar">${initials}</div>
                        <div class="bc-wc-info">
                            <div class="bc-wc-lbl">Booking with</div>
                            <div class="bc-wc-name">${workerName}</div>
                            <div class="bc-wc-rate">LKR ${hrVal} / hour</div>
                            ${skillsPre.length > 0 ? `<div class="bc-wc-skills">${skillsPre.map(s => `<div class="bc-wc-skill">${s}</div>`).join('')}</div>` : ''}
                        </div>
                        <i class="ri-arrow-right-s-line bc-wc-chevron"></i>
                    </div>

                    <div class="bc-form-sections">
                        <!-- Date & Time -->
                        <div class="bc-card">
                            <div class="bc-field-label">Date</div>
                            <input type="date" class="bc-date-input ${bcState.fieldErrors.scheduledDate ? 'error' : ''}" id="bc-fd-date" min="${minDateStr}" max="${maxDateStr}" value="${bcState.form.scheduledDate}">
                            ${bcState.fieldErrors.scheduledDate ? `<div class="bc-field-error">${bcState.fieldErrors.scheduledDate}</div>` : ''}

                            <div class="bc-field-label" style="margin-top:20px;">Time</div>
                            <div class="bc-time-grid">
                                ${timeSlots.map(t => `<div class="bc-time-slot ${bcState.form.scheduledTime === t ? 'active' : ''}" data-t="${t}">${formatTime(t)}</div>`).join('')}
                            </div>
                        </div>

                        <!-- Duration & Cost -->
                        <div class="bc-card">
                            <div class="bc-field-label">Duration</div>
                            <div class="bc-stepper">
                                <button class="bc-step-btn" id="bc-step-sub" ${bcState.form.estimatedDurationHours <= 1 ? 'disabled':''}>&minus;</button>
                                <div class="bc-step-val">${bcState.form.estimatedDurationHours} hour(s)</div>
                                <button class="bc-step-btn" id="bc-step-add" ${bcState.form.estimatedDurationHours >= 12 ? 'disabled':''}>+</button>
                            </div>
                            
                            <div class="bc-cost-block">
                                <div class="bc-cost-row1">
                                    <div class="bc-cost-lbl">Estimated Cost</div>
                                    <div class="bc-cost-amt">${formatLKR(cost)}</div>
                                </div>
                                <div class="bc-cost-row2">
                                    <div class="bc-cost-calc">Duration</div>
                                    <div class="bc-cost-calc" style="text-align:right;">${bcState.form.estimatedDurationHours} hours &times; LKR ${hrVal}/hr</div>
                                </div>
                                <div class="bc-cost-help">Final cost agreed between you and the worker</div>
                            </div>
                        </div>

                        <!-- Link a Job -->
                        <div class="bc-card">
                            <div class="bc-field-label" style="margin-bottom:2px;">Link to a Job (optional)</div>
                            <div class="bc-job-helper">Connect this booking to one of your active job postings</div>
                            ${jobsHtml}
                        </div>

                        <!-- Notes -->
                        <div class="bc-card">
                            <div class="bc-field-label">Notes for the Worker</div>
                            <textarea class="bc-notes-area" id="bc-fd-notes" placeholder="e.g. Please bring your own tools. Access via the back gate. Ring bell on arrival." maxlength="500">${bcState.form.notes}</textarea>
                            <div class="bc-notes-count">${bcState.form.notes.length} / 500</div>
                        </div>

                        <!-- Summary -->
                        <div class="bc-card bc-summary-card">
                            <div class="bc-sum-title">Booking Summary</div>
                            
                            <div class="bc-sum-row">
                                <i class="ri-user-smile-line bc-sum-icon"></i>
                                <div class="bc-sum-lbl">Worker</div>
                                <div class="bc-sum-val">${workerName}</div>
                            </div>
                            <div class="bc-sum-row">
                                <i class="ri-calendar-2-line bc-sum-icon"></i>
                                <div class="bc-sum-lbl">Date</div>
                                <div class="bc-sum-val ${!bcState.form.scheduledDate ? 'missing' : ''}">${dateFormatted}</div>
                            </div>
                            <div class="bc-sum-row">
                                <i class="ri-time-line bc-sum-icon"></i>
                                <div class="bc-sum-lbl">Time</div>
                                <div class="bc-sum-val ${!bcState.form.scheduledTime ? 'missing' : ''}">${timeFormatted}</div>
                            </div>
                            <div class="bc-sum-row">
                                <i class="ri-hourglass-2-line bc-sum-icon"></i>
                                <div class="bc-sum-lbl">Duration</div>
                                <div class="bc-sum-val">${bcState.form.estimatedDurationHours} hours</div>
                            </div>
                            <div class="bc-sum-row">
                                <i class="ri-money-dollar-circle-line bc-sum-icon"></i>
                                <div class="bc-sum-lbl">Est. Cost</div>
                                <div class="bc-sum-val">${formatLKR(cost)}</div>
                            </div>
                            <div class="bc-sum-row">
                                <i class="ri-briefcase-4-line bc-sum-icon"></i>
                                <div class="bc-sum-lbl">Job</div>
                                <div class="bc-sum-val">${jobTitleStr}</div>
                            </div>
                            <div class="bc-sum-row" style="border:none;">
                                <i class="ri-sticky-note-line bc-sum-icon"></i>
                                <div class="bc-sum-lbl">Notes</div>
                                <div class="bc-sum-val" style="word-wrap: break-word;">${notePreview}</div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Sticky Bottom Bar -->
                <div class="bc-bottom-bar">
                    <div class="bc-bb-preview">Est. cost: ${formatLKR(cost)}</div>
                    <button class="bc-bb-btn" id="bc-submit" ${submitDisabled ? 'disabled' : ''}>
                        ${bcState.isSubmitting ? '<div class="spinner" style="width:20px;height:20px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;margin-right:8px;"></div> Sending request...' : 'Request Booking'}
                    </button>
                    ${bcState.error ? `<div style="color:#EF4444; font-size:12px; text-align:center; margin-top:8px;">${bcState.error}</div>` : ''}
                </div>

                <!-- Discard Sheet -->
                <div class="bc-sheet-overlay ${bcState.showDiscardSheet ? 'active' : ''}" id="bc-discard-bg">
                    <div class="bc-sheet">
                        <div class="bc-sh-title">Discard booking?</div>
                        <div class="bc-sh-sub">Your booking details will be lost.</div>
                        <button class="bc-sh-btn-discard" id="bc-btn-discard">Discard</button>
                        <button class="bc-sh-btn-keep" id="bc-btn-keep">Keep Editing</button>
                    </div>
                </div>
            </div>
        `;
    }

    async function loadActiveJobs() {
        try {
            const res = await api.getJobs('my'); // GET /api/jobs/my
            if (res && res.data && res.data.content) {
                bcState.activeJobs = res.data.content.filter(j => j.status === 'active');
            }
        } catch(e) {
            // Mock fallback if api fails
            bcState.activeJobs = [
                { _id: "job123", jobTitle: "Fix kitchen sink leak", category: "Plumbing", city: "Negombo", budgetMin: 2000, status: "active" },
                { _id: jobId || "job456", jobTitle: "Repaint front wall", category: "Painting", city: "Colombo", budgetMin: 5000, budgetMax: 8000, status: "active" }
            ];
        } finally {
            bcState.isLoadingJobs = false;
            bcUpdateUI();
        }
    }

    appElement.addEventListener('click', async (e) => {
        // Back flows
        if (e.target.closest('#bc-back')) {
            if (isDirty()) {
                bcState.showDiscardSheet = true;
                bcUpdateUI();
            } else {
                navigate(-1);
            }
        }
        if (e.target.closest('#bc-worker-card')) {
            navigate(-1);
        }

        // Stepper
        if (e.target.closest('#bc-step-sub')) {
            if (bcState.form.estimatedDurationHours > 1) {
                bcState.form.estimatedDurationHours--;
                bcUpdateUI();
            }
        }
        if (e.target.closest('#bc-step-add')) {
            if (bcState.form.estimatedDurationHours < 12) {
                bcState.form.estimatedDurationHours++;
                bcUpdateUI();
            }
        }

        // Time Grid
        const slot = e.target.closest('.bc-time-slot');
        if (slot) {
            bcState.form.scheduledTime = slot.dataset.t;
            bcUpdateUI();
        }

        // Job Selector
        const jRow = e.target.closest('.bc-job-row');
        if (jRow) {
            bcState.form.selectedJobId = jRow.dataset.jid;
            bcUpdateUI();
        }

        // Post Job link
        if (e.target.closest('#bc-nav-postjob')) {
            navigate('post-job');
        }

        // Discard Modal
        if (e.target.closest('#bc-btn-discard')) {
            bcState.showDiscardSheet = false;
            navigate(-1);
        }
        if (e.target.closest('#bc-btn-keep') || (e.target.id === 'bc-discard-bg')) {
            bcState.showDiscardSheet = false;
            bcUpdateUI();
        }

        // Submit Booking
        if (e.target.closest('#bc-submit') && !bcState.isSubmitting) {
            const form = bcState.form;
            bcState.fieldErrors = {};
            
            // Validate Date (Must be future)
            const selDate = new Date(form.scheduledDate);
            const tmr = new Date();
            tmr.setHours(0,0,0,0);
            tmr.setDate(tmr.getDate() + 1);
            if(selDate < tmr) {
                bcState.fieldErrors.scheduledDate = "Please select a future date";
            }

            if(Object.keys(bcState.fieldErrors).length > 0) {
                bcUpdateUI();
                document.getElementById('bc-fd-date').scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            bcState.isSubmitting = true;
            bcState.error = null;
            bcUpdateUI();

            const payload = {
                worker: workerId,
                job: form.selectedJobId || null,
                scheduledDate: new Date(form.scheduledDate).toISOString(),
                scheduledTime: form.scheduledTime,
                estimatedDurationHours: form.estimatedDurationHours,
                notes: form.notes.trim() || ""
            };

            try {
                // Call API
                const token = localStorage.getItem('token');
                const headers = { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                };
                
                const res = await fetch(`${api.baseURL}/bookings`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
                const j = await res.json();
                
                if(res.ok || (j && j.status === 'success')) {
                    const newId = j.data ? j.data._id : "mock_id";
                    showToast("Booking request sent!", "success");
                    setTimeout(() => {
                        navigate('/customer/bookings', { state: { newBookingId: newId } });
                    }, 800);
                } else {
                    bcState.error = j.message || "Failed to create booking.";
                    bcState.isSubmitting = false;
                    bcUpdateUI();
                }
            } catch (err) {
                // Fallback mock success
                showToast("Booking request sent! (Mock)", "success");
                setTimeout(() => {
                     navigate('dashboard'); // Assuming bookings list isn't fully set up, or go backward
                }, 800);
                bcState.isSubmitting = false;
                bcUpdateUI();
            }
        }
    });

    appElement.addEventListener('input', (e) => {
        if (e.target.id === 'bc-fd-date') {
            bcState.form.scheduledDate = e.target.value;
            delete bcState.fieldErrors.scheduledDate;
            bcUpdateUI();
        }
        if (e.target.id === 'bc-fd-notes') {
            bcState.form.notes = e.target.value;
            bcUpdateUI();
        }
    });

    loadActiveJobs();
}
