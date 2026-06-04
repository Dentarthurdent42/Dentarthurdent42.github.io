# physical-metric-space

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
- **Color encoding in OKLAB space** tied to dimensional coordinates
- **Grouped metrics** when multiple physical quantities share the same dimensional signature
- **Keyboard and mouse controls** for orbiting, zooming, and resetting the view

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
open dimensional_analysis.html
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
