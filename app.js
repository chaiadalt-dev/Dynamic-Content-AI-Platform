// ========== מבנה התורה (לממשק) ==========
const TORAH_STRUCTURE = {
    'בראשית': 50,
    'שמות': 40,
    'ויקרא': 27,
    'במדבר': 36,
    'דברים': 34
};

// ========== אלמנטים ==========
const bookSelect = document.getElementById('book-select');
const chapterSelect = document.getElementById('chapter-select');
const verseSelect = document.getElementById('verse-select');
const submitButton = document.getElementById('submit-button');
const form = document.getElementById('verse-form');
const aiHelperBtn = document.getElementById('ai-helper-btn');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

// ========== אתחול ==========
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadStats();
    loadPopularDvarim();
});

// ========== מאזיני אירועים ==========
function initEventListeners() {
    bookSelect.addEventListener('change', function() {
        const bookName = this.value;
        resetSelect(chapterSelect, 'בחר פרק...');
        resetSelect(verseSelect, 'בחר פסוק...');
        submitButton.disabled = true;
        
        if (!bookName) return;
        
        const numChapters = TORAH_STRUCTURE[bookName];
        populateSelect(chapterSelect, numChapters);
        chapterSelect.disabled = false;
    });

    chapterSelect.addEventListener('change', function() {
        resetSelect(verseSelect, 'בחר פסוק...');
        submitButton.disabled = true;
        
        if (!this.value) return;
        
        const numVerses = 50; // קבוע להדגמה
        populateSelect(verseSelect, numVerses);
        verseSelect.disabled = false;
    });

    verseSelect.addEventListener('change', function() {
        submitButton.disabled = !this.value;
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const book = bookSelect.value;
        const chapter = chapterSelect.value;
        const verse = verseSelect.value;
        
        if (book && chapter && verse) {
            viewVerse(book, chapter, verse);
        }
    });

    aiHelperBtn.addEventListener('click', showAIHelper);

    searchInput.addEventListener('input', function() {
        if (this.value.length >= 2) searchDvarim(this.value);
        else clearSearchResults();
    });
}

// ========== פונקציות עזר ==========
function resetSelect(select, defaultText) {
    select.innerHTML = `<option value="">${defaultText}</option>`;
    select.disabled = true;
}

function populateSelect(select, count) {
    for (let i = 1; i <= count; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        select.appendChild(option);
    }
}

