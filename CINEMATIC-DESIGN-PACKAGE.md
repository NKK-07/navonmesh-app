# NAVONMESH cinematic page: design package

Tier 1, one continuous six second shot. Written before any generation.
Every viewer facing line below ships verbatim.

---

## 1. The brand premise

One word from your own world carries the page: **hold**.

The chamber holds eight degrees through the night with no grid behind it.
The farmer holds their harvest until the price is worth selling into. Same
verb, two meanings, and the second one is what people are actually buying.
Every section on the page teaches that one idea. The engineering is the
proof, not the point. If a section does not serve holding, it does not
belong on the page.

This is why the research matters. Nobody argues that cold storage works.
They sell at harvest because they cannot wait. The page sells the waiting.

---

## 2. The palette as CSS tokens

Sampled from the world of the footage: dawn gold on the roof, cold blue
through the chamber, frost white, and the green already in your brand.
Final values get confirmed against the approved footage after the video
gate.

```css
:root{
  --canvas:#0F1519;        /* deep cold blue black, graded toward the chamber, never pure black */
  --panel:#161F25;         /* cards and raised surfaces */
  --accent:#04785C;        /* the CTA and rare emphasis, carried from your site */
  --accent-hover:#05A47C;  /* hover only */
  --accent-muted:#12332A;  /* borders, glows, particles, whisper level */
  --warm:#C08A3E;          /* the sunlight, used sparingly and never for a control */
  --text-secondary:#93A4AE;
  --text-primary:#F2F5F4;
}
```

The warm token is the one addition to your existing system. It exists so
the top of the page can carry the sun and the bottom can carry the cold,
and so the page reads as the same world as the film.

---

## 3. The type trio

- **Display: Outfit, 800.** A deliberate deviation, stated out loud. The
  usual advice is a fresh display face, but Outfit is already the voice of
  your five existing pages, and this page has to sit beside them rather
  than announce itself as a different company.
- **Body: Inter, 400 and 500.**
- **Labels: IBM Plex Mono, 500 and 600.** This is the face doing the most
  character work. It is the engineering register your site already speaks,
  and it is what makes a readout look like an instrument.

---

## 4. The band map

Four bands over the six second scrub. Ranges are starting points and get
validated by the flick test later.

| Band | Range | Footage moment | Copy (verbatim) | Entrance |
|---|---|---|---|---|
| 1 | 0.00 to 0.16 | First sun striking the array on a hillside roof, mist still moving across the slope | "The sun comes up over Ri-Bhoi." | Words rise from below the line, slow, as the light arrives |
| 2 | 0.22 to 0.42 | Camera crosses the panel glass. Flare, a beat of blur, then a descending spine of light | "By eight, it is already cold inside." | Letters resolve out of blur, matching the lens crossing |
| 3 | 0.50 to 0.70 | Through the insulated wall. Frost blooms outward across the chamber surface | "Eight degrees, held all night, with nothing plugged in." | The word held stays fixed while the rest settles around it |
| 4 | 0.78 to 0.96 | Settles on crates in still blue air, cold drifting, produce firm | "So the harvest can wait for a price worth taking." | Fade up only, no movement, because the film has come to rest |

The action lane runs down the centre of frame. Copy sits left on wide
screens, with the right side of frame kept clear.

---

## 5. The static hero copy block

For phones and for reduced motion. This stands over the ending frame with
no journey behind it.

- **Headline:** "Cold that runs on sunlight."
- **Subline:** "A 200 kg cold room for the hills of the North East. No grid, no diesel, no monthly bill. Eight degrees held through the night, so your harvest waits for a price worth taking."
- **CTA:** "Book a unit through your FPO"

---

## 6. The below-fold outline

Every section funnels to one anchor, `#book`.

**6.1 The wait** (the pain, in their words)
> "Twenty five to thirty percent of what the North East grows never gets
> sold. Not because it was not good enough, but because it could not wait.
> At harvest everyone sells at once, the price drops, and produce that
> cannot be stored has to move that day. The word for it is a distress
> sale, and it takes twenty to thirty percent off a farm's income every
> year."

