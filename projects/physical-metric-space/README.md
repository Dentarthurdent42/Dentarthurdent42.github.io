# physical-metric-space

**[Live demo → dentarthurdent42.github.io/physical-metric-space](https://dentarthurdent42.github.io/physical-metric-space/)**

An interactive visualization of **dimensional analysis as a geometric space**.

This project maps physical quantities into a 3D coordinate system defined by exponents of the base dimensions:

- **L** — Length
- **M** — Mass
- **T** — Time

Instead of treating dimensional analysis as a table of units or a set of symbolic manipulations, this project turns it into something you can **explore visually**. Quantities that share the same dimensional structure occupy the same point in space, making relationships, equivalences, and abstractions much easier to see.

## What it does

The app renders physical quantities in **L/M/T exponent space** as interactive 3D points. Each point corresponds to a dimensional signature such as:

- velocity → L T^-1
- force → L M T^-2
- energy → L^2 M T^-2
- pressure → L^-1 M T^-2

The visualization helps show that dimensional analysis is not just a bookkeeping trick — it is a compact structural representation of physical meaning.

## Features

- **Interactive 3D exploration** using Three.js
- **Perspective and orthographic projection** modes
- **Hover tooltips** for inspecting quantities
- **Label styling controls** for readability
- **Color encoding** tied to dimensional coordinates (explained in the tutorials' glossary)
- **Grouped metrics** when multiple physical quantities share the same dimensional signature
- **Keyboard and mouse controls** for orbiting, zooming, and resetting the view
- **Draw vectors** between any two points to see the equation that connects them — the exponent difference is the factor that turns one quantity into the other (e.g. Force → Energy gives `Energy = Force × Length`)
- **Calculus operators** — pick d/dt, ∫dt, ∂/∂x (∇), ∇², ∫dx, ∫dA, ∫dV and more to see the operator as a field of parallel arrows. A derivative or integral is a fixed shift in exponent space, so chains like Length → Velocity → Acceleration → Jerk show up as straight lines. Gradient, divergence and curl share the same L⁻¹ shift; they differ in tensor rank, which L·M·T exponents can't see. √ and x² scale the vector about the origin instead of shifting it
- **General powers** — the xⁿ operator raises every quantity to any exponent you type (2/3, −5/3, 1.5)
- **Power laws** — formulas like Kolmogorov's E(k) = C·ε²ᐟ³·k⁻⁵ᐟ³, η = (ν³/ε)¹ᐟ⁴, ω = √(g/L) and Kepler's third law drawn as a path from the origin: each factor Xᵖ steps p times along X's ray, passing through unnamed fractional points before landing on the result
- **Angle as a dimension** — angle can be a fourth exponent **A** (1 rad = A, sr = rad² = A², one cycle = 2π rad), so torque (N·m/rad), angular momentum (J·s/rad), moment of inertia (kg·m²/rad²) and radiant intensity (W/sr) separate from the quantities they share a point with in SI. The default is the **SI view** (angle hidden, rad = 1). Turn on **A** under ⚙ Controls › Dimensions to separate them; with all four shown, angle is drawn as short **vertical stalks** off each L·M·T point, or one **slice** of A at a time. Hidden exponents are ignored, so points that differ only there merge into one sphere with beads. Angle operators ∂/∂θ, ∫dθ and ∫dΩ join the operator panel
- **Fractional exponents on demand** — quantities with half-integer exponents (per-√Hz noise densities such as NEP and accelerometer noise, and CGS-Gaussian electromagnetic quantities such as charge L³ᐟ²·M¹ᐟ²·T⁻¹ and magnetometer noise in G/√Hz, where all three exponents are fractional) are hidden by default and shown with ⚙ Controls › Dimensions › Fractional exponents. Picking one from search switches them on
- **Commensurable quantities** — quantities with identical dimensions share a point, but only quantities of the same *kind* are commensurable (time = period = half-life; energy ≠ torque). Where different kinds share a point, each kind gets its own bead on a ring around it. Hover to fan out the kinds; click a bead to copy that kind's names
- **Fractional exponents** — quantities like fracture toughness (M·L⁻¹ᐟ²·T⁻²), sorptivity (L·T⁻¹ᐟ²) and Gaussian charge (L³ᐟ²·M¹ᐟ²·T⁻¹) sit between lattice points; exponents display as fractions
- **Click to copy** any point's names, formula label, or vector equation to the clipboard
- **Search** (press `/`) for quantity names (“force”), symbols (“F” — case-sensitive), formulas, operations (×, ÷), controls and glossary terms
- **Tutorials** behind the glowing **?** button: short guided walkthroughs (what the points are, drawing vectors, formula arrows, search, projection, labels) with nested glossary tooltips and progress marks
- **Formula arrows** for well-known laws (F = ma, E = mc², …), hidden by default and toggled from the controls panel
- **Share links** — the 🔗 button (or ⚙ Controls › Share & source) copies a link that reopens the exact view: camera, projection, dimensions, labels, visibility, drawn vectors, and any operator or power law. On phones it opens the system share sheet. See [Share link format](#share-link-format)
- **Source link** — ⚙ Controls › Share & source links back to this repository

## Why this exists

A lot of mathematical and physical structure becomes easier to understand when it is made visual.

This project explores the idea that dimensional exponents form a useful embedding space for physical concepts. That makes it interesting not only as a physics or math visualization, but also as a way of thinking about:

- formula retrieval
- semantic structure in scientific expressions
- clustering related physical quantities
- making abstract ideas more intuitive

## Tech stack

- **HTML**
- **JavaScript**
- **Three.js**

## Running it locally

Because this project is a standalone HTML app, you can usually run it by opening the file directly in a browser:

```bash
open index.html
```

Or serve it locally with a simple static server:

```bash
python -m http.server
```

Then open the local address in your browser.

## Controls

- **Mouse drag** — orbit the scene
- **Scroll / pinch** — zoom
- **Hover** — inspect a point
- **Arrow keys** — orbit with keyboard
- **Space** — pause / resume rotation
- **R** — reset the view
- **V** (or the ✎ Draw vector button) — toggle vector drawing; click a start point, then an end point
- **Esc** — cancel the vector in progress / leave drawing mode
- **O** (or the Operators panel) — cycle through calculus operators; Esc clears
- **Click** a point, formula arrow, drawn vector, or operator arrow — copy its label / equation
- **🔗** — copy a link to the current view

## Share link format

A share link keeps the whole view in the URL fragment, so it works on any static host and nothing is stored on a server:

```
index.html#v=1&cam=9,6,11&tgt=0,0,0&fov=50&dims=LMT&op=ddt&vec=1,0,0,0~1,0,-1,0
```

| Key | Value | Default (v1) |
| --- | --- | --- |
| `v` | format version | `1` |
| `cam`, `tgt` | camera position and orbit target, `x,y,z` | `9,6,11` and `0,0,0` |
| `fov` | perspective field of view in degrees (2–90) | `50` |
| `proj`, `zoom` | `proj=ortho` with its zoom factor | perspective, `1` |
| `dims` | base dimensions shown, any of `LMTA` (new links always write it; the app itself now opens in SI view, `LMT`) | `LMTA` |
| `mode` | 4-D view: `stalk` or `slice` (`oblique` is retired and opens as `stalk`) | `oblique`, shown as `stalk` |
| `slice` | angle layer for slices (−2…2) | `1` |
| `lam` | retired (λ of the removed oblique axis): accepted and ignored | |
| `frac` | fractional exponents shown (`1`/`0`) | `0` |
| `spheres`, `labels` | `full`, `low` or `hidden` | `full` |
| `lsize`, `lfont`, `lfx` | label size (6–20), typeface id, legibility effect | `9.5`, `courier`, `halo` |
| `formulas`, `rot` | formula arrows, auto-rotation (`1`/`0`) | `0` |
| `op`, `n` | operator id (`ddt`, `intdx`, `pow`, …) and the exponent for `pow` | none, `2/3` |
| `law` | power-law id (`kolmogorov-spectrum`, `kepler-third`, …) | none |
| `vec` | drawn vectors, `from~to` pairs separated by `;` | none |
| `focus` | point whose card is open | none |

Points are written as their exponents `L,M,T,A` with exact fractions (`-1/2,1/2,-1,0`), never by name or list position, so renaming or adding quantities cannot break a link.

**Compatibility rules** (so links made today keep working):

- Keys are never renamed, removed or given a new meaning. New settings get new keys.
- A missing key means the frozen v1 default in the table above, not whatever the app defaults to later.
- Operator and power-law ids are fixed once published.
- A retired setting maps to its nearest replacement rather than failing: `mode=oblique` opens as stalks and `lam` is ignored.
- Anything unknown or out of range is skipped and the rest still applies; the viewer is told how many settings were skipped. A link from a newer version opens with whatever this version understands.
- `v` is bumped only for a change that cannot follow these rules, and the decoder for every earlier version stays.

## Project goal

The goal of this project is to make dimensional structure feel **concrete, inspectable, and explorable**.

If a formula, quantity, or unit system has hidden structure, I want to be able to see it.

## Future directions

Possible next steps for the project:

- support for additional base dimensions
- filtering and search
- richer metadata for each quantity
- connections between related quantities
- exportable views for teaching or research use

## Author

Created by **Mathieu Poulin**.
