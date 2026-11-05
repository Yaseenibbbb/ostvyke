"""Creative campaign compositions made exclusively from the existing art library."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
import ast,base64,html,json,csv,shutil,zipfile
import numpy as np
ROOT=Path(__file__).resolve().parent.parent;OUT=Path(__file__).resolve().parent
UI=ROOT/'GothicUI2/GothicUI2/UIElements';FONT=ROOT/'GothicUI2/GothicUI2/Fonts/georgia.ttf'
GOLD='#edbd73';WHITE='#f3eee2';USED={}
for d in ['store/screenshots','brand','social','game','editable','derived','review']:(OUT/d).mkdir(parents=True,exist_ok=True)
# Reuse only the source-only layout engine, without running the previous compositions.
tree=ast.parse((ROOT/'rebrand-assets-only/build_assets_only.py').read_text())
node=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Layout')
exec(compile(ast.Module(body=[node],type_ignores=[]),'layout_engine','exec'))
SHOTS=ROOT/'app icon v1.2/google play screenshots'
KNIGHT=ROOT/'app icon v1.2/Human_03_nobg 2.png'
AV=ROOT/'icons_spells_bosses_cards/AvatarIcons_vol3'
GATE=AV/'No_bg/Elf_01_nobg.png';ALCHEMIST=AV/'No_bg/Monster_09_nobg.png'
gate_source=GATE
# Blend the source portrait's cut shoulder edge into the collage; keep the paintwork intact.
gate_im=Image.open(GATE).convert('RGBA');gate_arr=np.array(gate_im)
edge=np.minimum(np.arange(gate_im.width)/24,1)[None,:]
bottom=np.minimum(np.arange(gate_im.height)[::-1]/12,1)[:,None]
gate_arr[:,:,3]=(gate_arr[:,:,3]*edge*bottom).astype('uint8')
GATE=OUT/'derived/gatekeeper-edge-blend.png';Image.fromarray(gate_arr).save(GATE)
LOGO=ROOT/'game_title/Untitled-2.png';LOGOCROP=(118,102,1226,720)
for p in (ROOT/'rebrand-assets-only/derived').glob('*.png'):shutil.copy2(p,OUT/'derived'/p.name)
def logo(c,x,y,w):c.image(LOGO,x,y,w,crop=LOGOCROP)
def back(c):c.image(UI/'Background_2.png',0,0,c.w,c.h,crop=(1300,0,2515,2160) if c.h>c.w else None)
def jewel(c,color,x,y,w):c.image(OUT/f'derived/gem-{color}.png',x,y,w)
def frame(c,x,y,w):c.image(UI/'TitleFrameMainRaven.png',x,y,w)
def heading(c,a,b):
 c.text(a,540,45,73,WHITE,maxwidth=990)
 c.text(b,540,143,73,GOLD,maxwidth=990)
def lowerlogo(c):logo(c,440,1800,200)
def smoke(c,x,y,w):c.image(ROOT/'GothicUI2/GothicUI2/Effects/Smoke.png',x,y,w)

# Cutout of the actual displayed Purifying Flame card, including its original raven frame.
src=Image.open(SHOTS/'6.png').convert('RGBA').crop((275,855,805,1525))
mask=Image.new('L',src.size);dr=ImageDraw.Draw(mask)
dr.polygon([(119,0),(390,0),(414,16),(446,30),(468,51),(490,61),(515,99),(530,123),(475,110),(459,103),(459,670),(70,670),(70,111),(39,117),(0,119),(19,80),(42,59),(51,34),(78,21)],fill=255)
src.putalpha(mask);src.save(OUT/'derived/purifying-flame-cutout.png')
cardback=Image.open(SHOTS/'1.png').convert('RGBA').crop((50,1720,240,1945));cardback.save(OUT/'derived/card-back.png')
def rotate_asset(path,angle,name):
 im=Image.open(path).convert('RGBA').rotate(angle,resample=Image.Resampling.BICUBIC,expand=True)
 p=OUT/'derived'/name;im.save(p);return p
fan_left=rotate_asset(OUT/'derived/card-back.png',18,'card-back-left.png')
fan_right=rotate_asset(OUT/'derived/card-back.png',-18,'card-back-right.png')
flame=rotate_asset(OUT/'derived/purifying-flame-cutout.png',-8,'flame-tilted.png')
for name,box in [('arcane',(160,480,377,670)),('thunder',(435,480,650,670)),('storm',(710,480,926,670))]:
 Image.open(SHOTS/'4.png').crop(box).save(OUT/f'derived/spell-{name}.png')

# Three alternate icon compositions, with much stronger gem silhouettes.
original=ROOT/'app icon v1.2/google play icon/order of the gems.png'
c=Layout(512,512);c.image(original,0,0,512,512)
jewel(c,'blue',28,347,168);jewel(c,'gold',346,350,146);jewel(c,'red',154,275,240)
c.save('store/app-icon-512.png',alpha=True)
c=Layout(512,512);c.image(UI/'SkillFrameGothic_bg.png',0,0,512,512)
c.image(KNIGHT,-80,0,400,400,flip=True);c.image(GATE,217,10,390,390)
jewel(c,'red',145,300,230);c.save('brand/icon-duel-alternative.png',alpha=True)
c=Layout(512,512);c.image(original,0,0,512,512)
jewel(c,'purple',35,344,155);jewel(c,'blue',334,345,154);jewel(c,'green',151,280,240)
c.save('brand/icon-emerald-alternative.png',alpha=True)

def duel(c,w,h,tag=True):
 back(c)
 smoke(c,w*.18,h*.20,w*.68)
 c.image(KNIGHT,-w*.07,h*.07,w*.47,flip=True)
 c.image(GATE,w*.69,h*.05,w*.47)
 logo(c,w*.26,h*.08,w*.48)
 for col,x,y,s in [('blue',.34,.70,.075),('purple',.585,.70,.075),('red',.445,.66,.11)]:
  jewel(c,col,w*x,h*y,w*s)
 if tag:
  frame(c,w*.27,h*.84,w*.46)
  c.text('EVERY MATCH IS A BATTLE.',w*.50,h*.885,round(w*.018),maxwidth=w*.36)

c=Layout(1024,500);duel(c,1024,500);c.save('store/feature-graphic-1024x500.png')
c=Layout(1920,1080);duel(c,1920,1080);c.save('social/landscape-1920x1080.png')

manifest=[]
def save_shot(c,slug,caption,source):
 file=f'store/screenshots/{slug}.png';c.save(file)
 manifest.append({'file':file,'size':[1080,1920],'caption':caption,'capture':f'app icon v1.2/google play screenshots/{source}.png'})

# 01: a duel poster above a large, intact excerpt of real gameplay.
c=Layout(1080,1920);back(c);smoke(c,160,250,800)
c.image(KNIGHT,-90,230,660,flip=True);c.image(GATE,550,210,670)
heading(c,'MATCH TO','SURVIVE.')
jewel(c,'blue',270,596,145);jewel(c,'purple',670,612,132);jewel(c,'red',416,521,238)
c.image(SHOTS/'1.png',32,800,1016,crop=(0,420,1080,1445));lowerlogo(c)
save_shot(c,'01-match-to-survive','Knight versus Gatekeeper; a captured match-3 board below.',1)

# 02: an enemy gallery leads into a boss encounter, instead of repeating the hero layout.
c=Layout(1080,1920);back(c);heading(c,'THE ORDER','FIGHTS BACK.')
for i,name in enumerate(['The Gatekeeper.png','Protector of the Order.png','The Alchemist.png']):
 x=25+i*350;c.image(UI/'SkillFrameGothic_bg.png',x,285,330,330)
 c.image(AV/'boss avatar'/name,x+10,295,310,310)
c.image(SHOTS/'2.png',32,660,1016,crop=(0,420,1080,1445))
frame(c,50,1640,980);c.text('DIFFERENT FOES. DIFFERENT TACTICS.',540,1698,32,maxwidth=780)
lowerlogo(c);save_shot(c,'02-the-order-fights-back','Three original bosses and the captured Protector encounter.',2)

# 03: cards break out of the screenshot, then the real capture proves their effect.
c=Layout(1080,1920);back(c);heading(c,'ONE CARD.','CHANGE THE FIGHT.')
smoke(c,120,210,800)
c.image(fan_left,180,350,325);c.image(fan_right,610,350,325);c.image(flame,310,270,460)
jewel(c,'gold',50,615,150);jewel(c,'purple',900,590,120)
c.image(SHOTS/'6.png',70,910,940,crop=(0,420,1080,1515))
save_shot(c,'03-one-card','Original Purifying Flame card featured above its captured use during battle.',6)

# 04: a deck fan uses the actual card back and card artwork, above the loadout UI.
c=Layout(1080,1920);back(c);heading(c,'YOUR HAND.','YOUR STRATEGY.')
c.image(fan_left,180,295,300);c.image(fan_right,600,295,300)
c.image(OUT/'derived/purifying-flame-cutout.png',375,265,320)
c.image(SHOTS/'3.png',70,760,940,crop=(0,340,1080,1520))
lowerlogo(c);save_shot(c,'04-your-hand','A fan of existing cards above the original card loadout screen.',3)

# 05: a spell triptych, using the exact spell images already displayed in the game.
c=Layout(1080,1920);back(c);heading(c,'CHOOSE YOUR','KIND OF POWER.')
for j,name in enumerate(['arcane','thunder','storm']):
 c.image(OUT/f'derived/spell-{name}.png',26+j*350,320,328)
for j,title in enumerate(['ARCANE BOLT','THUNDER BOLT','HOLY STORM']):c.text(title,190+j*350,652,25,maxwidth=300)
c.image(SHOTS/'4.png',32,805,1016,crop=(0,350,1080,1315))
lowerlogo(c);save_shot(c,'05-choose-your-power','Original spell images enlarged above the captured spell loadout.',4)

# 06: a monumental knight and an actual leaderboard create the final aspiration.
c=Layout(1080,1920);back(c);heading(c,'LEAVE YOUR NAME','IN THE CRYPT.')
c.image(AV/'playeravatar avatar/God_Athena.png',34,420,300)
c.image(AV/'playeravatar avatar/FrostMage.png',748,420,300)
c.image(KNIGHT,262,230,556)
c.image(SHOTS/'5.png',80,790,920,crop=(0,160,1080,1320))
lowerlogo(c);save_shot(c,'06-leave-your-name','Original knight and avatars above the Crypt of Knights leaderboard.',5)

c=Layout(1080,1080);back(c);smoke(c,100,150,880)
c.image(KNIGHT,-150,230,760,flip=True);c.image(GATE,540,230,760)
logo(c,210,40,660);jewel(c,'blue',220,760,180);jewel(c,'purple',690,790,150);jewel(c,'red',420,675,260)
frame(c,145,930,790);c.text('EVERY MATCH IS A BATTLE.',540,980,30,maxwidth=650)
c.save('social/square-1080x1080.png')
c=Layout(1080,1920);back(c);logo(c,90,80,900)
c.image(KNIGHT,-190,730,860,flip=True);c.image(GATE,550,720,860)
heading_y=650
c.text('EVERY MATCH',540,620,71,WHITE,maxwidth=970);c.text('IS A BATTLE.',540,715,71,GOLD,maxwidth=970)
jewel(c,'blue',220,1400,170);jewel(c,'purple',700,1420,150);jewel(c,'red',403,1300,270)
frame(c,85,1650,910);c.text('MATCH-3 • SPELLS • BOSS BATTLES',540,1704,34,maxwidth=760)
c.save('social/story-1080x1920.png')

c=Layout(1080,1920);back(c);logo(c,90,90,900)
c.image(KNIGHT,170,740,740)
jewel(c,'blue',170,1400,160);jewel(c,'purple',765,1410,150);jewel(c,'red',410,1320,265)
c.image(ROOT/'splash screen-logo-Mainaccount logo/Ostvyke Games.png',400,1700,280,crop=(175,84,851,580))
c.save('game/splash-1080x1920.png')

c=Layout(2048,1536);back(c)
c.image(OUT/'store/feature-graphic-1024x500.png',20,20,1420,693)
for i,name in enumerate(['store/app-icon-512.png','brand/icon-duel-alternative.png','brand/icon-emerald-alternative.png']):
 c.image(OUT/name,1490+(i%2)*270,40+(i//2)*285,245,245)
for i,item in enumerate(manifest):c.image(OUT/item['file'],30+i*336,760,310,551)
c.text('ORDER OF THE GEM • THE DUEL CAMPAIGN',1024,1410,45,maxwidth=1850)
c.save('review/creative-overview.png')
(OUT/'asset-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
(OUT/'source-provenance.json').write_text(json.dumps({'policy':'Only supplied game artwork. No AI-generated images. Composition, cutouts, transparent-edge blending, crops, scaling and card rotation only.','selected_sources':list(USED)+[str(gate_source.relative_to(ROOT))],'gatekeeper_cutout_match':'Elf_01_nobg.png matches The Gatekeeper.png foreground','alchemist_cutout_match':'Monster_09_nobg.png matches The Alchemist.png foreground'},indent=2),encoding='utf-8')
print('Creative campaign built from existing artwork only.')
