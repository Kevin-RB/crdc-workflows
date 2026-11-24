# Research: licenses and document shape of candidate flagship collections

Ticket: [#21](https://github.com/Kevin-RB/crdc-workflows/issues/21) (child of wayfinder map [#20](https://github.com/Kevin-RB/crdc-workflows/issues/20)).
Researched: 2026-11-24.

**Question.** For each candidate flagship collection: what is the license, and can it be shown in a public demo and committed to a public repo? Is it available as PDF? Roughly how many pages, and how much of it is prose dense in cross-referencing named entities versus tables and numbers (which the pipeline handles poorly)? Which would support good, verifiable evaluation questions?

**How it was measured.** Licenses come from the publisher's own license page or the license printed in the document. Page counts come from the downloaded PDFs (`pypdf`). For "number density" I sampled about 40 evenly spaced pages per PDF and counted digit tokens per word. This is a rough proxy for how much of the text is tables and stat blocks. For reference: legal prose with article numbers comes out around 0.07, and stat-block-heavy text around 0.12 or higher. Novels were measured by word count from the Project Gutenberg plain-text files.

---

## 1. D&D 5e System Reference Document (SRD 5.2.1)

- **Current version.** SRD **v5.2.1**, published 1 May 2025. The SRD page was last updated 2 March 2026. v5.2.0 (22 April 2025) and v5.1 are still downloadable. [D&D Beyond SRD page](https://www.dndbeyond.com/srd)
- **License.** CC-BY-4.0. Wizards states that "all new SRD versions will be released exclusively under Creative Commons (CC-BY-4.0)" and that the license is irrevocable. [SRD page, FAQ](https://www.dndbeyond.com/srd). The PDF's Legal Information page requires one specific attribution statement and says: "Please do not include any other attribution to Wizards or its parent or affiliates other than that provided above." [SRD 5.2.1 PDF, p. 1](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf)
- **Public demo / commit to repo.** Yes. CC-BY-4.0 allows redistribution and adaptation, including commercial use, with attribution. Things to watch:
  - Use the exact attribution sentence from p. 1.
  - Don't use "Dungeons & Dragons"/D&D trademarks or logos in a way that implies endorsement. The SRD page lists those names as Wizards trademarks, and SRD 5.2 itself renames items "to avoid using protected trademarks". The page allows describing a work as "5E compatible".
  - The Fan Content Policy is a separate thing and doesn't apply here.
- **PDF.** Yes, the official PDF, about 6 MB.
- **Size.** **364 pages** (measured).
- **Shape.** Mixed, and it leans toward tables. From the table of contents (p. 2–4):
  - Rules prose: pp. 5–27, plus the Rules Glossary at pp. 176–191.
  - Classes: pp. 28–82, with level-progression tables.
  - Equipment tables: pp. 89+.
  - Spells: pp. 104–175, each with a semi-structured header (level, casting time, range, components).
  - Monsters: pp. 254–343, and Animals from p. 344. That is about 110 pages of stat blocks.
  
  Digit-token density is **0.120 per word**, the highest of the candidates. Entity cross-referencing is strong but formulaic: spells → conditions, classes → spells and features, monsters → conditions and damage types. Most of it is attribute/value data, not narrative relations. Since SRD 5.2, named lore characters (Strahd, Orcus, Tiamat) are deliberately left out. [SRD page, FAQ](https://www.dndbeyond.com/srd)
- **Evaluation questions.** Very verifiable, because rules text is unambiguous. Examples: "Which condition does *Hold Person* impose?" and "What does the Grappled condition do to speed?". The catch is that many good questions are numeric (CR, AC, damage dice), and those land on the pipeline's weak spot.

## 2. Public-domain novel via Project Gutenberg (*The Adventures of Sherlock Holmes*, *A Christmas Carol*)

- **License.** For books not under US copyright, "you can do anything you want with that text in the United States and most of the rest of the world" once "the Project Gutenberg license and all references to Project Gutenberg" are removed. Kept verbatim with the PG header, the text is redistributable for free under the PG license (§1.E). The PG license only restricts use of the **trademark**, such as charging a fee or modifying a work that still carries the PG name. Outside the US, users must check local law. [PG License](https://www.gutenberg.org/policy/license.html) (read through the [Wayback snapshot of 2026-11-16](http://web.archive.org/web/20261116094507/https://www.gutenberg.org/policy/license.html), because gutenberg.org returned HTTP 503 to automated requests). Both authors died more than 70 years ago (Doyle in 1930, Dickens in 1870), so these texts are also public domain in life+70 jurisdictions. *Adventures* was published in 1892 and *Carol* in 1843.
- **Public demo / commit to repo.** Yes. The simplest compliant option is to commit the text with the PG header and license left intact. The alternative is to strip all PG references.
- **PDF.** **Not natively.** PG's master formats are "plain text and HTML". EPUB and Kindle files are generated from them, and PDF only exists for the small number of LaTeX-mastered books. [PG file-formats help](https://www.gutenberg.org/help/file_formats.html) (via [Wayback](http://web.archive.org/web/20261017000503/https://www.gutenberg.org/help/file_formats.html)). The pipeline parses PDFs (OpenDataLoader, per map #20), so the HTML would need to be printed to PDF first. That's a one-time and trivial step, but it is a step.
- **Size.** *The Adventures of Sherlock Holmes* (PG #1661) is **104,532 words**: 12 short stories, about 300 pages when printed. *A Christmas Carol* (PG #46) is **28,579 words**, about 80–100 pages. Word counts were taken between PG's START and END markers.
- **Shape.** Almost all narrative prose with essentially no tables, which is the best fit for the pipeline's strengths. There are many named people, places and objects, and they relate to each other (client → case → culprit → location). Coreference is the hard part: "he", "my friend", "the Count".
- **Evaluation questions.** Good for multi-hop relational questions, such as "Who hired Holmes in *The Red-Headed League*, and what was the scheme's real target?". Answers are verifiable against the text. The risk is that LLMs already know these stories, so a correct answer doesn't prove the graph was used. The evaluation would need to check graph provenance (cited chunk or node), not only the answer text.

## 3. Open government/NGO species profiles

- **IUCN Red List (NGO): not usable.** The terms of use prohibit "all forms of reposting … or other forms of redistribution of IUCN Red List Data … including within Derivative Works" without a written waiver (§4). They also bar commercial use (§3), and the licence "is personal to you" (§1). [IUCN Red List Terms of Use v3.1](https://www.iucnredlist.org/terms/terms-of-use)
- **US federal agencies (e.g. USFWS species status assessments, recovery plans, NOAA species pages).** Works created by US government employees are not subject to US copyright (17 U.S.C. §105). However, "content on federal websites may include protected intellectual property used with the right holder's permission", and US works may still be protected abroad. [USAGov: copyright and government works](https://www.usa.gov/government-copyright). The usual traps are photos and contractor-authored sections, so each PDF needs checking.
- **Australian DCCEEW (SPRAT profiles, Conservation Advices).** Not verified. The DCCEEW pages timed out or returned nothing during this research. Australian Commonwealth content is commonly CC BY 4.0, but confirm per document before relying on it.
- **PDF.** Yes, for USFWS species status assessments and recovery plans and for DCCEEW Conservation Advices. Profiles that only exist as web pages would need printing.
- **Size.** Varies. One collection would be a hand-picked set of roughly 10–30 documents, each from a few pages to more than 100.
- **Shape.** Mixed. There is narrative prose on habitat, threats and interactions between species, and lots of entities that recur across documents (species, regions, threats, agencies). But they are heavy on population counts, survey tables, coordinates and range maps, which is the same profile the cotton manual had trouble with. Not measured here because no single canonical PDF exists.
- **Evaluation questions.** Moderate. Facts are verifiable, but many questions are numeric or tabular. The licence also has to be checked one document at a time, and there's no natural "one collection" boundary.

## 4. Cluster of arXiv papers on RAG / knowledge graphs

- **License.** Each paper carries the license its submitter chose. arXiv lists CC BY 4.0, CC BY-SA 4.0, CC BY-NC-SA 4.0, CC BY-NC-ND 4.0, CC0 and the arXiv perpetual non-exclusive license. [arXiv License Information](https://info.arxiv.org/help/license/index.html). The non-exclusive license "does not grant further reuse permissions directly", and "the overwhelming majority of e-prints" use it. [arXiv Permissions and Reuse](https://info.arxiv.org/help/license/reuse.html)
- **Licenses checked for the obvious papers** (license link on each abs page, read 2026-11-24):

  | arXiv id | Paper | License |
  |---|---|---|
  | 2404.16130 | From Local to Global: A Graph RAG Approach… (Microsoft GraphRAG) | **CC BY 4.0** |
  | 2310.11511 | Self-RAG | **CC BY 4.0** |
  | 2401.18059 | RAPTOR | **CC BY 4.0** |
  | 2410.05779 | LightRAG | CC BY-NC-SA 4.0 |
  | 2005.11401 | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al.) | arXiv non-exclusive |
  | 2004.04906 | Dense Passage Retrieval | arXiv non-exclusive |
  | 2405.14831 | HippoRAG | arXiv non-exclusive |
  | 2502.14802 | From RAG to Memory (HippoRAG 2) | arXiv non-exclusive |
  | 2306.08302 | Unifying LLMs and Knowledge Graphs: A Roadmap | arXiv non-exclusive |
  | 2408.08921 | Graph Retrieval-Augmented Generation: A Survey | arXiv non-exclusive |
  | 2312.10997 | RAG for LLMs: A Survey (Gao et al.) | arXiv non-exclusive |
  | 2501.00309 | Retrieval-Augmented Generation with Graphs (GraphRAG survey) | arXiv non-exclusive |
  | 2402.07630 | G-Retriever | arXiv non-exclusive |

- **Public demo / commit to repo.** Only the CC BY (and CC0) papers can be committed. Here that means 3 of 13. CC BY-NC-SA can be redistributed for non-commercial use under ShareAlike, which is probably fine for a personal show project but adds conditions. The canonical papers, including the original RAG paper and both surveys, **cannot** be committed. They can still be linked and downloaded at runtime.
- **PDF.** Yes, all of them.
- **Size.** Measured: GraphRAG is 26 pp, Self-RAG 30 pp, RAPTOR 23 pp. A cluster of 5–10 papers comes to roughly 150–300 pages.
- **Shape.** Prose, with cross-references between papers (methods, datasets, baselines, authors) that suit an "inter-document graph" story. But every paper has results tables, equations and references sections. Digit density was 0.172 for GraphRAG (the highest measured, driven by results tables and references), 0.088 for Self-RAG and 0.117 for RAPTOR.
- **Evaluation questions.** Good conceptual questions with checkable answers, e.g. "Which datasets did GraphRAG evaluate on?" and "Which method uses recursive summarisation trees?". The meta angle ("a KG pipeline that understands KG papers") makes a nice demo. Licensing is the problem: the CC BY subset is small and leaves out the papers people would expect.

## 5. EU AI Act — Regulation (EU) 2024/1689

- **License.** EUR-Lex: "Unless otherwise specified, you can re-use the legal documents published in EUR-Lex for commercial or non-commercial purposes." The reuse policy is based on Commission Decision 2011/833/EU. Editorial content, summaries and consolidated texts are CC BY 4.0, and metadata is CC0. Logos and trademarks are excluded. [EUR-Lex legal notice](https://eur-lex.europa.eu/content/legal-notice/legal-notice.html) (via [Wayback snapshot of 2026-11-22](http://web.archive.org/web/20261122105641/https://eur-lex.europa.eu/content/legal-notice/legal-notice.html), because EUR-Lex returned an empty HTTP 202 bot challenge to automated requests). Also: "Only European Union documents published in the Official Journal … are deemed authentic". The committed copy should therefore be described as a reproduction and cite OJ L, 2024/1689.
- **Public demo / commit to repo.** Yes, with source acknowledgement.
- **PDF.** Yes. This is the official OJ PDF from the Publications Office: [OJ L 2024/1689 PDF](https://op.europa.eu/o/opportal-service/download-handler?identifier=dc8116a1-3fe6-11ef-865a-01aa75ed71a1&format=pdf&language=en&productionSystem=cellar&part=), whose first page reads "REGULATION (EU) 2024/1689 … (Artificial Intelligence Act)".
- **Size.** **144 pages** (measured).
- **Shape.** Dense, highly structured legal prose: 180 recitals, 113 articles and 13 annexes. There are almost no data tables. The digit density of **0.067** is the lowest of the PDFs and comes almost entirely from article and paragraph numbers. Defined entities cross-reference each other constantly: actors (provider, deployer, importer, distributor, notified body, AI Office, market surveillance authority), artefacts (high-risk AI system, general-purpose AI model with systemic risk), obligations, and references to annexes and articles ("referred to in Article 6(2)"). That fits the pipeline's open-IE strengths well. The difficulty is that relations are often conditional or deontic ("shall … unless"), which simple triples flatten.
- **Evaluation questions.** Excellent verifiability. Every answer has a canonical article/paragraph citation, e.g. "Which actor must draw up the EU declaration of conformity for a high-risk AI system?" → provider, Art. 16/47. Multi-hop questions are natural, e.g. "Which obligations apply to deployers of the systems listed in Annex III, point 1?". There's also strong public interest in the subject. LLM prior knowledge is a risk here too, but smaller than with Sherlock Holmes for fine-grained article-level questions.

---

## Comparison

| Candidate | License | Commit to public repo? | PDF? | Size | Prose vs tables/numbers | Verifiable eval questions |
|---|---|---|---|---|---|---|
| D&D SRD 5.2.1 | CC-BY-4.0 (exact attribution sentence required) | Yes | Yes (official) | 364 pp | Table/stat-block heavy (0.120 digits/word; ~110 pp monsters, ~70 pp spells) | High, but many are numeric |
| Sherlock Holmes / A Christmas Carol (Gutenberg) | Public domain (US + life+70); PG trademark terms if the PG header is kept | Yes | **No**: HTML/TXT/EPUB, print to PDF yourself | 104.5k words (~300 pp) / 28.6k words (~90 pp) | Nearly pure narrative prose | Good multi-hop; LLM already knows the answers |
| Species profiles | IUCN: **no** redistribution. US federal: public domain except third-party content. AU DCCEEW: unverified | Per document; IUCN excluded | Mostly yes | Varies, hand-curated set | Mixed; heavy on counts, survey tables, maps | Moderate; often numeric |
| arXiv RAG/KG cluster | Per paper; 3 of 13 checked are CC BY, 1 CC BY-NC-SA, 9 arXiv non-exclusive | Only the CC BY subset (GraphRAG, Self-RAG, RAPTOR) | Yes | ~23–30 pp each | Prose + results tables, equations, references (0.088–0.172) | Good, but the best-known papers can't be shipped |
| EU AI Act (Reg. 2024/1689) | EUR-Lex reuse policy (Decision 2011/833/EU), commercial and non-commercial reuse allowed | Yes (cite source; OJ is the authentic version) | Yes (official OJ PDF) | 144 pp | Dense cross-referencing legal prose, almost no tables (0.067) | Excellent: every answer has an article citation |

## Recommendation (for the decision ticket)

My recommendation is the **EU AI Act**. It is the only candidate that meets all of these at once:

- clean reuse terms for a public repo;
- an official PDF that goes straight into the existing OpenDataLoader parsing path;
- a manageable 144 pages;
- the least tabular content measured;
- dense, cross-referencing named entities (actors, system categories, authorities, annexes) that suit open-IE;
- an evaluation set with canonical article citations for every answer.

It is also topical for an AI show project.

**Runner-up: *The Adventures of Sherlock Holmes*.** It's the most "pure prose" and has no licensing friction. It would make a fun, readable demo graph. Two drawbacks: it needs an HTML→PDF conversion step, and an evaluation can't easily tell answers from the graph apart from the LLM's memory of the stories.

**Not recommended as the flagship:**
- The **SRD**: legally clean, but its mass of stat blocks hits the pipeline's known weakness.
- The **arXiv cluster**: the shippable CC BY subset leaves out the canonical papers.
- **Species profiles**: IUCN forbids redistribution, government sources need per-document licence checks, and the documents are table-heavy.

## Open points / caveats

- gutenberg.org and eur-lex.europa.eu blocked automated requests during this research. Their policy pages were read through Wayback Machine snapshots from November 2026, which are linked above.
- Australian DCCEEW licensing was not confirmed.
- Digit density is a crude proxy computed on about 40 sampled pages per PDF. It doesn't detect tables that don't contain digits.
- arXiv licenses are per *version*. Re-check the abs page of the exact version you download.
