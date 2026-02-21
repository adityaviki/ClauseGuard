# ClauseGuard

Multi-agent legal contract review system powered by Claude AI, Elasticsearch, and React.

ClauseGuard ingests legal contracts (PDF/TXT), extracts clauses using AI, indexes them for hybrid semantic+lexical search, and compares each clause against company-approved templates to produce compliance risk reports.

## Architecture

```
                         ┌──────────────────────────────┐
                         │        React Frontend         │
                         │   Vite + TypeScript + shadcn  │
                         │        localhost:5173          │
                         └──────────────┬───────────────┘
                                        │ /api/v1 (proxy)
                                        ▼
                         ┌──────────────────────────────┐
                         │       FastAPI Backend          │
                         │        localhost:8000          │
                         ├──────────────────────────────┤
                         │                              │
                         │   ┌────────────────────┐     │
                         │   │  Ingestion Agent    │     │
                         │   │  Parse → Extract →  │     │
                         │   │  Embed → Index      │     │
                         │   └────────────────────┘     │
                         │                              │
                         │   ┌────────────────────┐     │
                         │   │  Search Agent       │     │
                         │   │  BM25 + kNN → RRF   │     │
                         │   └────────────────────┘     │
                         │                              │
                         │   ┌────────────────────┐     │
                         │   │  Review Agent       │     │
                         │   │  Compare clauses    │     │
                         │   │  to templates →     │     │
                         │   │  Risk report        │     │
                         │   └────────────────────┘     │
                         │                              │
                         └──────┬──────────┬────────────┘
                                │          │
                    ┌───────────▼──┐  ┌────▼──────────┐
                    │ Elasticsearch │  │  Claude API   │
                    │   8.16.0     │  │  (Anthropic)  │
                    │  :9200       │  │               │
                    └──────────────┘  └───────────────┘
```

### Multi-Agent Pipeline

**1. Ingestion Agent** — triggered on file upload

- PDFService parses the uploaded file into raw text + page count
- ClaudeService extracts structured clauses (type, text, section, page, offsets, confidence)
- EmbeddingService encodes each clause into a 384-dim vector (all-MiniLM-L6-v2)
- ElasticsearchService indexes contract metadata and bulk-indexes clauses with embeddings

**2. Search Agent** — triggered on search queries

- Encodes the query string into a vector
- Executes two parallel Elasticsearch searches:
  - **BM25** (lexical) on clause text
  - **kNN** (semantic) on clause embeddings
- Combines results using **Reciprocal Rank Fusion (RRF)** with rank constant 60
- Returns ranked hits with highlights

**3. Review Agent** — triggered on compliance review request

- Fetches all clauses for a contract and groups them by type
- **Parallelizes** clause-to-template comparisons (ThreadPoolExecutor, 2 workers):
  - Claude compares each clause against the approved template
  - Returns severity, deviation, risk, recommendation, confidence
- Detects missing required clauses and creates HIGH severity findings
- Generates an executive summary and overall risk score (0-10) via Claude
- Returns a full RiskReport with findings, coverage map, and severity counts

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, lucide-react |
| Backend | Python 3.12+, FastAPI, Pydantic, async/await |
| AI/LLM | Anthropic Claude (claude-sonnet-4-20250514) |
| Embeddings | Sentence Transformers (all-MiniLM-L6-v2, 384 dims) |
| Search/Storage | Elasticsearch 8.16 (hybrid BM25 + kNN) |
| PDF Parsing | PyMuPDF |

## Project Structure

