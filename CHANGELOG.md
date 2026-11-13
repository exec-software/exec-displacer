# Changelog

## v70

- Extend the optional browser node editor with schema 2 typed request/records
  ports and a single validated source/filter/sort/limit/display pipeline.
- Add no-code filter, sort, and pagination inspectors, phase-aware insertion,
  edge-derived canvas order, and measured SVG port connections.
- Preserve schema 1 graphs without automatic upgrade. Legacy Concord queries
  with omitted pagination retain the server's default of 25 results.
- Export `defaultPipelineGraph()` while keeping `defaultQueryGraph()` compatible.
  Expand editor model tests and the synthetic browser showcase for both schemas.
