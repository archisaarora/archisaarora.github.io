# Archisa Arora — portfolio

A static site: no build step, no dependencies. Open `index.html` or serve the folder.

```
python3 -m http.server 8000     # then visit http://localhost:8000
```

## Put it on GitHub Pages

1. Create a repo named `archisaarora.github.io` (or any name) and push this folder to `main`.
2. Repo Settings → Pages → Deploy from branch → `main` / root.

## Where things live

| Path | What it holds |
|---|---|
| `js/data.js` | **All content**: profile, hero lines and highlights, skills, projects, timeline, resume. Edit this to change the site. |
| `js/tree.js` | The cherry tree in the hero and the falling petals. |
| `js/main.js` | Builds the page from `data.js`: hero, project deck, timeline, skill boxes, resume tab, floating menu, scroll motion. |
| `js/demos/*.js` | One file per live demo. |
| `js/lib/nn.js` | The neural network used by the DigiDetect demo (same file as in the DigiDetect repo). |
| `data/digits.js` | The MNIST sample the DigiDetect demo trains on. |
| `scripts/check_nn.js` | Trains the network in Node and prints its accuracy. |
| `css/style.css` | Styles. The palette is the variables at the top. |
| `assets/Archisa_Arora_Resume.pdf` | Resume PDF linked from the Resume tab. |
| `RESUME_BULLETS.md` | Resume bullets for DigiDetect. |

## Add a project

1. Add an object to `projects` in `js/data.js`.
2. For a live demo, create `js/demos/yourdemo.js`:

```js
Site.registerDemo("yourdemo", function (root) {
  // build your UI inside `root`
  return { start() {}, stop() {} };   // called when its tab is shown or hidden
});
```

3. Add `<script src="js/demos/yourdemo.js"></script>` to `index.html` and set `demo: "yourdemo"` on the project.

## What each demo is

- **SwipeMeet**: a stand-in for the request flow with made-up posts.
- **SecureSafe**: a step-by-step walkthrough of the lock (same routes and messages as `backend/app.py`). The hardware is drawn, not connected.
- **Co-traveler detection**: a JavaScript re-implementation with a spatial-hash index on simulated walkers; precision and recall are computed against the simulation's ground truth.
- **Rocket telemetry**: an invented flight encoded into the real 41-byte packet layout with the real CRC-16, sent through a lossy pretend radio, then decoded and plotted. The real project is in the two UPennRocketry repos linked on its tab.
- **DigiDetect**: the neural network from https://github.com/archisaarora/DigiDetect, trained in the browser on a bundled sample of 5,000 MNIST digits and tested on 1,000 it never saw.