```
ClauseGuard/
├── pyproject.toml                   # Python project config
├── docker-compose.yml               # Elasticsearch container
├── clauseguard/                     # Backend package
│   ├── main.py                      # FastAPI app, lifespan, CORS
│   ├── config.py                    # Pydantic settings (env vars)
│   ├── agents/
│   │   ├── ingestion.py             # Parse → extract → embed → index
│   │   ├── search.py                # Hybrid BM25 + kNN search
│   │   └── review.py                # Clause-to-template compliance review
│   ├── services/
│   │   ├── pdf_service.py           # PDF/TXT parsing (PyMuPDF)
│   │   ├── claude_service.py        # Claude API calls with retry logic
│   │   ├── embedding_service.py     # Sentence transformer encoding
│   │   └── elasticsearch_service.py # Index management, search, bulk ops
│   ├── models/
│   │   ├── clause.py                # ExtractedClause, ClauseType enum
│   │   ├── contract.py              # ContractMetadata, ContractUploadResponse
│   │   ├── report.py                # RiskReport, Finding, Severity enum
│   │   ├── search.py                # SearchRequest, SearchResponse, SearchHit
│   │   └── template.py              # ClauseTemplate
│   ├── templates/
│   │   └── defaults.py              # 8 company-approved clause templates
│   └── api/
│       ├── router.py                # API router (/api/v1 prefix)
│       ├── contracts.py             # Upload, list, get, get-clauses endpoints
│       ├── search.py                # Hybrid search endpoint
│       ├── review.py                # Compliance review endpoint
│       └── deps.py                  # Dependency injection from app.state
└── frontend/                        # React frontend
    ├── package.json
    ├── vite.config.ts               # Proxy, path aliases, Tailwind plugin
    ├── components.json              # shadcn/ui config
    └── src/
        ├── main.tsx                 # BrowserRouter + app render
        ├── App.tsx                  # Route definitions
        ├── index.css                # Tailwind + shadcn CSS variables
        ├── types/api.ts             # TypeScript interfaces (mirrors backend)
        ├── lib/
        │   ├── api.ts               # Fetch-based API client
        │   ├── constants.ts         # Labels, colors, risk helpers
        │   └── utils.ts             # cn() utility
        ├── components/
        │   ├── ui/                  # shadcn components (button, card, tabs, etc.)
        │   ├── layout/
        │   │   ├── Layout.tsx       # Sidebar + content + mobile sheet
        │   │   ├── Sidebar.tsx      # Navigation links
        │   │   └── ThemeToggle.tsx   # Dark/light/system toggle
        │   ├── DropZone.tsx         # Drag-and-drop file upload
        │   ├── RiskGauge.tsx        # SVG circular risk score (0-10)
        │   ├── CoverageMap.tsx      # Clause type coverage grid
        │   └── FindingCard.tsx      # Finding with severity, risk, recommendation
        └── pages/
            ├── Dashboard.tsx        # Stats + contracts table
            ├── Upload.tsx           # File upload + success state
            ├── ContractDetail.tsx   # Metadata + clause tabs
            ├── Search.tsx           # Search bar + filters + results
            └── Review.tsx           # Full compliance risk report
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- Docker (for Elasticsearch)
- Anthropic API key

### 1. Start Elasticsearch

```bash
docker compose up -d
```

Wait for Elasticsearch to be healthy:

```bash
curl http://localhost:9200/_cluster/health
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-...
ELASTICSEARCH_URL=http://localhost:9200
EMBEDDING_MODEL=all-MiniLM-L6-v2
CLAUDE_MODEL=claude-sonnet-4-20250514
```

### 3. Install and Run Backend

```bash
pip install -e .
clauseguard
```

The backend starts at `http://localhost:8000`. On first startup it:
- Loads the sentence transformer model (~80MB download)
- Connects to Elasticsearch and creates indices
- Initializes all three agents

### 4. Install and Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173` and proxies API calls to the backend.

## API Endpoints

All endpoints are under `/api/v1`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/contracts/upload` | Upload a contract (multipart/form-data) |
| `GET` | `/contracts/` | List all contracts |
| `GET` | `/contracts/{id}` | Get contract metadata |
| `GET` | `/contracts/{id}/clauses` | Get extracted clauses |
| `POST` | `/search/` | Hybrid semantic + lexical search |
| `POST` | `/review/{id}` | Run compliance review |

### Upload Contract

```bash
curl -X POST http://localhost:8000/api/v1/contracts/upload \
  -F "file=@contract.pdf"
```

Response:
```json
{
  "contract_id": "uuid",
  "filename": "contract.pdf",
  "num_clauses": 12,
  "clause_types_found": ["indemnity", "termination", "confidentiality"],
  "message": "Contract ingested successfully"
}
```

### Search Clauses

```bash
curl -X POST http://localhost:8000/api/v1/search/ \
  -H "Content-Type: application/json" \
  -d '{"query": "limitation of liability", "top_k": 5}'
