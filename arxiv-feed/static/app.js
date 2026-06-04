/**
 * ArXiv Feed - Instagram-style Paper Discovery
 */

// ===== State =====
const state = {
    papers: [],
    likedPapers: JSON.parse(localStorage.getItem('arxiv_liked') || '{}'),
    currentFeed: 'foryou',
    currentPage: 'home',
    activeCategory: null,
    loading: false,
    offset: 0,
    hasMore: true,
    searchTimeout: null,
    lastTap: 0,
};

// ===== Category Colors =====
const CATEGORY_COLORS = {
    'cs.AI': ['#667eea', '#764ba2'],
    'cs.CL': ['#f093fb', '#f5576c'],
    'cs.CV': ['#4facfe', '#00f2fe'],
    'cs.LG': ['#43e97b', '#38f9d7'],
    'cs.NE': ['#fa709a', '#fee140'],
    'cs.RO': ['#a18cd1', '#fbc2eb'],
    'cs.SE': ['#fccb90', '#d57eeb'],
    'cs.DS': ['#e0c3fc', '#8ec5fc'],
    'cs.CR': ['#f5576c', '#ff6a88'],
    'cs.DB': ['#667eea', '#00cdac'],
    'stat.ML': ['#3cba92', '#0ba360'],
    'math.OC': ['#ff9a9e', '#fecfef'],
    'eess.SP': ['#a1c4fd', '#c2e9fb'],
};

function getCategoryGradient(categories) {
    if (!categories || categories.length === 0) return ['#667eea', '#764ba2'];
    for (const cat of categories) {
        if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
    }
    // Generate from category string
    const hash = categories[0].split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hue1 + 40) % 360;
    return [`hsl(${hue1}, 70%, 55%)`, `hsl(${hue2}, 70%, 45%)`];
}

// ===== Procedural Visualization Generator =====
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

function generateVisualization(paper, width = 200, height = 250) {
    const seed = hashString(paper.id || paper.title || 'default');
    const rand = seededRandom(seed);
    const [color1, color2] = getCategoryGradient(paper.categories);
    const vizType = seed % 6;

    let elements = '';

    switch (vizType) {
        case 0: // Neural network
            elements = genNeuralNet(rand, width, height, color1, color2);
            break;
        case 1: // Scatter plot
            elements = genScatterPlot(rand, width, height, color1, color2);
            break;
        case 2: // Bar chart
            elements = genBarChart(rand, width, height, color1, color2);
            break;
        case 3: // Network graph
            elements = genNetworkGraph(rand, width, height, color1, color2);
            break;
        case 4: // Line chart
            elements = genLineChart(rand, width, height, color1, color2);
            break;
        case 5: // Matrix heatmap
            elements = genMatrix(rand, width, height, color1, color2);
            break;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${elements}</svg>`;
}

function genNeuralNet(rand, w, h, c1, c2) {
    const layers = [3, 5, 6, 5, 3, 2];
    const layerSpacing = w / (layers.length + 1);
    let svg = '';
    const nodes = [];

    layers.forEach((count, li) => {
        const x = layerSpacing * (li + 1);
        const nodeSpacing = h / (count + 1);
        const layerNodes = [];
        for (let i = 0; i < count; i++) {
            const y = nodeSpacing * (i + 1);
            layerNodes.push({ x, y });
        }
        nodes.push(layerNodes);
    });

    // Draw connections
    for (let l = 0; l < nodes.length - 1; l++) {
        for (const from of nodes[l]) {
            for (const to of nodes[l + 1]) {
                if (rand() > 0.3) {
                    const opacity = 0.1 + rand() * 0.3;
                    svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${c1}" stroke-width="0.5" opacity="${opacity}"/>`;
                }
            }
        }
    }

    // Draw nodes
    for (const layer of nodes) {
        for (const node of layer) {
            const r = 2 + rand() * 3;
            svg += `<circle cx="${node.x}" cy="${node.y}" r="${r}" fill="${rand() > 0.5 ? c1 : c2}" opacity="${0.5 + rand() * 0.5}"/>`;
        }
    }

    return svg;
}

