from pathlib import Path
p=Path('d:/HotelManagement/frontend/src/App.jsx')
s=p.read_text(encoding='utf-8')
old=''<button className="ghost" onClick={() => setPage('booking')}>Explore hotels</button>''
# fallback: replace substring without escaping
s2=s.replace('<button className="ghost" onClick={() => setPage(\'booking\')}>Explore hotels</button>','')
# also try another variant
s2=s2.replace('<button className="ghost" onClick={() => setPage("booking")}>Explore hotels</button>','')
if s2!=s:
    p.write_text(s2, encoding='utf-8')
    print('removed')
else:
    # attempt regex remove
    import re
    s3=re.sub(r"<button[^>]*>\s*Explore hotels\s*</button>", '', s, flags=re.S)
    if s3!=s:
        p.write_text(s3, encoding='utf-8')
        print('removed-regex')
    else:
        print('not-found')
