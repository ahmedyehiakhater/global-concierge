"""Build a clean Windows x64 delivery folder from an already compiled dist/."""
from pathlib import Path
import hashlib, shutil, zipfile, json, struct
root=Path(__file__).resolve().parent.parent
archive=Path('/tmp/gc-node-win-x64.zip')
expected='1177b4137ba5adaa56354ae40f1080c7450e8ae09cecb47da459d1c52ac99f97'
assert hashlib.sha256(archive.read_bytes()).hexdigest()==expected, 'Runtime checksum mismatch'
out=root/'releases'/'Global Concierge Windows x64'
if out.exists(): shutil.rmtree(out)
out.mkdir(parents=True)
for directory in ['dist','server','shared']:
 shutil.copytree(root/directory,out/directory,ignore=shutil.ignore_patterns('*.sqlite*','*.log'))
(out/'packaging').mkdir()
for name in ['run.js','serve.js','launch.js']:shutil.copy2(root/'packaging'/name,out/'packaging'/name)
for name in ['Start Global Concierge.cmd','Stop Global Concierge.cmd','README-WINDOWS.txt']:
 text=(root/'packaging'/name).read_text();(out/name).write_bytes(text.replace('\n','\r\n').encode())
(out/'package.json').write_text(json.dumps({'name':'global-concierge-offline','private':True,'type':'module'}))
(out/'runtime').mkdir();(out/'licenses').mkdir()
with zipfile.ZipFile(archive) as z:
 for src,dest in [('node.exe','runtime/node.exe'),('LICENSE','licenses/Node-LICENSE.txt')]:
  (out/dest).write_bytes(z.read('node-v22.23.2-win-x64/'+src))
exe=(out/'runtime/node.exe').read_bytes();pe=struct.unpack_from('<I',exe,0x3c)[0]
assert exe[pe:pe+4]==b'PE\0\0' and struct.unpack_from('<H',exe,pe+4)[0]==0x8664, 'Not Windows x64'
for name in ['react','react-dom','scheduler','three','lucide-react']:
 module=root/'node_modules'/name
 for f in module.iterdir():
  if f.is_file() and f.name.lower().startswith('license'):shutil.copy2(f,out/'licenses'/(name+'-'+f.name))
(out/'BUILD-INFO.txt').write_text('Windows x64 / Node 22.23.2\nRuntime source: https://nodejs.org/dist/v22.23.2/node-v22.23.2-win-x64.zip\nRuntime ZIP SHA-256: '+expected+'\nNo database or rehearsal data included.\n')
files={str(p.relative_to(out)):hashlib.sha256(p.read_bytes()).hexdigest() for p in out.rglob('*') if p.is_file()}
(out/'MANIFEST-SHA256.json').write_text(json.dumps(files,indent=2))
zip_path=shutil.make_archive(str(root/'releases'/'Global-Concierge-Windows-x64'),'zip',out.parent,out.name)
print(zip_path)
print('ZIP SHA-256:',hashlib.sha256(Path(zip_path).read_bytes()).hexdigest())
print('Size MB:',round(Path(zip_path).stat().st_size/1024/1024,1))
