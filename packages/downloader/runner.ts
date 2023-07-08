export const RUNNER = `
import io
import sys
import os

sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')


from pathlib import Path
from zipfile import ZipFile
from weld import run_weld

path = Path('temp') / sys.argv[1]
mode = sys.argv[2]
version = sys.argv[3]


zips = []
for file in os.listdir(path):
    zips.append(ZipFile(path / file))


if mode == "datapack" or mode == "both":
    with run_weld(zips, pack_types=["data_pack"]) as context:
        context.data.name = 'welded-dp'
        context.meta.setdefault('minecraft', version)
        context.data.save(path, zipped=True, overwrite=True)
if mode == "resourcepack" or mode == "both":
    with run_weld(zips, pack_types=["resource_pack"]) as context:
        context.assets.name = 'welded-rp'
        context.meta.setdefault('minecraft', version)
        context.assets.save(path, zipped=True, overwrite=True)

if mode == "both": 
    with ZipFile(path / 'welded-both.zip', 'w') as zip:
        zip.write(path / 'welded-dp.zip', arcname='datapacks.zip')
        zip.write(path / 'welded-rp.zip', arcname='resourcepacks.zip')w
`