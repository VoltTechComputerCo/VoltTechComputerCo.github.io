import json,re,hashlib,collections
import argparse
parser=argparse.ArgumentParser();parser.add_argument('rows');parser.add_argument('output');args=parser.parse_args()
rows=json.load(open(args.rows));chosen=[];office=[]
for r in rows:
 if not isinstance(r['sku'],str) or not r['sku'].strip() or not isinstance(r['category'],str):continue
 c=r['category'].lower();n=r['name'].lower();typ=cat=None
 if any(w in c for w in ['server','enterprise','apple','notebook memory']) or re.search('surveillance|skyhawk|ironwolf',n):continue
 if 'graphics cards' in c:
  if not re.search(r'\b(?:rtx\s*[3-9]\d{3}|rx\s*[6-9]\d{3}|arc\s*[ab]\d{3})',n) or re.search('quadro|rtx pro',n):continue
  typ=cat='gpu'
 elif ' > cpu >' in c:
  m=re.search(r'ryzen\s+[3579]\s+(\d{4,5})|core\s+i[3579][ -]*(\d{4,5})',n)
  if not ('core ultra' in n or (m and int(m[1] or m[2])>=(5000 if m[1] else 10000))):continue
  typ=cat='cpu'
 elif 'motherboards' in c:
  if not re.search(r'\bam[45]\b|lga\s*(1200|1700|1851)|\b[abxh][56789]\d{2}',n):continue
  typ=cat='motherboard'
 elif 'desktop memory' in c:
  if not re.search(r'ddr[ -]?[45]',n) or re.search('ecc|registered',n):continue
  typ=cat='memory'
 elif 'solid state drives > consumer' in c:typ=cat='storage'
 elif 'hard disk drives' in c:
  if re.search('nas|surveillance|skyhawk|ironwolf|purple|red plus|enterprise',n):continue
  typ='storage';cat='storage'
 elif 'power supplies' in c:
  if not re.search(r'(\d{3,4})\s*w',n):continue
  typ=cat='psu'
 elif 'chassis' in c:typ=cat='case'
 elif 'cooling > case fans' in c:typ=cat='fan'
 elif 'cooling >' in c:typ=cat='cooler'
 elif 'thermal paste' in c:typ='accessory';cat='thermal-paste'
 elif c.startswith('cables >') and 'printer' not in c:typ='accessory';cat='cables'
 elif c.startswith('components >') and any(w in c for w in ['controllers','expansion','brackets']):typ='accessory';cat='adapters'
 elif c.startswith('computer peripherals'):
  if 'keyboard accessories' in c or 'mousepads' in c:cat='desk-accessories'
  elif 'keyboards' in c:cat='keyboards'
  elif 'mice' in c:cat='mice'
  elif 'monitors' in c:cat='monitors'
  elif any(w in c for w in ['microphone','audio adapters','speakers']):cat='audio'
  elif 'headsets' in c:cat='headsets'
  elif 'webcams' in c:cat='webcams'
  elif any(w in c for w in ['adapters','hubs','docking','enclosures']):cat='adapters'
  elif any(w in c for w in ['chairs','stands','mounts','desk']):cat='desk-accessories'
  elif any(w in c for w in ['controllers','simulation']):cat='controllers'
  elif 'external ssds' in c:cat='storage';typ='storage'
  else:continue
  typ=typ or ('accessory' if cat in ['desk-accessories','adapters'] or 'audio adapters' in c else 'peripheral')
 else:continue
 use='Office' if 'office' in c or 'keyboard combos' in c or (typ=='memory' and re.search(r'\b[48]\s?gb',n)) or (typ=='storage' and 'sata' in n and re.search(r'\b(120|128|240|256|480|512)\s?gb',n)) else 'Gaming & creator'
 specs={'useCase':use,'productKind':r['category'].split(' > ')[-1]}
 for key,pat in [('refreshRateHz',r'(\d{2,3})\s*hz'),('lengthM',r'(\d+(?:\.\d+)?)\s*m(?:eter|etre)?\b'),('capacityGB',r'(\d+)\s*gb'),('speedMTs',r'(\d{4,5})\s*(?:mhz|mt/s)'),('wattage',r'(\d{3,4})\s*w\b'),('screenSize',r'(\d+(?:\.\d+)?)\s*(?:inch|\")')]:
  m=re.search(pat,n)
  if m:specs[key]=float(m[1]) if '.' in m[1] else int(m[1])
 for key,pat in [('memoryType',r'ddr[ -]?[45]'),('socket',r'\bam[45]\b|lga\s*(?:1200|1700|1851)'),('interface',r'usb[ -]?c|usb[ -]?a|hdmi|displayport|xlr|sata|nvme'),('connection',r'wireless|bluetooth|usb|xlr'),('resolution',r'3840\s*x\s*2160|2560\s*x\s*1440|1920\s*x\s*1080|4k|1440p|1080p'),('panelType',r'\b(?:ips|oled|va|tn)\b')]:
  m=re.search(pat,n)
  if m:specs[key]=m[0].upper()
 if 'mic' in n and re.search('arm|boom',n):specs['productKind']='Microphone arm'
 if 'audio interface' in n:specs['productKind']='Audio interface'
 r.update(type=typ,category_slug=cat,specs=specs,use=use,id='syntech-'+hashlib.sha256(('syntech:'+str(r['sku'])).encode()).hexdigest()[:16])
 (office if use=='Office' else chosen).append(r)
# Preserve all gaming candidates and a curated office range, capped at roughly 20% of added listings.
limit=min(len(office),round(len(chosen)/4));office=sorted(office,key=lambda r:(r['cost'],r['sku']))[:limit];chosen+=office
json.dump(chosen,open(args.output,'w'))
print('selected',len(chosen),'office',len(office),round(len(office)/len(chosen)*100,1))
print(dict(collections.Counter(r['category_slug'] for r in chosen)))
print('audio',[(r['sku'],r['name']) for r in chosen if r['category_slug']=='audio'])
