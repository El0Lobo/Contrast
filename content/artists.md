# Optionale Künstler*innen-Profile

Jede Person oder Band aus `assets/data/events.ics` erhält automatisch eine schlanke Profilseite. Ergänzungen sind optional und werden in `artists.json` unter dem exakten Namen aus dem Event hinterlegt.

```json
{
  "artists": {
    "Beispielband": {
      "image": "assets/images/artists/beispielband.webp",
      "description": "Freigegebener Kurztext.",
      "url": "https://beispielband.example"
    }
  }
}
```

`image` ist optional. Lege die Bilddatei unter `assets/images/artists/` ab; ohne Bild bleibt das Profil absichtlich textbasiert.