```

### Run Compliance Review

```bash
curl -X POST http://localhost:8000/api/v1/review/{contract_id}
```

Response includes:
- `overall_risk_score` (0.0-10.0)
- `summary` (executive summary)
- `findings[]` (each with severity, deviation, risk, recommendation)
- `coverage` (which clause types are present)
- `missing_required_clauses` (required types not found)

## Clause Types

ClauseGuard recognizes 9 clause types. 6 are **required** in the default compliance templates:

| Clause Type | Required | Description |
|-------------|----------|-------------|
| Indemnity | Yes | Mutual indemnification covering breach, negligence, attorneys' fees |
| Liability Cap | Yes | Aggregate cap tied to 12-month fees, consequential damage exclusion |
| Termination | Yes | For convenience (30-day notice) and for cause (with cure period) |
| Confidentiality | Yes | Mutual NDA with 3-year survival, third-party restrictions |
| Governing Law | Yes | Jurisdiction, exclusive venue, consent to personal jurisdiction |
| Data Protection | Yes | GDPR/CCPA compliance, DPA requirement, security measures |
| IP Assignment | No | Work product ownership, pre-existing IP carve-outs |
| Force Majeure | No | Excused performance, notice requirement, 60-day termination right |
| Other | — | Catch-all for unclassified clauses |

## Frontend Pages

**Dashboard** (`/`) — Stats cards showing total contracts, clauses, types, and pages analyzed. Contracts table with type badges and quick View/Review actions.

**Upload** (`/upload`) — Drag-and-drop zone accepting PDF and TXT files. Shows upload progress, then success card with extracted clause count and types.

**Contract Detail** (`/contracts/:id`) — Contract metadata header with clause count and types. Tabs for each clause type, with expandable clause cards showing text, section/page info, and confidence bars.

**Search** (`/search`) — Search input with clause type filter badges and top-k selector. Results show scored clause cards with highlights and links to source contracts.

**Review** (`/contracts/:id/review`) — Full compliance risk report featuring:
- Circular risk gauge (color-coded: green/yellow/orange/red)
- Executive summary
- Severity breakdown cards (HIGH/MEDIUM/LOW counts)
- Clause coverage map (8 types with present/missing indicators)
- Findings organized by severity tabs, each with deviation analysis, risk assessment, clause text, template reference, and recommendation

## How Search Works

ClauseGuard uses **hybrid search** combining two approaches:

1. **BM25 (Lexical)** — Traditional full-text search on clause text. Good for exact keyword matches.
2. **kNN (Semantic)** — Cosine similarity search on 384-dim sentence embeddings. Good for meaning-based matches even when wording differs.

Results are combined using **Reciprocal Rank Fusion (RRF)**:

```
RRF_score = Σ 1 / (k + rank_i)
```

where `k=60` is the rank constant. This produces a single ranked list that benefits from both lexical precision and semantic recall.

## How Review Works

The compliance review compares each extracted clause against a company-approved template:

1. **Match** — Each clause is paired with its corresponding template by clause type
2. **Compare** — Claude analyzes the deviation between the actual clause and the template, considering the template's key requirements
3. **Score** — Each finding receives a severity (HIGH/MEDIUM/LOW/INFO) and confidence score
4. **Coverage** — The system checks which of the 8 clause types are present and flags missing required clauses as HIGH severity
5. **Summarize** — Claude generates an executive summary and an overall risk score (0-10)

## Configuration

All settings are configured via environment variables (or `.env` file):

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Anthropic API key (required) |
| `ELASTICSEARCH_URL` | `http://localhost:9200` | Elasticsearch endpoint |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence transformer model |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | Claude model for extraction and review |
| `ES_CONTRACTS_INDEX` | `clauseguard-contracts` | ES index for contract metadata |
| `ES_CLAUSES_INDEX` | `clauseguard-clauses` | ES index for clause data + embeddings |

## License

MIT
