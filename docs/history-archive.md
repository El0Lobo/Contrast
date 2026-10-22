# Venue history archive

`data/history/Mauerbluemchen_Outback_Contrast_Historical_Archive.xlsx` is the tracked research source for the venue lineage Mauerblümchen → Outback → Contrast.

Run the following after editing the workbook:

```bash
python3 scripts/import-history-archive.py
node scripts/build-clean-routes.mjs
git add data/history content/history-bands.json
```

The generated `content/history-bands.json` is used for the public `/Archiv/` and `/en/Archiv/` pages. The public archive shows venue era, recovered dates and source links. It deliberately does not publish the workbook's private ranking logic or unresolved/excluded names as established venue facts.