// ========== הצגת פסוק (Modal) ==========
function viewVerse(book, chapter, verse) {
    fetch(`/api/verse/${book}/${chapter}/${verse}`)
        .then(res => res.json())
        .then(data => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top:0; left:0; width:100%; height:100%;
                background: rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:center; z-index:10000;
            `;
            
            let contentHtml = data.length > 0 
                ? data.map(d => `
                    <div class="card" style="margin:10px 0;">
                        <h3>${d.title || 'דבר תורה'}</h3>
                        <p>${d.content}</p>
                        <small>נכתב ע"י: ${d.user_name} | דירוג: ${d.rating}</small>
                    </div>`).join('')
                : '<p>אין עדיין דברי תורה על פסוק זה.</p>';

            modal.innerHTML = `
                <div class="card" style="max-width:600px; width:90%; max-height:80vh; overflow-y:auto;">
                    <h2>${book} פרק ${chapter}, פסוק ${verse}</h2>
                    <div style="margin:20px 0;">${contentHtml}</div>
                    <button onclick="this.closest('div[style]').remove()" class="btn btn-primary">סגור</button>
                </div>
            `;
            document.body.appendChild(modal);
        });
}

// ========== סטטיסטיקות ==========
function loadStats() {
    fetch('/api/stats')
        .then(res => res.json())
        .then(stats => {
            document.getElementById('total-dvarim').textContent = stats.total_dvarim || 0;
            document.getElementById('total-rating').textContent = stats.total_rating || 0;
            document.getElementById('books-covered').textContent = stats.books_covered || 0;
        })
        .catch(() => {
            document.getElementById('total-dvarim').textContent = '?';
            document.getElementById('total-rating').textContent = '?';
            document.getElementById('books-covered').textContent = '?';
        });
}

// ========== פופולריים ==========
function loadPopularDvarim() {
    fetch('/api/popular')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('popular-dvarim');
            container.innerHTML = data.map(d => `
                <div class="card hover-card">
                    <div class="card-header">
                        <h3>${d.book} ${d.chapter}:${d.verse}</h3>
                        <div class="rating">
                            <span class="rating-score">${d.rating}</span>
                            <i class="fas fa-star"></i>
                        </div>
                    </div>
                    <p class="dvar-preview">${d.content.substring(0, 100)}${d.content.length>100 ? '...' : ''}</p>
                    <button class="btn btn-secondary" onclick="viewVerse('${d.book}', ${d.chapter}, ${d.verse})">קרא עוד</button>
                </div>
            `).join('');
        });
}

// ========== חיפוש ==========
function searchDvarim(query) {
    const q = query || searchInput.value;
    if (!q || q.length < 2) {
        clearSearchResults();
        return;
    }
    
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(results => {
            if (results.length === 0) {
                searchResults.innerHTML = `<p>לא נמצאו תוצאות עבור "${q}"</p>`;
                return;
            }
            
            searchResults.innerHTML = `
                <div class="cards-grid">
                    ${results.map(d => `
                        <div class="card hover-card">
                            <h3>${d.title || d.book + ' ' + d.chapter + ':' + d.verse}</h3>
                            <p>${d.content}</p>
                            <small>${d.user_name} | ⭐ ${d.rating}</small>
                        </div>
                    `).join('')}
                </div>
            `;
        });
}

function clearSearchResults() { searchResults.innerHTML = ''; }

// ========== AI Helper (קריאה לשרת) ==========
function showAIHelper() {
    const book = bookSelect.value;
    const chapter = chapterSelect.value;
    const verse = verseSelect.value;
    
    if (!book || !chapter || !verse) {
        alert('⚠️ אנא בחר פסוק לפני השימוש בעוזר AI');
        return;
    }
    
    // מראה למשתמש שאנחנו טוענים...
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:10000;
    `;
    modal.innerHTML = `
        <div class="card" style="max-width:500px; margin:20px; text-align:center;">
            <h2><i class="fas fa-spinner fa-spin"></i> יוצר דבר תורה...</h2>
            <p>אנא המתן בזמן ש-Gemini AI כותב עבורך.</p>
        </div>
    `;
    document.body.appendChild(modal);

    // קריאה לשרת שלנו שיפנה לגוגל
    fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ book: book, chapter: chapter, verse: verse })
    })
    .then(res => res.json())
    .then(data => {
        if(data.error) {
            modal.innerHTML = `
                <div class="card" style="max-width:500px; margin:20px;">
                    <h2><i class="fas fa-exclamation-triangle"></i> שגיאה</h2>
                    <p>${data.error}</p>
                    <button onclick="this.closest('div[style]').remove()" class="btn btn-primary mt-2">סגור</button>
                </div>
            `;
        } else {
             modal.innerHTML = `
                <div class="card" style="max-width:500px; margin:20px; max-height:80vh; overflow-y:auto;">
                    <h2><i class="fas fa-robot"></i> עוזר AI - ${book} ${chapter}:${verse}</h2>
                    <p>${data.ai_dvar_torah.replace(/\n/g, '<br>')}</p>
                    <button onclick="this.closest('div[style]').remove()" class="btn btn-primary mt-2">סגור</button>
                </div>
            `;
        }
    })
    .catch(err => {
        modal.innerHTML = `
                <div class="card" style="max-width:500px; margin:20px;">
                    <h2><i class="fas fa-exclamation-triangle"></i> שגיאת תקשורת</h2>
                    <p>לא הצלחנו להתחבר לשרת.</p>
                    <button onclick="this.closest('div[style]').remove()" class="btn btn-primary mt-2">סגור</button>
                </div>
            `;
    });
}

// ========== Expose to HTML ==========
window.viewVerse = viewVerse;
window.searchDvarim = searchDvarim;
