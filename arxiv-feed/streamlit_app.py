"""
ArXiv Feed - Instagram-style Paper Discovery
Hosted on Streamlit in Snowflake
"""
import streamlit as st
import json
from pathlib import Path

st.set_page_config(
    page_title="ArXiv Feed",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Hide Streamlit chrome for immersive experience
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    header {visibility: hidden;}
    footer {visibility: hidden;}
    .block-container {padding: 0 !important; max-width: 100% !important;}
    [data-testid="stAppViewContainer"] {padding: 0 !important;}
    .stApp {background: #000 !important;}
    iframe {border: none !important;}
</style>
""", unsafe_allow_html=True)

# Load pre-fetched papers
@st.cache_data
def load_papers():
    data_path = Path(__file__).parent / "papers_data.json"
    with open(data_path) as f:
        return json.load(f)

papers = load_papers()
papers_json = json.dumps(papers)

# Read CSS and JS
css_path = Path(__file__).parent / "static" / "styles.css"
js_path = Path(__file__).parent / "static" / "app.js"

with open(css_path) as f:
    css_content = f.read()

with open(js_path) as f:
    js_content = f.read()

# Build the full HTML page with embedded data
html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
{css_content}
    </style>
</head>
<body>
    <!-- Top Header -->
    <header class="top-header">
        <div class="header-content">
            <h1 class="logo">arxiv<span class="logo-accent">feed</span></h1>
            <div class="header-actions">
                <button id="refresh-btn" class="icon-btn" title="Refresh">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 4v6h-6M1 20v-6h6"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                </button>
            </div>
        </div>
    </header>

    <!-- Story-style Category Bar -->
    <div class="story-bar">
        <div class="story-scroll" id="story-scroll"></div>
    </div>

    <!-- Main Content -->
    <main class="main-content">
        <div class="feed-toggle">
            <button class="toggle-btn active" data-feed="foryou">For You</button>
            <button class="toggle-btn" data-feed="latest">Latest</button>
            <button class="toggle-btn" data-feed="explore">Explore</button>
        </div>

        <div class="feed-grid" id="feed-grid"></div>

        <div class="loading-container hidden" id="loading">
            <div class="skeleton-grid">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            </div>
        </div>

        <div id="load-more-trigger" class="load-more-trigger"></div>
    </main>

    <!-- Paper Detail Modal -->
    <div class="modal-overlay" id="paper-modal">
        <div class="modal-content">
            <button class="modal-close" id="modal-close">&times;</button>
            <div class="modal-body" id="modal-body"></div>
        </div>
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
        <button class="nav-btn active" data-page="home" title="Home">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z"/>
            </svg>
            <span>Home</span>
        </button>
        <button class="nav-btn" data-page="search" title="Search">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
            </svg>
            <span>Search</span>
        </button>
        <button class="nav-btn" data-page="liked" title="Liked">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>Liked</span>
        </button>
    </nav>

    <!-- Search Overlay -->
    <div class="search-overlay" id="search-overlay">
        <div class="search-header">
            <div class="search-input-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                </svg>
                <input type="text" id="search-input" placeholder="Search papers, authors, topics..." autocomplete="off">
            </div>
            <button id="search-cancel" class="search-cancel">Cancel</button>
        </div>
        <div class="search-results" id="search-results"></div>
    </div>

    <script>
    // Inject pre-fetched papers data
    const PRELOADED_PAPERS = {papers_json};
    </script>
    <script>
{js_content}
    </script>
</body>
</html>
"""

# Render the full-page HTML component
st.components.v1.html(html_content, height=900, scrolling=True)
