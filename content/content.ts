// Single source of truth for the site, the chat corpus and the 3D labels.
// Rule: the current employer (Set #02) is never named anywhere.

export type Link = { label: string; href: string };

export type BuildStep = {
  title: string;
  detail: string;
};

export type BrickSet = {
  id: string;
  number: string;
  name: string;
  tagline: string;
  context: string;
  flagship?: boolean;
  openSource?: boolean;
  summary: string;
  steps: BuildStep[];
  // The final "does it hold?" step every set ends with.
  check: BuildStep;
  metrics: { value: string; label: string }[];
  parts: string[];
  links?: Link[];
};

export type Role = {
  title: string;
  org: string;
  location: string;
  start: string;
  end: string;
  summary: string;
  sets: string[];
};

export type SkillBin = {
  name: string;
  colour: "red" | "blue" | "yellow" | "green" | "orange" | "purple";
  parts: string[];
};

export const profile = {
  name: "Lokesh Bothra",
  title: "AI Engineer",
  location: "Bangalore, India",
  tagline: "I build AI systems that check their own work.",
  intro:
    "AI engineer building production agentic and RAG systems for enterprise knowledge and scientific computing. " +
    "LangGraph, multi-agent orchestration, hybrid retrieval, LLM evaluation, FastAPI and GCP. " +
    "The common thread in my work: agents that verify their evidence, abstain when unsure, and prove their quality with numbers.",
  email: "lokesh8946891910@gmail.com",
  resume: "/Lokesh_Bothra_Resume.pdf",
  links: {
    github: "https://github.com/lokeshbothra21",
    linkedin: "https://www.linkedin.com/in/lokeshbothra/",
    leetcode: "https://leetcode.com/u/lokesh21bothra/",
  },
} as const;

export const sets: BrickSet[] = [
  {
    id: "aegisops",
    number: "01",
    name: "AegisOps",
    tagline: "Autonomous incident-response agent",
    context: "Open source · in progress",
    flagship: true,
    openSource: true,
    summary:
      "An agent that detects and investigates incidents over real OpenTelemetry data (logs, metrics, traces and change events) " +
      "from a 15-service microservice system, and never acts without a human.",
    steps: [
      {
        title: "Detect",
        detail:
          "Deterministic SQL alert rules over the telemetry store opened an incident 57 s after fault injection in a live test.",
      },
      {
        title: "Triage and plan",
        detail:
          "A 6-node LangGraph investigation (triage, plan, investigate, change correlation, root cause, verification) with structured outputs.",
      },
      {
        title: "Investigate with tools",
        detail:
          "9 read-only telemetry tools exposed over MCP. Tool output is treated as untrusted input to resist prompt injection.",
      },
      {
        title: "Stay on budget",
        detail: "Postgres checkpoints plus hard budgets on tool calls, tokens and time.",
      },
      {
        title: "Human in the loop",
        detail: "Remediation actions can only run after human approval.",
      },
    ],
    check: {
      title: "Verify every claim",
      detail:
        "A deterministic evidence verifier checks every trace, log, metric and change the LLM cites against the telemetry store. " +
        "On the first real run it dropped an invented metric and cut confidence from 0.86 to 0.57.",
    },
    metrics: [
      { value: "57 s", label: "fault to incident" },
      { value: "0.86 → 0.57", label: "confidence after catching a hallucinated metric" },
      { value: "109", label: "tests, 95% coverage" },
    ],
    parts: [
      "LangGraph",
      "MCP",
      "OpenTelemetry",
      "PostgreSQL",
      "Python",
      "Cloud Run",
      "Workload Identity Federation",
      "CodeQL",
    ],
    links: [{ label: "GitHub", href: "https://github.com/lokeshbothra21/aegisops" }],
  },
  {
    id: "literature-rag",
    number: "02",
    name: "Scientific Literature RAG",
    tagline: "Question answering over research PDFs",
    context: "Production platform · current role",
    summary:
      "A multi-user platform for asking questions of uploaded scientific papers. I took ownership of it and redesigned the pipeline end to end.",
    steps: [
      {
        title: "Chunk by structure",
        detail: "Structure-aware PDF chunking built for scientific documents.",
      },
      {
        title: "Retrieve two ways",
        detail: "Hybrid BM25 + FAISS search with Gemini embedding-001, then BGE cross-encoder reranking.",
      },
      {
        title: "Decompose the question",
        detail:
          "LangGraph (DeepAgents) pipeline with sub-question decomposition, iterative evidence retrieval and prompt-injection isolation.",
      },
      {
        title: "Keep indexes live",
        detail:
          "SQLAlchemy metadata with dynamically synchronised FAISS/BM25 indexes: per-user document isolation and hot updates without restarts.",
      },
      {
        title: "Harden for production",
        detail: "API-key auth, SSE streaming, LLM retry and rate limiting, usage analytics and automated tests.",
      },
    ],
    check: {
      title: "Abstain and measure",
      detail:
        "Confidence-based abstention instead of guessing, plus an end-to-end RAGAS evaluation framework with custom retrieval metrics " +
        "tracking faithfulness, relevancy, retrieval quality and answer correctness.",
    },
    metrics: [
      { value: "0.68 → 0.79", label: "RAGAS answer correctness" },
      { value: "0.54 → 0.64", label: "context precision" },
    ],
    parts: ["LangGraph", "DeepAgents", "FastAPI", "Gemini", "FAISS", "BM25", "BGE reranker", "RAGAS", "SQLAlchemy", "SSE"],
  },
  {
    id: "sports-analytics",
    number: "03",
    name: "AI Sports Analytics",
    tagline: "Ask your data in plain English, get charts back",
    context: "HashInclude Computech",
    summary:
      "Backend for a generative-AI sports analytics platform where coaches and analysts query large sports datasets in natural language.",
    steps: [
      {
        title: "Text to SQL",
        detail: "Agents built on Google Agent ADK and Gemini 2.5 Pro turn questions into complex BigQuery SQL.",
      },
      {
        title: "Tools over MCP",
        detail: "Model Context Protocol tools give agents real-time BigQuery access.",
      },
      {
        title: "See beyond text",
        detail: "Multimodal RAG with Docling and Gemini Vision reads charts, tables and screenshots.",
      },
      {
        title: "Sandboxed charts",
        detail:
          "AI-generated Python runs in a constrained Docker sandbox (llm-sandbox) and streams interactive Plotly charts over SSE.",
      },
      {
        title: "Lock it down",
        detail:
          "RBAC with Azure AD (Entra ID) and SQLAlchemy maps user groups to BigQuery datasets, isolating coaches from data scientists.",
      },
    ],
    check: {
      title: "Validate and self-correct",
      detail:
        "Automated SQL validation and self-correction loops before results reach the user, plus OpenTelemetry tracing and Cloud Build CI/CD.",
    },
    metrics: [
      { value: "95%+", label: "query accuracy" },
      { value: "30%", label: "less DB overhead from short-TTL permission caching" },
    ],
    parts: ["Google Agent ADK", "Gemini 2.5 Pro", "MCP", "BigQuery", "Docling", "Docker sandbox", "Plotly", "Azure AD", "OpenTelemetry"],
  },
  {
    id: "rally",
    number: "04",
    name: "Rally",
    tagline: "AI-powered enterprise assistant",
    context: "HashInclude Computech",
    summary: "A document-centric RAG assistant for retrieving knowledge from large internal document collections and email.",
    steps: [
      {
        title: "Ingest without blocking",
        detail: "A document server on Docling and Celery for asynchronous ingestion and indexing of very large files.",
      },
      {
        title: "Sync only what changed",
        detail: "Delta-based email sync with the Microsoft Graph API to automate inbox processing.",
      },
      {
        title: "Retrieve fast",
        detail: "Vector retrieval on PostgreSQL (pgvector) with Redis for relevance and latency.",
      },
    ],
    check: {
      title: "Measure the win",
      detail: "Email handling time dropped by 40% once inbox processing was automated.",
    },
    metrics: [{ value: "40%", label: "less email handling time" }],
    parts: ["Docling", "Celery", "pgvector", "Redis", "Microsoft Graph API", "FastAPI"],
  },
];

