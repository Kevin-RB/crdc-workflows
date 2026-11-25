# OpenDataLoader PDF on the EU AI Act (Reg. (EU) 2024/1689): findings

## Setup
- **PDF:** the official EN text, 144 pages, 2.58 MB. EUR-Lex (`eur-lex.europa.eu/.../PDF/?uri=OJ:L_202401689`, also the CELEX and ELI URLs) returned `HTTP 202` with an empty body, which is an AWS WAF bot challenge. The same file came from the Publications Office Cellar instead: `curl -H 'Accept: application/pdf' -H 'Accept-Language: eng' http://publications.europa.eu/resource/celex/32024R1689`, which redirects to `cellar/dc8116a1-3fe6-11ef-865a-01aa75ed71a1.0006.01/DOC_1`.
- **Runtime:** Node v26.12.1, and a portable Temurin JRE 21.0.13.1 from api.adoptium.net. No root was needed.
- **Package:** `@opendataloader/pdf@2.5.24` exists and is the latest version. It wraps a bundled Java CLI jar.
- **Command:** `node node_modules/@opendataloader/pdf/dist/cli.js ai-act.pdf -o out -f json,markdown`. It took about 3 s.
- **Library API:** `import { convert } from '@opendataloader/pdf'; await convert([paths], { outputDir, format: 'markdown,json' })`.

## Outputs
| File | What it is |
|---|---|
| `out/ai-act.json` | Default mode, the main subject of this analysis (1.27 MB) |
| `out/ai-act.md` | Markdown (590 KB) |
| `out/flat.txt` | Readable tree dump: type, id, page, chars, preview |
| `out/sizes.json` | Per-unit character counts |
| `out-struct/ai-act.json` | Run with `--use-struct-tree` (the PDF is tagged) |
| `out-hf/ai-act.json` | Run with `--include-header-footer` |
| `scripts/segment.py` | Regex segmenter used to compute the stats |

## JSON shape (default mode)
The top level is `{ "file name", "number of pages": 144, author, title, "creation date", "modification date", kids: [632] }`. Pages are not grouped: `kids` is one flat, reading-ordered list, and each element carries a `page number`.

Element fields:
- **Common to all elements:** `type`, `id`, `page number`, `bounding box`, `pdfua_tag`, `font`, `font size`, `text color`, `content`.
- **Headings** add `heading level`, and their `level` field is `"Subtitle"`.
- **Lists** add `numbering style` (`arabic numbers` or `english letters`), `number of list items`, `previous list id` / `next list id`, and `list items[]`.
- **List items** have `content` (their own text, which includes the label such as "1." or "(a)") plus `kids[]` for nested lists and paragraphs.

Element counts, recursive:

| Type | Count |
|---|---|
| list item | 1427 (1169 at depth 1, 247 at depth 3, 11 at depth 5) |
| list | 382 |
| paragraph | 274 |
| heading | 100 (H2: 95, H4: 4, H3: 1) |
| image | 1 (the OJ logo) |
| table, header, footer, form field | 0 |

Heading detection is unreliable. Only 81 of the 113 Article headings come out as `heading` elements. The rest are 24 `paragraph` and 8 `list item`. Only 4 of the 13 CHAPTER headings are headings (H4). All SECTION and ANNEX labels are `paragraph`. One false H3 heading is Annex XI point 3.

Total text is 582,335 chars. Of that, 14,034 chars are footnotes, which have font size 8.498 against 9.554 for body text.

## Recovering the structure
Everything below is recoverable with regexes over a linearised stream of `content` values: walk `kids`, then each list item's `content`, then its `kids`. With sequential-number checks, my segmenter found 180/180 recitals, 113/113 articles, 13/13 annexes and 68/68 Article 3 definitions.

- **Recitals.** These are list items whose text starts "(N) …", in `arabic numbers` lists.
  - Footnotes ("(1) OJ C 517…") are also arabic "(N)" list items, interleaved with the recitals, and their numbers collide with recital numbers. The two kinds sit in separate list chains (`previous list id`/`next list id`), and footnotes can also be told apart by font size 8.498.
  - Recitals are split at page breaks: the continuation becomes a top-level `paragraph` starting in lower case (e.g. id 34 on p2 continues recital (3)). 32 recitals span more than one block.
- **CHAPTER.** Number and title are in one block, e.g. "CHAPTER III HIGH-RISK AI SYSTEMS". The block is usually a paragraph, sometimes an H4 heading.
- **SECTION.** The label "SECTION 1" is one paragraph, and its title ("Classification of AI systems as high-risk", bold italic) is the next paragraph.
- **Article headings.**
  - Usually "Article N Title" is a single block. Arts 103 and 104 are the exception: a bare "Article 103" paragraph, then the title as an H2.
  - Art 1's title has a stray trailing backtick: "Article 1 Subject matter`".
  - Some article headings are list items that wrap the article body as a nested list (e.g. Art 28 contains its paragraphs 1–7 nested, and Art 29 is a sibling list item).
  - The regex needs guards against body text such as "Article 18 of Regulation (EU) 2019/1020 shall apply…".
