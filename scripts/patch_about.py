from pathlib import Path
import re
p=Path('d:/HotelManagement/frontend/src/App.jsx')
s=p.read_text(encoding='utf-8')
pattern=re.compile(r'className="about-hero">.*?</div></section>', re.S)
new='''className="about-hero"><div className="about-copy"><p className="eyebrow">ABOUT STAYFINDER</p><h2>Discover stays across Bangladesh</h2><p className="lead">We make finding and booking hotels simple — curated listings, clear pricing, and local support so you can travel with confidence.</p><div className="hero-actions"><button onClick={() => setPage('home')}>Back to home</button><button className="ghost" onClick={() => setPage('booking')}>Explore hotels</button></div></div><div className="about-image"><img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80" alt="Hotel scene" /></div></div></section>'''
if pattern.search(s):
    s2=pattern.sub(new, s, count=1)
    p.write_text(s2, encoding='utf-8')
    print('patched')
else:
    print('pattern not found')
