from pathlib import Path
p=Path('d:/HotelManagement/frontend/src/App.jsx')
s=p.read_text(encoding='utf-8')
start_token="{page === 'about' ? <section className=\"section about-page\">"
start=s.find(start_token)
if start==-1:
    print('start token not found')
else:
    # find the closing </section> that ends the about block
    end=s.find('</section>', start)
    if end==-1:
        print('end not found')
    else:
        end+=len('</section>')
        new_section='''{page === 'about' ? <section className="section about-page"><div className="about-hero"><div className="about-copy"><p className="eyebrow">ABOUT STAYFINDER</p><h2>Discover stays across Bangladesh</h2><p className="lead">We make finding and booking hotels simple — curated listings, clear pricing, and local support so you can travel with confidence.</p><div className="hero-actions"><button onClick={() => setPage('home')}>Back to home</button></div></div><div className="about-image"><img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80" alt="Hotel scene" /></div>
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
        </div>
      </section>'''
        s2=s[:start]+new_section+s[end:]
        p.write_text(s2, encoding='utf-8')
        print('replaced')
