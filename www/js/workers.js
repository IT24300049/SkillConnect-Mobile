// ========================= //
// SkillConnect Mobile      //
// Browse Workers Screen    //
// ========================= //

let bwState = {
    allWorkers: [],
    isLoading: true,
    error: null,
    searchQueryRaw: '',
    searchQuery: '',
    activeDistrict: '',
    sortBy: 'verified_first',
    rateMin: '',
    rateMax: '',
    showFilterSheet: false,
    toast: null
};

const topDistricts = [
    "Colombo", "Gampaha", "Kalutara", "Kandy", "Nuwara Eliya",
    "Galle", "Matara", "Hambantota", "Jaffna", "Batticaloa", 
    "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Ratnapura"
];

const allDistrictsList = [
    "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", 
    "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar", 
    "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee", 
    "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", 
    "Moneragala", "Ratnapura", "Kegalle"
];

const spotlightSkills = [
    { label: "Plumbing", icon: "🔧" },
    { label: "Electrical", icon: "⚡" },
    { label: "Carpentry", icon: "🪚" },
    { label: "Painting", icon: "🎨" },
    { label: "Masonry", icon: "🧱" },
    { label: "Welding", icon: "🔩" },
    { label: "Roofing", icon: "🏗" },
    { label: "Landscaping", icon: "🌿" },
    { label: "Cleaning", icon: "🧹" },
    { label: "Moving", icon: "📦" },
    { label: "Other", icon: "✦" }
];

let bwSearchTimeout = null;

// Helper: rating
function bwMockRating(id) {
    if (!id || id.length < 3) return { r: 4.5, c: 12 };
    try {
        const rating = (parseInt(id.slice(-2), 16) % 20 + 30) / 10;
        const count = parseInt(id.slice(-3), 16) % 40 + 5;
        return { r: rating, c: count };
    } catch {
        return { r: 4.0, c: 10 };
    }
}

// Helper: render stars
function renderStars(ratingStr) {
    const num = parseFloat(ratingStr);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (num >= i) html += '★';
        else if (num >= i - 0.5) html += '☆'; // We can use half star if we had it but ☆ serves well too
        else html += '☆';
    }
    return html;
}

// Helper: experience mapping
function bwParseExperienceYears(str) {
    if (!str) return 0;
    const match = str.match(/\d+/);
    if (!match) return 0;
    let num = parseInt(match[0], 10);
    if (str.toLowerCase().includes('month')) return Math.floor(num / 12);
    return num;
}

// Helper: avatar
function bwGetAvatarInitials(first, last) {
    return ((first || "W")[0] + (last || "")[0]).toUpperCase();
}

