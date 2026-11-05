"""Source-art-only store refresh. No generated artwork, redrawing or recoloring.
Run: python rebrand-assets-only/build_assets_only.py
Requires Pillow and numpy. Every composition also exports a self-contained editable SVG.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import numpy as np
import base64, html, json, csv, shutil
from collections import deque

ROOT=Path(__file__).resolve().parent.parent
OUT=Path(__file__).resolve().parent
UI=ROOT/'GothicUI2/GothicUI2/UIElements'
SHOTS=ROOT/'app icon v1.2/google play screenshots'
FONT=ROOT/'GothicUI2/GothicUI2/Fonts/georgia.ttf'
GOLD='#edbd73';WHITE='#f3eee2'
for name in ['store/screenshots','brand','game/launcher','social','editable','derived','review']:
 (OUT/name).mkdir(parents=True,exist_ok=True)
USED={}

class Layout:
 def __init__(self,w,h,transparent=False):
  self.w=w;self.h=h;self.im=Image.new('RGBA',(w,h),(0,0,0,0) if transparent else '#171515');self.layers=[];self.svg=[]
 def image(self,path,x,y,w=None,h=None,crop=None,flip=False):
  path=Path(path);source=Image.open(path).convert('RGBA');ow,oh=source.size
  im=source.crop(crop) if crop else source
  if flip:im=ImageOps.mirror(im)
  if w is None:w=im.width
  if h is None:h=round(w*im.height/im.width)
  im=im.resize((round(w),round(h)),Image.Resampling.LANCZOS)
  self.im.alpha_composite(im,(round(x),round(y)))
  rel=str(path.relative_to(ROOT));USED[rel]=True
  self.layers.append({'type':'image','source':rel,'x':x,'y':y,'width':w,'height':h,'crop':crop,'flip':flip})
  data=base64.b64encode(path.read_bytes()).decode()
  a,b,c,d=crop if crop else (0,0,ow,oh)
  transform=f'translate({2*x+w} 0) scale(-1 1)' if flip else ''
  self.svg.append(f'<g transform="{transform}"><svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="{a} {b} {c-a} {d-b}" overflow="hidden"><image width="{ow}" height="{oh}" href="data:image/png;base64,{data}"/></svg></g>')
 def text(self,s,cx,y,size=44,color=GOLD,maxwidth=None):
  f=ImageFont.truetype(str(FONT),size);dr=ImageDraw.Draw(self.im)
  while maxwidth and dr.textlength(s,font=f)>maxwidth:
   size-=1;f=ImageFont.truetype(str(FONT),size)
  width=dr.textlength(s,font=f);x=cx-width/2
  dr.text((x+1,y+2),s,font=f,fill='#090808',anchor='lt')
  dr.text((x,y),s,font=f,fill=color,anchor='lt')
  self.layers.append({'type':'text','text':s,'x':x,'y':y,'size':size,'color':color,'font':str(FONT.relative_to(ROOT))})
  self.svg.append(f'<text x="{x}" y="{y}" dominant-baseline="text-before-edge" font-family="Georgia" font-size="{size}" fill="{color}">{html.escape(s)}</text>')
 def save(self,name,alpha=False):
  p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True)
  self.im.convert('RGBA' if alpha else 'RGB').save(p,compress_level=6)
  (OUT/'editable'/f'{p.stem}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}">'+''.join(self.svg)+'</svg>',encoding='utf-8')
  (OUT/'editable'/f'{p.stem}.layers.json').write_text(json.dumps({'width':self.w,'height':self.h,'layers':self.layers},indent=2),encoding='utf-8')

def bg(c):c.image(UI/'Background_1.png',0,0,c.w,c.h,crop=(1300,0,2515,2160) if c.h>c.w else None)
LOGO=ROOT/'game_title/Untitled-2.png';LOGOCROP=(118,102,1226,720)
def logo(c,x,y,w):c.image(LOGO,x,y,w,crop=LOGOCROP)
KNIGHT=ROOT/'app icon v1.2/Human_03_nobg 2.png'
def header(c,title):
 logo(c,365,10,350)
 c.image(UI/'TitleFrameMain.png',5,204,1070)
 c.text(title,540,266,48,maxwidth=800)

# The gems are isolated from the supplied screenshot, preserving their actual paintwork.
gem_regions={'blue':(64,735,176,843),'green':(58,853,180,965),'red':(184,734,296,846),'gold':(307,734,417,844),'purple':(665,735,779,845)}
for name,box in gem_regions.items():
 im=Image.open(SHOTS/'1.png').crop(box).convert('RGBA');arr=np.array(im)
 rgb=arr[:,:,:3].astype(float);reference=rgb[0,0];eligible=np.linalg.norm(rgb-reference,axis=2)<55
 seen=np.zeros(eligible.shape,bool);q=deque()
 hh,ww=eligible.shape
 for x in range(ww):q.extend([(0,x),(hh-1,x)])
 for y in range(hh):q.extend([(y,0),(y,ww-1)])
 while q:
  y,x=q.popleft()
  if not (0<=y<hh and 0<=x<ww) or seen[y,x] or not eligible[y,x]:continue
  seen[y,x]=True;q.extend([(y-1,x),(y+1,x),(y,x-1),(y,x+1)])
 arr[:,:,3][seen]=0
 Image.fromarray(arr).save(OUT/f'derived/gem-{name}.png')

ORIGINAL_ICON=ROOT/'app icon v1.2/google play icon/order of the gems.png'
icon=Layout(512,512);icon.image(ORIGINAL_ICON,0,0,512,512)
icon.image(OUT/'derived/gem-blue.png',278,385,103)
icon.image(OUT/'derived/gem-gold.png',420,389,80)
icon.image(OUT/'derived/gem-green.png',350,373,132)
icon.save('store/app-icon-512.png',alpha=True)
for size in [48,72,96,144,192,256,432,1024]:
 icon.im.resize((size,size),Image.Resampling.LANCZOS).save(OUT/f'game/launcher/icon-{size}.png')
clean=Layout(512,512);clean.image(ORIGINAL_ICON,0,0,512,512);clean.save('brand/icon-knight-only-alternative.png',alpha=True)

# Preserve the existing hand-crafted identity instead of replacing it.
c=Layout(1108,618,True);c.image(LOGO,0,0,1108,618,crop=LOGOCROP);c.save('brand/existing-logo-trimmed.png',alpha=True)

def feature(name,w,h):
 c=Layout(w,h);bg(c)
 # All decorative framing is from the supplied GothicUI pack.
 c.image(UI/'CornerSlide.png',w*.76,0,w*.24,w*.24)
 c.image(ORIGINAL_ICON,w*.655,h*.055,w*.32,w*.32)
 logo(c,w*.065,h*.10,w*.51)
 c.image(UI/'TitleFrameBig.png',w*.035,h*.765,w*.60)
 c.text('MATCH GEMS. DEFEAT BOSSES.',w*.335,h*.807,round(w*.018),maxwidth=w*.49)
 for j,col in enumerate(['blue','red','green','gold','purple']):
  c.image(OUT/f'derived/gem-{col}.png',w*(.625+j*.069),h*.765,w*.061)
 c.save(name)
feature('store/feature-graphic-1024x500.png',1024,500)
feature('social/landscape-1920x1080.png',1920,1080)

specs=[
 ('01-match-and-battle',1,'MATCH GEMS. FIGHT BOSSES.',(0,420,1080,1445),'The Gatekeeper encounter and original match-3 board.'),
 ('02-boss-encounters',2,'OUTSMART THE ORDER.',(0,420,1080,1445),'The Protector of the Order encounter with a captured magical board effect.'),
 ('03-cards-in-battle',6,'TURN THE TIDE WITH CARDS.',(0,420,1080,1510),'Purifying Flame displayed during the Alchemist battle.'),
 ('04-collect-cards',3,'BUILD YOUR CARD LOADOUT.',(0,340,1080,1520),'The original card collection and equipped card slots.'),
 ('05-equip-spells',4,'EQUIP YOUR SPELLS.',(0,350,1080,1315),'The original Arcane Bolt, Thunder Bolt and Holy Storm spell loadout.'),
 ('06-crypt-of-knights',5,'CLIMB THE CRYPT OF KNIGHTS.',(0,160,1080,1320),'The captured Crypt of Knights leaderboard.')
]
manifest=[]
for idx,(slug,source,title,crop,alt) in enumerate(specs):
 c=Layout(1080,1920);bg(c);header(c,title)
 shot=SHOTS/f'{source}.png';height=round(1016*(crop[3]-crop[1])/1080)
 c.image(shot,32,384,1016,height,crop=crop)
 if idx<3:
  # A second crop shows the actual player/spell controls without the old promotional caption.
  lower_y=384+height+24
  lower_w=min(1016,round((1780-lower_y)*1080/460))
  c.image(shot,(1080-lower_w)//2,lower_y,lower_w,crop=(0,1940,1080,2400))
 elif idx==3:
  # Include the lower card entry from the same captured screen.
  c.image(shot,32,384+height+20,1016,crop=(0,1805,1080,2050))
 elif idx==4:
  # Supplied avatars are presented as art, below the captured menu.
  yy=384+height+65
  for j,name in enumerate(['Human_03.png','God_Athena.png','FrostMage.png']):
   c.image(ROOT/'icons_spells_bosses_cards/AvatarIcons_vol3/playeravatar avatar'/name,160+j*270,yy,220,220)
 else:
  yy=384+height+30
  for j,name in enumerate(['The Gatekeeper.png','Protector of the Order.png','The Alchemist.png']):
   c.image(ROOT/'icons_spells_bosses_cards/AvatarIcons_vol3/boss avatar'/name,160+j*270,yy,220,220)
 c.image(UI/'DecoratedLineHorizontal.png',140,1800,800)
 c.text('ORDER OF THE GEM',540,1850,26)
 file=f'store/screenshots/{slug}.png';c.save(file)
 manifest.append({'file':file,'width':1080,'height':1920,'capture':str(shot.relative_to(ROOT)),'crop':crop,'alt_text':alt})

c=Layout(1080,1920);bg(c);logo(c,105,110,870)
c.image(UI/'SkillFrameGothic_bg.png',190,730,700,700);c.image(KNIGHT,210,730,660,660)
c.image(UI/'TitleFrameMain.png',60,1450,960)
c.text('MATCH-3 PUZZLE RPG',540,1505,39)
c.image(ROOT/'splash screen-logo-Mainaccount logo/Ostvyke Games.png',420,1730,240,crop=(175,84,851,580))
c.save('game/splash-1080x1920.png')

c=Layout(1080,1080);bg(c);logo(c,120,35,840)
c.image(KNIGHT,340,480,570,570)
c.image(ROOT/'icons_spells_bosses_cards/AvatarIcons_vol3/boss avatar/The Gatekeeper.png',30,600,250,250)
for j,col in enumerate(['blue','red','green','gold','purple']):c.image(OUT/f'derived/gem-{col}.png',40+j*88,925,80)
c.save('social/square-1080x1080.png')

c=Layout(1080,1920);bg(c);logo(c,120,120,840)
c.image(KNIGHT,170,700,740,740)
c.image(UI/'TitleFrameMain.png',20,1500,1040);c.text('MATCH GEMS. DEFEAT BOSSES.',540,1560,42,maxwidth=810)
for j,col in enumerate(['blue','red','green','gold','purple']):c.image(OUT/f'derived/gem-{col}.png',240+j*125,1735,100)
c.save('social/story-1080x1920.png')

(OUT/'asset-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
(OUT/'source-provenance.json').write_text(json.dumps({'artwork_policy':'Only supplied artwork. No AI-generated images, redrawn assets or recoloring.','selected_sources':list(USED),'gem_extraction_source':'app icon v1.2/google play screenshots/1.png','gem_crop_regions':gem_regions},indent=2),encoding='utf-8')
if (ROOT/'rebrand/source-library-inventory.csv').exists():shutil.copy2(ROOT/'rebrand/source-library-inventory.csv',OUT/'source-library-inventory.csv')

c=Layout(1920,1450);bg(c);logo(c,60,40,460)
c.image(OUT/'store/app-icon-512.png',80,340,290,290)
c.image(OUT/'store/feature-graphic-1024x500.png',450,270,1390,679)
for idx,item in enumerate(manifest):c.image(OUT/item['file'],70+idx*303,920,270,480)
c.save('review/overview.png')
print('Source-only kit complete:',len(list((OUT/'store/screenshots').glob('*.png'))),'screenshots; icon; feature graphic; splash; social; editable SVGs.')
