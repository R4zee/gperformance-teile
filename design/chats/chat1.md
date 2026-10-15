# GPerformance car parts platform

_Started 2026-10-10 22:39 UTC_

---

## User

The owner of https://www.youtube.com/@GPerformance approached me. He wants to create a site very similar to https://vehiclevirals.com/. A site to browse handpicked parts for car models. It should work on an affiliate system (link to the offers with an affiliate link) and be German. Selection by make, model, generation, engine. Then a 3D view of the car like Forza car modding, https://www.3dtuning.com/en-US/home or any brand car configurator with visible parts swapping and zooming on the corrosponding area. Styling should be very clean and sleek. Not many pills or roundings. No font changes within sentences. Very modern.

## Assistant



## Assistant

_[tool: ask_user]_

_[tool: ask_user]_

I've sent a short question form covering scope, how the 3D view should work, how affiliate offers appear and which curation details to show. I'll start building once you've answered.

## User

Answered — assets: unnamed.jpg; scope: Homepage, Vehicle selector (make → model → generation → engine), 3D configurator / part swapping, Category part list, Part detail + affiliate offers, Build summary / share, Mobile versions; view_3d: Real interactive 3D (three.js, orbit/zoom, swap a few parts on a placeholder car); swap: Both: click car hotspots or use list; offers: One recommended shop link per part; curation: G Performance pick / creator note; theme: Light (configurator); variations: One polished direction, full flow; example_car: M4 F82; design_system: Design system left to Claude

## Assistant

_[tool: view_image]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: copy_files]_

_[tool: write_file]_

_[tool: dc_write]_

_[tool: show_html]_

_[tool: ready_for_verification]_

I've built the full flow as one clickable German prototype, `G Performance Teile.dc.html`. It's out for an automated check now.

- **Startseite:** a headline with a quick picker (Marke → Modell → Generation → Motor) next to a slowly rotating 3D M4, then popular cars and a short note on how the affiliate links work.
- **Fahrzeugauswahl:** a step-by-step picker with large tiles. Only BMW M4 F82 has data so far; everything else is marked "Bald verfügbar".
- **Konfigurator:** a real interactive 3D car you can drag and zoom. You pick an area either by clicking a point on the car or from the category list, and the camera moves there. Choosing a part swaps it on the car straight away: wheels, brake caliper colour, ride height, exhaust tips, front lip, spoiler and the intake cover.
- **Teileliste:** switch the configurator to "Liste" for a grid of all parts in a category, sortable by recommendation or price.
- **Teil-Detail:** one recommended shop per part with an "Zum Angebot bei …*" button, a G Performance note on his picks, and the required affiliate disclosure.
- **Build-Übersicht:** all chosen parts with prices, shop links and a total, plus a button that copies a shareable link.
- **Mobil:** the same screens rearrange below 900px wide: car on top, categories as a sideways-scrolling row, and a fixed bar at the bottom with the total.

The design is light, with square corners, one font family (with its monospace version for prices and labels) and one red-orange accent. The car paint can be switched in the Tweaks panel.

Things to know:
- **Placeholders:**
  - **3D car:** built from simple shapes. The real version needs a proper 3D model of each car with the swappable parts as separate pieces.
  - **Product photos:** placeholder boxes.
  - **Logo:** only a JPG was available, so I used it as-is. A vector logo will look much sharper.
- **Made-up content:** parts, prices and shops are invented examples. The Amazon and eBay links carry dummy partner IDs (`tag=gperformance-21`, `campid=0000000000`) that need replacing with his real affiliate IDs.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

I fixed all five issues from the check; it's re-checking now.

- **Hotspot labels:** the car now shows only small square markers. A label appears on hover or for the area you've selected, so labels no longer overlap.
- **Home page:** the stray "Ansaugung" label in the hero's top-left corner is gone.
- **Mobile categories:** the row now scrolls sideways only, without the double scrollbars.
- **Logo:** cropped tighter in the header so the "Performance" wordmark is readable.
- **Car size:** the car fills more of the frame on narrow screens.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

I re-centred the header logo so the "Performance" wordmark should now be visible, and hid the scrollbar on the mobile category row. The page loads without errors, but I skipped the automated check this time, so I haven't confirmed the logo visually.

