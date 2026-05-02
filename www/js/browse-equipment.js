// ============================== //
// SkillConnect Mobile           //
// Browse Equipment Screen       //
// ============================== //

const BE_CATEGORIES = ["All", "Power Tools", "Hand Tools", "Heavy Machinery", "Scaffolding", "Electrical", "Plumbing", "Welding", "Painting", "Gardening", "Safety", "Other"];
const BE_CAT_ICONS = {
    "Power Tools": "ri-tools-fill", "Hand Tools": "ri-hammer-fill", "Heavy Machinery": "ri-truck-fill", 
    "Scaffolding": "ri-building-4-fill", "Electrical": "ri-flashlight-fill", "Plumbing": "ri-drop-fill",
    "Welding": "ri-fire-fill", "Painting": "ri-paint-brush-fill", "Gardening": "ri-leaf-fill",
    "Safety": "ri-shield-fill", "Other": "ri-box-3-fill"
};
const BE_CAT_COLORS = {
    "Power Tools": "blue", "Hand Tools": "amber", "Heavy Machinery": "red", 
    "Scaffolding": "gray", "Electrical": "amber", "Plumbing": "teal",
    "Welding": "coral", "Painting": "purple", "Gardening": "green",
    "Safety": "red", "Other": "gray"
};
const BE_CONDITIONS = ["Any", "New", "Excellent", "Good", "Fair"];

