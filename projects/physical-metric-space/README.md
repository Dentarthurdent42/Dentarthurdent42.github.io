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
- **Color encoding in OKLAB space** tied to dimensional coordinates (explained in the tutorials' glossary)
- **Grouped metrics** when multiple physical quantities share the same dimensional signature
- **Keyboard and mouse controls** for orbiting, zooming, and resetting the view
- **Draw vectors** between any two points to see the equation that connects them — the exponent difference is the factor that turns one quantity into the other (e.g. Force → Energy gives `Energy = Force × Length`)
- **Calculus operators** — pick d/dt, ∫dt, ∂/∂x (∇), ∇², ∫dx, ∫dA, ∫dV and more to see the operator as a field of parallel arrows. A derivative or integral is a fixed shift in exponent space, so chains like Length → Velocity → Acceleration → Jerk show up as straight lines. Gradient, divergence and curl share the same L⁻¹ shift; they differ in tensor rank, which L·M·T exponents can't see. √ and x² scale the vector about the origin instead of shifting it
- **General powers** — the xⁿ operator raises every quantity to any exponent you type (2/3, −5/3, 1.5)
- **Power laws** — formulas like Kolmogorov's E(k) = C·ε²ᐟ³·k⁻⁵ᐟ³, η = (ν³/ε)¹ᐟ⁴, ω = √(g/L) and Kepler's third law drawn as a path from the origin: each factor Xᵖ steps p times along X's ray, passing through unnamed fractional points before landing on the result
- **Commensurable quantities** — quantities with identical dimensions (addable, comparable) share a point; each gets its own bead on a ring around it. Hover to fan out every member's name; click a bead to copy that one name
- **Fractional exponents** — quantities like fracture toughness (M·L⁻¹ᐟ²·T⁻²), sorptivity (L·T⁻¹ᐟ²) and Gaussian charge (L³ᐟ²·M¹ᐟ²·T⁻¹) sit between lattice points; exponents display as fractions
- **Click to copy** any point's names, formula label, or vector equation to the clipboard
- **Search** (press `/`) for quantity names (“force”), symbols (“F” — case-sensitive), formulas, operations (×, ÷), controls and glossary terms
- **Tutorials** behind the glowing **?** button: short guided walkthroughs (what the points are, drawing vectors, formula arrows, search, projection, labels) with nested glossary tooltips and progress marks
- **Formula arrows** for well-known laws (F = ma, E = mc², …), hidden by default and toggled from the controls panel

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
