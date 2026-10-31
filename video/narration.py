"""Narration script, split into beats.  Each beat becomes one audio clip and the
animations of that beat are timed to the clip length.

Numbers in the text are taken from analysis/results/results.json (base case,
1 year of production) and rounded.  They are written out in words so the
speech engine pronounces them predictably.
"""

SCRIPT = {
    # ------------------------------------------------------------------ 1
    "S01_Intro": [
        ("intro_1", "When a subsea production well starts flowing, hot oil from the reservoir "
                    "warms every steel string around it, and the steel wants to get longer. "
                    "Normally the wellhead is allowed to move. It rises a few centimetres off the seabed."),
        ("intro_2", "But what if you don't let it? What if the wellhead and the conductor are held, "
                    "so they cannot move upward? Where does the expansion go? And does the casing buckle?"),
        ("intro_3", "In this video we build a well with standard casing sizes, apply the production "
                    "temperature, and follow the physics all the way to the loads and the buckling."),
    ],
    # ------------------------------------------------------------------ 2
    "S02_Architecture": [
        ("arch_1", "Here is our example. An oil producer in three hundred and fifty metres of water. "
                   "The thirty inch conductor, with a one inch wall, is drilled and cemented eighty metres "
                   "into the seabed. It carries the low pressure wellhead housing."),
        ("arch_2", "The twenty inch surface casing, one hundred and thirty three pounds per foot, runs to "
                   "seven hundred metres and is cemented all the way back to the seabed. On top of it sits "
                   "the eighteen and three quarter inch high pressure wellhead housing, which lands and "
                   "locks inside the conductor housing."),
        ("arch_3", "Next comes the thirteen and three eighths inch intermediate casing, seventy two pounds "
                   "per foot, grade L eighty, set at eighteen hundred metres. Only the bottom five hundred "
                   "metres are cemented. Above the top of cement, thirteen hundred metres of pipe hang free in mud."),
        ("arch_4", "Then the nine and five eighths inch production casing, fifty three and a half pounds per "
                   "foot, grade P one ten, set at three thousand two hundred and fifty metres, with its top of "
                   "cement at two thousand five hundred and fifty. A seven inch liner covers the reservoir, and "
                   "five and a half inch tubing, with a production packer, brings the oil up."),
        ("arch_5", "The spaces between the strings are the annuli. The A annulus is between the tubing and the "
                   "production casing. B is outside the nine and five eighths, and C is outside the thirteen "
                   "and three eighths. Each top of cement sits below the previous casing shoe, so the B and C "
                   "annuli can bleed into the formation instead of building up pressure."),
        ("arch_6", "The key feature for this problem is the free, uncemented length of each string. Each one is "
                   "a long, slender steel column, fixed in cement at the bottom and hung from the wellhead at the top."),
    ],
    # ------------------------------------------------------------------ 3
    "S03_Wellhead": [
        ("wh_1", "Let's zoom in on the wellhead. Each casing string hangs from a hanger that lands on a load "
                 "shoulder inside the high pressure housing. A seal assembly and a lockdown ring hold it in place. "
                 "So every string is tied to the same point."),
        ("wh_2", "Downward loads, like hanging weight, travel through the hangers into the housing, then into "
                 "the cemented twenty inch and thirty inch strings, and finally into the soil."),
        ("wh_3", "If a hot string pushes upward instead, its hanger pushes up against the lockdown, and that "
                 "force must be carried by the very same structure."),
    ],
    # ------------------------------------------------------------------ 4
    "S04_Temperature": [
        ("temp_1", "Now, the temperature. Before production, everything sits at the undisturbed geothermal "
                   "temperature. Six degrees at the seabed, rising three point three degrees per hundred metres, "
                   "to about one hundred and eighteen degrees at the reservoir."),
        ("temp_2", "This is also the temperature at which the cement set around each casing. So it is the "
                   "stress free reference state. Every load in this problem comes from the change in temperature "
                   "from this state."),
        ("temp_3", "In production, about three thousand cubic metres of liquid per day flows up the tubing. "
                   "It moves so fast that it loses only about ten degrees on the way, and arrives at the wellhead "
                   "at about one hundred and eight degrees. The gap between the flowing temperature and the rock "
                   "is largest near the seabed, where the rock is coldest."),
        ("temp_4", "That heat flows radially outward, through every layer, to the cold formation. Each layer is a "
                   "thermal resistance, like resistors in series. The formation itself is the largest one, so the "
                   "casings end up much closer to the oil temperature than to the rock temperature."),
        ("temp_5", "Just below the seabed, after a year of production, the tubing has warmed by about one hundred "
                   "degrees, the nine and five eighths by ninety seven, the thirteen and three eighths by eighty "
                   "seven, the twenty inch by seventy five, and the conductor by about sixty."),
        ("temp_6", "Deeper down the warming fades, and it reaches zero at the reservoir. The inner strings respond "
                   "within hours. The outer strings and the rock warm over weeks and months, so the loads keep "
                   "creeping up long after start up."),
    ],
    # ------------------------------------------------------------------ 5
    "S05_ThermalStrain": [
        ("strain_1", "Steel expands by about twelve point four millionths of its length for every degree. "
                     "Integrate that over the free length. The thirteen and three eighths, warmed by seventy one "
                     "degrees on average over thirteen hundred metres, would grow one point one four metres if it "
                     "were free. The nine and five eighths would grow almost two metres."),
        ("strain_2", "But the string is not free. The bottom is locked in cement, and the top is locked in the "
                     "wellhead. If the length cannot change, the thermal strain must be cancelled by an equal and "
                     "opposite mechanical strain. And mechanical strain means stress. Sigma equals E, times alpha, "
                     "times delta T."),
        ("strain_3", "For steel, that is about two and a half megapascals of compression for every degree. "
                     "Multiply by the steel area, and every degree adds thirty four kilonewtons in the thirteen and "
                     "three eighths, and twenty six in the nine and five eighths. Fully restrained, that is two point "
                     "four, and one point six meganewtons."),
    ],
    # ------------------------------------------------------------------ 6
    "S06_Springs": [
        ("spring_1", "So how much does the wellhead actually move in a normal well? Think of each string as a spring. "
                     "A long free casing is a soft spring. The thirteen and three eighths has an axial stiffness of "
                     "about two meganewtons per metre. The conductor and the cemented surface casing, gripped by "
                     "cement and soil, are more than a hundred times stiffer."),
        ("spring_2", "The hot inner strings push up on the wellhead with about four meganewtons in total. "
                     "The stiff foundation hardly yields. At the same time, the conductor and the surface casing "
                     "expand themselves, sliding in the soft soil near the seabed."),
        ("spring_3", "Solve for equilibrium, and the wellhead grows about sixty one millimetres. Forty four of those "
                     "come from the foundation's own expansion, and seventeen from the push of the inner strings."),
        ("spring_4", "And here is the surprising part. Sixty one millimetres is tiny compared with the one point one "
                     "four metres the thirteen and three eighths wanted. So even in a normal subsea well, the inner "
                     "strings are already ninety to ninety six percent restrained. They already carry almost the full "
                     "thermal compression."),
    ],
    # ------------------------------------------------------------------ 7
    "S07_Restrained": [
        ("res_1", "Now let's hold the wellhead and the conductor, so the growth is zero."),
        ("res_2", "The inner strings pick up only the last few percent. The thirteen and three eighths goes from "
                  "two point two, to two point three meganewtons of added compression. The nine and five eighths, "
                  "from one point five one, to one point five six."),
        ("res_3", "The big change is in the foundation. The conductor and the surface casing can no longer expand at "
                  "the seabed, so their own thermal strain turns into compression. About one hundred and forty four "
                  "megapascals in the conductor, and one hundred and eighty in the twenty inch. That is almost half "
                  "of its yield strength, before any other load is added."),
        ("res_4", "And the restraint itself must push down with about nineteen and a half meganewtons. That is the "
                  "weight of roughly two thousand tonnes. Even a partial restraint is expensive. Cutting the growth "
                  "in half still takes about eight and a half meganewtons."),
        ("res_5", "Restricting growth does not remove the expansion. It converts displacement into force."),
    ],
    # ------------------------------------------------------------------ 8
    "S08_EffectiveForce": [
        ("eff_1", "So, does the casing buckle? To answer that, we need the effective force. For a pipe filled with "
                  "fluid and surrounded by fluid, buckling is not governed by the true axial force in the steel. "
                  "It is governed by the effective force. The axial force, minus the internal pressure times the "
                  "inside area, plus the external pressure times the outside area. This is Lubinski's result."),
        ("eff_2", "Before production, the thirteen and three eighths hangs in tension. The effective force is "
                  "largest at the wellhead, about one point three meganewtons, and falls to almost zero at the top "
                  "of cement, because each point only carries the weight of the pipe below it."),
        ("eff_3", "Heating adds a uniform compression along the whole free length, so the entire profile shifts. "
                  "For the restrained well, it shifts by two point three meganewtons. Now the effective force is "
                  "compressive all the way from the top of cement up to the wellhead."),
        ("eff_4", "In a vertical well, the critical buckling load is tiny. Under two hundred kilonewtons for this "
                  "pipe, because the pipe is long and slender, and there is no low side for gravity to hold it "
                  "against. So the compressed section buckles. But it cannot fly out sideways. The outer casing "
                  "confines it. It first snakes sinusoidally, then wraps into a helix, pressed against the outer wall."),
        ("eff_5", "The nine and five eighths behaves the same way. But it carries more hanging weight, so only its "
                  "lower part is compressed, from about six hundred metres down to the top of cement. Restraining "
                  "the wellhead moves its neutral point about a hundred metres higher."),
    ],
    # ------------------------------------------------------------------ 9
    "S09_Helix": [
        ("hel_1", "Here is the thirteen and three eighths inside the twenty inch casing, with the sideways scale "
                  "exaggerated. The radial clearance is sixty eight millimetres."),
        ("hel_2", "As the compression grows, the helix tightens. Lubinski's pitch is pi, times the square root of "
                  "eight E I over F. About thirty six metres at the top of cement."),
        ("hel_3", "Bending the pipe into a helix adds bending stress. D, times the clearance, times the force, over "
                  "four I. Here that is up to about fifty seven megapascals. The pipe also presses on the outer "
                  "casing, with a contact force of about two kilonewtons per metre. That wears both strings whenever "
                  "something rotates or moves inside."),
        ("hel_4", "Buckling gives back a little length, because a helix is shorter than a straight pipe. But only "
                  "about five centimetres of the one point one four metres. So buckling does not relieve the load."),
    ],
    # ------------------------------------------------------------------ 10
    "S10_Verdict": [
        ("ver_1", "Now add it all up. In the thirteen and three eighths, axial compression, plus bending, plus "
                  "pressure, gives a von Mises stress of about two hundred and thirty megapascals. That is forty "
                  "two percent of its yield strength. The nine and five eighths reaches about twenty percent."),
        ("ver_2", "So yes. The casings buckle, helically, and elastically. And they would do so with a free "
                  "wellhead too. The restraint makes it only slightly worse."),
        ("ver_3", "What still needs checking are the connections, which must be rated for compression. The casing "
                  "hanger lockdown, which now sees about one meganewton pushing up from the thirteen and three "
                  "eighths. Wear from the contact forces. And above all, the outer strings and the restraint, "
                  "which take the real hit."),
    ],
    # ------------------------------------------------------------------ 11
    "S11_Partial20": [
        ("p20_1", "There is one situation where restraint changes everything for a casing string. When the twenty "
                  "inch is not cemented to the seabed. Say its top of cement is two hundred metres down. Now the "
                  "twenty inch has its own free length, inside the conductor."),
        ("p20_2", "With a free wellhead, the conductor gives way, and the twenty inch picks up two and a half "
                  "meganewtons of compression. Restrained, that jumps to four point two meganewtons."),
        ("p20_3", "It buckles into a fifty three metre helix inside the conductor, with about seventy megapascals "
                  "of bending stress, and a combined stress of sixty two percent of yield."),
    ],
    # ------------------------------------------------------------------ 12
    "S12_Summary": [
        ("sum_1", "To sum up. Production heat makes every casing want to grow. The free lengths are fixed at both "
                  "ends, so that growth becomes compression, about two and a half megapascals per degree."),
        ("sum_2", "In a subsea well, the inner strings are already almost fully restrained. They buckle helically "
                  "in their free sections, whether or not the wellhead can move. Restraining the wellhead adds only "
                  "a few percent to them."),
        ("sum_3", "The real cost of restraint lands on the conductor, the surface casing, the wellhead housing, and "
                  "the restraint itself. Tens of meganewtons. If growth must be limited, reduce the heat with "
                  "insulated tubing, make sure the surface casing is cemented to the seabed, and design the "
                  "foundation, the hanger lockdowns and the connections for the full restrained load."),
        ("sum_4", "Thermal expansion is not optional. Stop the movement, and you get the force."),
    ],
}

SCENE_ORDER = list(SCRIPT.keys())
