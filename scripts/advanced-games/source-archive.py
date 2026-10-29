"""Ship complete preferred-form source in independently extractable Pages-sized ZIPs."""
from pathlib import Path
import sys,zipfile,hashlib,html
root,out=map(Path,sys.argv[1:]);out.parent.mkdir(parents=True,exist_ok=True)
files=[]
for p in sorted(root.rglob('*')):
 if not p.is_file():continue
 rel=p.relative_to(root)
 if any(part in {'.git','node_modules','static','.cache','.husky','blender','build','dist'} for part in rel.parts):continue
 if p.parent.resolve()==out.parent.resolve() and (p.name.startswith('source') and p.suffix in {'.zip','.html'}):continue
 files.append((p,rel))
groups=[[]];size=0
for p,rel in files:
 n=p.stat().st_size
 assert n<24*1024*1024,f'Source file too large: {rel}'
 if size+n>20*1024*1024 and groups[-1]:groups.append([]);size=0
 groups[-1].append((p,rel));size+=n
links=[]
for i,group in enumerate(groups):
 target=out if i==0 else out.with_name(f'source-part-{i+1:02d}.zip')
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
  for p,rel in group:z.write(p,rel.as_posix())
 assert target.stat().st_size<25*1024*1024
 digest=hashlib.sha256(target.read_bytes()).hexdigest()
 links.append(f'<li><a href="{target.name}">{target.name}</a> ({target.stat().st_size:,} bytes) SHA-256: <code>{digest}</code></li>')
index=out.with_name('source.html')
index.write_text('<!doctype html><meta charset="utf-8"><title>Complete modified game source</title><h1>Complete modified game source</h1><p>Download ALL archives below, then unzip each into the same empty directory. Each archive is a valid standalone ZIP containing different source files. Together they provide the modified code, build inputs and redistributable assets. Dependencies are installed from the included package manifest and lockfile where present. See LICENSE and KNIGHTFALL-CHANGES.md for notices and build details.</p><ol>'+''.join(links)+'</ol>')
print(f'{len(files)} source files across {len(groups)} archives: {index}')