async function renderBrowseEquipment(appElement, stateRoute) {
    let beState = {
        allEquipment: [],
        isLoading: true,
        error: null,
        searchQueryRaw: "",
        searchQuery: "",
        activeCategory: "All",
        conditionFilter: "Any",
        priceMin: "",
        priceMax: "",
        showAvailableOnly: false,
        sortBy: "price_asc",
        viewMode: "grid",
        showFilterSheet: false
    };

    let searchTimeout = null;

    // --- Data Processing (useMemo equivalent) ---
    function getProcessedData() {
        let list = [...beState.allEquipment];

        // 1. Availability
        if (beState.showAvailableOnly) {
            list = list.filter(e => e.isAvailable && e.quantityAvailable > 0);
        }

        // 2. Category
        if (beState.activeCategory !== "All") {
            list = list.filter(e => e.category === beState.activeCategory);
        }

        // 3. Condition
        if (beState.conditionFilter && beState.conditionFilter !== "Any") {
            list = list.filter(e => String(e.equipmentCondition).toLowerCase() === beState.conditionFilter.toLowerCase());
        }

        // 4. Price
        if (beState.priceMin !== "") {
            list = list.filter(e => e.rentalPricePerDay >= parseInt(beState.priceMin));
        }
        if (beState.priceMax !== "") {
            list = list.filter(e => e.rentalPricePerDay <= parseInt(beState.priceMax));
        }

        // 5. Search
        if (beState.searchQuery) {
            const q = beState.searchQuery.toLowerCase();
            list = list.filter(e => 
                (e.equipmentName || "").toLowerCase().includes(q) ||
                (e.category || "").toLowerCase().includes(q) ||
                (e.supplier && e.supplier.companyName && e.supplier.companyName.toLowerCase().includes(q)) ||
                (e.equipmentDescription || "").toLowerCase().includes(q)
            );
        }

        // 6. Sort
        list.sort((a, b) => {
            if (beState.sortBy === "price_asc") return a.rentalPricePerDay - b.rentalPricePerDay;
            if (beState.sortBy === "price_desc") return b.rentalPricePerDay - a.rentalPricePerDay;
            if (beState.sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
            if (beState.sortBy === "most_available") return b.quantityAvailable - a.quantityAvailable;
            if (beState.sortBy === "name_az") return (a.equipmentName||"").localeCompare(b.equipmentName||"");
            return 0;
        });

        return list;
    }

    // --- Render Helpers ---
    function renderTabs() {
        return BE_CATEGORIES.map(c => `
            <div class="be-tab ${beState.activeCategory === c ? 'active' : ''}" data-cat="${c}">${c}</div>
        `).join('');
    }

    function hasActiveFilters() {
        return beState.conditionFilter !== "Any" || beState.priceMin !== "" || beState.priceMax !== "" || beState.showAvailableOnly || beState.sortBy !== "price_asc";
    }

    function renderSummaryStrip(listCount) {
        if (!hasActiveFilters() && listCount >= beState.allEquipment.length) return '';

        let chips = '';
        if (beState.conditionFilter !== "Any" && beState.conditionFilter !== "") {
            chips += `<div class="be-chip"><span>Condition: </span>${beState.conditionFilter} <i class="ri-close-line" data-clear="cond"></i></div>`;
        }
        if (beState.priceMin !== "" || beState.priceMax !== "") {
            chips += `<div class="be-chip"><span>Price: </span>LKR ${beState.priceMin||0}–${beState.priceMax||'Max'} <i class="ri-close-line" data-clear="price"></i></div>`;
        }
        if (beState.sortBy !== "price_asc") {
            const sortMap = { "price_desc": "Highest Price", "newest": "Newest", "most_available": "Most Available", "name_az": "A–Z" };
            chips += `<div class="be-chip"><span>Sort: </span>${sortMap[beState.sortBy]} <i class="ri-close-line" data-clear="sort"></i></div>`;
        }

        return `
            <div class="be-summary-strip">
                <div class="be-sum-lbl">${listCount} items available</div>
                ${chips}
            </div>
        `;
    }

    function renderPopularCategories() {
        if (beState.searchQuery || hasActiveFilters() || beState.allEquipment.length === 0) return '';
        
        const scrollCats = BE_CATEGORIES.filter(c => c !== "All").slice(0, 8).map(c => `
            <div class="be-pop-card color-${BE_CAT_COLORS[c]}" data-pcat="${c}">
                <i class="${BE_CAT_ICONS[c]} be-pop-ic"></i>
                <div class="be-pop-t">${c}</div>
            </div>
        `).join('');

        return `
            <div class="be-popular">
                <div class="be-pop-lbl">Popular categories</div>
                <div class="be-pop-scroll">${scrollCats}</div>
            </div>
        `;
    }

    function renderItemCard(e, mode) {
        const isAv = e.isAvailable && e.quantityAvailable > 0;
        const subId = String(e._id);
        const condClass = (e.equipmentCondition || "").toLowerCase();
        
        let imgHtml = '';
        if(e.imagePath) {
             imgHtml = `<img src="${e.imagePath}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
             const ic = BE_CAT_ICONS[e.category] || "ri-settings-4-line";
             imgHtml = `<i class="${ic} be-cg-ic"></i><div class="be-cg-ic-lbl">${e.category||'General'}</div>`;
        }

        if (mode === "grid") {
            return `
                <div class="be-c-grid" data-id="${subId}">
                    <div class="be-cg-img">
                        <div class="be-cg-pill ${isAv ? 'avail' : 'unavail'}">${isAv ? 'Available' : 'Unavailable'}</div>
                        ${imgHtml}
                    </div>
                    <div class="be-cg-body">
                        <div class="be-cg-title">${e.equipmentName}</div>
                        <div class="be-cg-sup">${e.supplier?.companyName || (e.supplier?.firstName + ' ' + e.supplier?.lastName)}</div>
                        <div class="be-cond ${condClass}">${e.equipmentCondition}</div>
                        <div class="be-cg-pr"><span class="be-cg-lkr">LKR ${e.rentalPricePerDay}</span> <span class="be-cg-day">/ day</span></div>
                        ${e.quantityAvailable > 0 ? `<div class="be-cg-qty">${e.quantityAvailable} of ${e.quantityTotal} available</div>` : `<div class="be-cg-out">Out of stock</div>`}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="be-c-list" data-id="${subId}">
                    <div class="be-cl-img">
                        <div class="be-cl-dot ${isAv ? 'avail' : 'unavail'}"></div>
                        ${imgHtml}
                    </div>
                    <div class="be-cl-body">
                        <div class="be-cl-row1">
                            <div class="be-cl-t">${e.equipmentName}</div>
                            <div class="be-cond ${condClass}" style="margin:0;">${e.equipmentCondition}</div>
                        </div>
                        <div class="be-cl-sup">${e.supplier?.companyName || (e.supplier?.firstName + ' ' + e.supplier?.lastName)}</div>
                        <div class="be-cl-pr">LKR ${e.rentalPricePerDay} <span style="font-size:12px;color:#6B7280;font-weight:500;">/ day</span> <span class="be-cl-dep">Deposit: LKR ${e.depositAmount}</span></div>
                        <div class="be-cl-stats"><i class="ri-box-3-line"></i> ${e.quantityAvailable} available &middot; <i class="ri-map-pin-line"></i> ${e.supplier?.city}, ${e.supplier?.district}</div>
                        <button class="be-cl-enq">Enquire</button>
                    </div>
                </div>
            `;
        }
    }

    function renderEmptyState() {
        if (beState.allEquipment.length === 0) {
            return `
                <div class="be-empty">
                    <i class="ri-box-3-line be-e-ic" style="color:#0D9488;"></i>
                    <div class="be-e-t">No equipment listed yet</div>
                    <div class="be-e-s">Suppliers haven't listed any rental equipment yet. Check back soon.</div>
                </div>
            `;
        }
        if (beState.searchQuery && getProcessedData().length === 0) {
            return `
                <div class="be-empty">
                    <i class="ri-search-line be-e-ic"></i>
                    <div class="be-e-t">No results for "${beState.searchQuery}"</div>
                    <div class="be-e-s">Try a different name or category.</div>
                    <button class="be-e-b" id="be-clr-srch">Clear search</button>
                </div>
            `;
        }
        if (beState.activeCategory !== "All" && getProcessedData().length === 0 && !hasActiveFilters()) {
            return `
                <div class="be-empty">
                    <i class="${BE_CAT_ICONS[beState.activeCategory]||'ri-box-3-line'} be-e-ic"></i>
                    <div class="be-e-t">No ${beState.activeCategory} equipment</div>
                    <div class="be-e-s">No equipment in this category is currently listed.</div>
                    <button class="be-e-b" id="be-clr-cat">Browse all</button>
                </div>
            `;
        }
        if (beState.showAvailableOnly && getProcessedData().length === 0) {
            return `
                <div class="be-empty">
                    <i class="ri-calendar-event-line be-e-ic" style="color:#F59E0B;"></i>
                    <div class="be-e-t">Nothing available right now</div>
                    <div class="be-e-s">All equipment is currently rented out. Try again later or browse all listings.</div>
                    <button class="be-e-b" id="be-clr-avail">Show all equipment</button>
                </div>
            `;
        }
        return `
            <div class="be-empty">
                <i class="ri-equalizer-line be-e-ic"></i>
                <div class="be-e-t">No equipment matches your filters</div>
                <div class="be-e-s">Try adjusting your filters.</div>
                <button class="be-e-b" id="be-clr-filt">Reset filters</button>
            </div>
        `;
    }

    function beUpdateUI() {
        const pList = getProcessedData();

        let content = '';
        if (beState.isLoading) {
            const skCount = beState.viewMode === 'grid' ? 4 : 3;
            if (beState.viewMode === 'grid') {
                content = `<div class="be-sk-grid">` + Array(skCount).fill(`
                    <div class="be-sk-c-grid">
                        <div class="be-sk-c-img"></div>
                        <div class="be-sk-c-bod"><div class="be-sk-b" style="width:100%;"></div><div class="be-sk-b" style="width:60%;"></div><div class="be-sk-b" style="width:40%;"></div><div class="be-sk-b" style="width:50%;margin-top:auto;"></div></div>
                    </div>`).join('') + `</div>`;
            } else {
                content = `<div class="be-sk-list">` + Array(skCount).fill(`
                    <div class="be-sk-c-list">
                        <div class="be-sk-c-img-l"></div>
                        <div class="be-sk-c-bod-l"><div class="be-sk-b" style="width:80%;"></div><div class="be-sk-b" style="width:40%;"></div><div class="be-sk-b" style="width:60%;"></div></div>
                    </div>`).join('') + `</div>`;
            }
        } else if (pList.length === 0) {
             content = renderEmptyState();
        } else {
             content = renderPopularCategories();
             if (beState.viewMode === 'grid') {
                 content += `<div class="be-grid">${pList.map(e => renderItemCard(e, 'grid')).join('')}</div>`;
             } else {
                 content += `<div class="be-list">${pList.map(e => renderItemCard(e, 'list')).join('')}</div>`;
             }
        }

        const filterDot = hasActiveFilters() ? `<div class="be-filter-dot"></div>` : ``;

        appElement.innerHTML = `
            <div class="be-screen">
                <div class="be-top-wrapper">
                    <div class="be-header">
                        <button class="be-btn-icon" onclick="navigate(-1)"><i class="ri-arrow-left-line"></i></button>
                        <div class="be-title-global">Equipment Rental</div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div class="be-view-togs">
                                <button class="be-vt-btn ${beState.viewMode==='grid'?'active':''}" id="be-btn-grid"><i class="ri-grid-fill"></i></button>
                                <button class="be-vt-btn ${beState.viewMode==='list'?'active':''}" id="be-btn-list"><i class="ri-list-check-2"></i></button>
                            </div>
                            <button class="be-filter-btn" id="be-btn-filt"><i class="ri-equalizer-line"></i>${filterDot}</button>
                        </div>
                    </div>
                    
                    <div class="be-search-box">
                        <div class="be-search-inner">
                            <i class="ri-search-line be-search-ic"></i>
                            <input type="search" class="be-search-input" id="be-si" placeholder="Search equipment or category..." value="${beState.searchQueryRaw}" autocomplete="off" autocorrect="off">
                            ${beState.searchQueryRaw ? `<button class="be-search-clear" id="be-sl-clr"><i class="ri-close-line"></i></button>` : ''}
                        </div>
                    </div>
                    
                    <div class="be-tabs" id="be-tabs-wrap">${renderTabs()}</div>
                    ${renderSummaryStrip(pList.length)}
                </div>

                <div class="be-scroll-content" id="be-scroller">
                    <div class="be-ptr-wrapper" id="be-ptr">
                        <div class="be-ptr-indicator"><i class="ri-arrow-down-line" id="be-ptr-ic"></i></div>
                    </div>
                    ${content}
                </div>

                <!-- Filter Sheet Overlay -->
                <div class="be-sheet-bg ${beState.showFilterSheet ? 'active' : ''}" id="be-fs-bg">
                    <div class="be-sheet">
                        <div class="be-sh-head">
                            <div class="be-sh-ti">Filter & Sort</div>
                            <button class="be-sh-reset" id="be-fs-res">Reset all filters</button>
                        </div>
                        <div class="be-sh-scroll">
                            
                            <!-- Sec 1 -->
                            <div class="be-sh-sec">
                                <div class="be-tog-row">
                                    <div>
                                        <div class="be-tog-lbl">Available items only</div>
                                        <div class="be-tog-sub">Hide out-of-stock equipment</div>
                                    </div>
                                    <div class="be-switch ${beState.showAvailableOnly ? 'on' : ''}" id="be-fs-av">
                                        <div class="be-sw-circ"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Sec 2 -->
                            <div class="be-sh-sec">
                                <div class="be-sh-lbl">Condition</div>
                                <div class="be-chip-grid">
                                    ${BE_CONDITIONS.map(c => `<button class="be-sh-chip ${beState.conditionFilter===c?'active':''}" data-fcond="${c}">${c}</button>`).join('')}
                                </div>
                            </div>

                            <!-- Sec 3 -->
                            <div class="be-sh-sec">
                                <div class="be-sh-lbl">Daily Rental Price (LKR)</div>
                                <div class="be-input-row">
                                    <div class="be-in-grp"><span class="be-in-pre">LKR</span><input type="number" class="be-in-field" id="be-fi-min" placeholder="0" value="${beState.priceMin}"></div>
                                    <div class="be-in-grp"><span class="be-in-pre">LKR</span><input type="number" class="be-in-field" id="be-fi-max" placeholder="Any" value="${beState.priceMax}"></div>
                                </div>
                            </div>

                            <!-- Sec 4 -->
                            <div class="be-sh-sec" style="border-bottom:none;">
                                <div class="be-sh-lbl" style="margin-bottom:16px;">Sort by</div>
                                ${[ {v:"price_asc", l:"Price: low to high"}, {v:"price_desc", l:"Price: high to low"}, {v:"newest", l:"Newest listings"}, {v:"most_available", l:"Most available"}, {v:"name_az", l:"Name: A to Z"} ].map(s => `
                                    <div class="be-rad-row ${beState.sortBy===s.v?'active':''}" data-fsort="${s.v}">
                                        <div class="be-rad-circ"><div class="be-rad-dot"></div></div>
                                        ${s.l}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <button class="be-sh-apply" id="be-fs-apply">Show Equipment</button>
                    </div>
                </div>

            </div>
        `;

        setupGestures();
    }

    // --- Gestures PTR ---
    function setupGestures() {
        const scroller = document.getElementById('be-scroller');
        const ptr = document.getElementById('be-ptr');
        const ic = document.getElementById('be-ptr-ic');
        if (!scroller || !ptr) return;

        let startY = 0; let curY = 0; let refreshing = false;

        scroller.addEventListener('touchstart', e => {
            if (scroller.scrollTop === 0 && !refreshing) startY = e.touches[0].clientY;
            else startY = 0;
        }, {passive: true});

        scroller.addEventListener('touchmove', e => {
            if (!startY || refreshing) return;
            curY = e.touches[0].clientY;
            const diff = curY - startY;
            if (diff > 0) {
                ptr.style.height = `${Math.min(diff, 80)}px`;
                if (diff > 60) { ic.style.transform = 'rotate(180deg)'; }
                else { ic.style.transform = 'rotate(0deg)'; }
            }
        }, {passive: true});

        scroller.addEventListener('touchend', () => {
            if (!startY || refreshing) return;
            const diff = curY - startY;
            if (diff > 60) {
                refreshing = true;
                ptr.style.height = '60px';
                ic.className = 'be-ptr-spinner';
                ic.style.transform = 'rotate(0deg)';
                loadData(true).finally(() => {
                    ptr.style.height = '0px';
                    setTimeout(() => { ic.className = 'ri-arrow-down-line'; refreshing = false; }, 200);
                });
            } else {
                ptr.style.height = '0px';
            }
            startY = 0;
        });
    }

    // --- Loading ---
    async function loadData(silent = false) {
        if (!silent) { beState.isLoading = true; beUpdateUI(); }

        try {
            // Simulated Fetch using realistic structure boundaries
            await new Promise(r => setTimeout(r, silent ? 600 : 1200));

            beState.allEquipment = [
                {
                    _id: "eq_1A",
                    supplier: { firstName: "Nimal", lastName: "Silva", companyName: "Lanka Tools & Equipment", city: "Colombo", district: "Colombo", isVerified: true },
                    equipmentName: "Heavy Duty Power Drill Bosch Model X",
                    equipmentDescription: "Bosch professional grade drilling solution.",
                    category: "Power Tools",
                    equipmentCondition: "excellent",
                    rentalPricePerDay: 1500,
                    depositAmount: 5000,
                    quantityAvailable: 3,
                    quantityTotal: 5,
                    imagePath: null,
                    isAvailable: true,
                    createdAt: new Date(Date.now() - 86400000*3).toISOString()
                },
                {
                    _id: "eq_1B",
                    supplier: { firstName: "Shan", lastName: "Kumara", companyName: "BuildRight Machinery", city: "Negombo", district: "Gampaha", isVerified: false },
                    equipmentName: "Concrete Mixer 200L Petrol",
                    equipmentDescription: "Heavy duty concrete mixer.",
                    category: "Heavy Machinery",
                    equipmentCondition: "good",
                    rentalPricePerDay: 8000,
                    depositAmount: 20000,
                    quantityAvailable: 0,
                    quantityTotal: 2,
                    imagePath: null,
                    isAvailable: false,
                    createdAt: new Date(Date.now() - 86400000*1).toISOString()
                },
                {
                    _id: "eq_1C",
                    supplier: { firstName: "Nuwan", lastName: "", companyName: "Nuwan Plumbing Solutions", city: "Kaduwela", district: "Colombo", isVerified: true },
                    equipmentName: "PEX Pipe Crimper Tool Set",
                    equipmentDescription: "Standard plumbing pipe crimping set.",
                    category: "Plumbing",
                    equipmentCondition: "fair",
                    rentalPricePerDay: 800,
                    depositAmount: 2000,
                    quantityAvailable: 2,
                    quantityTotal: 2,
                    imagePath: null,
                    isAvailable: true,
                    createdAt: new Date(Date.now() - 86400000*10).toISOString()
                }
            ];
            beState.error = null;
        } catch(e) {
            beState.error = "Failed to load equipment.";
        }

        beState.isLoading = false;
        beUpdateUI();
    }

    // --- Interactive Logic ---
    appElement.addEventListener('click', e => {
        // Navigations
        const card = e.target.closest('.be-c-grid') || e.target.closest('.be-c-list');
        if (card || e.target.closest('.be-cl-enq')) {
            const tgtId = (card || e.target.closest('.be-c-list')).dataset.id;
            navigate(`/customer/equipment/${tgtId}`);
        }

        // Tabs
        const tab = e.target.closest('.be-tab');
        if (tab) {
            beState.activeCategory = tab.dataset.cat;
            beUpdateUI();
            const wWrap = document.getElementById('be-tabs-wrap');
            if(wWrap) {
                const scrollPos = tab.offsetLeft - (wWrap.offsetWidth / 2) + (tab.offsetWidth / 2);
                wWrap.scrollTo({ left: scrollPos, behavior: 'smooth' });
            }
        }
        
        // Pop cards
        const pop = e.target.closest('.be-pop-card');
        if(pop) {
            beState.activeCategory = pop.dataset.pcat;
            beUpdateUI();
        }

        // View Toggles
        if (e.target.closest('#be-btn-grid')) { beState.viewMode = 'grid'; beUpdateUI(); }
        if (e.target.closest('#be-btn-list')) { beState.viewMode = 'list'; beUpdateUI(); }

        // Clears
        if (e.target.closest('#be-sl-clr') || e.target.closest('#be-clr-srch')) {
            beState.searchQueryRaw = ""; beState.searchQuery = ""; beUpdateUI();
        }
        if (e.target.closest('i[data-clear]')) {
            const d = e.target.dataset.clear;
            if(d==='cond') beState.conditionFilter = "Any";
            if(d==='price') { beState.priceMin = ""; beState.priceMax = ""; }
            if(d==='sort') beState.sortBy = "price_asc";
            beUpdateUI();
        }
        if (e.target.closest('#be-clr-cat')) { beState.activeCategory = "All"; beUpdateUI(); }
        if (e.target.closest('#be-clr-avail')) { beState.showAvailableOnly = false; beUpdateUI(); }
        if (e.target.closest('#be-clr-filt') || e.target.closest('#be-fs-res')) {
            beState.conditionFilter = "Any"; beState.showAvailableOnly = false; 
            beState.priceMin = ""; beState.priceMax = ""; beState.sortBy = "price_asc";
            beUpdateUI();
        }

        // Filter Sheet Flow
        if (e.target.closest('#be-btn-filt')) { beState.showFilterSheet = true; beUpdateUI(); }
        if (e.target.id === 'be-fs-bg') { beState.showFilterSheet = false; beUpdateUI(); }
        if (e.target.closest('#be-fs-apply')) { beState.showFilterSheet = false; beUpdateUI(); }

        if (e.target.closest('#be-fs-av')) { beState.showAvailableOnly = !beState.showAvailableOnly; beUpdateUI(); }
        
        const fcond = e.target.closest('.be-sh-chip');
        if (fcond) { beState.conditionFilter = fcond.dataset.fcond; beUpdateUI(); }

        const fsort = e.target.closest('.be-rad-row');
        if (fsort) { beState.sortBy = fsort.dataset.fsort; beUpdateUI(); }
    });

    appElement.addEventListener('input', e => {
        if (e.target.id === 'be-si') {
            beState.searchQueryRaw = e.target.value;
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                beState.searchQuery = beState.searchQueryRaw;
                beUpdateUI();
            }, 300);
        }
        if (e.target.id === 'be-fi-min') { beState.priceMin = e.target.value; }
        if (e.target.id === 'be-fi-max') { beState.priceMax = e.target.value; }
    });

    loadData();
}