function genScatterPlot(rand, w, h, c1, c2) {
    let svg = '';
    // Axes
    svg += `<line x1="30" y1="${h-30}" x2="${w-20}" y2="${h-30}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
    svg += `<line x1="30" y1="20" x2="30" y2="${h-30}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;

    // Points
    const numPoints = 25 + Math.floor(rand() * 20);
    const points = [];
    for (let i = 0; i < numPoints; i++) {
        const x = 40 + rand() * (w - 70);
        const y = 30 + rand() * (h - 70);
        const r = 2 + rand() * 4;
        points.push({ x, y });
        svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${rand() > 0.5 ? c1 : c2}" opacity="${0.3 + rand() * 0.5}"/>`;
    }

    // Trend line
    const sorted = points.sort((a, b) => a.x - b.x);
    if (sorted.length > 4) {
        let path = `M ${sorted[0].x} ${sorted[0].y}`;
        for (let i = 1; i < sorted.length; i += 3) {
            const p = sorted[Math.min(i, sorted.length - 1)];
            path += ` L ${p.x} ${p.y}`;
        }
        svg += `<path d="${path}" stroke="${c2}" stroke-width="2" fill="none" opacity="0.4" stroke-dasharray="4 2"/>`;
    }

    return svg;
}

function genBarChart(rand, w, h, c1, c2) {
    let svg = '';
    const numBars = 7 + Math.floor(rand() * 5);
    const barWidth = (w - 60) / numBars - 4;
    const maxH = h - 60;

    // Axis
    svg += `<line x1="30" y1="${h-30}" x2="${w-20}" y2="${h-30}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;

    for (let i = 0; i < numBars; i++) {
        const barH = 20 + rand() * (maxH - 20);
        const x = 35 + i * (barWidth + 4);
        const y = h - 30 - barH;
        const color = rand() > 0.5 ? c1 : c2;
        const opacity = 0.4 + rand() * 0.4;
        svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="2" fill="${color}" opacity="${opacity}"/>`;
    }

    return svg;
}

function genNetworkGraph(rand, w, h, c1, c2) {
    let svg = '';
    const numNodes = 8 + Math.floor(rand() * 6);
    const nodes = [];

    for (let i = 0; i < numNodes; i++) {
        nodes.push({
            x: 30 + rand() * (w - 60),
            y: 30 + rand() * (h - 60),
            r: 4 + rand() * 8
        });
    }

    // Edges
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            if (dist < 100 && rand() > 0.3) {
                svg += `<line x1="${nodes[i].x}" y1="${nodes[i].y}" x2="${nodes[j].x}" y2="${nodes[j].y}" stroke="${c1}" stroke-width="1" opacity="${0.2 + rand() * 0.3}"/>`;
            }
        }
    }

    // Nodes
    for (const node of nodes) {
        svg += `<circle cx="${node.x}" cy="${node.y}" r="${node.r}" fill="${rand() > 0.4 ? c1 : c2}" opacity="${0.5 + rand() * 0.4}"/>`;
        svg += `<circle cx="${node.x}" cy="${node.y}" r="${node.r + 2}" fill="none" stroke="${c2}" stroke-width="0.5" opacity="0.3"/>`;
    }

    return svg;
}

