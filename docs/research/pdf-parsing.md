# Research: parsing PDFs inside the pipeline

Ticket: [#22](https://github.com/Kevin-RB/crdc-workflows/issues/22) (part of wayfinder map #20).
Researched: 2026-11-24. All versions and dates below were checked against the primary source on that day.

## Question

Today PDFs are parsed outside the repo with OpenDataLoader PDF (ODL), and the pipeline reads its JSON
(`src/interface/document.ts`, with a vendored copy of the upstream schema in
`src/interface/opendataloader-pdf-schema.json`). The chunker (`src/mastra/workflows/lib/chunking-function.ts`)
uses `heading`, `paragraph` and `list` elements. This note covers:

1. The current ODL release, and how it can be invoked (Node package, CLI, Docker, Java, hybrid mode).
2. Whether the JSON schema changed compared with `document.ts`.
3. Realistic alternatives for a local-first TypeScript project, and their trade-offs.

Mastra stays on the host. Supporting services go in Docker Compose.

---

## 1. OpenDataLoader PDF today

### Release and licence

- **Latest release: v2.5.24**, published 2026-11-23. Releases come out about every 3–7 days (v2.5.20 on 11-06, v2.5.21 on 11-10, v2.5.22 on 11-12, v2.5.23 on 11-19). [GitHub releases][odl-releases]
- The same version is published to npm (`@opendataloader/pdf@2.5.24`, 2026-11-23) and to PyPI (`opendataloader-pdf==2.5.24`, `requires_python >=3.11`). [npm][odl-npm], [PyPI][odl-pypi]
- Licence: **Apache-2.0** for the repo and the npm package. PDF/UA export is a paid enterprise add-on, and this pipeline doesn't need it. [repo][odl-repo], [README "Licence" row][odl-readme]
- Recent releases include many heading, list and column fixes that matter for our chunker. For example, v2.5.21 added "keep a bold step heading out of the paragraph below it", "end a list of bullets at a section title between its items" and "keep numbered steps drawn out of order in one list". [v2.5.21 notes][odl-releases]

### Ways to invoke it

| Route | What you get | Runtime requirement | Source |
|---|---|---|---|
| **npm `@opendataloader/pdf`** | `convert(paths, options)` in TypeScript, plus a CLI `opendataloader-pdf` (`npx @opendataloader/pdf`) | **Java 11+ on `PATH`**. The package describes itself as "a Node.js wrapper for the opendataloader-pdf Java CLI". Its only JS dependency is `commander`. `engines.node >=22.13`, which matches this repo exactly. Unpacked size is about 25 MB because it bundles the JAR. | [npm metadata][odl-npm], [Node quick start][odl-node] |
| PyPI `opendataloader-pdf` | Same API in Python, and the same CLI | Java 11+ and Python 3.11+ | [README][odl-readme] |
| Maven `org.opendataloader:opendataloader-pdf-core` | Embed it in a JVM app | Java 11+ | [README][odl-readme] |
| **Hybrid mode** | Pages that the local Java pass finds hard (complex or borderless tables, scans, formulas, charts) go to a local HTTP backend. Start it with `opendataloader-pdf-hybrid --port 5002` and call the client with `--hybrid docling-fast` / `hybrid: "docling-fast"`. | Python package `opendataloader-pdf[hybrid]`, which pulls in **Docling** (`docling[easyocr]>=2.126`), `docling-parse`, FastAPI and uvicorn. It runs locally, with no cloud calls. | [README hybrid section][odl-readme], [PyPI requires_dist][odl-pypi] |
| Docker | **No official image.** Docker Hub has only community images (for example `lvalics/opendataloader-pdf-server` and `dangsanhong/opendataloader-pdf-cli`). The upstream repo has no Dockerfile at its root. | n/a | [Docker Hub search][dockerhub-odl], [repo tree][odl-tree] |

Details that matter for integration ([Node quick start][odl-node], [README][odl-readme]):

- **Each `convert()` call starts a JVM.** Upstream says to batch files into one call because "repeated calls are slow".
- `toStdout` only supports `text` or `markdown`, **not JSON**, so JSON output has to go through `outputDir`. v2.5.23 added "convert the bytes of a PDF and return the output as a string" to the Python and Node SDKs. That API takes one format per call and writes the bytes to a private temporary file. [v2.5.23 notes][odl-releases], [README][odl-readme]
- Useful options: `useStructTree` (use the PDF's own tags when present; this overrides hybrid), `tableMethod: "cluster"`, `includeHeaderFooter` (default `false`), `imageOutput: "off"`, `pages`, `threads` (experimental), `sanitize`, and `contentSafetyOff` (hidden-text and off-page prompt-injection filters are on by default).
- **Heading depth:** in hybrid mode, Docling's layout model returns every heading at level 1 unless the hybrid server is started with `--heading-hierarchy`. That flag infers depth from the PDF outline, then section numbering, then visual style. [README "Heading Hierarchy"][odl-readme]
- Upstream benchmark (self-reported, 200 PDFs): ODL local scores 0.831 overall and 0.489 on tables, at 0.015 s/page. ODL hybrid scores 0.907 overall and 0.928 on tables, at 0.46 s/page. Docling scores 0.882 overall and 0.887 on tables, at 0.76 s/page. Heading scores are ODL local 0.739, ODL hybrid 0.821 and Docling 0.824. ODL publishes these numbers about itself, so treat them as directional. [README benchmark table][odl-readme], [opendataloader-bench][odl-bench]

## 2. Has the JSON schema changed compared with `document.ts`?

**The format is the same, with one addition.** Upstream `schema.json` has been changed only twice: once on 2025-12-20, when it was auto-generated (#133), and once on **2026-11-16** in commit `fd4278b`, "read printed check boxes and radio buttons in tag mode". [schema.json history][odl-schema-commits]

I diffed the current upstream [`schema.json`][odl-schema] against the vendored `src/interface/opendataloader-pdf-schema.json`, with both normalized using `json.tool --sort-keys`. The **only** difference is a new content element:

```jsonc
"formField": {               // added to contentElement.oneOf
  "type": { "const": "form field" },
  "field role": "check box" | "radio button",   // required
  "checked": "on" | "off" | "neutral",          // required
  "content": string,                            // required
  "description"?: string,                       // the field's Desc attribute
  "font"?, "font size"?, "text color"?          // only when the label comes from the page
  // + baseElement: type, id?, level?, "page number", "bounding box"
}
```

Concrete field comparison with the Zod schema in `document.ts`:

| Area | Upstream now | `document.ts` | Status |
|---|---|---|---|
| Root: `file name`, `number of pages`, `author`, `title`, `creation date`, `modification date`, `kids` | same | same | ✅ unchanged |
| Base: `type`, `id`, `level`, `page number`, `bounding box` ([l,b,r,t]) | same | same | ✅ |
| Text: `font`, `font size`, `text color`, `content`, `hidden text` | `font` and `text color` are **required** strings | `nullable().optional()` | ✅ Zod is looser, which is fine |
| `heading` → `heading level` (int ≥1) | same | same | ✅ |
| `caption` → `linked content id` | same | same | ✅ |
| `table` → `number of rows/columns`, `previous/next table id`, `rows[]` → `table row` → `cells[]` → `table cell` (`row/column number`, `row/column span`, `kids`) | same | same | ✅ |
| `list` → `numbering style`, `number of list items`, `previous/next list id`, `list items[]` → `list item` (text + `kids`) | same | same | ✅ |
| `text block`, `image` (`source`, `data`, `format` png/jpeg), `header`/`footer` | same | same | ✅ |
| **`form field`** | new, but only emitted with `--use-struct-tree` on tagged PDFs | missing | ⚠️ `z.union` would **reject the whole document** if one appears |
| `formula` | listed as an element type in the README's JSON field table, **but not defined in `schema.json`** | missing | ⚠️ README and schema disagree; hybrid `--enrich-formula` may emit it. Not verified. |

Sources: [README "JSON Output Example"][odl-readme], [schema.json][odl-schema].

Takeaway: the pipeline's assumptions still hold. Before relying on any new ODL version, either add `form field` (and maybe `formula`) to the union, or make unknown `type` values pass through and get skipped. A strict union fails closed on any element type it doesn't know.

## 3. Alternatives for a local-first TypeScript project

| Option | Current release | How it runs | Structure output (headings / lists / tables) | Runtime deps / Docker | Licence |
|---|---|---|---|---|---|
| **OpenDataLoader local** (status quo) | v2.5.24 | In-process from Node via `@opendataloader/pdf` (starts a JVM) | Typed `heading` + `heading level`, `list`/`list item` with nesting, `table` with spans, bounding boxes. Tables are weaker in local mode (0.489 benchmark). | JDK 11+ on the host. No official image. | Apache-2.0 |
| **OpenDataLoader hybrid** | v2.5.24 | Same Node call with `hybrid: "docling-fast"` and `hybridUrl`, plus a Python backend service | Same JSON schema. Tables, OCR and formulas improve a lot. Needs `--heading-hierarchy` for heading depth. | JDK on the host, plus a Python 3.11 service built from `pip install "opendataloader-pdf[hybrid]"`. **You'd write the Dockerfile yourself.** | Apache-2.0 (Docling is MIT) |
| **Docling via docling-serve** | docling v2.152.0, docling-serve v1.39.0 (both 2026-11-23) | HTTP `POST /v1/convert/source` (sync and async) on `:5001`, with a UI at `/ui`. TS calls it with `fetch`. | `DoclingDocument` JSON (`section_header`, `title`, `list_item`, `table` labels), Markdown, and server-side `chunks` output (Hierarchical/Hybrid chunker, `merge_peers`). Our chunker would need a new adapter. | **Official images**: `ghcr.io`/`quay.io` `docling-project/docling-serve-cpu` (amd64/arm64, about 4.4 GB), plus CUDA variants and a Compose example. Slower than ODL local. | MIT |
| **Unstructured (self-hosted API)** | unstructured-api 0.1.2 (2026-04-03) | HTTP on `:8000`. Strategies `fast`/`hi_res`/`ocr_only`, `chunking_strategy=by_title` | Flat element list (`Title`, `ListItem`, `NarrativeText`, `Table`). No heading depth. Benchmark: tables 0.588 with hi_res and 0.000 with fast. | Official `quay.io/unstructured-io/unstructured-api` image (amd64/arm64). `hi_res` is about 3 s/page. | Apache-2.0 |
| **pdf.js / unpdf** | pdfjs-dist 6.5.438, unpdf 2.2.2 | Pure JS, in-process | Text runs with positions only. **No headings, lists or tables**, so you'd have to rebuild layout yourself from fonts and positions. | Nothing extra. ⚠️ unpdf 2.x's README says Node **24+**, but this repo pins `>=22.13`. pdfjs-dist works directly. | Apache-2.0 / MIT |
| **LlamaIndex LiteParse** (`@llamaindex/liteparse`) | 2.21.1 | npm, "spatial text extraction" | ODL's benchmark scores it 0.000 on tables and headings | Node | Apache-2.0 |
| **LLM / vision parsing** (render pages, then ask a VLM for Markdown or JSON) | n/a | Through the model provider Mastra already uses, or a local VLM (for example Docling's VLM pipeline in docling-serve) | Can be very good on messy layouts, but **non-deterministic**, costly per page, may hallucinate or drop text, and loses bounding boxes | GPU or API cost. Cloud APIs conflict with local-first. | depends on the model |
| marker / MinerU / pymupdf4llm | — | Python | Good tables (marker, MinerU) | GPU or slow | **GPL-3.0 / AGPL-3.0**, avoid |

Sources: [docling releases][docling-rel], [docling-serve releases][ds-rel], [docling-serve README][ds-readme], [docling-serve usage][ds-usage], [docling-core labels][docling-labels], [unstructured-api README][ua-readme], [unstructured-api releases][ua-rel], [unpdf README][unpdf], [npm pdfjs-dist][pdfjs], [npm @llamaindex/liteparse][liteparse], benchmark rows from the [ODL README][odl-readme].

### Trade-offs that matter here

- **No schema churn**: only ODL (local or hybrid) keeps `document.ts` and the chunker as they are. Every other option needs a new adapter. Docling's own chunker could also replace part of `chunking-function.ts`, but that's a bigger change.
- **Docker friendliness**: docling-serve and unstructured-api ship official multi-arch images. ODL has none, so running it in Compose means a custom Dockerfile (Temurin JRE + CLI) and a non-server CLI, which fits a `docker compose run` job better than a long-lived service. Running ODL in-process on the host from Node is simpler: the only host requirement is `java`.
- **Heading quality** is what drives our chunk boundaries. ODL local uses heuristics and has had heading and list fixes almost every week. Docling or ODL hybrid need `--heading-hierarchy` to get levels at all.
- **Tables**: only matter if the cotton manual's tables need to reach the graph. Today the chunker ignores tables, so local mode's weak table score doesn't affect us yet.
- **Speed**: ODL local is about 50× faster than Docling. That matters when re-parsing a long manual during development.

## Recommendation

This is a recommendation, not a decision.

1. **Keep OpenDataLoader and bring it into the pipeline through `@opendataloader/pdf`**, called from a Mastra step on the host (`convert([pdfPath], { outputDir, format: "json", imageOutput: "off" })`, then read the JSON). It matches the repo's Node engine, adds one npm dependency, and keeps `document.ts` and the chunker unchanged. Document the **JDK 17 (11+) host requirement** in the README and `.env.example` checks, and pin the ODL version because it releases weekly.
2. **Make the Zod union tolerant**: add `form field`, and maybe `formula`, or let unknown element types through so they're ignored. This avoids hard failures on upgrade.
3. **Hybrid mode is optional and comes later.** If tables or scanned pages start to matter, add a Compose service built from `python:3.11` + `pip install "opendataloader-pdf[hybrid]"` running `opendataloader-pdf-hybrid --port 5002 --heading-hierarchy`, and pass `hybridUrl`. The output schema stays the same, so nothing downstream changes.
4. **docling-serve is the fallback** if ODL becomes a problem (for example the JVM on the host). It's the most Docker-friendly option with an MIT licence and strong quality, at the cost of a new adapter or chunker and a 4 GB+ image.
5. Don't use pdf.js/unpdf or LiteParse as the main parser, because they have no structure. Avoid LLM-only parsing for a deterministic graph pipeline. Avoid GPL/AGPL parsers.

Open items I didn't verify: whether `formula` elements actually appear in hybrid JSON, and ODL output quality on the actual cotton manual compared with the version used to produce the current JSON. Re-running the parser and diffing chunk counts would settle the second one.

---

[odl-releases]: https://github.com/opendataloader-project/opendataloader-pdf/releases
[odl-repo]: https://github.com/opendataloader-project/opendataloader-pdf
[odl-tree]: https://github.com/opendataloader-project/opendataloader-pdf/tree/main
[odl-readme]: https://github.com/opendataloader-project/opendataloader-pdf/blob/main/README.md
[odl-schema]: https://github.com/opendataloader-project/opendataloader-pdf/blob/main/schema.json
[odl-schema-commits]: https://github.com/opendataloader-project/opendataloader-pdf/commits/main/schema.json
[odl-npm]: https://www.npmjs.com/package/@opendataloader/pdf
[odl-pypi]: https://pypi.org/project/opendataloader-pdf/
[odl-node]: https://opendataloader.org/docs/quick-start-nodejs
[odl-bench]: https://github.com/opendataloader-project/opendataloader-bench
[dockerhub-odl]: https://hub.docker.com/search?q=opendataloader
[docling-rel]: https://github.com/docling-project/docling/releases
[docling-labels]: https://github.com/docling-project/docling-core/blob/main/docling_core/types/doc/labels.py
[ds-rel]: https://github.com/docling-project/docling-serve/releases
[ds-readme]: https://github.com/docling-project/docling-serve/blob/main/README.md
[ds-usage]: https://github.com/docling-project/docling-serve/blob/main/docs/usage.md
[ua-readme]: https://github.com/Unstructured-IO/unstructured-api/blob/main/README.md
[ua-rel]: https://github.com/Unstructured-IO/unstructured-api/releases
[unpdf]: https://github.com/unjs/unpdf
[pdfjs]: https://www.npmjs.com/package/pdfjs-dist
[liteparse]: https://www.npmjs.com/package/@llamaindex/liteparse