- **Numbered paragraphs "1."** These are list items in `arabic numbers` lists. Page breaks and interruptions split the list into chained lists (`next list id`). Unnumbered sub-paragraphs appear as `paragraph` kids of the list item (e.g. Art 2(3)).
- **Points "(a)".** These are list items in `english letters` lists (480 point items found). Nesting is inconsistent: they are sometimes nested under the "N." item (Art 2(1)) and sometimes a sibling top-level list (Art 1(2), Annex III 5(a)–(d)). Use text order, not tree nesting.
- **Annexes.**
  - The label "ANNEX III" is a paragraph, and the title is the next block, usually H2. Annex X is the exception: label and title are merged into one block.
  - Annex points are "1." list items with "(a)" sub-lists, as in articles. Annex I/II items also use "—" dash paragraphs.
- **Page headers/footers.** These are removed by default:
  - The header "EN OJ L, 12.7.2024" and footer "ELI: http://data.europa.eu/eli/reg/2024/1689/oj N/144" do not appear.
  - Only the page-1 masthead ("Official Journal of the European Union", "EN L series", "2024/1689 12.7.2024") remains.
  - With `--include-header-footer` they come back as 143 `header` and 144 `footer` elements. Heading detection also changes in that run (385 headings).
- **Page-break splits.** 33 body blocks start in lower case: 20 paragraphs and 13 list items. All of them are continuations of the previous unit, mostly after a footnote block. Some lists are also cut into a new chained list at a page break.
- **Tables.** None in default mode. `--use-struct-tree` finds 1 table, on p123 (Article 113).

## Size stats (chars; headings excluded; footnotes removed)
| Unit | n | min | median | p90 | max | Biggest |
|---|---|---|---|---|---|---|
| Recital | 180 | 145 | 1030 | 2645 | 4447 | (53) 4447, (29) 3709, (158) 3298, (139) 3288, (143) 3283 |
| Article, whole | 113 | 204 | 1858 | 4632 | 17000 | Art 3 17000, Art 5 11095, Art 57 9086, Art 60 7679, Art 26 7401, Art 74 6958 |
| Numbered article paragraph, including its points | 500 | 80 | 377 | 909 | 4690 | Art 5(1) 4690, Art 60(4) 4471, Art 59(1) 3308, Art 58(2) 2932, Art 26(10) 2724 |
| Art 3 definition | 68 | 97 | 223 | 376 | 810 | (61) 810, (45) 609, (57) 551 |
| Annex | 13 | 658 | 2922 | 5811 | 7774 | VII 7774, III 7258, I 5811, IV 5685, X 5170 |

- **Totals:** recitals 226,697 chars; articles 287,693; annexes 44,677.
- **Articles with no numbered paragraphs** (19): 3, 4, 16, 32, 39, 66, 85, 87, 94, 102–110, 113. Art 3 has definitions instead.
- **Caveat:** SECTION titles are counted into the preceding article (≤ about 100 chars each).

## Mode comparison: `--use-struct-tree`
- It produces **0 headings**, so every element is a `paragraph`, `list` or `list item`.
- "Article N" and its title are always two separate paragraphs. That is very regular: 157 CHAPTER/SECTION/Article/ANNEX label blocks were found.
- List labels are separate: a list item holds "(1)" and a child paragraph holds the text.
- Page-split recitals are merged into one block (recital 3 is 1859 chars), but footnotes get nested inside the recital list item.
- Default mode is better for heading hints. Struct-tree mode is more regular for regex segmentation. Either way, the chunker should rely on text regex plus sequential numbering, not on the `heading` type.

## Raw excerpts (default mode, long content truncated with …)
Article heading plus its first paragraph:
```json
{"type": "heading", "pdfua_tag": "H2", "id": 933, "level": "Subtitle", "page number": 56, "bounding box": [245.365, 617.38, 349.918, 645.741], "heading level": 2, "font": "EUAlbertina-Bold", "font size": 9.554, "text color": "[0.0, 0.0, 0.0, 1.0]", "content": "Article 9 Risk management system"}
{"type": "list", "pdfua_tag": "L", "id": 934, "level": "4", "page number": 56, "bounding box": [67.408, 230.114, 527.939, 599.82], "numbering style": "arabic numbers", "number of list items": 5, "next list id": 957, "list items": [{"type": "list item", "pdfua_tag": "LI", "id": 935, "page number": 56, "bounding box": [67.408, 577.809, 527.868, 599.82], "font": "EUAlbertina-Regu", "font size": 9.554, "text color": "[0.0, 0.0, 0.0, 1.0]", "content": "1. A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI sys…"}, "…"]}
```
Recital:
```json
{"type": "list item", "pdfua_tag": "LI", "id": 16, "page number": 1, "bounding box": [67.408, 205.335, 527.86, 237.834], "font": "EUAlbertina-Regu", "font size": 9.554, "text color": "[0.0, 0.0, 0.0, 1.0]", "content": "(2) This Regulation should be applied in accordance with the values of the Union enshrined as in the Charter, facilitating the protection of natural persons, undertakings, democracy, the rule of law a…", "kids": []}
```
Article 3 definition:
```json
{"type": "list item", "pdfua_tag": "LI", "id": 690, "page number": 46, "bounding box": [67.408, 284.085, 485.896, 295.552], "font": "EUAlbertina-Regu", "font size": 9.554, "text color": "[0.0, 0.0, 0.0, 1.0]", "content": "(2) ‘risk’ means the combination of the probability of an occurrence of harm and the severity of that harm;", "kids": []}
```
