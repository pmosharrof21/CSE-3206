from pathlib import Path
s=Path('d:/HotelManagement/frontend/src/App.jsx').read_text(encoding='utf-8')
idx=s.find('Explore hotels')
print('idx', idx)
if idx!=-1:
    print(s[idx-120:idx+120])
else:
    print('not found')
