# Rules of Engagement: AI Agents, Antigravity, MCP, Software & Web Design
# Quick Reference & Copy-Paste Deployment Guide

## <span style="color:red">IMPORTANT — DO NOT SKIP: Core Operational Directives & Usage Notes</span>
> [!IMPORTANT]
> **<span style="color:red">PRIORITY DIRECTIVE — THE ANTI-ASSUMPTION PROTOCOL:</span>**
> When encountering ambiguity in any software, web design, or system task, the AI must STOP immediately, engage the user, and ask clear, factual questions rather than making assumptions. Never guess or assume user intent, tools, or configurations.
- **Standalone Usability:** Each document is completely self-contained. You can copy the entire markdown text of any file and paste it directly into prompt instruction boxes without missing dependencies.
- **Single-Spaced Layout:** Every document strictly avoids double spacing and empty blank lines between list items, ensuring minimal token overhead when loaded into system contexts.
- **Code & Stack Dictated by User:** The developer dictates frameworks, libraries, and design choices. Never unilaterally introduce unrequested dependencies.

## 1. Document Index
- `00-engineer-mentor-persona.md`: The Engineer-Mentor Charter & Operational DNA (Encouraging mentor, engineer of the sciences, careful to a fault, 48-hr continuity, hands-on multimodal teaching, double-check rigor).
- `01-antigravity-and-ide-rules.md`: Operational standards for Google Antigravity and Antigravity IDE (Autocomplete, Inline Cmd+I/Ctrl+I, Sidebar Agent, Planning Mode, Sandboxing, Subagents).
- `02-ai-agent-guardrails-and-community-guidelines.md`: Community guidelines and guardrails for autonomous agents (Human-in-the-Loop, anti-hallucination, destructive command gates, prompt injection defense).
- `03-mcp-model-context-protocol-rules.md`: Guardrails for Model Context Protocol (MCP) tool execution, schema compliance, read/write segregation, and secret management.
- `04-computer-operations-and-os-safety-rules.md`: Operating system safety rules, terminal execution boundaries, path escaping, background process governance, and supply chain checks.
- `05-general-ai-use-and-prompting-rules.md`: Authentic team-player persona, 24-hr thread re-engagement summaries, alternative generation, and clear explanation standards.
- `06-software-engineering-and-clarity-rules.md`: Priority Anti-Assumption Mandate (Zero Guesswork Protocol), requirements categorization, dependency gates, and grounded verification.
- `07-web-design-and-ui-clarity-rules.md`: Frontend and web design rules requiring explicit user queries for aesthetics, color palettes, mobile breakpoints, and user-dictated code stacks.

## 2. Platform Copy-Paste Deployment Matrix

Platform | Target Rule Configuration Location | Recommended Documents
:--- | :--- | :---
**Antigravity IDE & Antigravity 2.0** | Save directly to `.agents/rules/` or paste into project root `GEMINI.md` / `AGENTS.md` | `00`, `01`, `02`, `03`, `04`, `06`, `07`
**Google Gemini (Advanced / Gems)** | Open Gem Settings -> **Instructions** / System Prompt field | `00`, `02`, `05`, `06`, `07`
**Anthropic Claude (Projects / Web)** | Open Project -> **Project Knowledge** or **Project Instructions** | `00`, `02`, `05`, `06`, `07` (add `03` for Claude Desktop MCP)
**OpenAI ChatGPT (Custom Instructions)** | Settings -> **Custom Instructions** ("How would you like ChatGPT to respond?") | `00`, `02`, `05`, `06`, `07`
**Cursor / Windsurf** | Paste into `.cursorrules`, `.cursor/rules/*.md`, or `.windsurfrules` | `00`, `01`, `02`, `04`, `06`, `07`
**GitHub Copilot (VS Code / JetBrains)** | Paste into `.github/copilot-instructions.md` | `00`, `02`, `04`, `05`, `06`
