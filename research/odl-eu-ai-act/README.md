# Research: OpenDataLoader output for the EU AI Act

Throwaway research branch, never merged. Reference for [Chunking strategy for the flagship](https://github.com/Kevin-RB/crdc-workflows/issues/36) and [Draft the EU AI Act Domain Profile](https://github.com/Kevin-RB/crdc-workflows/issues/37).

- `findings.md`: structure and size analysis of the parse, plus raw excerpts.
- `scripts/segment.py`: regex + sequence-check segmenter (180 recitals / 113 articles / 13 annexes / 68 Art. 3 definitions). `scripts/flat.py`: tree dump.
- `out/`: default-mode `@opendataloader/pdf@2.5.24` JSON/markdown, flat dump, size stats.
- `out-struct/`: `--use-struct-tree` run.

Source PDF (not committed): Regulation (EU) 2024/1689, official EN, 144 pages, fetched with
`curl -L -H 'Accept: application/pdf' -H 'Accept-Language: eng' http://publications.europa.eu/resource/celex/32024R1689`.
