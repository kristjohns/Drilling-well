"""Narration for the part cards and the Q&A section of the combined video.
Numbers from analysis/results/results.json (base well, 1 year) - written in words for the TTS."""

SCRIPT = {
    "P1_Card": [
        ("part_1", "This video has three parts. First, the physics of restrained wellhead growth. Second, a side by side "
                   "comparison of a free and a restrained wellhead. And third, answers to your questions. "
                   "Part one. The physics."),
    ],
    "P2_Card": [
        ("part_2", "Part two. Free versus restrained, side by side."),
    ],
    "P3_Card": [
        ("part_3", "Part three. Your questions."),
    ],
    "Q1_RestraintSplit": [
        ("q1_q", "Question one. How much of the restraint force is in the surface casing, and how much in the conductor? "
                 "And why do they create such high forces?"),
        ("q1_a1", "Of the nineteen and a half meganewtons, about eight and a half come from the thirty inch conductor, four "
                  "and a half from the twenty inch surface casing, and about two from the cement between and around them. "
                  "The inner strings add the last four point three. So the conductor and the surface casing, with their "
                  "cement, give almost four fifths of the total."),
        ("q1_a2", "Why so high? Steel that cannot expand carries about two and a half megapascals of compression for every "
                  "degree, whatever its size. Just below the seabed the conductor has warmed by about sixty one degrees, "
                  "and the twenty inch by about seventy five. Fully blocked, that is about one hundred and fifty six, and "
                  "one hundred and ninety two megapascals."),
        ("q1_a3", "Force is stress times steel area. The conductor, thirty inches with a one inch wall, has five hundred and "
                  "eighty eight square centimetres of steel. That is four point four times the thirteen and three eighths. "
                  "So every degree costs one hundred and fifty one kilonewtons in the conductor, sixty four in the twenty "
                  "inch, and only thirty four in the thirteen and three eighths."),
        ("q1_a4", "And these strings cannot escape. Cement and soil hold them sideways, so they cannot buckle to shed load, "
                  "and they are extremely stiff. Every millimetre of growth you prevent costs about a third of a meganewton."),
    ],
    "Q2_Length": [
        ("q2_q", "Question two. Doesn't length matter? With a longer pipe, surely you need to restrain a longer section?"),
        ("q2_a1", "For the force, surprisingly, no. A longer pipe does want to grow more, in proportion to its length. But "
                  "it is also a softer spring, in inverse proportion to its length. Multiply the two, and the length "
                  "cancels. The force to hold it is E, times A, times alpha, times delta T."),
        ("q2_a2", "Think of it per metre. Every metre of hot steel needs the same stress to cancel its own expansion. That "
                  "stress acts on each cross section. It does not add up along the pipe, the way weight does. A thirteen "
                  "hundred metre, a six hundred and fifty metre, and a ten metre piece of the same pipe all need two point "
                  "four meganewtons to hold them."),
        ("q2_a3", "Your intuition is right about other things, though. A longer pipe needs more movement prevented, and in "
                  "the ground, the force has to be anchored by friction over some length. The conductor needs roughly the "
                  "top sixty to a hundred metres of soil to hold it. Below that, cement and rock lock every metre locally, "
                  "so a longer conductor would not raise the force at the wellhead."),
    ],
    "Q3_Limits": [
        ("q3_q", "Question three. What are the buckling limit and the yield limit for the different casings?"),
        ("q3_a1", "For the inner casings in a vertical hole, the buckling limit is tiny. Helical buckling starts at about one "
                  "hundred and eighty kilonewtons for the thirteen and three eighths, eighty for the nine and five eighths, "
                  "and twenty for the tubing. Their thermal loads are ten to twenty times higher, so they buckle. In a "
                  "deviated section the limit is much higher, about one and a half meganewtons at thirty degrees."),
        ("q3_a2", "But buckling is not failure. The outer casing confines the pipe to a stable helix. The real limit for a "
                  "buckled string is yield, from compression plus helical bending. That happens at about five point two "
                  "meganewtons for the thirteen and three eighths, five point eight for the nine and five eighths, and one "
                  "point one for the tubing. Roughly two to three times the actual loads."),
        ("q3_a3", "In pure compression, the pipe body yields at seven point four meganewtons for the thirteen and three "
                  "eighths, seven point six for the nine and five eighths, nine and a half for the twenty inch, and twenty "
                  "two point seven for the conductor. A fully blocked pipe, starting from zero stress, would only yield "
                  "after about one hundred and fifty degrees of heating for K fifty five and X fifty six, two hundred and "
                  "fifteen for L eighty, and two hundred and ninety five for P one ten."),
        ("q3_a4", "The conductor and the cemented twenty inch do not buckle at all. Soil and cement hold them sideways, which "
                  "puts their buckling load at sixty to two hundred and eighty meganewtons. For them, yield is the limit. "
                  "The closest point is the twenty inch just below the conductor shoe. About three hundred and eight "
                  "megapascals in the restrained case, eighty one percent of yield."),
    ],
    "Q4_LockedIn": [
        ("q4_q", "Question four. You said the inner casings are already mostly locked in. What does that really mean?"),
        ("q4_a1", "Both ends of each free section are fixed. The bottom is bonded in cement. The top hangs from a hanger that "
                  "sits on a load shoulder in the wellhead housing, held down by a lockdown ring. So the top can only move "
                  "if the whole wellhead moves."),
        ("q4_a2", "That leaves two ways out. The wellhead can rise and carry the hanger with it, and the pipe can coil into a "
                  "helix, which is slightly shorter end to end. Whatever growth is left over is blocked, and blocked growth "
                  "becomes compression."),
        ("q4_a3", "Here is the budget for the thirteen and three eighths. It wants to grow about one thousand one hundred and "
                  "forty millimetres. The rising wellhead takes sixty one, and the helix forty eight. More than a thousand "
                  "millimetres are still blocked. That is ninety percent of the fully restrained force. For the nine and "
                  "five eighths it is ninety six percent, and for the tubing ninety three."),
        ("q4_a4", "Why does the wellhead move so little? It sits on the conductor and the surface casing, which behave like a "
                  "spring of about two hundred and forty meganewtons per metre. The inner strings are springs of two "
                  "meganewtons per metre or less. Their four meganewton push lifts the wellhead only seventeen millimetres. "
                  "The other forty four come from the conductor's own expansion. It is a tug of war the inner strings "
                  "cannot win."),
        ("q4_a5", "And this is where length matters. The same sixty one millimetres would relieve a hundred metre free "
                  "section by about seventy percent, but a thirteen hundred metre section by only five. Long free lengths "
                  "are locked, whatever the wellhead does."),
        ("q4_a6", "So the inner strings buckle whether or not the wellhead is restrained. The only real unlock would be the "
                  "hanger sliding up, and that would be a seal failure. What actually reduces their load is less heat, more "
                  "hanging tension, and stronger pipe and connections."),
    ],
    "Q5_Closing": [
        ("qa_end", "Free or restrained, the expansion is the same. It shows up as movement, or as force. And in a subsea "
                   "well, most of that force ends up in the conductor, the surface casing, and whatever holds them down."),
    ],
}

SCENE_ORDER = list(SCRIPT.keys())
