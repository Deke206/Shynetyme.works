# AGENTS.md — Web Design and Development Operating Rules

## 1. Primary objective

Treat this website as one integrated product and practical sales tool.

The website must:

* Demonstrate completed work.
* Clearly explain services and products.
* Collect qualified leads.
* Support direct outreach, referrals, and repeat customers.
* Preserve working functionality while improvements are made.

Business priorities, in order:

1. Listing services.
2. Website repair and refresh work.
3. Referrals and repeat customers.
4. LED demonstrations and installation jobs.
5. Larger product Project Power and storefront development.

## 2. Source-of-truth hierarchy

Use this hierarchy whenever information conflicts:

1. The current repository and its verified deployment.
2. This AGENTS.md file and repository documentation.
3. The current issue, task, or pull-request requirements.
4. Existing architecture, components, naming conventions, and tests.
5. Conversation history and remembered project context.
6. Assumptions only when verification is impossible.

Repository files and the verified deployment override conversational memory.

Never claim that a file, feature, branch, deployment, or test exists without verifying it.

## 3. Mandatory pre-edit inspection

Before changing any file:

1. Confirm the repository name and remote.
2. Fetch the latest remote state.
3. Confirm the current branch.
4. Inspect the working-tree status.
5. Inspect the latest commit.
6. Inspect recent relevant commits.
7. Locate the authoritative files for the requested feature.
8. Search for existing components, graphics, styles, scripts, and functions that may already solve the requirement.
9. Identify the current build, test, preview, and deployment commands.
10. Record the starting commit SHA as the rollback point.

Required commands where applicable:

```bash
git remote -v
git fetch --all --prune
git status --short --branch
git branch --show-current
git log -1 --oneline --decorate
git diff --stat
git rev-parse HEAD
```

Do not edit until the current state is understood.

If unrelated uncommitted changes are present, stop before overwriting, deleting, resetting, or mixing them into the task.

## 4. Branch and task isolation

Never perform ordinary development directly on `main`.

Create one short-lived branch for one defined change:

```text
fix/descriptive-problem
feat/descriptive-feature
refactor/descriptive-area
docs/descriptive-update
chore/descriptive-maintenance
```

A branch must not combine unrelated fixes, redesigns, dependency changes, and content changes.

Do not begin a second change until the first change is built, tested, reviewed, and recorded.

## 5. Root-cause-first requirement

Do not patch the first visible symptom without investigating its cause.

Use this diagnostic sequence:

1. Reproduce the problem.
2. Record the expected behavior.
3. Record the actual behavior.
4. Identify the earliest point where behavior diverges.
5. Inspect the relevant HTML, CSS, JavaScript, assets, configuration, build output, and recent commits.
6. Determine whether the cause is structural, styling-related, behavioral, data-related, configuration-related, or deployment-related.
7. Make the smallest complete correction at the actual failure point.
8. Test nearby functionality for regression.
9. Document the cause and the evidence supporting the correction.

Do not use speculative edits as diagnosis.

## 6. Existing-file and source-of-truth rule

Edit the authoritative existing implementation.

Do not create replacement files with names such as:

```text
index-new.html
index-final.html
index-fixed.html
styles-new.css
styles-final.css
main-updated.js
component-v2.jsx
page-copy.html
backup-index.html
```

Do not duplicate an existing page, component, stylesheet, script, configuration file, or image merely to avoid understanding the current implementation.

Use Git commits, branches, tags, and pull requests for history and rollback. Do not use duplicate tracked files as a version-control system.

A new file is permitted only when it has a distinct architectural responsibility that does not already exist.

Before creating a file, search for an existing equivalent.

## 7. Integrated website development sequence

Build and repair the website in this order:

1. Establish or verify the site map, routes, and page hierarchy.
2. Establish shared global CSS, typography, spacing, navigation, layout primitives, components, and naming conventions.
3. Establish shared JavaScript and site-wide functionality.
4. Build page structure and semantic content.
5. Connect forms, data, integrations, and interactive behavior.
6. Add page-specific functionality only where it is genuinely unique.
7. Add styling refinement, responsive behavior, transitions, and animation.
8. Build the production version.
9. Run automated checks.
10. Preview the complete affected user flow.
11. Inspect the final diff.
12. Commit the defined change.
13. Open or update the pull request.
14. Merge only after required checks pass.
15. Verify the deployed version.

Do not polish animation while structure or functionality remains broken.

## 8. Shared-foundation rule

Use shared resources wherever practical:

* Shared global stylesheet.
* Shared design tokens or CSS custom properties.
* Shared typography.
* Shared navigation and footer.
* Shared buttons, cards, forms, modals, alerts, and layout components.
* Shared utility functions.
* Shared event handling.
* Shared validation.
* Shared API and storage helpers.