function genLineChart(rand, w, h, c1, c2) {
    let svg = '';
    const numLines = 2 + Math.floor(rand() * 2);
    const numPoints = 10;

    // Grid
    for (let i = 0; i < 4; i++) {
        const y = 30 + i * ((h - 60) / 3);
        svg += `<line x1="30" y1="${y}" x2="${w-20}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    }

    // Lines
    const colors = [c1, c2, 'rgba(255,255,255,0.5)'];
    for (let l = 0; l < numLines; l++) {
        let path = '';
        let prevY = h / 2;
        for (let i = 0; i < numPoints; i++) {
            const x = 30 + i * ((w - 50) / (numPoints - 1));
            prevY = Math.max(30, Math.min(h - 30, prevY + (rand() - 0.5) * 40));
            path += (i === 0 ? 'M' : ' L') + ` ${x} ${prevY}`;
        }
        svg += `<path d="${path}" stroke="${colors[l]}" stroke-width="2" fill="none" opacity="${0.5 + rand() * 0.3}" stroke-linecap="round" stroke-linejoin="round"/>`;

        // Area fill
        svg += `<path d="${path} L ${w-20} ${h-30} L 30 ${h-30} Z" fill="${colors[l]}" opacity="0.05"/>`;
    }

    return svg;
}

function genMatrix(rand, w, h, c1, c2) {
    let svg = '';
    const cols = 8 + Math.floor(rand() * 4);
    const rows = 10 + Math.floor(rand() * 4);
    const cellW = (w - 40) / cols;
    const cellH = (h - 40) / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = 20 + c * cellW;
            const y = 20 + r * cellH;
            const val = rand();
            const color = val > 0.5 ? c1 : c2;
            const opacity = 0.1 + val * 0.6;
            svg += `<rect x="${x}" y="${y}" width="${cellW - 1}" height="${cellH - 1}" rx="1" fill="${color}" opacity="${opacity}"/>`;
        }
    }

    return svg;
}

// ===== Storage =====
function saveLikes() {
    localStorage.setItem('arxiv_liked', JSON.stringify(state.likedPapers));
}

function isLiked(paperId) {
    return !!state.likedPapers[paperId];
}

function toggleLike(paper) {
    if (isLiked(paper.id)) {
        delete state.likedPapers[paper.id];
    } else {
        state.likedPapers[paper.id] = {
            ...paper,
            likedAt: Date.now()
        };
    }
    saveLikes();
    return isLiked(paper.id);
}

function getLikedCategories() {
    const cats = {};
    Object.values(state.likedPapers).forEach(p => {
        (p.categories || []).forEach(c => {
            cats[c] = (cats[c] || 0) + 1;
        });
    });
    return Object.entries(cats)
        .sort((a, b) => b[1] - a[1])
        .map(([cat]) => cat);
}

function getLikedKeywords() {
    const words = {};
    const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'we', 'our', 'us', 'its', 'it', 'they', 'their', 'them', 'which', 'what', 'who', 'whom', 'where', 'when', 'how', 'not', 'no', 'nor', 'if', 'then', 'than', 'so', 'as', 'up', 'out', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'each', 'all', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'same', 'also', 'very', 'just', 'over', 'using', 'based', 'via', 'new']);
    Object.values(state.likedPapers).forEach(p => {
        const text = (p.title || '').toLowerCase();
        text.split(/\W+/).forEach(w => {
            if (w.length > 3 && !stopwords.has(w)) {
                words[w] = (words[w] || 0) + 1;
            }
        });
    });
    return Object.entries(words)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([w]) => w);
}

// ===== API =====
async function fetchPapers(query = '', category = '', start = 0, maxResults = 20) {
    // If we have preloaded data (Snowflake/embedded mode), filter locally
    if (typeof PRELOADED_PAPERS !== 'undefined' && PRELOADED_PAPERS.length > 0) {
        let filtered = [...PRELOADED_PAPERS];
        if (category) {
            filtered = filtered.filter(p => (p.categories || []).some(c => c === category));
        }
        if (query) {
            const q = query.toLowerCase();
            filtered = filtered.filter(p =>
                (p.title || '').toLowerCase().includes(q) ||
                (p.abstract || '').toLowerCase().includes(q) ||
                (p.authors || []).some(a => a.toLowerCase().includes(q))
            );
        }
        return filtered.slice(start, start + maxResults);
    }
    // Otherwise use API (local dev mode)
    const params = new URLSearchParams({ query, category, start, max_results: maxResults });
    try {
        const resp = await fetch(`/api/papers?${params}`);
        return await resp.json();
    } catch (e) {
        console.error('Fetch papers error:', e);
        return [];
    }
}

async function fetchRecommendations(maxResults = 20) {
    // If we have preloaded data, do recommendations locally
    if (typeof PRELOADED_PAPERS !== 'undefined' && PRELOADED_PAPERS.length > 0) {
        const likedCats = getLikedCategories();
        const likedKws = getLikedKeywords();

        if (likedCats.length === 0 && likedKws.length === 0) {
            // Shuffle and return
            const shuffled = [...PRELOADED_PAPERS].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, maxResults);
        }

        // Score papers by relevance to likes
        const scored = PRELOADED_PAPERS.map(p => {
            let score = 0;
            (p.categories || []).forEach(c => {
                const idx = likedCats.indexOf(c);
                if (idx !== -1) score += (likedCats.length - idx) * 2;
            });
            const titleLower = (p.title || '').toLowerCase();
            likedKws.forEach((kw, i) => {
                if (titleLower.includes(kw)) score += (likedKws.length - i);
            });
            // Don't recommend already-liked papers
            if (isLiked(p.id)) score = -1;
            return { paper: p, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.filter(s => s.score > 0).slice(0, maxResults).map(s => s.paper);
    }
    // Otherwise use API
    const categories = getLikedCategories().slice(0, 5).join(',');
    const keywords = getLikedKeywords().slice(0, 5).join(',');
    const params = new URLSearchParams({ categories, keywords, max_results: maxResults });
    try {
        const resp = await fetch(`/api/recommend?${params}`);
        return await resp.json();
    } catch (e) {
        console.error('Fetch recommendations error:', e);
        return [];
    }
}

// ===== UI Rendering =====
function createPaperCard(paper) {
    const [color1, color2] = getCategoryGradient(paper.categories);
    const liked = isLiked(paper.id);
    const mainCat = paper.categories?.[0] || 'paper';
    const authorsText = (paper.authors || []).slice(0, 2).join(', ');

    const card = document.createElement('div');
    card.className = 'paper-card';
    card.dataset.paperId = paper.id;
    const vizSvg = generateVisualization(paper);
    const thumbnailUrl = paper.thumbnail_url || `https://ar5iv.labs.arxiv.org/html/${paper.id}/assets/x1.png`;
    card.innerHTML = `
        <div class="card-gradient" style="background: linear-gradient(160deg, ${color1}, ${color2})"></div>
        <div class="card-visualization">
            <img src="${thumbnailUrl}" alt="" class="card-thumbnail" loading="lazy">
            <div class="card-viz-fallback">${vizSvg}</div>
        </div>
        <div class="card-gradient-overlay"></div>
        <div class="card-content">
            <div class="card-category">${mainCat}</div>
            <div class="card-bottom">
                <div class="card-title">${escapeHtml(paper.title)}</div>
                <div class="card-authors">${escapeHtml(authorsText)}</div>
            </div>
        </div>
        <div class="card-actions">
            <button class="card-action-btn like-btn ${liked ? 'liked' : ''}" data-paper-id="${paper.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>
        </div>
        <div class="double-tap-heart">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
        </div>
    `;

    // Handle image load failure - show SVG fallback
    const img = card.querySelector('.card-thumbnail');
    const fallback = card.querySelector('.card-viz-fallback');
    img.addEventListener('load', () => {
        fallback.style.display = 'none';
    });
    img.addEventListener('error', () => {
        img.style.display = 'none';
        fallback.style.display = 'flex';
    });

    // Double-tap to like
    card.addEventListener('click', (e) => {
        if (e.target.closest('.card-action-btn')) return;
        const now = Date.now();
        if (now - state.lastTap < 300) {
            // Double tap
            if (!isLiked(paper.id)) {
                toggleLike(paper);
                updateLikeUI(card, paper.id);
            }
            showDoubleTapHeart(card);
        } else {
            // Single tap - open modal (delayed)
            setTimeout(() => {
                if (Date.now() - state.lastTap >= 300) {
                    openModal(paper);
                }
            }, 300);
        }
        state.lastTap = now;
    });

    // Like button
    card.querySelector('.like-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(paper);
        updateLikeUI(card, paper.id);
    });

    return card;
}

