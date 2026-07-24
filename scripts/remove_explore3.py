from pathlib import Path
p=Path('d:/HotelManagement/frontend/src/App.jsx')
s=p.read_text(encoding='utf-8')
idx=s.find('Explore hotels')
if idx==-1:
    print('not found')
else:
    start_btn=s.rfind('<button',0,idx)
    end_btn=s.find('</button>',idx)
    if start_btn==-1 or end_btn==-1:
        print('button tags not found')
    else:
        end_btn+=len('</button>')
        s2=s[:start_btn]+s[end_btn:]
        p.write_text(s2, encoding='utf-8')
        print('removed')
