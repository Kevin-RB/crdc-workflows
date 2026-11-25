"""Segment ODL default-mode JSON of the EU AI Act into recitals / articles / paragraphs / annexes and report stats."""
import json, re, sys, statistics, collections

d = json.load(open(sys.argv[1]))
blocks = []  # (id, type, page, fsize, depth, text)


def walk(n, depth):
    t = n.get('type')
    c = n.get('content')
    if c:
        blocks.append(dict(id=n.get('id'), type=t, page=n.get('page number'), fs=n.get('font size'),
                           depth=depth, text=c, hl=n.get('heading level')))
    if t == 'table':
        blocks.append(dict(id=n.get('id'), type='table', page=n.get('page number'), fs=None, depth=depth,
                           text='<TABLE>', hl=None))
    for k in ('kids', 'list items'):
        for x in n.get(k, []) or []:
            walk(x, depth + 1)


for k in d['kids']:
    walk(k, 0)

total_chars = sum(len(b['text']) for b in blocks)
KEEP_SMALL = re.compile(r'^(CHAPTER|SECTION|ANNEX|THE EUROPEAN PARLIAMENT|\(Text with|HAVE ADOPTED)')
footnotes = [b for b in blocks if b['fs'] and b['fs'] < 9 and not KEEP_SMALL.match(b['text'])]
body = [b for b in blocks if not (b['fs'] and b['fs'] < 9 and not KEEP_SMALL.match(b['text']))]
print('blocks', len(blocks), 'total chars', total_chars, 'footnote blocks', len(footnotes),
      'footnote chars', sum(len(b['text']) for b in footnotes))

# --- zones
idx_whereas = next(i for i, b in enumerate(body) if b['text'].strip() == 'Whereas:')
idx_adopted = next(i for i, b in enumerate(body) if b['text'].startswith('HAVE ADOPTED'))

# recitals
recitals = collections.OrderedDict()
cur = None
RC = re.compile(r'^\((\d+)\)\s')
for b in body[idx_whereas + 1:idx_adopted]:
    m = RC.match(b['text'])
    if m and b['type'] == 'list item' and int(m.group(1)) == (cur or 0) + 1:
        cur = int(m.group(1)); recitals[cur] = [b]
    elif cur:
        recitals[cur].append(b)
rec_sizes = {k: sum(len(x['text']) for x in v) for k, v in recitals.items()}
rec_split = {k: len(v) for k, v in recitals.items() if len(v) > 1}
print('recitals found', len(recitals), 'max num', max(recitals), 'recitals with >1 block (page-split continuations)', len(rec_split))

# enacting terms + annexes
ART = re.compile(r'^Article (\d+)\b\s*(.*)$')
CH = re.compile(r'^CHAPTER ([IVX]+)\b\s*(.*)$')
SEC = re.compile(r'^SECTION (\d+)\b\s*(.*)$')
ANX = re.compile(r'^ANNEX ([IVX]+)\b\s*(.*)$')
units = []  # dict(kind,num,title,blocks,headblock)
expect_art = 1
expect_anx = 1
roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII']
curunit = None
head_types = collections.Counter()
structure = []
for b in body[idx_adopted + 1:]:
    t = b['text'].strip()
    m = ART.match(t)
    if m and int(m.group(1)) == expect_art and len(t) < 260 and not re.match(r'^Article \d+(\(\d+\))? of ', t):
        curunit = dict(kind='article', num=expect_art, title=m.group(2), blocks=[], head=b)
        units.append(curunit); head_types[('article', b['type'])] += 1; expect_art += 1
        continue
    m = ANX.match(t)
    if m and expect_anx <= 13 and m.group(1) == roman[expect_anx - 1]:
        curunit = dict(kind='annex', num=m.group(1), title=m.group(2), blocks=[], head=b)
        units.append(curunit); head_types[('annex', b['type'])] += 1; expect_anx += 1
        continue
    if CH.match(t):
        head_types[('chapter', b['type'])] += 1; structure.append(('CH', t, b['type'], b['hl'])); continue
    if SEC.match(t) and len(t) < 120:
        head_types[('section', b['type'])] += 1; structure.append(('SEC', t, b['type'], b['hl'])); continue
    if curunit is not None:
        # article title on its own block right after bare "Article N"
        if curunit['kind'] in ('article', 'annex') and not curunit['title'] and not curunit['blocks'] and len(t) < 250:
            curunit['title'] = t; curunit['title_block_type'] = b['type']; continue
        curunit['blocks'].append(b)

