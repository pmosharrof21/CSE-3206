from pathlib import Path
import re
p=Path('d:/HotelManagement/frontend/src/App.jsx')
s=p.read_text(encoding='utf-8')
# remove Explore hotels button inside hero-actions
s=re.sub(r'<div className="hero-actions">\s*<button[^>]*>\s*Back to home\s*</button>\s*<button[^>]*>.*?</button>\s*</div>',
         '<div className="hero-actions"><button onClick={() => setPage(\'home\')}>Back to home</button></div>', s, flags=re.S)
# insert about-content before the section close for about page
insert_after='</div></div></section>'
idx=s.find('className="about-hero"')
if idx!=-1:
    # find the first occurrence of the closing that belongs to the about section after this index
    close_idx=s.find('</div></section>', idx)
    if close_idx!=-1:
        # construct new about-content
        content='''</div>
        <div className="about-content">
          <div className="about-block">
            <h3>Our Story</h3>
            <p>Born from a love of travel, StayFinder connects travelers with trusted local hotels across Bangladesh. We handpick properties for quality, value, and comfort so planning a trip becomes part of the joy.</p>
          </div>
          <div className="about-block">
            <h3>How it works</h3>
            <p>Search by city or dates, compare verified rooms, and reserve instantly. Your bookings, receipts, and trip details live in one dashboard for easy management.</p>
          </div>
          <div className="about-block">
            <h3>Safety & Cleanliness</h3>
            <p>We prioritize properties that follow clear cleanliness protocols and provide accurate, recent photographs so you know what to expect on arrival.</p>
          </div>
          <div className="about-block">
            <h3>Local tips</h3>
            <p>Each listing includes neighborhood notes and recommended attractions so you can discover nearby gems beyond the hotel doorstep.</p>
          </div>
          <div className="gallery">
            <img src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80" alt="lobby" />
            <img src="https://images.unsplash.com/photo-1496412705862-e0088f16f791?auto=format&fit=crop&w=900&q=80" alt="room" />
            <img src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80" alt="pool" />
          </div>
        </div>\n      </section>'''
        # replace the first occurrence of the old closing with the new content
        # find the exact substring '</div></div></section>' after about-image img
        old='</div></div></section>'
        # search for old after the about-hero index
        pos=s.find(old, idx)
        if pos!=-1:
            s=s[:pos]+content+s[pos+len(old):]
            p.write_text(s, encoding='utf-8')
            print('patched')
        else:
            print('closing pattern not found after about-hero')
    else:
        print('about section close not found')
else:
    print('about-hero not found')
