# 3D-Modelle

Ohne eigenes Modell zeigt der Konfigurator ein **stilisiertes Auto**, das im Code erzeugt wird (`src/components/three/ProceduralCar.tsx`). Es kostet nichts, und alle Teile lassen sich daran tauschen.

Ein echtes Modell wird pro Generation eingetragen: Keystatic → *Marken & Fahrzeuge* → Modell → Generation → **3D-Modell (GLB-URL)**. Ist das Feld leer, erscheint das stilisierte Auto.

## Lizenz – vor dem Download prüfen

Die GLB-Datei wird an jeden Besucher ausgeliefert. Das ist rechtlich eine **Weitergabe**. Erlaubt sind nur:

- **CC0** oder **CC-BY** (Urheber auf der Website nennen, z. B. im Impressum)
- gekaufte Modelle, deren Lizenz **Echtzeit-/Web-/Spiele-Nutzung** ausdrücklich erlaubt

Nicht erlaubt: *CC-BY-NC*, *Editorial*, *Personal use*, und **alles, was aus Spielen stammt** (Forza, Need for Speed, Gran Turismo, Assetto Corsa, GTA). Auf Sketchfab tragen viele Spiel-Rips trotzdem ein CC-BY-Label. Hinweise darauf sind Titel wie „2016 BMW …“, Spielnamen in Titel, Beschreibung oder Tags und Uploader mit Hunderten Autos.

Markenlogos (BMW-Emblem, Niere mit Logo) besser entfernen.

Stand der Recherche (Oktober 2026): Für den M4 F82 wurde **kein kostenloses Modell mit eindeutig sauberer Lizenz** gefunden. Kandidaten zum Prüfen:
- Sketchfab-Profil *BlackSnow02* (M4 F82, Lizenz ungeprüft)
- *vecarz* „M4 F82 Razor“ (CC-BY, aber Verdacht auf NFS-Rip, daher **nicht** verwenden, solange die Herkunft unklar ist)
- Gekaufte Alternative: Hum3D / CGTrader, ca. 100–250 $, auf Lizenz „real-time / web“ achten

## Aufbau, den der Konfigurator erwartet

| Vorgabe | Wert |
|---|---|
| Format | `.glb`, möglichst Draco-komprimiert, Ziel < 10 MB |
| Einheit | **Meter** (ein M4 ist ca. 4,7 m lang) |
| Ausrichtung | Front zeigt nach **+X**, linke Fahrzeugseite nach **+Z**, oben = +Y |
| Boden | Reifen stehen auf **y = 0**, Fahrzeugmitte bei x = 0, z = 0 |
| Polygone | < 200 000 Dreiecke |

Kameraperspektiven und Hotspots sind auf diese Maße abgestimmt (`VIEWS`/`SPOTS` in `CarStage.tsx`).

### Benannte Teile (in Blender: Objektname bzw. Materialname)

| Name | Typ | Wofür |
|---|---|---|
| `body` | Objekt | Karosserie. Wird beim Tieferlegen abgesenkt. **Räder dürfen nicht darunter hängen.** |
| `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR` | Objekt | Serienräder. Ihr Ursprung muss in der Radmitte liegen. Bei Felgen-Tausch werden sie ausgeblendet und durch das gewählte Rad ersetzt. |
| `exhaust_tips` | Objekt | Serien-Endrohre, werden bei Abgas-Tausch ausgeblendet |
| `paint` | Material | Lack. Die Farbe wird vom Konfigurator gesetzt. |
| `caliper` | Material | Bremssättel, werden bei Bremsen-Tausch umgefärbt |
| `anchor_lip`, `anchor_spoiler`, `anchor_tips`, `anchor_intake` | Empty (optional) | Verschiebt die Anbauteile, falls sie nicht an den Standardpositionen sitzen |

Fehlt ein Name, nutzt der Konfigurator Standardwerte. Fehlt etwa `body`, senkt sich beim Tieferlegen das ganze Auto ab.

### Blender-Kurzanleitung

1. Modell importieren, mit `S` auf ca. 4,7 m Länge skalieren, so drehen, dass die Front nach +X zeigt, und *Apply → All Transforms* ausführen.
2. Räder als eigene Objekte trennen (`P` → *Selection*), *Origin to Geometry* setzen und wie oben benennen.
3. Lackmaterial in `paint` umbenennen, Bremssattel-Material in `caliper`.
4. *File → Export → glTF 2.0*, Format *glTF Binary (.glb)*, unter *Data → Compression* Draco aktivieren. Wichtig: Blender exportiert mit Y-up, also Front +X, links −Y in Blender.
5. Datei in Cloudflare R2 hochladen (oder für den Anfang nach `public/models/`) und die URL in Keystatic eintragen.

Aus Zeitgründen kann man die Schritte 1–4 als Auftrag vergeben (z. B. Fiverr, „split car model for web configurator, glTF“, ca. 50–150 €).