Page-specific CSS or JavaScript is allowed only for genuinely unique functionality, such as a configurator, simulator, editor, or specialized visualization.

Do not copy shared code into multiple pages.

## 9. Preserve approved work

Reuse approved graphics, components, layouts, content, and working code.

Do not regenerate, redraw, rename, relocate, or replace approved assets unless the current task explicitly requires it.

When changing an existing design:

* Preserve its intended visual identity.
* Preserve existing routes and working links.
* Preserve form behavior and collected data.
* Preserve responsive layouts unless the change requires modification.
* Preserve accessibility and keyboard behavior.
* Preserve existing integrations and deployment configuration.

## 10. Package-manager and dependency rule

Use the package manager identified by the existing lockfile.

* `package-lock.json` means npm.
* `pnpm-lock.yaml` means pnpm.
* `yarn.lock` means Yarn.

Never switch package managers or regenerate another package manager’s lockfile without explicit authorization.

Do not upgrade dependencies as a side effect of unrelated work.

Dependency updates require their own branch or must be directly necessary for the requested change.

## 11. Change-size rule

Prefer the smallest complete change that solves the full requirement.

Do not perform unrelated cleanup, renaming, formatting, framework migration, dependency replacement, or architectural refactoring unless it is required to complete the task safely.

A small diff is not automatically correct. It must still address every relevant surface.

## 12. Verification requirements

A task is not complete merely because code was written.

Run every applicable existing project check:

```text
install
format check
lint
typecheck
unit tests
integration tests
end-to-end tests
production build
local preview
accessibility checks
responsive inspection
link and navigation checks
form-submission checks
deployment verification
```

Use the commands already defined by the repository and CI configuration. Do not invent commands without inspecting the project.

When no automated test exists for changed behavior:

1. Perform a documented manual test.
2. State exactly what was tested.
3. State what remains untested.
4. Add an automated regression check when practical.

Do not mark work complete while a relevant test, build, lint, or deployment check is failing.

## 13. Visual and responsive verification

For visible website changes, inspect at minimum:

* Small mobile viewport.
* Large mobile or tablet viewport.
* Desktop viewport.
* Navigation open and closed states.
* Forms and error states.
* Text wrapping.
* Overflow and clipping.
* Images and media.
* Hover, focus, active, disabled, and loading states where applicable.
* Reduced-motion behavior where animation is used.

Compare the implementation against the approved reference, not against memory.

## 14. Pull-request requirement

Every pull request must explain:

* The problem or objective.
* The verified root cause when repairing a defect.
* The authoritative files changed.
* Why each file changed.
* What was deliberately not changed.
* Tests and commands run.
* Manual preview steps performed.
* Screenshots or recordings for visual changes.
* Risks and affected areas.
* Rollback commit or starting SHA.
* Deployment result.

Do not use vague descriptions such as “updated site,” “fixed stuff,” or “made improvements.”

## 15. Commit requirements

Use focused commits with meaningful messages.

Preferred formats:

```text
fix: correct mobile navigation overflow
feat: add lead form validation
refactor: consolidate shared card styles
docs: document deployment verification
chore: update GitHub quality workflow
```

Do not use messages such as:

```text
update
changes
final
fixed
stuff
working version
```

## 16. Rollback protection

Before editing, preserve the starting commit SHA.

Do not use destructive commands such as the following without explicit authorization:

```bash
git reset --hard
git clean -fd
git checkout -- .
git restore .
git push --force
```

Rollback must use a known commit, revert commit, protected branch, or approved deployment rollback.

Never destroy unrelated local work to make the current task easier.

## 17. Completion definition

The work is complete only when all applicable items are true:

* The requested behavior is implemented.
* The root cause is corrected.
* Existing functionality is preserved.
* No duplicate replacement files were created.
* The production build succeeds.
* Required automated checks pass.
* The affected user flow was previewed.
* The final diff contains only relevant changes.
* The change was committed to the task branch.
* A rollback point is recorded.
* The pull request accurately describes the work.
* The protected merge process was followed.
* The deployed result was verified when deployment was requested.

The required operating sequence is:

```text
Pull latest verified version
→ inspect repository and deployment
→ record rollback commit
→ create one task branch
→ make one defined change
→ build
→ test
→ preview
→ inspect diff
→ commit
→ open pull request
→ pass required checks
→ merge
→ deploy
→ verify deployment
```

## 18. Failure reporting

When a required step cannot be completed, report:

1. The exact failed step.
2. The command or operation attempted.
3. The relevant error output.
4. The likely cause supported by evidence.
5. What was successfully completed.
6. What remains incomplete.
7. The safest next action.

Never report an attempted build, test, preview, deployment, or verification as successful unless it actually ran and passed.