arts = [u for u in units if u['kind'] == 'article']
anxs = [u for u in units if u['kind'] == 'annex']
print('articles found', len(arts), 'annexes found', len(anxs))
print('heading element types:', dict(head_types))
print('articles w/o title', [u['num'] for u in arts if not u['title']])
print('articles with title as separate block:', [(u['num'], u.get('title_block_type')) for u in arts if u.get('title_block_type')])


def stats(name, sizes):
    v = sorted(sizes.values())
    if not v:
        print(name, 'none'); return
    p90 = v[int(0.9 * (len(v) - 1))]
    top = sorted(sizes.items(), key=lambda kv: -kv[1])[:6]
    print(f"{name}: n={len(v)} min={v[0]} median={int(statistics.median(v))} p90={p90} max={v[-1]} sum={sum(v)} top={top}")


stats('recital chars', rec_sizes)
art_sizes = {u['num']: sum(len(b['text']) for b in u['blocks']) for u in arts}
stats('article chars (body, excl heading)', art_sizes)
anx_sizes = {u['num']: sum(len(b['text']) for b in u['blocks']) for u in anxs}
stats('annex chars', anx_sizes)

# numbered paragraphs inside articles
PARA = re.compile(r'^(\d+)\.\s')
para_sizes = {}
no_para_articles = []
para_count_by_art = {}
lowercase_starts = 0
for u in arts:
    curp = None; expected = 1; n = 0
    pre = 0
    for b in u['blocks']:
        m = PARA.match(b['text'])
        if m and int(m.group(1)) == expected:
            curp = f"Art{u['num']}({expected})"; para_sizes[curp] = 0; expected += 1; n += 1
        if curp:
            para_sizes[curp] += len(b['text'])
        else:
            pre += len(b['text'])
    para_count_by_art[u['num']] = n
    if n == 0:
        no_para_articles.append(u['num'])
stats('numbered article paragraph chars', para_sizes)
print('articles with no numbered paragraphs (single-body):', no_para_articles)

# Article 3 definitions
a3 = arts[2]
defs = {}
curd = None
for b in a3['blocks']:
    m = RC.match(b['text'])
    if m and int(m.group(1)) == len(defs) + 1:
        curd = int(m.group(1)); defs[curd] = len(b['text'])
    elif curd:
        defs[curd] += len(b['text'])
stats('Article 3 definition chars', defs)

# points
POINT = re.compile(r'^\(([a-z]{1,4})\)\s')
pts = [b for u in units for b in u['blocks'] if POINT.match(b['text'])]
print('point blocks "(a)" in articles+annexes:', len(pts), 'types', collections.Counter(b['type'] for b in pts))
pts_depth = collections.Counter(b['depth'] for b in pts)
print('point depth distribution', dict(pts_depth))

# page-split continuations: body blocks starting lowercase
cont = [b for b in body if re.match(r'^[a-z]', b['text'])]
print('body blocks starting lowercase (likely page-break continuations):', len(cont),
      collections.Counter(b['type'] for b in cont))
print('chapters/sections:', structure)
tables = [b for b in blocks if b['type'] == 'table']
print('tables', [(b['id'], b['page']) for b in tables])
json.dump(dict(rec=rec_sizes, art=art_sizes, anx=anx_sizes, para=para_sizes, defs=defs,
               titles={u['num']: u['title'] for u in units}), open(sys.argv[2], 'w'), indent=1)
