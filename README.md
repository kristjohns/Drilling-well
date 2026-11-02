# Drilling-well

## Restrained wellhead growth in a subsea well

What happens to the casing strings of a subsea well when production heats them up and the wellhead and conductor are **not allowed to move upward**?

- **Report:** [`report/REPORT.md`](report/REPORT.md) covers the well setup, how temperature is applied, the mechanics, effective force and helical buckling, results and assumptions.
- **Complete video (recommended):** `deliverables/restrained_wellhead_growth_complete.mp4` (≈ 27 min). It has chapter markers and subtitles, and combines:
  - Part 1: the explainer;
  - Part 2: the free vs. restrained comparison;
  - Part 3: Q&A on restraint force split, length, buckling/yield limits and why the inner casings are locked in.
- **Conductor lock-in load video:** `deliverables/conductor_lock_in_load.mp4` (≈ 8 min). It shows how to calculate the force needed to hold a 30" × 1" or 36" × 1.5" conductor down:
  - the hand calculation;
  - the inner-string push;
  - the role of the soil;
  - model results, partial restraint and time;
  - design checks.

  Calculations are in `analysis/lockin_conductor.py`; video source is in `video/lockin/`.
- **Explainer video:** `deliverables/restrained_wellhead_growth_explainer.mp4` (≈ 12.5 min, narrated, with English subtitles in the `.srt`).
- **Comparison video:** `deliverables/free_vs_restrained_wellhead_comparison.mp4` (≈ 7 min). It runs the free and restrained wellhead side by side and covers:
  - the heat-up;
  - the forces on the wellhead;
  - the conductor and surface casing force and stress profiles;
  - the inner casings and their buckling;
  - a scoreboard of the key numbers;
  - partial restraint and load cycling;
  - the uncemented-20" case.
- **Model:** [`analysis/`](analysis) is a 1-D multi-string thermal–mechanical model with standard API casing (30", 20", 13⅜", 9⅝", 5½").
  - `wellmodel.py`: thermal model (Ramey / Hasan–Kabir + radial resistance network), hung strings with ballooning and helical buckling (Lubinski / Mitchell / Wu–Juvkam-Wold), conductor/surface-casing foundation on t–z soil springs, and wellhead equilibrium (free, spring-restrained or fully restrained).
  - `run_cases.py`: runs all cases and writes `results/results.json`.
  - `make_figures.py`: makes the report figures.
- **Video source:** [`video/`](video) contains the narration script, TTS generation, Manim scenes and the assembly script. The comparison video's scenes and narration are in `video/compare/`, the Q&A part is in `video/qa/`, and `video/build_combined.py` assembles the complete video.

### Key result (base case, 1 year of production, WHFT ≈ 108 °C)

| | Free wellhead | Restrained wellhead |
|---|---|---|
| Wellhead growth | 61 mm | 0 |
| 13⅜" added compression | 2.20 MN | 2.32 MN (+5 %) |
| 9⅝" added compression | 1.51 MN | 1.56 MN (+3 %) |
| 30" / 20" stress change at seabed | +44 / +8 MPa | −144 / −180 MPa |
| Restraint force | – | 19.5 MN (≈ 2 000 t) |
| Inner strings buckled? | yes, helically (elastic) | yes, slightly more |

### Reproduce

```bash
pip install numpy scipy matplotlib
python analysis/run_cases.py && python analysis/make_figures.py
# video (needs manim, LaTeX, kokoro-onnx + model files):
cd video && python make_tts.py && manim -r 1920,1080 --frame_rate 30 scenes_a.py ... && python build_video.py --media media --out ../deliverables/restrained_wellhead_growth_explainer.mp4
```
