#!/usr/bin/env python3
"""Import two real third-party sci-fi ship GLBs under CC BY 4.0.
Source: https://opengameart.org/content/proteron-ships
Creator: Viktor Hahn. See docs/PROTERON_CREDITS.md.
"""
from __future__ import annotations
import hashlib
import io
import json
from pathlib import Path
import struct
import urllib.request
import zipfile

SOURCE = "https://opengameart.org/sites/default/files/gltf.zip"
req = urllib.request.Request(SOURCE, headers={"User-Agent": "Mozilla/5.0 SpaceSIM Asset Integration/1.0"})
with urllib.request.urlopen(req, timeout=120) as response:
    data = response.read(85 * 1024 * 1024 + 1)
if len(data) > 85 * 1024 * 1024:
    raise ValueError("Oversized source archive")
print("Source archive size:",len(data),flush=True)
z = zipfile.ZipFile(io.BytesIO(data))
candidates = [entry for entry in z.infolist() if not entry.is_dir() and entry.filename.lower().endswith('.glb')
              and not entry.filename.split('/')[-1].startswith('.')]
if len(candidates) < 2:
    raise ValueError("Source archive does not contain two GLB files: "+str(z.namelist()))
print("GLB candidates:",[(entry.filename,entry.file_size) for entry in candidates],flush=True)
candidates.sort(key=lambda item:item.file_size,reverse=True)
chosen=[candidates[0], candidates[min(2,len(candidates)-1)]]
root=Path('public/assets/ships')
root.mkdir(parents=True,exist_ok=True)
manifest = {'creator':'Viktor Hahn','source_page':'https://opengameart.org/content/proteron-ships',
            'archive_url':SOURCE,'license':'CC-BY-4.0','license_url':'https://creativecommons.org/licenses/by/4.0/',
            'source_archive_sha256':hashlib.sha256(data).hexdigest(),'files':{}}
for index,entry in enumerate(chosen):
    name=['proteron-a.glb','proteron-b.glb'][index]
    raw=z.read(entry)
    if len(raw)<5000 or raw[:4]!=b'glTF' or struct.unpack('<I',raw[4:8])[0]!=2:
        raise ValueError(f"Invalid GLB 2.0: {entry.filename}")
    if struct.unpack('<I',raw[8:12])[0]!=len(raw):
        raise ValueError(f"Invalid GLB size: {entry.filename}")
    header_json_length, chunk_type=struct.unpack('<II',raw[12:20])
    if chunk_type!=0x4e4f534a:
        raise ValueError(f"Missing GLB JSON chunk {entry.filename}")
    doc=json.loads(raw[20:20+header_json_length].decode('utf-8'))
    mats=doc.get('materials',[])
    if not doc.get('meshes') or not mats:
        raise ValueError(f"Missing scene meshes/materials in {entry.filename}")
    pbr=sum(bool(m.get('pbrMetallicRoughness')) for m in mats)
    maps=sum(bool(m.get('normalTexture')) for m in mats)
    if not pbr:
        raise ValueError(f"No PBR materials in {entry.filename}")
    (root/name).write_bytes(raw)
    manifest['files'][name]={
        'original_filename':entry.filename,'bytes':len(raw),
        'sha256':hashlib.sha256(raw).hexdigest(),
        'mesh_count':len(doc['meshes']),'material_count':len(mats),
        'normal_mapped_material_count':maps,'pbr_material_count':pbr
    }
(root/'proteron-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print("Imported:",json.dumps(manifest['files'],indent=2),flush=True)
