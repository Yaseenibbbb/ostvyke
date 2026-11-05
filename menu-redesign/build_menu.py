"""Main-menu design. Existing painted assets, new layout and transparent compositing."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps,ImageFilter
import ast,base64,html,json,shutil,math
import numpy as np
ROOT=Path(__file__).resolve().parent.parent;OUT=Path(__file__).resolve().parent
SOURCE=ROOT if (ROOT/'GothicUI2').exists() else ROOT/'assets'
UI=SOURCE/'GothicUI2/GothicUI2/UIElements'
FONT=SOURCE/'GothicUI2/GothicUI2/Fonts/georgia.ttf'
GOLD='#e6bc7a';WHITE='#eee7d9';USED={}
for d in ['exports','assets','editable','review']:(OUT/d).mkdir(exist_ok=True)
tree=ast.parse((ROOT/'rebrand-assets-only/build_assets_only.py').read_text())
node=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Layout')
exec(compile(ast.Module(body=[node],type_ignores=[]),'layout_engine','exec'))

def nine_slice(path,w,h,name,b=170):
 source=Image.open(path).convert('RGBA');sw,sh=source.size
 b=min(b,sw//3,sh//3,w//3,h//3);dest=Image.new('RGBA',(w,h))
 xs=[0,b,sw-b,sw];ys=[0,b,sh-b,sh];dx=[0,b,w-b,w];dy=[0,b,h-b,h]
 for j in range(3):
  for i in range(3):
   tile=source.crop((xs[i],ys[j],xs[i+1],ys[j+1])).resize((dx[i+1]-dx[i],dy[j+1]-dy[j]),Image.Resampling.LANCZOS)
   dest.alpha_composite(tile,(dx[i],dy[j]))
 dest.save(OUT/'assets'/name);return OUT/'assets'/name

def faded(path,name,side=0,bottom=0):
 im=Image.open(path).convert('RGBA');a=np.array(im);h,w=a.shape[:2];fade=np.ones((h,w))
 if side:fade*=np.minimum(np.minimum(np.arange(w),np.arange(w)[::-1])/side,1)[None,:]
 if bottom:fade*=np.minimum(np.arange(h)[::-1]/bottom,1)[:,None]
 a[:,:,3]=(a[:,:,3]*fade).astype('uint8');Image.fromarray(a).save(OUT/'assets'/name);return OUT/'assets'/name

# Grounding shadow is a new transparent utility asset, not new painted illustration.
shadow=Image.new('RGBA',(900,220));d=ImageDraw.Draw(shadow);d.ellipse((90,60,820,150),fill=(0,0,0,180));shadow=shadow.filter(ImageFilter.GaussianBlur(32));shadow.save(OUT/'assets/knight-ground-shadow.png')
# Vignette keeps the existing texture, while giving the hero and controls more contrast.
yy,xx=np.mgrid[0:2340,0:1080];r=((xx-620)/850)**2+((yy-900)/1450)**2
alpha=np.clip(r*160,0,220).astype('uint8');v=np.zeros((2340,1080,4),dtype='uint8');v[:,:,3]=alpha
Image.fromarray(v).save(OUT/'assets/vignette.png')
sigil=Image.open(UI/'HeroRankFrame.png').convert('RGBA');sigil.putalpha(sigil.getchannel('A').point(lambda x:round(x*.28)));sigil.save(OUT/'assets/hero-sigil.png')
smoke=Image.open(SOURCE/'GothicUI2/GothicUI2/Effects/Smoke.png').convert('RGBA');smoke.putalpha(smoke.getchannel('A').point(lambda x:round(x*.42)));smoke.save(OUT/'assets/ambient-smoke.png')

profile=nine_slice(UI/'BasicWindow_Square.png',984,176,'profile-panel.png',90)
tile=nine_slice(UI/'BasicWindow_Square.png',470,380,'navigation-tile.png',100)
crypt=nine_slice(UI/'BasicWindow_Square.png',984,200,'crypt-panel.png',80)
knight=SOURCE/'GothicUI2/GothicUI2/Characters/Character_Knight.png'
logo=SOURCE/'game_title/Untitled-2.png';logo_crop=(118,102,1226,720)
spells=SOURCE/'icons_spells_bosses_cards/2000_Icons/Update_icons/skill_b_No_bg'
spell=spells/'22_Big_Light_arrow_nobg.png'
cardback=ROOT/'rebrand-creative/derived/card-back.png'

c=Layout(1080,2340)
c.image(UI/'Background_1.png',0,0,1080,2340,crop=(1420,0,2417,2160))
c.image(OUT/'assets/ambient-smoke.png',-150,600,1250)
c.image(OUT/'assets/vignette.png',0,0,1080,2340)
# Bounded top bar: one profile destination and one menu/settings control.
c.image(profile,48,60,984,176)
c.image(SOURCE/'app icon v1.2/google play icon/order of the gems.png',68,79,136,136)
profile_clean=c.im.crop((225,90,835,142))
c.text('ContemplativeEnhanced…',530,95,36,WHITE,maxwidth=570)
c.text('KNIGHT  •  RANK —',421,151,27,'#bcab92')
c.image(SOURCE/'GothicUI2/GothicUI2/UIIcons/StatsIconTiny.png',710,145,32)
c.text('0',778,150,26,GOLD)
c.image(UI/'SquareGrayButton_Normal.png',892,91,108,108)
c.image(SOURCE/'GothicUI2/GothicUI2/UIIcons/MenuIconTiny.png',920,119,52,52)

# Hero: reuse the silver logo, monumental frame and full-resolution knight.
c.image(logo,80,300,590,crop=logo_crop)
c.image(OUT/'assets/hero-sigil.png',310,540,720,720)
c.image(OUT/'assets/knight-ground-shadow.png',226,1077,800,196)
c.image(knight,285,475,770)
c.text('THE ORDER',225,710,38,GOLD)
c.text('AWAITS.',225,764,52,WHITE)
c.text('Match gems.',210,856,26,'#cbbfac')
c.text('Cast spells.',209,900,26,'#cbbfac')
c.text('Defy the dark.',221,944,26,'#cbbfac')
# Two small original gems bring the puzzle element into the hero scene.
c.image(ROOT/'rebrand-assets-only/derived/gem-red.png',106,1032,108)
c.image(ROOT/'rebrand-assets-only/derived/gem-blue.png',209,1070,78)

# One primary action. The secondary label explains where it goes.
c.image(UI/'GameButtonRed_Normal.png',40,1265,1000,274)
c.text('PLAY',540,1350,80,WHITE)
c.text('ENTER THE NEXT BATTLE',540,1450,26,GOLD)

# Illustrated secondary actions sit side by side, outside a shared button stack.
for x in [48,562]:c.image(tile,x,1580,470,380)
c.image(spell,174,1600,220,220)
c.text('SPELLS',283,1843,45,WHITE)
c.text('Shape your power',283,1911,28,'#b8a991')
c.image(ROOT/'rebrand-creative/derived/card-back-left.png',647,1620,170)
c.image(ROOT/'rebrand-creative/derived/card-back-right.png',786,1620,170)
c.image(ROOT/'rebrand-creative/derived/purifying-flame-cutout.png',715,1600,180)
c.text('CARDS',797,1843,45,WHITE)
c.text('Build your strategy',797,1911,28,'#b8a991')

# The existing leaderboard becomes a distinct horizontal destination.
c.image(crypt,48,2005,984,200)
c.image(SOURCE/'GothicUI2/GothicUI2/GameIcons/Class_Paladin_G.png',90,2035,134,134)
c.text('CRYPT OF KNIGHTS',554,2055,36,GOLD,maxwidth=680)
c.text('Leaderboard',554,2121,30,'#cbbfac')
c.image(SOURCE/'GothicUI2/GothicUI2/UIIcons/ArrowRightTiny.png',928,2084,40,40)

# Sound and music remain independent, with plain labels and no large floating icons.
c.image(SOURCE/'GothicUI2/GothicUI2/GameIcons/Class_Bard_G.png',363,2250,54,54)
footer_clean=c.im.crop((0,2240,1080,2310))
c.text('MUSIC ON',505,2267,26,'#b6a690')
c.text('SOUND ON',760,2267,26,'#b6a690')
c.image(UI/'DecoratedLineHorizontal.png',390,2310,300)
c.save('exports/main-menu-1080x2340.png')
base=c.im.copy();base.paste(profile_clean,(225,90));base.paste(footer_clean,(0,2240));base.convert('RGB').save(OUT/'assets/menu-prototype-base.png')

# Unity-ready visual layers and their unchanged source art.
copies={
 'knight.png':knight,'background.png':UI/'Background_1.png',
 'play-normal.png':UI/'GameButtonRed_Normal.png','play-hover.png':UI/'GameButtonRed_Hovered.png','play-pressed.png':UI/'GameButtonRed_Pressed.png',
 'settings-button.png':UI/'SquareGrayButton_Normal.png',
 'settings-icon.png':SOURCE/'GothicUI2/GothicUI2/UIIcons/MenuIconTiny.png',
 'spell-art.png':spell,'card-back.png':cardback,
 'card-featured.png':ROOT/'rebrand-creative/derived/purifying-flame-cutout.png',
 'crypt-crest.png':SOURCE/'GothicUI2/GothicUI2/GameIcons/Class_Paladin_G.png',
 'arrow.png':SOURCE/'GothicUI2/GothicUI2/UIIcons/ArrowRightTiny.png',
 'music-icon.png':SOURCE/'GothicUI2/GothicUI2/GameIcons/Class_Bard_G.png',
 'profile-avatar.png':SOURCE/'app icon v1.2/google play icon/order of the gems.png'
}
for name,path in copies.items():shutil.copy2(path,OUT/'assets'/name)
Image.open(logo).crop(logo_crop).save(OUT/'assets/logo.png')
for name,number,crop in [('battle',1,(0,420,1080,1445)),('spells',4,(0,350,1080,1315)),('cards',3,(0,340,1080,1520)),('leaderboard',5,(0,160,1080,1320))]:
 Image.open(SOURCE/f'app icon v1.2/google play screenshots/{number}.png').crop(crop).save(OUT/f'assets/preview-{name}.png')

# A second, more conservative avatar option keeps the familiar player portrait.
# The principal export uses only supplied artwork; no image-generation tool is used.
Image.open(OUT/'exports/main-menu-1080x2340.png').resize((540,1170),Image.Resampling.LANCZOS).save(OUT/'exports/main-menu-preview.png')
before=Image.open('C:/Users/yasee/.codex/codex-remote-attachments/01a1a276-f4cd-7f11-accc-8d92b12c7f5d/86041B19-95A1-4478-A299-EE7B9BA57829/1-Photo-1.jpg').convert('RGB')
before=ImageOps.fit(before,(540,1170),Image.Resampling.LANCZOS)
after=Image.open(OUT/'exports/main-menu-preview.png').convert('RGB')
comparison=Image.new('RGB',(1180,1290),'#131110');comparison.paste(before,(30,85));comparison.paste(after,(610,85))
dr=ImageDraw.Draw(comparison);f=ImageFont.truetype(str(FONT),29)
dr.text((30,25),'CURRENT MENU',font=f,fill='#a99d8e');dr.text((610,25),'REDESIGNED MENU',font=f,fill=GOLD)
comparison.save(OUT/'review/before-after.png')

manifest={'canvas':[1080,2340],'artwork':'Existing hand-painted assets; new layout, panel slicing, shadow and vignette only.','sources':list(USED),'hotspots':{'profile':[48,60,824,176],'settings':[892,91,108,108],'play':[40,1265,1000,274],'spells':[48,1580,470,380],'cards':[562,1580,470,380],'leaderboard':[48,2005,984,200],'music':[345,2235,255,90],'sound':[635,2235,260,90]}}
(OUT/'menu-layout.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Main menu and before/after preview exported.')