function updateLikeUI(card, paperId) {
    const btn = card.querySelector('.like-btn');
    const liked = isLiked(paperId);
    btn.classList.toggle('liked', liked);
    btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    `;
    if (liked) {
        btn.classList.add('heart-burst');
        setTimeout(() => btn.classList.remove('heart-burst'), 400);
    }
}

function showDoubleTapHeart(card) {
    const heart = card.querySelector('.double-tap-heart');
    heart.classList.remove('show');
    void heart.offsetWidth; // reflow
    heart.classList.add('show');
    setTimeout(() => heart.classList.remove('show'), 900);
}

function openModal(paper) {
    const modal = document.getElementById('paper-modal');
    const body = document.getElementById('modal-body');
    const [color1, color2] = getCategoryGradient(paper.categories);
    const liked = isLiked(paper.id);
    const date = paper.published ? new Date(paper.published).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

    const modalViz = generateVisualization(paper, 400, 140);
    const thumbnailUrl = paper.thumbnail_url || `https://ar5iv.labs.arxiv.org/html/${paper.id}/assets/x1.png`;
    body.innerHTML = `
        <div class="modal-header-gradient" style="background: linear-gradient(135deg, ${color1}, ${color2})">
            <div class="modal-header-viz">
                <img src="${thumbnailUrl}" alt="" class="modal-header-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="modal-header-viz-fallback" style="display:none;">${modalViz}</div>
            </div>
            <div class="modal-categories">
                ${(paper.categories || []).map(c => `<span class="modal-cat-chip">${c}</span>`).join('')}
            </div>
        </div>
        <div class="modal-body-inner">
            <h2 class="modal-title">${escapeHtml(paper.title)}</h2>
            <div class="modal-authors">
                ${(paper.authors || []).slice(0, 8).map(a => `
                    <span class="author-chip">
                        <span class="author-avatar">${a.charAt(0).toUpperCase()}</span>
                        ${escapeHtml(a)}
                    </span>
                `).join('')}
                ${paper.authors.length > 8 ? `<span class="author-chip">+${paper.authors.length - 8} more</span>` : ''}
            </div>
            <div class="modal-meta">
                <span>${date}</span>
                <span>${paper.id}</span>
            </div>
            <p class="modal-abstract">${escapeHtml(paper.abstract)}</p>
            <div class="modal-actions">
                <button class="modal-action-btn btn-like ${liked ? 'liked' : ''}" id="modal-like-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    ${liked ? 'Liked' : 'Like'}
                </button>
                <a href="${paper.pdf_url}" target="_blank" class="modal-action-btn btn-pdf">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    PDF
                </a>
                <a href="${paper.url}" target="_blank" class="modal-action-btn btn-arxiv">
                    arXiv
                </a>
            </div>
        </div>
    `;

    // Modal like button
    document.getElementById('modal-like-btn').addEventListener('click', () => {
        toggleLike(paper);
        const btn = document.getElementById('modal-like-btn');
        const nowLiked = isLiked(paper.id);
        btn.classList.toggle('liked', nowLiked);
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${nowLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            ${nowLiked ? 'Liked' : 'Like'}
        `;
        // Update card in grid too
        const card = document.querySelector(`[data-paper-id="${paper.id}"]`);
        if (card) updateLikeUI(card, paper.id);
    });

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('paper-modal').classList.remove('active');
}

// ===== Feed Loading =====
async function loadFeed(reset = false) {
    if (state.loading) return;
    state.loading = true;

    const loadingEl = document.getElementById('loading');
    const grid = document.getElementById('feed-grid');

    if (reset) {
        state.offset = 0;
        state.hasMore = true;
        state.papers = [];
        grid.innerHTML = '';
        loadingEl.classList.remove('hidden');
    }

    let papers = [];

    if (state.currentPage === 'liked') {
        papers = Object.values(state.likedPapers)
            .sort((a, b) => (b.likedAt || 0) - (a.likedAt || 0));
        state.hasMore = false;
    } else if (state.currentFeed === 'foryou') {
        const likeCount = Object.keys(state.likedPapers).length;
        if (likeCount > 0) {
            papers = await fetchRecommendations(20);
        } else {
            papers = await fetchPapers('', 'cs.AI', state.offset, 20);
        }
    } else if (state.currentFeed === 'latest') {
        const cat = state.activeCategory || '';
        papers = await fetchPapers('', cat, state.offset, 20);
    } else if (state.currentFeed === 'explore') {
        const cat = state.activeCategory || 'cs.LG';
        papers = await fetchPapers('', cat, state.offset, 20);
    }

    loadingEl.classList.add('hidden');

    if (papers.length === 0 && state.papers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <div class="empty-title">No papers yet</div>
                <div class="empty-text">
                    ${state.currentPage === 'liked' 
                        ? 'Like papers to see them here. Double-tap any paper card!' 
                        : 'Try selecting a category above or searching for topics.'}
                </div>
            </div>
        `;
    } else {
        // Deduplicate against existing
        const existingIds = new Set(state.papers.map(p => p.id));
        const newPapers = papers.filter(p => !existingIds.has(p.id));

        state.papers.push(...newPapers);
        state.offset += newPapers.length;
        state.hasMore = newPapers.length >= 15;

        newPapers.forEach(paper => {
            grid.appendChild(createPaperCard(paper));
        });
    }

    state.loading = false;
}

// ===== Story Bar =====
function renderStoryBar() {
    const scroll = document.getElementById('story-scroll');
    const categories = [
        ['cs.AI', 'AI'],
        ['cs.CL', 'NLP'],
        ['cs.CV', 'Vision'],
        ['cs.LG', 'ML'],
        ['stat.ML', 'Stats'],
        ['cs.NE', 'Neural'],
        ['cs.RO', 'Robots'],
        ['cs.SE', 'Software'],
        ['cs.CR', 'Crypto'],
        ['cs.DB', 'Data'],
    ];

    scroll.innerHTML = categories.map(([cat, label]) => {
        const [c1, c2] = getCategoryGradient([cat]);
        const active = state.activeCategory === cat ? 'active' : '';
        return `
            <div class="story-item ${active}" data-category="${cat}">
                <div class="story-circle" style="background: linear-gradient(135deg, ${c1}, ${c2})">
                    ${label}
                </div>
                <span class="story-label">${cat}</span>
            </div>
        `;
    }).join('');

    // Click handlers
    scroll.querySelectorAll('.story-item').forEach(item => {
        item.addEventListener('click', () => {
            const cat = item.dataset.category;
            if (state.activeCategory === cat) {
                state.activeCategory = null;
                item.classList.remove('active');
            } else {
                scroll.querySelectorAll('.story-item').forEach(i => i.classList.remove('active'));
                state.activeCategory = cat;
                item.classList.add('active');
            }
            loadFeed(true);
        });
    });
}

// ===== Search =====
function openSearch() {
    document.getElementById('search-overlay').classList.add('active');
    document.getElementById('search-input').focus();
}

function closeSearch() {
    document.getElementById('search-overlay').classList.remove('active');
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
}

async function handleSearch(query) {
    if (!query.trim()) {
        document.getElementById('search-results').innerHTML = '';
        return;
    }

    const results = await fetchPapers(query, '', 0, 15);
    const container = document.getElementById('search-results');

    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-title">No results</div>
                <div class="empty-text">Try different keywords</div>
            </div>
        `;
        return;
    }

    container.innerHTML = results.map(paper => `
        <div class="search-result-item" data-paper-id="${paper.id}">
            <div class="search-result-title">${escapeHtml(paper.title)}</div>
            <div class="search-result-meta">${(paper.authors || []).slice(0, 2).join(', ')} · ${paper.categories?.[0] || ''}</div>
        </div>
    `).join('');

    container.querySelectorAll('.search-result-item').forEach((item, i) => {
        item.addEventListener('click', () => {
            closeSearch();
            openModal(results[i]);
        });
    });
}

// ===== Navigation =====
function switchPage(page) {
    state.currentPage = page;

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });

    if (page === 'search') {
        openSearch();
        return;
    }

    const feedToggle = document.querySelector('.feed-toggle');
    const storyBar = document.querySelector('.story-bar');

    if (page === 'liked') {
        feedToggle.style.display = 'none';
        storyBar.style.display = 'none';
        document.querySelector('.main-content').style.paddingTop = `calc(var(--header-height) + 8px)`;
    } else {
        feedToggle.style.display = 'flex';
        storyBar.style.display = 'flex';
        document.querySelector('.main-content').style.paddingTop = '';
    }

    loadFeed(true);
}

// ===== Utilities =====
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
    // Render story bar
    renderStoryBar();

    // Load initial feed
    loadFeed();

    // Feed toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFeed = btn.dataset.feed;
            loadFeed(true);
        });
    });

    // Bottom nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchPage(btn.dataset.page);
        });
    });

    // Modal close
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('paper-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Search
    document.getElementById('search-cancel').addEventListener('click', () => {
        closeSearch();
        switchPage('home');
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
        clearTimeout(state.searchTimeout);
        state.searchTimeout = setTimeout(() => handleSearch(e.target.value), 400);
    });

    // Escape key closes modal/search
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            if (document.getElementById('search-overlay').classList.contains('active')) {
                closeSearch();
                switchPage('home');
            }
        }
    });

    // Infinite scroll
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && state.hasMore && !state.loading) {
            loadFeed();
        }
    }, { rootMargin: '200px' });

    observer.observe(document.getElementById('load-more-trigger'));

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadFeed(true);
    });
});
