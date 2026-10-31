# Drilling-well

## Restrained wellhead growth in a subsea well

What happens to the casing strings of a subsea well when production heats them up and the wellhead and conductor are **not allowed to move upward**?

- **Report:** [`report/REPORT.md`](report/REPORT.md) covers the well setup, how temperature is applied, the mechanics, effective force and helical buckling, results and assumptions.
- **Explainer video:** `deliverables/restrained_wellhead_growth_explainer.mp4` (≈ 12.5 min, narrated, with English subtitles in the `.srt`).
- **Model:** [`analysis/`](analysis) is a 1-D multi-string thermal–mechanical model with standard API casing (30", 20", 13⅜", 9⅝", 5½").
  - `wellmodel.py`: thermal model (Ramey / Hasan–Kabir + radial resistance network), hung strings with ballooning and helical buckling (Lubinski / Mitchell / Wu–Juvkam-Wold), conductor/surface-casing foundation on t–z soil springs, and wellhead equilibrium (free, spring-restrained or fully restrained).
  - `run_cases.py`: runs all cases and writes `results/results.json`.
  - `make_figures.py`: makes the report figures.
- **Video source:** [`video/`](video) contains the narration script, TTS generation, Manim scenes and the assembly script.

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
