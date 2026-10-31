"""Narration for the comparison video: free vs. restrained wellhead.

All numbers are from analysis/results/results.json (base well, 1 year of
production unless stated) and rounded.  Written in words for the TTS.
"""

SCRIPT = {
    "C01_Intro": [
        ("c_intro_1", "Same well. Same production. Same heat. The only difference is one boundary condition at the top. "
                      "On the left, the wellhead is free to grow upward. On the right, the wellhead and the conductor "
                      "are held, so they cannot move."),
        ("c_intro_2", "Let's compare the two cases side by side. The heat up, the forces on the wellhead, the conductor "
                      "and surface casing, the inner casings and their buckling. And let's find out where the difference "
                      "really lies."),
    ],
    "C02_HeatUp": [
        ("c_heat_1", "Production starts. Oil at about one hundred and eight degrees warms the casings from the inside out, "
                     "and every string wants to get longer. The free sections of the inner casings want to grow by one to "
                     "two metres."),
        ("c_heat_2", "On the left, the wellhead rises. After one day it has grown about thirty millimetres, after a month "
                     "about fifty, and after a year about sixty one, as the conductor and the surface casing slowly warm up."),
        ("c_heat_3", "On the right, nothing moves. Instead, the force on the restraint climbs. About twelve meganewtons after "
                     "a day, seventeen after a month, and nineteen and a half after a year. The same thermal expansion, "
                     "showing up as force instead of movement."),
    ],
    "C03_Principle": [
        ("c_prin_1", "The principle is simple. A heated steel member that is free to move gets longer, with no stress. "
                     "A member that cannot move stays the same length, and instead carries about two and a half megapascals "
                     "of compression for every degree. Movement and force are two sides of the same coin."),
        ("c_prin_2", "The well is a set of springs tied to one wellhead. The long, free inner casings are soft springs. "
                     "The conductor and the cemented surface casing, gripped by cement and soil, form one very stiff spring, "
                     "more than a hundred times stiffer."),
        ("c_prin_3", "That stiffness ratio decides almost everything. Because the foundation is so stiff, the inner strings "
                     "cannot push the wellhead very far, even when it is free. They are already held back, and carry ninety "
                     "to ninety six percent of their fully restrained load."),
    ],
    "C04_ForceBalance": [
        ("c_fbd_1", "Now look at the forces acting on the wellhead itself. With a free wellhead, the hot inner strings push "
                    "up with about four point one meganewtons. The wellhead rises until the conductor and surface casing "
                    "are stretched enough to pull back with the same four point one. The net force is zero."),
        ("c_fbd_2", "With the wellhead restrained, the inner strings push up slightly harder, four point three meganewtons. "
                    "But now the conductor and the surface casing push up as well, with about fifteen meganewtons, because "
                    "their own expansion at the seabed is blocked. The restraint has to react the sum. Nineteen and a half "
                    "meganewtons, roughly the weight of two thousand tonnes."),
    ],
    "C05_Foundation": [
        ("c_fnd_1", "This is where the two cases really differ. Here is the axial force along the conductor and the surface "
                    "casing, in the top two hundred metres. Tension to the right, compression to the left."),
        ("c_fnd_2", "Free. At the seabed, the inner strings pull the composite upward, so the top is in tension. A few tens "
                    "of metres down, soil friction takes over, and the casing's own thermal expansion turns into compression."),
        ("c_fnd_3", "Restrained. The top is locked, so the full thermal compression reaches all the way up to the wellhead. "
                    "About fifteen meganewtons at the seabed."),
        ("c_fnd_4", "Below about a hundred metres, the two curves are identical. Cement and rock already hold the surface "
                    "casing completely, in both cases. The whole difference sits in the top hundred metres, where the soft "
                    "soil lets the conductor slide."),
        ("c_fnd_5", "In the steel, that is a change of about one hundred and ninety megapascals at the seabed. From plus forty "
                    "four, to minus one hundred and forty four in the conductor, and from plus eight, to minus one hundred and "
                    "eighty in the twenty inch. Just below the conductor shoe, where the conductor hands its load over, the "
                    "twenty inch locally reaches about three hundred megapascals in our model. Around eighty percent of yield."),
    ],
    "C06_InnerStrings": [
        ("c_inn_1", "Now the inner casings. The thirteen and three eighths picks up two point two meganewtons of compression "
                    "with a free wellhead, and two point three when restrained. Only five percent more."),
        ("c_inn_2", "In both cases its effective force is compressive along the entire thirteen hundred metre free length. "
                    "So it is helically buckled in both cases, with almost the same pitch, bending stress and contact force."),
        ("c_inn_3", "For the nine and five eighths, the buckled zone starts at six hundred and ninety metres with a free "
                    "wellhead, and at five hundred and ninety four metres when restrained. About a hundred metres more "
                    "buckled pipe, for three percent more compression."),
        ("c_inn_4", "Why so small? When free, the wellhead moves only sixty one millimetres. Compared with the one to two "
                    "metres the inner strings want to grow, that is almost no relief. Restraining the wellhead takes away "
                    "a relief they hardly had."),
    ],
    "C07_Scoreboard": [
        ("c_sc_1", "Here is the full comparison."),
        ("c_sc_2", "For the inner casings, the numbers barely move. Compression rises three to five percent, the highest "
                   "combined stress in the thirteen and three eighths goes from two hundred and seventeen to two hundred and "
                   "twenty nine megapascals, well below yield, and the uplift on its hanger from zero point nine to one "
                   "meganewton."),
        ("c_sc_3", "The rows that change dramatically are at the bottom. The conductor and surface casing stresses, and the "
                   "restraint force, which goes from zero to nineteen and a half meganewtons."),
    ],
    "C08_Partial": [
        ("c_part_1", "In practice, no restraint is perfectly rigid. Any real restraint lands somewhere on this line between "
                     "the two cases. Halving the growth to twenty eight millimetres still costs eight and a half meganewtons. "
                     "Roughly a third of a meganewton for every millimetre you take away."),
        ("c_part_2", "And the load comes and goes. Every shut in cools the well, and every start up heats it again. A free "
                     "wellhead simply moves up and down. A restrained one cycles its full force, on the restraint, the conductor "
                     "and the wellhead housing, for the life of the well."),
    ],
    "C09_Surface20": [
        ("c_20_1", "There is one situation where the comparison changes for a casing string. A surface casing that is not "
                   "cemented to the seabed. Then the twenty inch has its own free length inside the conductor, and the "
                   "foundation is much softer."),
        ("c_20_2", "Free, the wellhead grows seventy millimetres, and the twenty inch carries two and a half meganewtons. "
                   "Restrained, that jumps to four point two. Sixty eight percent more, and it buckles harder inside the "
                   "conductor. Here, the restraint really matters."),
    ],
    "C10_Conclusion": [
        ("c_con_1", "So what is the real difference? For the inner casings, very little. They buckle helically in both cases, "
                    "and the restraint adds only three to five percent."),
        ("c_con_2", "For the conductor, the surface casing, the wellhead housing and the restraint itself, it is the "
                    "difference between almost no load, and tens of meganewtons, cycling with every start up."),
        ("c_con_3", "Free or restrained, the thermal expansion is the same. The only choice is whether it shows up as "
                    "movement, or as force."),
    ],
}

SCENE_ORDER = list(SCRIPT.keys())