async function renderWorkers(appElement) {
    appElement.innerHTML = `
        <div class="bw-screen">
            <!-- 1. Header -->
            <div class="bw-header">
                <button class="bw-back-btn" id="bw-back"><i class="ri-arrow-left-line"></i></button>
                <div class="bw-title">Browse Workers</div>
                <button class="bw-filter-btn" id="bw-filter-trigger">
                    <i class="ri-equalizer-line"></i>
                    <div class="bw-filter-dot hidden" id="bw-filter-dot"></div>
                </button>
            </div>

            <!-- 2. Search Bar -->
            <div class="bw-search-container">
                <div class="bw-search-box">
                    <i class="ri-search-line"></i>
                    <input type="text" 
                           inputmode="search" 
                           autocapitalize="none" 
                           class="bw-search-input" 
                           id="bw-search-input" 
                           placeholder="Search by name or skill..." 
                           value="${bwState.searchQueryRaw}">
                    <button class="bw-search-clear hidden" id="bw-search-clear"><i class="ri-close-line"></i></button>
                </div>
            </div>

            <!-- 3. Summary & Strip -->
            <div class="bw-summary-strip hidden" id="bw-summary-strip">
                <div class="bw-summary-text" id="bw-summary-text">0 workers found</div>
                <div class="bw-active-chips" id="bw-active-chips"></div>
            </div>

            <!-- 4. District Tabs -->
            <div class="bw-tabs-row" id="bw-district-tabs">
                <button class="bw-tab ${bwState.activeDistrict===''?'active':''}" data-dist="">All</button>
                ${topDistricts.map(d => `<button class="bw-tab ${bwState.activeDistrict===d?'active':''}" data-dist="${d}">${d}</button>`).join('')}
                <button class="bw-tab" id="bw-more-districts">More...</button>
            </div>

            <!-- List Area -->
            <div class="bw-list-area" id="bw-list-area">
                <div class="bw-ptr-spinner" id="bw-ptr-spinner"><div class="spinner"></div></div>
                <div id="bw-spotlight-container"></div>
                <div id="bw-list-content"></div>
            </div>

            <!-- Bottom Sheet -->
            <div class="bw-sheet-overlay" id="bw-filter-sheet">
                <div class="bw-sheet">
                    <div class="bw-sheet-head">
                        <div class="bw-sheet-title">Filter & Sort Workers</div>
                        <button class="bw-sheet-reset" id="bw-sheet-reset">Reset filters</button>
                    </div>
                    <div class="bw-sheet-body">
                        <!-- District -->
                        <div class="bw-filter-sec">
                            <div class="bw-filter-label">District</div>
                            <div class="bw-chip-grid" id="bw-f-districts"></div>
                        </div>

                        <!-- Sort -->
                        <div class="bw-filter-sec">
                            <div class="bw-filter-label">Sort by</div>
                            <div id="bw-f-sorts">
                                <div class="bw-radio-row ${bwState.sortBy==='verified_first'?'active':''}" data-sort="verified_first">
                                    <div class="bw-radio-text">Verified first</div>
                                    <div class="bw-radio-circle"></div>
                                </div>
                                <div class="bw-radio-row ${bwState.sortBy==='rate_asc'?'active':''}" data-sort="rate_asc">
                                    <div class="bw-radio-text">Lowest rate first</div>
                                    <div class="bw-radio-circle"></div>
                                </div>
                                <div class="bw-radio-row ${bwState.sortBy==='rate_desc'?'active':''}" data-sort="rate_desc">
                                    <div class="bw-radio-text">Highest rate first</div>
                                    <div class="bw-radio-circle"></div>
                                </div>
                                <div class="bw-radio-row ${bwState.sortBy==='newest'?'active':''}" data-sort="newest">
                                    <div class="bw-radio-text">Newest members</div>
                                    <div class="bw-radio-circle"></div>
                                </div>
                                <div class="bw-radio-row ${bwState.sortBy==='experienced'?'active':''}" data-sort="experienced">
                                    <div class="bw-radio-text">Most experienced</div>
                                    <div class="bw-radio-circle"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Rate Range -->
                        <div class="bw-filter-sec">
                            <div class="bw-filter-label">Hourly Rate (LKR)</div>
                            <div style="font-size:12px;color:#6B7280;margin-bottom:12px;">Filter workers by their hourly rate</div>
                            <div class="bw-range-row">
                                <input type="number" class="bw-range-input" id="bw-f-rmin" placeholder="0" value="${bwState.rateMin}">
                                <div class="bw-range-to">to</div>
                                <input type="number" class="bw-range-input" id="bw-f-rmax" placeholder="Any" value="${bwState.rateMax}">
                            </div>
                        </div>

                        <button class="bw-sheet-apply" id="bw-sheet-apply">Show Workers</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize logic
    async function fetchWorkersData(districtParam = '') {
        bwState.isLoading = true;
        bwUpdateUI();
        try {
            const endpoint = districtParam ? `/profile/workers?district=${encodeURIComponent(districtParam)}` : '/profile/workers';
            let res;
            try {
                res = await api.request(endpoint);
            } catch (e) {
                // Mock fallback
                res = {
                    status: 'success',
                    data: {
                        content: [
                            {
                                _id: "60d5ecb8b31123456",
                                firstName: "Kasun",
                                lastName: "Perera",
                                skills: ["Plumbing", "Electrical", "Carpentry"],
                                hourlyRate: 1200,
                                experience: "4 years",
                                district: "Gampaha",
                                city: "Negombo",
                                bio: "Experienced plumber with 4 years of residential fixing...",
                                isVerified: true,
                                isActive: true,
                                createdAt: "2024-01-15T10:30:00Z"
                            },
                            {
                                _id: "60d5ecb8b31123457",
                                firstName: "Nimal",
                                lastName: "Silva",
                                skills: ["Masonry"],
                                hourlyRate: 1500,
                                experience: "8 years",
                                district: "Colombo",
                                city: "Dehiwala",
                                bio: "Master mason.",
                                isVerified: false,
                                isActive: true,
                                createdAt: "2023-01-15T10:30:00Z"
                            },
                            {
                                _id: "60d5ecb8b31123458",
                                firstName: "Sunil",
                                lastName: "Kumara",
                                skills: ["Painting", "Landscaping"],
                                hourlyRate: 1000,
                                experience: "2 years",
                                district: "Kandy",
                                city: "Peradeniya",
                                bio: "Focuses on exterior painting and yard work.",
                                isVerified: true,
                                isActive: true,
                                createdAt: "2024-03-15T10:30:00Z"
                            }
                        ]
                    }
                };
            }

            if (res && res.data && res.data.content) {
                bwState.allWorkers = res.data.content.filter(w => w.isActive !== false);
            } else {
                bwState.allWorkers = [];
            }
        } catch (e) {
            bwState.allWorkers = [];
        } finally {
            bwState.isLoading = false;
            bwUpdateUI();
        }
    }

    function getDisplayedWorkers() {
        let res = bwState.allWorkers;

        // activeDistrict is theoretically handled via API, but we filter client side too
        if (bwState.activeDistrict) {
            res = res.filter(w => w.district === bwState.activeDistrict);
        }

        if (bwState.searchQuery) {
            const sq = bwState.searchQuery.toLowerCase();
            res = res.filter(w => {
                const searchStr = `${w.firstName||''} ${w.lastName||''} ${(w.skills||[]).join(' ')} ${w.city||''}`.toLowerCase();
                return searchStr.includes(sq);
            });
        }

        if (bwState.rateMin) {
            const min = parseInt(bwState.rateMin, 10);
            res = res.filter(w => (w.hourlyRate || 0) >= min);
        }
        if (bwState.rateMax) {
            const max = parseInt(bwState.rateMax, 10);
            res = res.filter(w => (w.hourlyRate || 0) <= max);
        }

        res.sort((a,b) => {
            if (bwState.sortBy === 'verified_first') {
                if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
                return (a.hourlyRate || 0) - (b.hourlyRate || 0);
            }
            if (bwState.sortBy === 'rate_asc') return (a.hourlyRate || 0) - (b.hourlyRate || 0);
            if (bwState.sortBy === 'rate_desc') return (b.hourlyRate || 0) - (a.hourlyRate || 0);
            if (bwState.sortBy === 'newest') return new Date(b.createdAt||0) - new Date(a.createdAt||0);
            if (bwState.sortBy === 'experienced') return bwParseExperienceYears(b.experience) - bwParseExperienceYears(a.experience);
            return 0;
        });

        return res;
    }

    function bwUpdateUI() {
        const displayed = getDisplayedWorkers();

        // Strip
        const strip = document.getElementById('bw-summary-strip');
        const text = document.getElementById('bw-summary-text');
        const chipsBox = document.getElementById('bw-active-chips');
        const dot = document.getElementById('bw-filter-dot');

        const hasFilters = bwState.activeDistrict || bwState.rateMin || bwState.rateMax;
        
        if (hasFilters) dot.classList.remove('hidden');
        else dot.classList.add('hidden');

        if (hasFilters || bwState.searchQuery) {
            strip.classList.remove('hidden');
            text.textContent = `${displayed.length} workers found`;
            
            let chips = '';
            if (bwState.activeDistrict) chips += `<button class="bw-filter-chip" data-clear="district">${bwState.activeDistrict} <i class="ri-close-line"></i></button>`;
            if (bwState.rateMin || bwState.rateMax) {
                let rTxt = '';
                if(bwState.rateMin && bwState.rateMax) rTxt = `LKR ${bwState.rateMin}-${bwState.rateMax}`;
                else if(bwState.rateMin) rTxt = `Min LKR ${bwState.rateMin}`;
                else rTxt = `Max LKR ${bwState.rateMax}`;
                chips += `<button class="bw-filter-chip" data-clear="rate">${rTxt} <i class="ri-close-line"></i></button>`;
            }
            chipsBox.innerHTML = chips;
        } else {
            strip.classList.add('hidden');
        }

        // Tabs
        document.querySelectorAll('.bw-tab').forEach(t => {
            if (t.id === 'bw-more-districts') return;
            if (t.dataset.dist === bwState.activeDistrict) t.classList.add('active');
            else t.classList.remove('active');
        });
        
        // Search clear btn
        const searchClear = document.getElementById('bw-search-clear');
        if (bwState.searchQueryRaw.trim().length > 0) searchClear.classList.remove('hidden');
        else searchClear.classList.add('hidden');

        // Render Skeletons
        const contentBox = document.getElementById('bw-list-content');
        const spotlightBox = document.getElementById('bw-spotlight-container');
        
        if (bwState.isLoading) {
            spotlightBox.innerHTML = '';
            let skels = '';
            for(let i=0; i<4; i++){
                skels += `
                    <div class="skel-card">
                        <div class="skel-row1">
                            <div class="skel-circle bw-skel" style="animation: pulseSkel 1.4s infinite ${(i*200)}ms;"></div>
                            <div class="skel-lines">
                                <div class="skel-line bw-skel" style="animation: pulseSkel 1.4s infinite ${(i*200)}ms; width:140px;"></div>
                                <div class="skel-line bw-skel" style="animation: pulseSkel 1.4s infinite ${(i*200)}ms; width:100px;"></div>
                            </div>
                        </div>
                        <div class="skel-row2">
                            <div class="skel-pill bw-skel" style="animation: pulseSkel 1.4s infinite ${(i*200)}ms; width:60px;"></div>
                            <div class="skel-pill bw-skel" style="animation: pulseSkel 1.4s infinite ${(i*200)}ms; width:80px;"></div>
                            <div class="skel-pill bw-skel" style="animation: pulseSkel 1.4s infinite ${(i*200)}ms; width:50px;"></div>
                        </div>
                        <div class="skel-row3 bw-skel" style="animation: pulseSkel 1.4s infinite ${(i*200)}ms; width:180px;"></div>
                    </div>
                `;
            }
            contentBox.innerHTML = skels;
            return;
        }

        // Skill Spotlight logic
        if (!bwState.searchQuery && !bwState.activeDistrict && bwState.allWorkers.length > 0) {
            spotlightBox.innerHTML = `
                <div class="bw-skills-spotlight">
                    <div class="bw-spotlight-title">Browse by skill</div>
                    <div class="bw-spotlight-scroll">
                        ${spotlightSkills.map(s => `
                            <button class="bw-sp-pill" data-skill="${s.label}"><span class="bw-sp-icon">${s.icon}</span> ${s.label}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            spotlightBox.innerHTML = '';
        }

        // Empty states logic
        if (bwState.allWorkers.length === 0) {
            contentBox.innerHTML = `
                <div class="bw-empty-state">
                    <div class="bw-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                    <div class="bw-empty-title">No workers found</div>
                    <div class="bw-empty-sub">There are no active workers on the platform yet. Check back soon.</div>
                </div>
            `;
            return;
        }

        if (displayed.length === 0) {
            if (bwState.activeDistrict && !bwState.searchQuery && !bwState.rateMin && !bwState.rateMax) {
                contentBox.innerHTML = `
                    <div class="bw-empty-state">
                        <div class="bw-empty-icon" style="color:#0D9488"><i class="ri-map-pin-line" style="font-size:48px;"></i></div>
                        <div class="bw-empty-title">No workers in ${bwState.activeDistrict}</div>
                        <div class="bw-empty-sub">Try a nearby district or browse all workers.</div>
                        <button class="bw-empty-btn" id="bw-empty-all">Browse all workers</button>
                    </div>
                `;
            } else if (bwState.searchQuery) {
                contentBox.innerHTML = `
                    <div class="bw-empty-state">
                        <div class="bw-empty-icon"><i class="ri-search-line" style="font-size:48px;"></i></div>
                        <div class="bw-empty-title">No results for "${bwState.searchQuery}"</div>
                        <div class="bw-empty-sub">Try a different name, skill, or location.</div>
                        <button class="bw-empty-btn" id="bw-empty-search">Clear search</button>
                    </div>
                `;
            } else {
                contentBox.innerHTML = `
                    <div class="bw-empty-state">
                        <div class="bw-empty-icon" style="color:#F59E0B"><i class="ri-wallet-3-line" style="font-size:48px;"></i></div>
                        <div class="bw-empty-title">No workers in this rate range</div>
                        <div class="bw-empty-sub">Try widening your budget range.</div>
                        <button class="bw-empty-btn" id="bw-empty-reset">Reset filters</button>
                    </div>
                `;
            }
            return;
        }

        // Render Cards
        let html = '';
        displayed.forEach(w => {
            const initials = bwGetAvatarInitials(w.firstName, w.lastName);
            // using solid teal gradient
            const avatarBg = 'linear-gradient(135deg, #0F766E, #14B8A6)';
            const fullName = `${w.firstName || ''} ${w.lastName || ''}`.trim();
            const mr = bwMockRating(w._id);
            const sinceDate = w.createdAt ? new Date(w.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Jan 2024";

            const vBadge = w.isVerified ? `<div class="bw-badge-verified"><i class="ri-check-line"></i></div>` : '';
            
            const first3 = (w.skills || []).slice(0,3);
            const moreSkill = (w.skills || []).length > 3 ? `<div class="bw-skill-pill bw-skill-more">+${w.skills.length - 3} more</div>` : '';

            // TODO: replace with real ratings API
            const stars = renderStars(mr.r);

            html += `
                <div class="bw-card">
                    <div class="bw-card-row1">
                        <div class="bw-avatar-wrap" onclick="navigate('/customer/workers/:id', {workerId:'${w._id}'})">
                            <div class="bw-avatar" style="background:${avatarBg}">${initials}</div>
                            ${vBadge}
                        </div>
                        <div class="bw-identity" onclick="navigate('/customer/workers/:id', {workerId:'${w._id}'})">
                            <div class="bw-name">${fullName}</div>
                            <div class="bw-loc">${w.city||''}, ${w.district||''}</div>
                            <div class="bw-rating">
                                <div class="bw-stars">${stars}</div>
                                <div class="bw-rating-text">(${mr.r.toFixed(1)}) · ${mr.c} reviews</div>
                            </div>
                        </div>
                        <div class="bw-book-pill" onclick="navigate('/customer/workers/:id', {workerId:'${w._id}'})">
                            Book Now
                        </div>
                    </div>

                    <div class="bw-card-row2">
                        <div class="bw-card-label">Skills</div>
                        <div class="bw-skills-flex">
                            ${first3.map(s => `<div class="bw-skill-pill">${s}</div>`).join('')}
                            ${moreSkill}
                        </div>
                    </div>

                    <div class="bw-card-row3">
                        <div class="bw-stat-item"><i class="ri-wallet-3-line"></i> LKR ${w.hourlyRate||0}/hr</div>
                        ${w.experience ? `<div>·</div><div class="bw-stat-item"><i class="ri-briefcase-4-line"></i> ${w.experience}</div>` : ''}
                    </div>

                    ${w.bio ? `<div class="bw-card-row4">${w.bio}</div>` : ''}
                    ${w.bio ? `<div style="margin-top:12px; border-top: 1px solid #F3F4F6;"></div>` : ''}

                    <div class="bw-card-footer">
                        Member since ${sinceDate}
                    </div>
                </div>
            `;
        });
        contentBox.innerHTML = html;
    }

    // Pull to refresh logic
    let touchStartY = 0;
    let ptrActive = false;
    const listArea = document.getElementById('bw-list-area');
    const spinner = document.getElementById('bw-ptr-spinner');

    listArea.addEventListener('touchstart', e => {
        if (listArea.scrollTop <= 0) {
            touchStartY = e.touches[0].clientY;
            ptrActive = true;
        }
    });
    listArea.addEventListener('touchmove', e => {
        if (!ptrActive) return;
        const diff = e.touches[0].clientY - touchStartY;
        if (diff > 0) {
            spinner.style.height = Math.min(diff, 60) + 'px';
            if (diff > 60) spinner.querySelector('.spinner').style.borderTopColor = '#000';
            else spinner.querySelector('.spinner').style.borderTopColor = 'transparent';
        }
    });
    listArea.addEventListener('touchend', e => {
        if (!ptrActive) return;
        ptrActive = false;
        spinner.style.height = '';
        if (spinner.querySelector('.spinner').style.borderTopColor === 'rgb(0, 0, 0)') {
            spinner.classList.add('active');
            fetchWorkersData(bwState.activeDistrict).then(() => {
                spinner.classList.remove('active');
            });
        }
    });

    // Delegations
    appElement.addEventListener('click', (e) => {
        // Back
        if (e.target.closest('#bw-back')) navigate('dashboard');

        // Search clear
        if (e.target.closest('#bw-search-clear')) {
            bwState.searchQueryRaw = '';
            bwState.searchQuery = '';
            document.getElementById('bw-search-input').value = '';
            bwUpdateUI();
        }

        // Active filter strips close
        const pChip = e.target.closest('.bw-filter-chip');
        if (pChip) {
            const clearT = pChip.dataset.clear;
            if (clearT === 'district') { bwState.activeDistrict = ''; fetchWorkersData(''); }
            if (clearT === 'rate') { bwState.rateMin = ''; bwState.rateMax = ''; bwUpdateUI(); }
        }

        // District Tabs
        const tDist = e.target.closest('.bw-tab');
        if (tDist) {
            if (tDist.id === 'bw-more-districts') {
                renderFilterSheetUI();
                document.getElementById('bw-filter-sheet').classList.add('active');
            } else {
                bwState.activeDistrict = tDist.dataset.dist;
                fetchWorkersData(bwState.activeDistrict);
            }
        }

        // Spotlight
        const sPill = e.target.closest('.bw-sp-pill');
        if (sPill) {
            bwState.searchQueryRaw = sPill.dataset.skill;
            bwState.searchQuery = sPill.dataset.skill;
            document.getElementById('bw-search-input').value = sPill.dataset.skill;
            document.getElementById('bw-list-area').scrollTop = 0;
            bwUpdateUI();
        }

        // Empty state buttons
        if(e.target.closest('#bw-empty-all')) { bwState.activeDistrict=''; fetchWorkersData(''); }
        if(e.target.closest('#bw-empty-search')) { bwState.searchQueryRaw=''; bwState.searchQuery=''; document.getElementById('bw-search-input').value=''; bwUpdateUI(); }
        if(e.target.closest('#bw-empty-reset')) { bwState.activeDistrict=''; bwState.searchQueryRaw=''; bwState.searchQuery=''; bwState.rateMin=''; bwState.rateMax=''; fetchWorkersData(''); }

        // Filter modal trigger
        if (e.target.closest('#bw-filter-trigger')) {
            renderFilterSheetUI();
            document.getElementById('bw-filter-sheet').classList.add('active');
        }

        // Inside Filter Sheet
        if (e.target.closest('#bw-filter-sheet')) {
            const distChip = e.target.closest('#bw-f-districts .bw-f-chip');
            if (distChip) {
                document.querySelectorAll('#bw-f-districts .bw-f-chip').forEach(c=>c.classList.remove('active'));
                distChip.classList.add('active');
            }
            
            const radioRow = e.target.closest('.bw-radio-row');
            if (radioRow) {
                document.querySelectorAll('.bw-radio-row').forEach(r => r.classList.remove('active'));
                radioRow.classList.add('active');
            }

            if (e.target.closest('#bw-sheet-reset')) {
                renderFilterSheetUI(true);
            }

            if (e.target.closest('#bw-sheet-apply')) {
                const sDist = document.querySelector('#bw-f-districts .bw-f-chip.active').dataset.val;
                const sSort = document.querySelector('.bw-radio-row.active').dataset.sort;
                const rMin = document.getElementById('bw-f-rmin').value;
                const rMax = document.getElementById('bw-f-rmax').value;

                const distChanged = bwState.activeDistrict !== sDist;

                bwState.activeDistrict = sDist;
                bwState.sortBy = sSort;
                bwState.rateMin = rMin;
                bwState.rateMax = rMax;

                document.getElementById('bw-filter-sheet').classList.remove('active');
                if (distChanged) fetchWorkersData(sDist);
                else bwUpdateUI();
            }
        }
        if(e.target.id === 'bw-filter-sheet') {
            e.target.classList.remove('active');
        }
    });

    // Debounce Input
    appElement.addEventListener('input', (e) => {
        if (e.target.id === 'bw-search-input') {
            const val = e.target.value;
            bwState.searchQueryRaw = val;
            const searchClear = document.getElementById('bw-search-clear');
            if (val.trim().length > 0) searchClear.classList.remove('hidden');
            else searchClear.classList.add('hidden');

            clearTimeout(bwSearchTimeout);
            bwSearchTimeout = setTimeout(() => {
                bwState.searchQuery = val.trim();
                bwUpdateUI();
            }, 300);
        }
    });

    function renderFilterSheetUI(reset = false) {
        const dTarget = reset ? '' : bwState.activeDistrict;
        const dBox = document.getElementById('bw-f-districts');
        let dHtml = `<button class="bw-f-chip ${dTarget===''?'active':''}" data-val="">All Districts</button>`;
        allDistrictsList.forEach(d => {
            dHtml += `<button class="bw-f-chip ${dTarget===d?'active':''}" data-val="${d}">${d}</button>`;
        });
        dBox.innerHTML = dHtml;

        const sortTarget = reset ? 'verified_first' : bwState.sortBy;
        document.querySelectorAll('.bw-radio-row').forEach(r => {
            if (r.dataset.sort === sortTarget) r.classList.add('active');
            else r.classList.remove('active');
        });

        document.getElementById('bw-f-rmin').value = reset ? '' : bwState.rateMin;
        document.getElementById('bw-f-rmax').value = reset ? '' : bwState.rateMax;
    }

    // Init
    fetchWorkersData();
}
