# Software Engineering & User Clarity Rules of Engagement

## 1. <span style="color:red">PRIORITY DIRECTIVE: The Anti-Assumption Mandate (Zero Guesswork Protocol)</span>
> [!IMPORTANT]
> **<span style="color:red">MANDATORY PRIORITY DIRECTIVE FOR ALL AGENTS AND MCP TOOLS — DO NOT SKIP THIS ENTIRE SECTION.</span>**
> Assumptions are strictly prohibited. You must query the user for factual clarification rather than guessing.

- **<span style="color:red">STOP AND QUERY (DO NOT SKIP — PRIORITY DIRECTIVE):</span>** Never assume ambiguous, missing, or underspecified requirements. If a task description leaves room for multiple architectural interpretations, halt immediately and query the user for factual clarification before writing code.
- Prevent Assumption Traps: Making silent assumptions leads to wasted work, broken builds, architectural divergence, and frustration. When in doubt, formulate 2-3 concise, specific questions with concrete options for the user to choose from.
- Factual Alignment First: Distinguish between verified repository facts and assumptions. If a file path, database field, API contract, or library version is not directly verifiable in the repository, ask the user rather than guessing.
- Explicit Decision Gates: Obtain user confirmation before selecting third-party libraries, changing database schemas, modifying public API contracts, or replacing existing algorithms.

## 2. Requirements Discovery & Change Classification
- Scope Categorization: Classify each user request into one of three distinct types before proceeding:
  - Bug Fix: Resolve defect strictly within existing architectural patterns without introducing new features or refactoring unrelated lines.
  - Feature Addition: Introduce new capability while maintaining complete backward compatibility with existing code and tests.
  - Refactoring: Improve internal structure without modifying external runtime behavior or public API contracts.
- Intent Verification: If a user command appears to combine a bug fix with a major architectural overhaul, query the user to confirm whether they want a minimal targeted fix or a full system refactor.
- Dependency Addition Gate: Never add new entries to `package.json`, `build.gradle.kts`, `requirements.txt`, or `Cargo.toml` without verifying the requirement with the user and checking supply-chain legitimacy.

## 3. Engineering Rigor & Code Integrity
- Inspect Before Editing: Thoroughly examine existing architecture, naming conventions, and file dependencies before modifying any code.
- Minimal Blast Radius: Confine edits strictly to the smallest coherent set of lines and files necessary to fulfill the user's objective.
- Zero Placeholder Policy: Never emit lazy placeholders, stubs, or truncated comments (e.g., `// ... rest of code unchanged ...`). Always deliver complete, production-ready, runnable code.
- Preserve Contextual Artifacts: Preserve all existing code comments, docstrings, licensing notices, and formatting conventions present in untouched sections of files.
- Root-Cause Resolution: Fix underlying defects diagnosed by compilers, linters, or test suites. Never apply suppression pragmas (`@ts-ignore`, `# noqa`, `@SuppressWarnings`) without user consent.

## 4. Verification, Testing & Grounded Truth
- Grounded Confirmation: Never claim code compiles, tests pass, or bugs are fixed unless verified through live command outputs or deterministic static analysis.
- Multi-Tier Validation: Validate code through syntax checks, strict type compilation, linting passes, and automated unit tests.
- Reversible Checkpoints: Ensure version control commits or staging checkpoints exist before executing complex multi-file modifications so the user can revert instantly if needed.
- Clear Completion Reporting: Report exactly what files were inspected, what lines were changed, how the changes were verified, and any remaining open decisions.
