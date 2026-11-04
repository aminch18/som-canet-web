"""Rebuild the static site from the inventoried original public content. No runtime dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from html import escape,unescape
import json,re,urllib.parse
root=Path(__file__).resolve().parents[1]
src=root.parent/'migration-source'
assetmap=json.loads((src/'asset-map.json').read_text())
pdftext=json.loads((src/'pdf-text.json').read_text())
files={p.stem:json.loads(p.read_text()) for p in src.glob('*.json') if isinstance(json.loads(p.read_text()),dict) and 'source' in json.loads(p.read_text())}
slugs={'inici':'index','grup-municipal':'grup-municipal','regiduria':'regidoria','blank':'valoracio-mandat','discurs':'discurs-regidora','revista':'revista','rserra':'raquel-serra','jordiplanet':'jordi-planet','ramonfaucon':'ramon-faucon','ricardmolins':'ricard-molins','joseluiscuba':'jose-luis-cuba','malika':'malika','videos':'videos','programa-electoral-2019':'programa-2019','executiva':'equip','blank-1':'equip','somhistoria':'historia','creu-de-sant-jordi-2016':'sant-jordi-2016','raquelserra':'notes-de-premsa','contacto':'contacte'}
urlmap={d['source'].rstrip('/'):slugs[k]+'.html' for k,d in files.items() if k in slugs}
posts=sorted([d for k,d in files.items() if k.startswith('entrada-')],key=lambda d:d['source'].split('/single-post/')[1][:10],reverse=True)
for d in posts:urlmap[d['source'].rstrip('/')]=d['slug']+'.html'
def localurl(url):
 if '/raquelserra/inici/hashtags/' in url:return ''
 if url.rstrip('/') in urlmap:return urlmap[url.rstrip('/')]
 if url in assetmap:return assetmap[url]
 base=url.split('/v1/')[0]
 if base in assetmap:return assetmap[base]
 return url if url.startswith(('https://','http://','mailto:','tel:','#')) else ''
class Clean(HTMLParser):
 allowed={'p','h1','h2','h3','h4','h5','h6','strong','b','em','i','u','a','ul','ol','li','blockquote','br','sup','sub','table','tbody','thead','tr','td','th'}
 def __init__(self):super().__init__();self.output=[];self.stack=[];self.skip=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  suppress=tag in {'figure','figcaption','svg','button','script','style','iframe'}
  if suppress:self.skip+=1
  outtag=None
  if not self.skip and tag in self.allowed:
   outtag='h2' if tag in {'h1','h2'} else ('h3' if tag in {'h4','h5','h6'} else tag)
   if tag=='a':
    href=localurl(a.get('href',''))
    self.output.append('<a href="'+escape(href,quote=True)+'">' if href else '<span>')
    if not href:outtag='span'
   else:self.output.append('<'+outtag+'>')
  if tag not in {'br','img','input','hr','meta','link','source','wbr'}:self.stack.append((tag,outtag,suppress))
 def handle_endtag(self,tag):
  pos=next((i for i in range(len(self.stack)-1,-1,-1) if self.stack[i][0]==tag),None)
  if pos is None:return
  for _,out,suppress in self.stack[pos:][::-1]:
   if out:self.output.append('</'+out+'>')
   if suppress:self.skip-=1
  self.stack=self.stack[:pos]
 def handle_data(self,text):
  if not self.skip:self.output.append(escape(text))
 def clean(self,html):
  self.feed(html);text=''.join(self.output).replace('\u200b','')
  for _ in range(4):text=re.sub(r'<(p|li|ul|ol|strong|b|em|i|u|h2|h3)>\s*(?:<br>\s*)*</\1>','',text)
  return text.strip()
def rich(d):
 html=d['html'] if d.get('slug','').startswith('entrada-') else ''.join(b['html'] for b in d.get('blocks',[]))
 return Clean().clean(html)
def imgpath(image):return localurl(image['src'])
def images(d):
 out=[];seen=set()
 for img in d.get('images',[]):
  p=imgpath(img)
  if not p or not p.startswith('assets/') or p in seen:continue
  seen.add(p);out.append({'path':p,'alt':img.get('alt','')})
 return out

def gallery(d):
 imgs=images(d)
 if not imgs:return ''
 content=[]
 for img in imgs:
  alt=img['alt']
  if not alt or re.match(r'^(IMG_|DSC|[a-f0-9-]{20}|\d.*\.jpg)',alt):alt='Imatge original: '+d.get('title',d['label'])
  if len(alt)>180:alt=alt[:177]+'…'
  content.append(f'<figure><a href="{escape(img["path"])}" target="_blank" rel="noopener" aria-label="Amplia la imatge: {escape(alt,quote=True)}"><img src="{img["path"]}" alt="{escape(alt,quote=True)}" loading="lazy"></a><figcaption>Imatge de l’arxiu · <a href="{img["path"]}" target="_blank" rel="noopener">Amplia la imatge ↗</a></figcaption></figure>')
 return '<div class="content-gallery'+(' single' if len(imgs)==1 else '')+'">'+''.join(content)+'</div>'

def pdfs(d):
 return list(dict.fromkeys(localurl(x['url']) for x in d.get('links',[]) if urllib.parse.urlparse(x['url']).path.lower().endswith('.pdf') and localurl(x['url']).startswith('documents/')))
def readerpath(path):return 'document-'+Path(path).stem[-12:]+'.html'
def pdfreader(path,title):
 pages=sorted(root.glob('assets/pdf-pages/'+Path(path).stem+'-*.jpg'))
 if not pages:return ''
 imagepaths=[str(p.relative_to(root)) for p in pages]
 options=''.join(f'<option value="{i}">Pàgina {i+1}</option>' for i in range(len(pages)))
 return '<div class="pdf-reader" data-pages="'+escape(json.dumps(imagepaths),quote=True)+'"><div class="reader-toolbar"><button class="reader-prev" type="button" disabled aria-label="Pàgina anterior">←</button><label>Tria la pàgina <select class="reader-select">'+options+'</select></label><button class="reader-next" type="button" aria-label="Pàgina següent">→</button><span class="reader-status" role="status">Pàgina 1 de '+str(len(pages))+'</span></div><div class="reader-stage"><a class="reader-enlarge" href="'+imagepaths[0]+'" target="_blank" rel="noopener"><img class="reader-image" src="'+imagepaths[0]+'" alt="'+escape(title,quote=True)+' · Pàgina 1" data-document-title="'+escape(title,quote=True)+'" loading="lazy"></a></div><p class="reader-help">Selecciona una pàgina o utilitza les fletxes. Prem sobre la imatge per ampliar-la.</p></div>'
def pdfsection(d,embed=False):
 paths=pdfs(d)
 if not paths:return ''
 links=''
 for i,path in enumerate(paths):
  suffix=f' {i+1}' if len(paths)>1 else ''
  links+=f'<a class="button" href="{readerpath(path)}">Llegeix el document{suffix} →</a><a class="button green" href="{path}" download>Descarrega el PDF{suffix} ↓</a>'
 return '<div class="pdf-links">'+links+'</div>'+(pdfreader(paths[0],d['label']) if embed else '')

def source(d):return f'<p class="source-note">Procedència: web històrica de SOM CANET · <a href="{escape(d["source"],quote=True)}" target="_blank" rel="noopener">Consulta la font original ↗</a></p>'
logo=localurl(json.loads((src/'brand.json').read_text())['src'])
nav=[('projecte','El projecte'),('grup-municipal','Grup municipal'),('revista','La revista'),('arxiu','Arxiu'),('participa','Participa'),('contacte','Contacte')]
projectnav=[('projecte','Què és SOM CANET?'),('historia','La nostra història'),('equip','Qui és qui'),('sant-jordi-2016','Sant Jordi 2016')]
groupnav=[('grup-municipal','Grup municipal'),('regidoria','Regidoria'),('valoracio-mandat','Mandat 2015–2019'),('discurs-regidora','Discurs de la regidora'),('programa-2019','Programa 2019')]
authors=[('rserra','Raquel Serra'),('jordiplanet','Jordi Planet'),('ramonfaucon','Ramon Faucon'),('ricardmolins','Ricard Molins'),('joseluiscuba','José Luis Cuba'),('malika','Malika Marouan El Afia')]
revnav=[('revista','La revista')]+[(slugs[k],label) for k,label in authors]+[('videos','Vídeos')]

def subnav(items,key):return '<nav class="wrap subnav" aria-label="En aquesta secció">'+''.join(f'<a href="{s}.html"'+(' aria-current="page"' if s==key else '')+f'>{label}</a>' for s,label in items)+'</nav>'
def heading(label,title,lead=''):
 return f'<section class="page-heading wrap"><p class="eyebrow">{escape(label)}</p><h1>{escape(title)}</h1>'+ (f'<p class="lead">{escape(lead)}</p>' if lead else '')+'</section>'
def historical(note='Contingut històric. Les referències a càrrecs, dates, convocatòries i propostes corresponen al moment de la publicació.'):
 return '<p class="historical-note">'+note+'</p>'
def sidebar(group='arxiu'):
 items=groupnav if group=='grup-municipal' else revnav if group=='revista' else [('arxiu','Tot l’arxiu'),('revista','La revista'),('programa-2019','Programa electoral 2019'),('notes-de-premsa','Notes de premsa'),('contacte','Contacta amb nosaltres')]
 return '<aside class="article-sidebar"><h2>Segueix explorant</h2>'+''.join(f'<a href="{s}.html">{label} →</a>' for s,label in items)+'</aside>'
def page(key,title,body,active=None,description=''):
 active=active or key
 links=''.join(f'<a href="{s}.html"'+(' aria-current="page"' if s==active else '')+f'>{label}</a>' for s,label in nav)
 crumb='' if key=='index' else f'<div class="wrap breadcrumb"><a href="index.html">Inici</a><span aria-hidden="true">/</span><span>{escape(title)}</span></div>'
 footer=f'''<footer><div class="wrap footer-main"><a class="brand" href="index.html" aria-label="SOM CANET, inici"><img src="{logo}" alt="SOM CANET" width="139" height="98"></a><p>Canet i la seva gent, al centre.<br><span>Canet de Mar · El Maresme</span></p><a class="text-link" href="contacte.html">Parlem-ne →</a></div><div class="wrap footer-bottom"><span>SOM CANET · Prototip de renovació</span><details class="credits"><summary>Fonts i crèdits</summary><p>Textos, logotip, documents i imatges d’arxiu de la web històrica de SOM CANET. Es conserva el context original de publicació. Les pàgines de participació i la interfície de contacte són propostes del redisseny.</p><p>Panoràmica de Canet: <a href="https://commons.wikimedia.org/wiki/File:Canet_214.JPG">Canet 214, pujada per Ramonga93</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>. Fotografia redimensionada i enquadrada.</p></details><span><a href="historia.html">Història</a> · <a href="equip.html">Qui és qui</a> · <a href="videos.html">Vídeos</a></span></div></footer>'''
 html=f'''<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#432359"><meta name="description" content="{escape(description or title+' · Història i continguts de SOM CANET a Canet de Mar.',quote=True)}"><title>{escape(title)} · SOM CANET</title><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"><script src="app.js" defer></script></head><body class="page-{key}"><a class="skip-link" href="#contingut">Salta al contingut</a><div class="utility"><div class="wrap"><span>CANET DE MAR · EL MARESME</span><a href="contacte.html">Tens una pregunta? Parlem-ne →</a></div></div><header class="header"><div class="wrap nav-wrap"><a class="brand" href="index.html" aria-label="SOM CANET, inici"><img src="{logo}" alt="SOM CANET" width="139" height="98"></a><button class="menu-toggle" aria-expanded="false" aria-controls="navigation">Menú <span aria-hidden="true">☰</span></button><nav id="navigation" aria-label="Navegació principal">{links}</nav></div></header><main id="contingut">{crumb}{body}</main>{footer}</body></html>'''
 (root/(key+'.html')).write_text(html)
 return html
# Retain the newly proposed participation and contact interactions, now on their own routes.
contactdoc=(root/'contacte.html').read_text(); contact=re.search(r'<section[^>]*id="contacte".*?</section>',contactdoc,re.S).group()
participatedoc=(root/'participa.html').read_text();participate=re.search(r'<section class="participate-section".*?</section>',participatedoc,re.S).group()
faq=re.search(r'<section class="wrap faq".*?</section>',participatedoc,re.S).group()
page('contacte','Contacte',heading('CONTACTE','Som a l’altra banda.','Una consulta, una proposta o ganes de participar? Escriu-nos o truca’ns.')+contact)
page('participa','Participa',heading('PARTICIPA','La teva veu també fa poble.','Tria per on vols començar. Una conversa pot ser el primer pas.')+participate+faq)
# Full original historical pages, kept as real separate documents.
for key,title,group,sub in [('somhistoria','La nostra història','projecte',projectnav),('grup-municipal','Grup municipal','grup-municipal',groupnav),('regiduria','Regidoria','grup-municipal',groupnav),('blank','Valoració del mandat 2015–2019','grup-municipal',groupnav),('discurs','Discurs de la regidora','grup-municipal',groupnav),('creu-de-sant-jordi-2016','Sant Jordi 2016','projecte',projectnav),('raquelserra','Notes de premsa','arxiu',[])]:
 d=files[key];slug=slugs[key]
 body=heading('ARXIU DEL PROJECTE',title)+(subnav(sub,slug) if sub else '')+'<div class="wrap article-layout"><div>'+historical()+'<article class="prose">'+rich(d)+'</article>'+pdfsection(d)+gallery(d)+source(d)+'</div>'+sidebar(group)+'</div>'
 page(slug,title,body,group)
# Project page carries the complete original statement, with the history on its own route.
hist=files['somhistoria'];statement=''.join(b['html'] for b in hist['blocks'][:2])
page('projecte','El projecte',heading('SOM CANET','Un projecte arrelat al poble.','La definició de SOM CANET, tal com es va explicar a la seva web d’origen.')+subnav(projectnav,'projecte')+'<div class="wrap article-layout"><div><article class="prose">'+Clean().clean(statement)+'</article><div class="pdf-links"><a class="button" href="historia.html">Coneix l’acord fundacional →</a><a class="button green" href="participa.html">Comença una conversa →</a></div>'+source(hist)+'</div>'+sidebar()+'</div>')
# Team: match each original portrait to its biography in DOM order, preserve historical wording.
d=files['blank-1'];imgs=images(d);blocks=d['blocks'];cards=[];role='';person_index=1
for block in blocks:
 text=block['text'].strip()
 if text.startswith(('SECRETARIA','CONSELL')):role=text;continue
 if not text:continue
 pic=imgs[person_index] if person_index<len(imgs) else None;person_index+=1
 photo=f'<img src="{pic["path"]}" alt="{escape(text.splitlines()[0],quote=True)}" loading="lazy">' if pic else ''
 cards.append('<article class="person">'+photo+'<div><p class="role">'+escape(role)+'</p>'+rich({'blocks':[block]})+'</div></article>')
team='<div class="wrap section">'+historical('Composició i biografies recollides a la web d’origen. Les edats i els càrrecs són els d’aquell moment; no es presenta com l’equip actual.')+(f'<img class="team-photo" src="{imgs[0]["path"]}" alt="Fotografia d’arxiu de l’equip de SOM CANET">' if imgs else '')+'<div class="people-grid">'+''.join(cards)+'</div>'+source(d)+'</div>'
page('equip','Qui és qui',heading('PERSONES DEL PROJECTE','Qui és qui','Les persones i responsabilitats que formaven part de la web històrica.')+subnav(projectnav,'equip')+team,'projecte')
# Magazine: original downloadable files and local article pages, with authentic covers.
d=files['revista'];authorcards=[]
for key,label in authors:
 a=files[key];imgs=images(a);pic=imgs[0]['path'] if imgs else ''
 authorcards.append(f'<a class="archive-card" href="{slugs[key]}.html">'+(f'<img class="thumb" src="{pic}" alt="{escape(label)}" loading="lazy">' if pic else '')+f'<div class="card-bottom"><div><h3>{escape(label)}</h3><p>Llegeix els articles i materials de la revista.</p></div><span aria-hidden="true">→</span></div></a>')
revbody=heading('PUBLICACIONS','La revista de SOM CANET','Els números originals i els articles de les persones que hi van participar.')+subnav(revnav,'revista')+'<div class="wrap section">'+historical('Publicacions històriques de SOM CANET. Els articles conserven el contingut i el context de la web d’origen.')+pdfsection(d,True)+gallery(d)+'<div class="section-header"><h2>Veus de la revista</h2></div><div class="archive-grid">'+''.join(authorcards)+'</div>'+source(d)+'</div>'
page('revista','La revista',revbody)
for key,label in authors:
 d=files[key];body=heading('VEUS DE LA REVISTA',label)+subnav(revnav,slugs[key])+'<div class="wrap article-layout"><div>'+historical()+'<article class="prose">'+rich(d)+'</article>'+gallery(d)+source(d)+'</div>'+sidebar('revista')+'</div>'
 page(slugs[key],label,body,'revista')
# Programme: complete original introduction and original PDF hosted locally.
d=files['programa-electoral-2019'];body=heading('DOCUMENT · ELECCIONS MUNICIPALS 2019','Programa electoral 2019')+subnav(groupnav,'programa-2019')+'<div class="wrap section">'+historical('Programa de les eleccions municipals de 2019. Document històric, conservat íntegrament.')+'<article class="prose">'+rich(d)+'</article>'+pdfsection(d,True)+gallery(d)+source(d)+'</div>'
page('programa-2019','Programa electoral 2019',body,'grup-municipal')
# Videos remain on their original streaming platform, embedded on the new page.
d=files['videos'];labels=[b['text'].strip() for b in d['blocks'] if b['text'].strip()];video=''
for i,frame in enumerate(d['frames']):
 match=re.search(r'/embed/([\w-]+)',frame['src'])
 if not match:continue
 ident=match.group(1);label=(labels[-1] if i==3 and len(labels)==5 else labels[i]) if i<len(labels) else f'Vídeo {i+1}'
 video+=f'<section class="video-item"><h2>{escape(label)}</h2><iframe src="https://www.youtube-nocookie.com/embed/{ident}" title="{escape(label,quote=True)}" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe><a href="https://www.youtube.com/watch?v={ident}" target="_blank" rel="noopener">Obre el vídeo a YouTube ↗</a></section>'
page('videos','Vídeos',heading('VEUS I IMATGES','Vídeos')+subnav(revnav,'videos')+'<div class="wrap article-layout"><div>'+historical()+video+'<section><h2>El Bon Govern</h2><p class="muted">Aquest títol apareix a la pàgina original, però no hi ha cap vídeo associat recuperable.</p></section>'+source(d)+'</div>'+sidebar('revista')+'</div>','revista')
# Blog posts and searchable archive cards.
resources=[]
def card(slug,title,category,date='',pic='',excerpt=''):
 year=date[:4] if date else ''
 picture=f'<img class="thumb" src="{pic}" alt="" loading="lazy">' if pic else ''
 dt=f'<time datetime="{date}">{date[8:10]}/{date[5:7]}/{date[:4]}</time>' if date else '<time>Arxiu històric</time>'
 return f'<a class="archive-card" data-category="{category}" data-year="{year}" href="{slug}.html">{picture}<div class="card-bottom"><div>{dt}<h3>{escape(title)}</h3>'+(f'<p>{escape(excerpt)}</p>' if excerpt else '')+'</div><span aria-hidden="true">→</span></div></a>'
for i,d in enumerate(posts):
 slug=d['slug'];date=re.search(r'/single-post/(\d{4})/(\d{2})/(\d{2})/',d['source']);date='-'.join(date.groups()) if date else ''
 title=d['title'];imgs=images(d);body=heading('HEMEROTECA · '+date,title)+'<div class="wrap article-layout"><div>'+historical()+'<article class="prose">'+rich(d)+'</article>'+gallery(d)+pdfsection(d)+source(d)+'<div class="pdf-links"><a class="button" href="arxiu.html">Torna a l’arxiu →</a></div></div>'+sidebar()+'</div>'
 page(slug,title,body,'arxiu')
 resources.append({'slug':slug,'title':title,'category':'hemeroteca','date':date,'pic':imgs[0]['path'] if imgs else ''})
for key,title,cat in [('revista','La revista','revista'),('programa-electoral-2019','Programa electoral 2019','documents'),('grup-municipal','Entrada al govern municipal','municipal'),('regiduria','Regidoria de participació, igualtat i noves tecnologies','municipal'),('blank','Valoració del mandat 2015–2019','municipal'),('discurs','Discurs de la regidora','municipal'),('raquelserra','Notes de premsa','documents'),('blank-1','Qui és qui','projecte'),('somhistoria','La nostra història','projecte'),('creu-de-sant-jordi-2016','Sant Jordi 2016','projecte'),('videos','Vídeos','revista')]+[(k,l,'revista') for k,l in authors]:
 d=files[key];imgs=images(d);resources.append({'slug':slugs[key],'title':title,'category':cat,'date':'','pic':imgs[0]['path'] if imgs else ''})
filters=''.join(f'<button type="button" data-filter="{v}" aria-pressed="'+('true' if v=='all' else 'false')+f'">{label}</button>' for v,label in [('all','Tot'),('hemeroteca','Hemeroteca'),('revista','Revista i vídeos'),('documents','Documents'),('municipal','Vida municipal'),('projecte','El projecte')])
archive=heading('ARXIU OBERT','Tot el que hem compartit.','Articles, publicacions, documents i imatges de SOM CANET. Troba els continguts pel seu títol o explora’ls per seccions.')+'<section class="wrap section"><div class="archive-controls"><label for="archive-search">Cerca per títol</label><input type="search" id="archive-search" placeholder="Pressupostos, igualtat, revista…"><div class="filters" role="group" aria-label="Tipus de contingut">'+filters+f'</div><p id="archive-count" role="status">{len(resources)} recursos</p></div><div class="archive-grid">'+''.join(card(**r) for r in resources)+'</div><p id="archive-empty" hidden>No hem trobat cap resultat. Canvia la cerca o selecciona un altre tipus de contingut.</p></section>'
page('arxiu','Arxiu',archive)
# Home: a gateway to a complete site, with genuine dated archive content.
home='''<section class="home-hero"><img src="assets/canet-panorama.jpg" width="1800" height="1350" alt="Panoràmica de Canet de Mar i el Mediterrani" fetchpriority="high"><div class="wrap hero-inner"><div class="hero-panel"><p class="eyebrow">SOM CANET</p><h1>Canet i la seva gent,<br>al centre.</h1><p>Un projecte plural, d’esquerres i arrelat al poble. La nostra història, les nostres idees i les veus que ens han fet créixer.</p><a class="button green" href="projecte.html">Coneix el projecte <span aria-hidden="true">→</span></a></div><span class="photo-caption">CANET DE MAR · EL NOSTRE PUNT DE PARTIDA</span></div></section><section class="home-directory wrap"><div class="section-header"><div><p class="eyebrow">CONEIX SOM CANET</p><h2>Un projecte que es construeix sumant.</h2></div><p>Idees, persones i compromís amb el municipi.</p></div><div class="directory-grid"><a href="historia.html"><span class="directory-icon" aria-hidden="true">◎</span><h3>Les nostres arrels</h3><p>El projecte, l’acord fundacional i les persones que hi van donar forma.</p><span class="link-label">La nostra història →</span></a><a href="grup-municipal.html"><span class="directory-icon" aria-hidden="true">▤</span><h3>La vida municipal</h3><p>Documents, discursos i balanç de la trajectòria institucional.</p><span class="link-label">Grup municipal →</span></a><a href="revista.html"><span class="directory-icon" aria-hidden="true">↔</span><h3>Veus pròpies</h3><p>La revista original i els articles de les persones del projecte.</p><span class="link-label">Llegeix la revista →</span></a></div></section>'''
home+='<section class="home-feed wrap"><div class="section-header"><div><p class="eyebrow">DE LA NOSTRA HEMEROTECA</p><h2>Les idees queden. La memòria, també.</h2></div><a class="text-link" href="arxiu.html">Explora tot l’arxiu →</a></div><div class="archive-grid">'+''.join(card(**r) for r in resources[:3])+'</div></section>'
home+='''<section class="home-participate"><div class="wrap"><div><p class="eyebrow">LA TEVA VEU HI TÉ LLOC</p><h2>Una idea per a Canet?<br>Comencem parlant.</h2><p>Comparteix una proposta, fes una pregunta o demana informació per participar.</p></div><a class="button" href="participa.html">Troba la teva manera de participar →</a></div></section>'''
page('index','Inici',home,description='SOM CANET: projecte municipal, història, revista, hemeroteca i participació a Canet de Mar.')
# Local document readers include all original pages and their extractable text.
for url,path in assetmap.items():
 if not path.endswith('.pdf'):continue
 title=next((d['label'] for d in files.values() if path in pdfs(d)), 'Document de SOM CANET')
 key=Path(readerpath(path)).stem
 transcript=''.join('<section><h3>Pàgina '+str(i+1)+'</h3><p class="pdf-transcript">'+escape(text)+'</p></section>' for i,text in enumerate(pdftext.get(Path(path).name,[])) if text.strip())
 textpanel='<details class="document-transcript"><summary>Llegeix el text del document <span aria-hidden="true">+</span></summary><p class="muted">Text extret del PDF. Per consultar la composició i la paginació originals, utilitza el visor.</p><div class="prose">'+transcript+'</div></details>' if transcript else ''
 body=heading('DOCUMENT ORIGINAL',title)+'<section class="wrap section">'+historical()+f'<div class="pdf-links"><a class="button" href="{path}" target="_blank" rel="noopener">Obre el PDF original ↗</a><a class="button green" href="{path}" download>Descarrega el PDF ↓</a><a class="text-link" href="arxiu.html">Torna a l’arxiu →</a></div>'+pdfreader(path,title)+textpanel+'</section>'
 page(key,title,body,'arxiu')
# A portable inventory documents provenance without exposing raw page dumps in the site.
(root/'content').mkdir(exist_ok=True)
manifest={'captured':'2026-11-04','posts':len(posts),'resources':len(resources),'assets':len(assetmap),'source_pages':[{'source':d['source'],'local':slugs[k]+'.html'} for k,d in files.items() if k in slugs], 'entries':[{'source':d['source'],'local':d['slug']+'.html'} for d in posts], 'documents':{url:path for url,path in assetmap.items() if path.endswith('.pdf')},'limitations':['Executiva original sense cos de contingut: representada per la pàgina Qui és qui.','La galeria antiga incrustada a La nostra història no exposa imatges recuperables.','Els vídeos es reprodueixen des de YouTube; no es descarreguen.','El títol El Bon Govern no té cap vídeo recuperable associat a la pàgina original.']}
(root/'content/migration-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({'posts':len(posts),'archive_resources':len(resources),'html_pages':len(list(root.glob('*.html'))),'assets':len(assetmap)},indent=2))
