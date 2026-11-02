"""Narration: conductor lock-in load explainer (30" x 1" vs 36" x 1.5").
Numbers from analysis/results/lockin.json - written in words for the TTS."""

SCRIPT = {
    "L01_Intro": [
        ("l_intro_1", "When a subsea well heats up, the conductor and the casings want to grow. If you hold the wellhead so it "
                      "cannot move, something has to carry that blocked expansion. That force is the lock-in load."),
        ("l_intro_2", "In this video we calculate it for two conductor sizes. A thirty inch with a one inch wall, and a thirty "
                      "six inch with a one and a half inch wall. After one year of production, holding them down takes about "
                      "nineteen and a half, and twenty four meganewtons. Roughly two thousand, and two and a half thousand tonnes."),
        ("l_intro_3", "We will build that number step by step by hand, check it against the full model, and look at what the "
                      "soil does, and does not do."),
    ],
    "L02_Definition": [
        ("l_def_1", "Start with the forces on the wellhead once the well is hot. The inner casings and the tubing heat up, and "
                    "push up through their hangers."),
        ("l_def_2", "The conductor, the twenty inch surface casing and the cement between them are bonded into one column. "
                    "Near the seabed it heats up too, and pushes up on the wellhead housings."),
        ("l_def_3", "If the wellhead is not allowed to move, the restraint must push down with the sum of the two. That is "
                    "the lock-in load."),
        ("l_def_4", "And the load path does not end at the restraint. The restraint has to be anchored, so the same force "
                    "leaves through its anchor as uplift. Below the seabed, the column's compression is passed to the soil by "
                    "friction, and at the conductor shoe, into the twenty inch and the rock."),
    ],
    "L03_Inputs": [
        ("l_in_1", "Both cases use the same well. A vertical oil producer in three hundred and fifty metres of water, with a "
                   "twenty inch surface casing cemented to the seabed, and the usual inner strings."),
        ("l_in_2", "Option A is a thirty inch by one inch conductor in a thirty six inch hole, with five hundred and eighty "
                   "eight square centimetres of steel. Option B is a thirty six inch by one and a half inch conductor in a "
                   "forty two inch hole, with one thousand and forty nine. Almost twice the steel."),
        ("l_in_3", "The oil reaches the wellhead at about one hundred and eight degrees, a hundred and two above the seabed "
                   "temperature. Just below the seabed, the thirty inch conductor warms by sixty one degrees, the thirty six "
                   "inch by fifty five because it sits further out, and the twenty inch by seventy five. Without a heat "
                   "transfer model, these are roughly zero point six, zero point five four, and zero point seven four of the "
                   "fluid temperature rise."),
    ],
    "L04_HandCalc": [
        ("l_hc_1", "Now the hand calculation. For each bonded component, the force needed to stop it expanding is E, times "
                   "A, times alpha, times delta T."),
        ("l_hc_2", "For the thirty inch conductor, the steel area is zero point zero five eight eight square metres. Times two "
                   "hundred and seven gigapascals, times twelve point four millionths per degree, that is one hundred and "
                   "fifty one kilonewtons per degree. Times sixty one degrees, nine point two meganewtons."),
        ("l_hc_3", "Do the same for the twenty inch and for both cement sheaths, and add them up. Sixteen point four "
                   "meganewtons for the thirty inch system, and twenty three point two for the thirty six inch."),
        ("l_hc_4", "Steel carries about eighty five percent of it. And the total depends on steel area and temperature, not on "
                   "how long the conductor is. A longer pipe wants to grow more, but it is also a softer spring, so the "
                   "length cancels out."),
    ],
    "L05_InnerPush": [
        ("l_ip_1", "The inner strings add their own push. Here, use the average temperature rise over each free length, from "
                   "the hanger down to the top of cement, because it falls with depth."),
        ("l_ip_2", "The thirteen and three eighths gives two point four meganewtons, the nine and five eighths one point six, "
                   "and the tubing zero point five. Four and a half in total, or four point three after the small relief "
                   "from helical buckling. It is the same for both conductors."),
        ("l_ip_3", "Add it to the conductor system, and the hand estimate is twenty point nine meganewtons for the thirty inch, "
                   "and twenty seven point seven for the thirty six inch. These are upper bounds, because every component is "
                   "assumed fully blocked."),
    ],
    "L06_Soil": [
        ("l_soil_1", "So, does the soil hold it down? The model includes it. Every metre of the column sits on a soil spring "
                     "that gives skin friction against the hole wall."),
        ("l_soil_2", "But friction only acts where the pipe slides past the soil. A restrained column is held at the top by "
                     "the restraint, and below about a hundred metres by cement and rock. In between, it moves only two to "
                     "five millimetres. So the soil cannot take the load off the restraint."),
        ("l_soil_3", "The little relief there is comes from the column pushing down into the soil below the restraint. Soft "
                     "soil lets it do more of that, so the load drops. Stiff soil stops it, so the load climbs towards the "
                     "hand calculation bound."),
        ("l_soil_4", "Here is the effect. Make the soil ten times weaker, and the thirty inch lock-in load falls from nineteen "
                     "and a half to fourteen meganewtons. Make it four times stronger, and it rises to twenty and a half. For "
                     "a free wellhead it is the opposite. Weak soil lets it grow two hundred millimetres, stiff soil only "
                     "thirty five."),
        ("l_soil_5", "Where the soil really matters is elsewhere. Its friction capacity over the conductor, about twelve and "
                     "fourteen and a half meganewtons, is less than the blocked force. So a free conductor slides, and grows "
                     "about forty millimetres by itself. And the restraint's own anchor has to hold the full lock-in load in "
                     "uplift, in the same soil."),
    ],
    "L07_Results": [
        ("l_res_1", "The full model gives nineteen and a half meganewtons for the thirty inch, and twenty four point one for "
                    "the thirty six inch. Seven and thirteen percent below the hand bounds. The conductor steel is the biggest "
                    "share, and the only one that changes much. Eight and a half, against twelve point six meganewtons."),
        ("l_res_2", "A restraint that gives a little relieves a lot. Halving the growth still costs about eight and a half to "
                    "nine meganewtons, and every millimetre held back costs a third, to almost half a meganewton."),
        ("l_res_3", "And the load keeps creeping up as the rock warms. Twelve to fourteen meganewtons after the first day, "
                    "twenty one and twenty seven after ten years. So design for end of life temperatures. There, the hand "
                    "bounds are twenty three, and thirty one meganewtons."),
    ],
    "L08_Effects": [
        ("l_eff_1", "A few more effects change the picture. The lock-in load comes on top of the loads already in the "
                    "conductor, from the wellhead and tree, the hanging casings, and riser loads during workovers. And every "
                    "shut in and start up cycles it, so it is a fatigue load, not a one off."),
        ("l_eff_2", "It scales roughly with temperature. About zero point two meganewtons for every degree of fluid "
                    "temperature rise with the thirty inch, and zero point two four with the thirty six inch."),
        ("l_eff_3", "And the highest stress is not at the seabed. At the conductor shoe, the conductor hands its compression "
                    "to the twenty inch. There the twenty inch locally reaches about three hundred and eight megapascals with "
                    "the thirty inch conductor, and three hundred and fifty two with the thirty six inch. Eighty one, and "
                    "ninety three percent of K fifty five yield."),
    ],
    "L09_Checks": [
        ("l_chk_1", "So the design checks are the restraint and its anchor, every component the load passes through, the "
                    "conductor and the twenty inch at the seabed and at the conductor shoe, the thirteen and three eighths "
                    "hanger lockdown, and fatigue for every start up."),
        ("l_chk_2", "And to reduce the load: allow some movement, or engage the restraint only after the first heat up. "
                    "Reduce the temperature with insulated tubing. Choose the conductor with the lock-in load in mind. And make "
                    "sure the twenty inch is cemented to the seabed."),
        ("l_chk_3", "In short. The lock-in load is the blocked thermal force of everything bonded at the wellhead, plus the "
                    "push of the inner strings. Steel area times temperature sets it. The soil does not hold it down. It only "
                    "decides how far a free wellhead would grow, and how well your restraint is anchored."),
    ],
}

SCENE_ORDER = list(SCRIPT.keys())