**6.2 What holding is worth** (the interactive moment)
A crop selector. Pick Khasi Mandarin, ginger, king chilli, cabbage or
tomato and the panel shows days at ambient against days at your set point,
with the real Shillong mandi price beside it. This is the one interactive
moment on the page and it lives here, because it turns the premise into
the visitor's own arithmetic.
> "Pick what you grow. The bar on the left is how long you have now. The
> bar on the right is how long you have with a unit on your roof."

**6.3 How it holds** (the proof)
Four plain blocks, no jargon before the number.
> "2.4 kW on the roof. No grid connection, no diesel, no monthly bill."
> "100 mm PUF and a hermetic seal keep 90 to 95% humidity in and the
> monsoon out."
> "A 70 kg phase change store keeps cooling for 8.6 hours after the
> compressor stops."
> "868 MHz LoRa carries readings where there is no cell signal, with SMS
> behind it and an app that works with no signal at all."

**6.4 Ten crops, shipped with the unit**
> "Each one carries its own set point, humidity band and chilling limit.
> Cabbage at zero to two degrees. King chilli never below four, or it
> takes chilling injury. The unit already knows the difference."

**6.5 The objections** (FAQ, from the research)
> **"We cannot afford one unit per farm."**
> "Most units are owned by an FPO and shared across members. One unit
> serves a collection point, and the cost per farmer per season is a
> fraction of one distress sale."
>
> **"Who fixes it when it breaks?"**
> "The unit reports its own health over LoRa before you notice anything.
> Nine sensors, a quarterly check, and a technician who is told what is
> wrong before they arrive."
>
> **"What happens in the monsoon, with no sun for days?"**
> "The battery carries the night. The phase change store carries 8.6 hours
> beyond that. Through a long grey spell the unit steps down through five
> power modes rather than stopping."
>
> **"Nobody at our collection point reads English."**
> "Eight languages, including Khasi, Mizo, Meitei and Nagamese, with
> speech output for anyone who does not read a screen."

**6.6 The close**
> "One unit. Two hundred kilograms. The week you never had."

**6.7 The form**
- Label: "Your name"
- Label: "FPO or village"
- Label: "What you grow"
- Button: "Book a unit"
- Success: "Booked. Someone from the Ri-Bhoi team will call you within two working days."
- Handling: JS only success state for now, since the site is static. If a
  real inbox is wanted before launch, a free form service gets wired in
  Phase 8 and the user picks which.

**6.8 Footer**
Standard footer, links back to the five existing pages. No fictional brand
disclosure, because the brand is real. Per your decision, no AI imagery
note either. The generated shots are placeholders and get swapped for
photographs of the built unit.

---

## 7. The vector layer plan

- **The signature element: the hold line.** One hand drawn SVG. Two lines
  travel left to right across the section divider. The upper line climbs
  and wanders, which is ambient temperature through a day. The lower line
  runs dead flat at eight degrees. The flat line is the product. It draws
  itself once on entry and then stops.
- **Whisper particles.** Slow drifting cold motes over the chamber
  sections only, in `--accent-muted`, low count, never over text.
- **Frost hairlines.** Section rules that grow from the left like the
  frost in band three, reusing the draw already written for the marketing
  site.
- All of it honours reduced motion: final states shown, every drive
  stopped.

---

## 8. The engineering list

The full standard, named so the build cannot half remember it: the Blob
fetch with the loading ring, the dt normalized lerp, gated seeks, delta
gated DOM writes, band pacing validated by the flick test, the four layer
legibility system, the five static hero gates kept live with change
listeners, complete without video, and the quality floor. All of it is in
`references/scrub-pipeline.md`, which gets read in full before the build
begins, plus the whole site animated standard in Phase 8 of the skill.

---

## 9. The copy gate

Every viewer facing line above ships verbatim. The built page must pass
the Phase 9 grep gate, zero em dashes and zero stock words, plus the body
copy sweep for AI tells, before anyone sees it. The repeated "held" in
band three and section 6.6 is a deliberate brand device and stays.
