from pathlib import Path
import re
p=Path('d:/HotelManagement/frontend/src/App.jsx')
s=p.read_text(encoding='utf-8')
# remove any button element whose inner text includes 'Explore hotels'
s2=re.sub(r"<button[^>]*>\s*Explore hotels\s*</button>", '', s, flags=re.IGNORECASE)
if s2!=s:
    p.write_text(s2, encoding='utf-8')
    print('removed')
else:
    print('not-found')
