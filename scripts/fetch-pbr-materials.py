#!/usr/bin/env python3
"""Vendor licensed CC0 Poly Haven texture sets for offline browser use.
Only the explicitly enumerated 1K maps are downloaded. No runtime CDN calls.
"""
from __future__ import annotations
import hashlib
import json
import pathlib
import struct
import urllib.request

BASE = "https://dl.polyhaven.org/file/ph-assets/Textures/png/1k"
MATERIALS = ("blue_metal_plate", "metal_plate_02")
CHANNELS = ("diff", "nor_gl", "arm")
OUTPUT = pathlib.Path("public/assets/materials")
manifest = {"source": "Poly Haven", "license": "CC0-1.0", "maps": {}}

for material in MATERIALS:
    for channel in CHANNELS:
        filename = f"{material}_{channel}_1k.png"
        url = f"{BASE}/{material}/{filename}"
        print(f"Downloading {url}", flush=True)
        req = urllib.request.Request(url, headers={"User-Agent": "SpaceSIM-Asset-Importer/1.0"})
        with urllib.request.urlopen(req, timeout=50) as response:
            data = response.read(12 * 1024 * 1024 + 1)
        if len(data) > 12 * 1024 * 1024 or len(data) < 5000:
            raise ValueError(f"Invalid downloaded length {filename}: {len(data)}")
        if data[:8] != bytes.fromhex("89504e470d0a1a0a") or data[12:16] != b"IHDR":
            raise ValueError(f"Not PNG: {filename}")
        width, height = struct.unpack(">II", data[16:24])
        if not 256 <= width <= 2048 or not 256 <= height <= 2048:
            raise ValueError(f"Unexpected texture size {filename}: {width} x {height}")
        OUTPUT.mkdir(parents=True, exist_ok=True)
        (OUTPUT / filename).write_bytes(data)
        manifest["maps"][filename] = {
            "source_url": url, "size": len(data), "width": width, "height": height,
            "sha256": hashlib.sha256(data).hexdigest(),
        }
(OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print("All CC0 PBR maps verified.", flush=True)
