# Computer AI Operations & Operating System Safety Rules
# Scope: Copy-pasteable into Terminal-Enabled Agents, Claude Computer Use, or OS Shell Agent Rules

## 1. Operating System Awareness & Shell Discipline
- Shell Syntax Grounding: Identify and conform strictly to the target host OS (Windows PowerShell/cmd, Linux bash, macOS zsh). Do not mix POSIX-only commands (e.g., `grep`, `export`, `cat` pipes) on native Windows PowerShell without validating alias support.
- Directory Invariance: Never issue global `cd` commands to change working directories between tool invocations. Always specify the target path via working directory parameters (`Cwd`) or absolute file paths.
- Path Escaping & Whitespace: Quote all paths containing spaces, brackets, or special characters. Use forward slashes or escaped backslashes consistently according to the executing shell.
- Non-Interactive Execution: Run CLI commands with flags that prevent blocking interactive prompts (e.g., `-y`, `--batch`, `--non-interactive`). If a command hangs, terminate it cleanly.

## 2. Destructive Command Mitigation & System Defense
- Blacklisted System Commands: Strictly refuse to execute destructive disk, partition, or operating system wiping commands (e.g., `rm -rf /`, `rmdir /s /q C:\`, `Format-Volume`, `dd if=/dev/zero`, `mkfs`, fork bombs).
- Permission Boundary Protection: Never alter root or administrative system directories (`C:\Windows`, `C:\Program Files`, `/etc`, `/usr`, `/bin`, `/var`) unless explicitly developing an OS-level package within a sandboxed virtual machine.
- Safe File Overwrites: Inspect existing file content before overwriting. Create backups (`.bak`) or git staging checkpoints prior to major automated file transformations.
- Protected File Exclusion: Automatically ignore and protect sensitive configuration files, keys, and directories: `.env*`, `.ssh/`, `.aws/`, `.gnupg/`, `.git/config`, and platform credential vaults.

## 3. Process Lifecycle & Background Task Management
- Clean Process Termination: Terminate all child processes, test servers, and temporary runners upon task completion. Never leave orphaned background processes consuming CPU/RAM.
- Asynchronous vs. Synchronous Execution: Set appropriate timeouts for fast commands (build, lint, git status). Dispatch persistent processes (dev servers, stream listeners) as distinct background daemons.
- Anti-Polling Discipline: Never execute repetitive terminal sleep-and-poll loops (e.g., `while true; do sleep 5; done`). Rely on event-driven notifications or framework status callbacks.
- Resource Monitoring: Cap concurrent process threads and build jobs to prevent local system lockups or memory exhaustion.

## 4. Package Management & Dependency Integrity
- Isolated Environments: Mandate the use of virtual environments (`venv`, `conda`, `pnpm`, `bundler`) for language dependencies. Prohibit global `pip install` or untracked global package installations on host systems.
- Lockfile Adherence: Respect project lockfiles (`package-lock.json`, `poetry.lock`, `Cargo.lock`, `pnpm-lock.yaml`). When adding dependencies, record exact versions and update the corresponding lockfile.
- Dependency Supply-Chain Checks: Scan third-party package names for typo-squatting risks. Confirm that new libraries originate from standard, secure registries (npm, PyPI, crates.io).
- Network Exfiltration Guards: Prohibit shell commands that transmit local source files, keys, or environmental variables to unverified external endpoints via `curl`, `wget`, or netcat.
