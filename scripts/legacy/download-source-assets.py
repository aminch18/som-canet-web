"""Download the public images and documents inventoried from the original site."""
from pathlib import Path
import concurrent.futures, hashlib, json, subprocess, urllib.parse
root=Path(__file__).resolve().parents[1]
sources=root.parent/'migration-source'
items={}
for file in sources.glob('*.json'):
 d=json.loads(file.read_text())
 if not isinstance(d,dict): continue
 images=d.get('images',[])
 if file.name=='brand.json': images=[d]
 for img in images:
  url=img.get('src','').split('/v1/')[0]
  if url.startswith('https://static.wixstatic.com/media/'):
   ext=Path(urllib.parse.urlparse(url).path).suffix.lower()
   items[url]='assets/original/'+hashlib.sha256(url.encode()).hexdigest()[:16]+ext
 for link in d.get('links',[]):
  url=link.get('url','')
  if urllib.parse.urlparse(url).path.lower().endswith('.pdf'):
   items[url]='documents/'+Path(urllib.parse.urlparse(url).path).name

def download(item):
 url,path=item; target=root/path; target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists() and target.stat().st_size>100:return url,path,None
 result=subprocess.run(['curl','-L','--fail','--silent','--show-error','--max-time','45',url,'-o',str(target)],capture_output=True,text=True)
 if result.returncode:
  target.unlink(missing_ok=True);return url,path,result.stderr.strip()
 return url,path,None
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 results=list(pool.map(download,items.items()))
mapping={url:path for url,path,error in results if error is None}
failures=[{'url':url,'error':error} for url,path,error in results if error]
(sources/'asset-map.json').write_text(json.dumps(mapping,indent=2))
(sources/'asset-failures.json').write_text(json.dumps(failures,indent=2))
print(json.dumps({'downloaded':len(mapping),'failed':failures,'pdfs':len([x for x in mapping.values() if x.endswith('.pdf')])},indent=2))
