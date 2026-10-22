#!/usr/bin/env python3
"""Create the website-safe band archive from the tracked research workbook.

The workbook remains the source of record. This script only exposes the
verified fields needed by the static archive page; it never runs in visitors'
browsers or during the production build.
"""

from __future__ import annotations

import json
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/history/Mauerbluemchen_Outback_Contrast_Historical_Archive.xlsx'
OUTPUT = ROOT / 'content/history-bands.json'
NS = {
    'm': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}
MAIN = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def value(cell: ET.Element, shared: list[str]) -> str:
    raw = cell.find('m:v', NS)
    text = '' if raw is None else raw.text or ''
    if cell.get('t') == 's' and text.isdigit():
        return shared[int(text)]
    if cell.get('t') == 'inlineStr':
        return ''.join(node.text or '' for node in cell.iter(MAIN + 't'))
    return text


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f'Missing archive workbook: {SOURCE}')
    with zipfile.ZipFile(SOURCE) as book:
        shared: list[str] = []
        if 'xl/sharedStrings.xml' in book.namelist():
            strings = ET.fromstring(book.read('xl/sharedStrings.xml'))
            shared = [''.join(node.text or '' for node in entry.iter(MAIN + 't')) for entry in strings.findall('m:si', NS)]
        workbook = ET.fromstring(book.read('xl/workbook.xml'))
        relationships = ET.fromstring(book.read('xl/_rels/workbook.xml.rels'))
        locations = {entry.get('Id'): entry.get('Target', '').lstrip('/') for entry in relationships}
        sheet = next(entry for entry in workbook.findall('m:sheets/m:sheet', NS) if entry.get('name') == 'Bands by size')
        relationship_id = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        target = locations[relationship_id]
        target = target if target.startswith('xl/') else f'xl/{target}'
        rows = ET.fromstring(book.read(target)).findall('.//m:sheetData/m:row', NS)

    bands = []
    for row in rows[1:]:
        fields = {''.join(filter(str.isalpha, cell.get('r', ''))): value(cell, shared).strip() for cell in row.findall('m:c', NS)}
        if not fields.get('B'):
            continue
        bands.append({
            'rank': int(fields['A']) if fields.get('A', '').isdigit() else None,
            'artist': fields['B'],
            'tier': fields.get('C', ''),
            'evidence': fields.get('G', ''),
            'era': fields.get('H', ''),
            'dates': fields.get('I', ''),
            'artistUrl': fields.get('J', ''),
            'linkStatus': fields.get('K', ''),
            'sourceUrl': fields.get('L', ''),
            'notes': fields.get('M', ''),
        })
    OUTPUT.write_text(json.dumps(bands, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {len(bands)} bands to {OUTPUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
