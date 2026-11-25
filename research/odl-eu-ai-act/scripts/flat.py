import json,sys
d=json.load(open(sys.argv[1]))
out=[]
def walk(n,depth):
    t=n.get('type')
    extra=''
    if t=='heading': extra=f"H{n.get('heading level')}"
    if t=='list': extra=f"style={n.get('numbering style')} n={n.get('number of list items')} prev={n.get('previous list id')} next={n.get('next list id')}"
    c=(n.get('content') or '')
    out.append((depth,t,n.get('id'),n.get('page number'),extra,len(c),c[:110].replace('\n','\\n')))
    for k in ('kids','list items'):
        for x in n.get(k,[]) or []: walk(x,depth+1)
for k in d['kids']: walk(k,0)
for o in out: print('  '*o[0]+f"{o[1]}#{o[2]} p{o[3]} {o[4]} [{o[5]}] {o[6]}")
