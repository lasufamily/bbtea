## Automatic pushes to main

- After completing each requested change, run the relevant project checks, commit the completed changes, and push them to `main` automatically without asking for confirmation. This also applies to changes to these instructions.
- Complete the required final Humanizer review of any website copy added or changed before pushing. Resolve relevant check failures before pushing.
- Include only changes belonging to the current request or explicitly continued work; preserve unrelated local changes. Do not force-push or overwrite other work.
- Verify the remote `main` commit after pushing. If pushing triggers a deployment, verify its outcome before reporting publication. Report any blocked push or unverified deployment accurately.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
