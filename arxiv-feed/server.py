#!/usr/bin/env python3
"""
ArXiv Feed - Instagram-style paper discovery app.
Python backend that proxies arXiv API and serves static files.
"""

import http.server
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path
import os
import re

PORT = 8000
ARXIV_API = "http://export.arxiv.org/api/query"
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

CATEGORIES = {
    "cs.AI": "Artificial Intelligence",
    "cs.CL": "Computation & Language",
    "cs.CV": "Computer Vision",
    "cs.LG": "Machine Learning",
    "cs.NE": "Neural & Evolutionary",
    "cs.RO": "Robotics",
    "cs.SE": "Software Engineering",
    "cs.DS": "Data Structures",
    "cs.CR": "Cryptography",
    "cs.DB": "Databases",
    "stat.ML": "Statistical ML",
    "math.OC": "Optimization",
    "eess.SP": "Signal Processing",
    "physics.comp-ph": "Computational Physics",
    "q-bio.NC": "Neuroscience",
}

NS = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}


def parse_arxiv_response(xml_text):
    """Parse arXiv Atom XML into list of paper dicts."""
    papers = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return papers

    for entry in root.findall("atom:entry", NS):
        paper_id_url = entry.find("atom:id", NS)
        if paper_id_url is None:
            continue
        paper_id = paper_id_url.text.strip().split("/abs/")[-1]

        title_el = entry.find("atom:title", NS)
        title = title_el.text.strip().replace("\n", " ") if title_el is not None else ""
        title = re.sub(r"\s+", " ", title)

        summary_el = entry.find("atom:summary", NS)
        abstract = summary_el.text.strip().replace("\n", " ") if summary_el is not None else ""
        abstract = re.sub(r"\s+", " ", abstract)

        authors = []
        for author_el in entry.findall("atom:author", NS):
            name_el = author_el.find("atom:name", NS)
            if name_el is not None:
                authors.append(name_el.text.strip())

        categories = []
        for cat_el in entry.findall("atom:category", NS):
            term = cat_el.get("term", "")
            if term:
                categories.append(term)

        published_el = entry.find("atom:published", NS)
        published = published_el.text.strip() if published_el is not None else ""

        pdf_link = ""
        for link_el in entry.findall("atom:link", NS):
            if link_el.get("title") == "pdf":
                pdf_link = link_el.get("href", "")

        # Strip version suffix for ar5iv thumbnail URL
        base_id = re.sub(r'v\d+$', '', paper_id)

        papers.append({
            "id": paper_id,
            "title": title,
            "authors": authors,
            "abstract": abstract,
            "categories": categories,
            "published": published,
            "url": f"https://arxiv.org/abs/{paper_id}",
            "pdf_url": pdf_link or f"https://arxiv.org/pdf/{paper_id}",
            "thumbnail_url": f"https://ar5iv.labs.arxiv.org/html/{base_id}/assets/x1.png",
        })

    return papers


def fetch_arxiv(query="", category="", start=0, max_results=20):
    """Fetch papers from arXiv API."""
    search_parts = []
    if query:
        search_parts.append(f"all:{query}")
    if category:
        search_parts.append(f"cat:{category}")

    search_query = " AND ".join(search_parts) if search_parts else "cat:cs.AI"

    params = urllib.parse.urlencode({
        "search_query": search_query,
        "start": start,
        "max_results": max_results,
        "sortBy": "lastUpdatedDate",
        "sortOrder": "descending",
    })

    url = f"{ARXIV_API}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "ArxivFeed/1.0"})

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            xml_text = resp.read().decode("utf-8")
        return parse_arxiv_response(xml_text)
    except Exception as e:
        print(f"arXiv API error: {e}")
        return []


def fetch_recommendations(liked_categories, liked_keywords, max_results=20):
    """Fetch recommended papers based on liked categories and keywords."""
    papers = []

    # 60% from liked categories
    if liked_categories:
        cat_count = max(1, int(max_results * 0.6))
        cats = liked_categories[:5]
        per_cat = max(1, cat_count // len(cats))
        for cat in cats:
            papers.extend(fetch_arxiv(category=cat, max_results=per_cat))

    # 40% from keywords
    if liked_keywords:
        kw_count = max(1, int(max_results * 0.4))
        keywords = liked_keywords[:3]
        per_kw = max(1, kw_count // len(keywords))
        for kw in keywords:
            papers.extend(fetch_arxiv(query=kw, max_results=per_kw))

    # Fallback if no likes yet
    if not papers:
        papers = fetch_arxiv(category="cs.AI", max_results=max_results)

    # Deduplicate
    seen = set()
    unique = []
    for p in papers:
        if p["id"] not in seen:
            seen.add(p["id"])
            unique.append(p)

    return unique[:max_results]


class ArxivHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler for API routes and static files."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        if path == "/api/papers":
            self.handle_papers(params)
        elif path == "/api/recommend":
            self.handle_recommend(params)
        elif path == "/api/categories":
            self.handle_categories()
        else:
            # Serve static files, default to index.html
            if path == "/" or not (STATIC_DIR / path.lstrip("/")).exists():
                self.path = "/index.html"
            super().do_GET()

    def handle_papers(self, params):
        query = params.get("query", [""])[0]
        category = params.get("category", [""])[0]
        start = int(params.get("start", ["0"])[0])
        max_results = int(params.get("max_results", ["20"])[0])

        papers = fetch_arxiv(query=query, category=category, start=start, max_results=max_results)
        self.send_json(papers)

    def handle_recommend(self, params):
        categories_str = params.get("categories", [""])[0]
        keywords_str = params.get("keywords", [""])[0]
        max_results = int(params.get("max_results", ["20"])[0])

        categories = [c.strip() for c in categories_str.split(",") if c.strip()]
        keywords = [k.strip() for k in keywords_str.split(",") if k.strip()]

        papers = fetch_recommendations(categories, keywords, max_results)
        self.send_json(papers)

    def handle_categories(self):
        self.send_json(CATEGORIES)

    def send_json(self, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        # Quieter logging
        if "/api/" in str(args[0]) if args else False:
            print(f"  API: {args[0]}")


if __name__ == "__main__":
    print(f"\n{'='*50}")
    print(f"  ArXiv Feed - Paper Discovery")
    print(f"  http://localhost:{PORT}")
    print(f"{'='*50}\n")

    server = http.server.HTTPServer(("", PORT), ArxivHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