export const experience: Role[] = [
  {
    title: "Software Developer",
    org: "AI company in scientific computing",
    location: "Bangalore, India",
    start: "Apr 2026",
    end: "Present",
    summary:
      "Own a production scientific-literature RAG platform and build LangGraph multi-agent systems for scientific workflows.",
    sets: ["literature-rag"],
  },
  {
    title: "Software Engineer",
    org: "HashInclude Computech Pvt Ltd",
    location: "Bangalore, India",
    start: "Apr 2024",
    end: "Mar 2026",
    summary: "Built the backends for a generative-AI sports analytics platform and an enterprise RAG assistant.",
    sets: ["sports-analytics", "rally"],
  },
];

export const origin = {
  title: "How it started",
  period: "2017 – 2023",
  org: "Trading & operations, family business",
  location: "Bikaner, India",
  story:
    "My first builds were Excel tools on a trading desk: tracking portfolio performance and generating client reports automatically, " +
    "while running daily equity trading operations, client transactions and KYC documentation. " +
    "In 2023–24 I did PG-DAC at CDAC, and I have been building AI systems professionally since 2024.",
};

export const skills: SkillBin[] = [
  {
    name: "AI Systems",
    colour: "red",
    parts: ["Agentic AI", "RAG", "Multimodal RAG", "LangGraph", "DeepAgents", "MCP", "Hybrid retrieval", "LLM evaluation (RAGAS)", "Prompt engineering"],
  },
  { name: "Languages", colour: "yellow", parts: ["Python"] },
  {
    name: "Frameworks",
    colour: "blue",
    parts: ["FastAPI", "LangChain", "SQLAlchemy", "Celery", "Google Agent ADK", "Flask"],
  },
  { name: "Databases", colour: "green", parts: ["PostgreSQL", "MySQL", "Redis", "BigQuery"] },
  { name: "Vector databases", colour: "purple", parts: ["FAISS", "ChromaDB", "pgvector"] },
  {
    name: "Cloud & DevOps",
    colour: "orange",
    parts: ["GCP", "Docker", "Kubernetes", "Cloud Run", "Cloud Build", "Cloud SQL", "OpenTelemetry", "GitHub Actions", "Nginx"],
  },
];

export const certifications = [
  { name: "Google Professional Cloud Architect", issuer: "Google Cloud", year: "2026" },
  { name: "Microsoft Certified: Azure AI Engineer Associate", issuer: "Microsoft", year: "2026" },
  { name: "Google Associate Cloud Engineer", issuer: "Google Cloud", year: "2025" },
];

export const education = [
  { name: "PG-DAC", school: "CDAC (IACSD), Pune", years: "2023 – 2024", note: "" },
  { name: "B.Tech in Information Technology", school: "Govt. College of Engineering, Bikaner", years: "2013 – 2017", note: "70% with Honours" },
];
