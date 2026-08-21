// One-off local seed script. Uses the service-role key to bypass RLS.
// Never deploy this key, run this locally only: `npm run seed`.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
}
const supabase = createClient(url, serviceRoleKey);

type SeedConcept = {
  sport_slug: string;
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  difficulty: number;
  sort_order: number;
  clip: {
    youtube_id: string;
    start_sec: number;
    title: string;
    teams: string[];
    players: string[];
    season: string;
    orientation: "landscape" | "portrait";
  };
  beats: unknown[];
  diagram: unknown;
  diagramSurface?: string;
  quiz: { prompt: string; choices: string[]; answer_idx: number }[];
};

const SPORTS = [
  { name: "Basketball", slug: "basketball" },
  { name: "Football", slug: "football" },
];

// Top-10 2025-26 NBA jersey-sales players (per NBA.com/NBPA, Aug 2026), one
// signature concept each. Clips are short, single-play clips (mostly
// YouTube Shorts) chosen specifically because they show ONE clear instance
// of the concept, a long mixtape doesn't work with the beat/pause format,
// since jumping into second 5 of a 20-minute compilation shows nothing in
// particular. Every youtube_id below was checked live via the YouTube
// oEmbed endpoint (200 = available/embeddable) before being included.
// Beat timestamps are still round-number placeholders (I can't watch/
// frame-verify video), refine them to the actual moment while watching,
// in Admin. Swap any pick you don't like the same way.
const CONCEPTS: SeedConcept[] = [
  {
    sport_slug: "basketball",
    slug: "curry-relocation-shooting",
    title: "Relocation Shooting",
    summary: "Give up the ball, then immediately move to a new spot: the defense has to solve you all over again.",
    body_md:
      "Most shooters stand still after passing. Curry never does. The instant the ball leaves his hands he's already sprinting to a new spot behind the arc, forcing his defender to navigate through traffic to stay attached. Why it works: a defender who was in perfect position to contest now has to fight through a screen or a crowd just to get back to the same spot, and by the time they do, Curry's moved again. Counter: teams try to \"body\" him with a physical, non-switching defender assigned to trail him full-time regardless of the play, refusing to help off him even for a second.",
    difficulty: 2,
    sort_order: 1,
    clip: {
      youtube_id: "ocPTdCbXR3Q",
      start_sec: 0,
      title: "Stephen Curry's mastery of off-ball movement",
      teams: ["GSW"],
      players: ["Stephen Curry"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Curry just passed, watch what he does next instead of standing still.", overlay: { arrows: [{ x1: 40, y1: 60, x2: 65, y2: 25 }] } },
      { t: 6, action: "note", caption: "He's relocating to a brand new catch spot before the defense can recover." },
      { t: 10, action: "note", caption: "That's why it works: the defender has to fight through traffic to get back to the same spot, every single time." },
    ],
    diagram: {
      players: [
        { id: "30", x: 20, y: 45, team: "offense" },
        { id: "X", x: 25, y: 40, team: "defense" },
        { id: "PG", x: 50, y: 20, team: "offense" },
      ],
      ball: { x: 50, y: 20 },
      annotations: [
        { type: "arrow", x1: 20, y1: 45, x2: 70, y2: 15, label: "relocate" },
        { type: "label", x: 70, y: 10, text: "open catch" },
      ],
    },
    quiz: [
      {
        prompt: "Why is relocation shooting hard to guard even for a great on-ball defender?",
        choices: [
          "It forces the defender to navigate to a new spot every time, instead of just holding position",
          "It's illegal to guard a moving player closely",
          "It only works with a very short shot clock",
          "It requires a screen every single time",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "luka-stepback-three",
    title: "The Step-Back Three",
    summary: "Create a full stride of separation from a live dribble, then rise before the defender can close it.",
    body_md:
      "The step-back uses a hard dribble into the defender's space, then a push backward off two feet to create separation right as the shot goes up. By the time the defender reacts, the space is already gone. Why it works: NBA closeout speed can't cover a full backward step in the half-second it takes to rise and fire, especially with a shooter this size shooting over the top. Counter: defenders try to bait the step-back into a contested long two by giving a half-step of space early, or use verticality/late high hands rather than closing hard and getting hung in the air.",
    difficulty: 3,
    sort_order: 2,
    clip: {
      youtube_id: "HQZiB-y6amY",
      start_sec: 0,
      title: "Luka Dončić Step-Back Three Over Anthony Davis",
      teams: ["LAL"],
      players: ["Luka Doncic"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Live dribble, defender square, this is the setup, not the shot yet.", overlay: { arrows: [{ x1: 45, y1: 50, x2: 45, y2: 35 }] } },
      { t: 5, action: "note", caption: "The push-back happens as the gather starts, separation before the rise, not during it." },
      { t: 9, action: "note", caption: "A full stride of space in half a second, no closeout recovers in time to contest that." },
    ],
    diagram: {
      players: [
        { id: "77", x: 45, y: 50, team: "offense" },
        { id: "X", x: 45, y: 40, team: "defense" },
      ],
      ball: { x: 45, y: 50 },
      annotations: [
        { type: "arrow", x1: 45, y1: 50, x2: 45, y2: 62, label: "step back" },
        { type: "label", x: 60, y: 55, text: "release" },
      ],
    },
    quiz: [
      {
        prompt: "When does the separation in a step-back three actually get created?",
        choices: [
          "During the push-back before the shooter rises, not during the shot itself",
          "While the ball is in the air",
          "Only if the defender fouls",
          "It happens automatically off any dribble move",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "brunson-mid-range-hesitation",
    title: "Mid-Range Hesitation",
    summary: "A change of pace, not a burst of speed: freezing the defender's hips is what creates the scoring window, pull-up or drive.",
    body_md:
      "Brunson isn't the fastest player on the floor, so he wins with pace instead: a hesitation dribble that makes the defender's hips guess wrong for a fraction of a second is all he needs to get to his spot, whether that's a mid-range pull-up or all the way to the rim. Why it works: most drives beat a defender with speed; this beats them with timing, which means it works just as well against faster, longer defenders. Counter: defenses drop a big into the gap early to wall off the paint and mid-range entirely, forcing the shot to happen further from the basket.",
    difficulty: 2,
    sort_order: 3,
    clip: {
      youtube_id: "3oaMqgOQ00E",
      start_sec: 0,
      title: "Jalen Brunson, Hesitation & a Tough Finish",
      teams: ["NYK"],
      players: ["Jalen Brunson"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Watch his hips, not the ball, that hesitation is what freezes the defender.", overlay: { circles: [{ x: 45, y: 45, r: 4 }] } },
      { t: 5, action: "note", caption: "One beat of hesitation bought him the space to finish." },
      { t: 9, action: "note", caption: "It's timing, not speed, which is why it works just as well against faster, longer defenders too." },
    ],
    diagram: {
      players: [
        { id: "11", x: 40, y: 50, team: "offense" },
        { id: "X", x: 40, y: 42, team: "defense" },
      ],
      ball: { x: 40, y: 50 },
      annotations: [
        { type: "arrow", x1: 40, y1: 50, x2: 55, y2: 35, label: "hesitation → pull-up" },
      ],
    },
    quiz: [
      {
        prompt: "What actually creates Brunson's scoring separation in this clip?",
        choices: [
          "A change of pace that freezes the defender's hips",
          "Pure straight-line speed",
          "A screen set by a teammate",
          "The defender fouling him",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "wembanyama-weakside-rim-protection",
    title: "Weak-Side Rim Protection",
    summary: "Helping from the gap without fouling: length lets you contest straight up instead of chasing the block.",
    body_md:
      "Weak-side rim protection means leaving your own assignment for a split second to help at the rim when the ball beats the on-ball defender. The hard part is timing it so you arrive as a wall, not as a foul. Why it works: elite length lets a helper contest straight up (verticality) instead of lunging across the driver's path, which is both safer and more effective than a chase-down. Counter: offenses attack it by immediately swinging the ball to whoever the helper just left open, punishing the gap he vacated.",
    difficulty: 3,
    sort_order: 4,
    clip: {
      youtube_id: "Frm3WCEKKow",
      start_sec: 0,
      title: "Victor Wembanyama Blocks a Shot Without Jumping",
      teams: ["SAS"],
      players: ["Victor Wembanyama"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "He starts on the weak side, this isn't his man driving.", overlay: { arrows: [{ x1: 70, y1: 20, x2: 50, y2: 45 }] } },
      { t: 5, action: "note", caption: "Straight up, not across the body, that's verticality, not a foul." },
      { t: 9, action: "note", caption: "Contesting like this is both safer for him and tougher for the shooter than a lunging chase-down block." },
    ],
    diagram: {
      players: [
        { id: "1", x: 50, y: 45, team: "offense" },
        { id: "X1", x: 55, y: 42, team: "defense" },
        { id: "X2", x: 75, y: 20, team: "defense" },
        { id: "2", x: 78, y: 15, team: "offense" },
      ],
      ball: { x: 50, y: 45 },
      annotations: [{ type: "arrow", x1: 75, y1: 20, x2: 52, y2: 42, label: "help" }],
    },
    quiz: [
      {
        prompt: "Why is contesting \"straight up\" (verticality) better than lunging across the driver's path?",
        choices: [
          "It avoids a foul while still altering the shot",
          "It's the only legal way to block a shot",
          "It makes the block count for two points",
          "It doesn't actually contest the shot at all",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "lebron-reading-the-help",
    title: "Reading the Help Before It Arrives",
    summary: "The pass leaves his hand before the help defender fully commits: the read happens a beat early, not after.",
    body_md:
      "LeBron's court vision isn't about seeing an open man once he appears. It's about seeing him a half-second before he's actually open, while the help defender is still mid-rotation. Why it works: it turns a 1-on-1 into a numbers game the defense can't win: they either give up the easy look at the rim or give up an open shot to whoever they left. Counter: teams pre-rotate a low man early and live with a slightly worse shot than a wide-open three, rather than help late and get killed by the pass.",
    difficulty: 3,
    sort_order: 5,
    clip: {
      youtube_id: "0Gt7lGASfbY",
      start_sec: 0,
      title: "LeBron's No-Look Dime to Jake LaRavia",
      teams: ["LAL"],
      players: ["LeBron James"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Watch where his eyes are pointed versus where the ball actually goes.", overlay: { arrows: [{ x1: 45, y1: 55, x2: 50, y2: 30 }] } },
      { t: 5, action: "note", caption: "The pass is already gone before the defense fully reacted, that's the read made early." },
      { t: 9, action: "note", caption: "He's not reacting to who's open, he's already throwing to where someone's about to be open." },
    ],
    diagram: {
      players: [
        { id: "23", x: 45, y: 55, team: "offense" },
        { id: "X1", x: 48, y: 45, team: "defense" },
        { id: "X2", x: 55, y: 30, team: "defense" },
        { id: "C", x: 80, y: 50, team: "offense" },
      ],
      ball: { x: 45, y: 55 },
      annotations: [{ type: "arrow", x1: 45, y1: 55, x2: 78, y2: 50, label: "pass, read early" }],
    },
    quiz: [
      {
        prompt: "What forces the defense into a losing decision when a passer reads the help this early?",
        choices: [
          "A second defender has to help, leaving someone open",
          "The shot clock running out",
          "The ball-handler always scores at the rim",
          "The defense calls a timeout",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "edwards-attacking-closeouts",
    title: "Attacking Closeouts",
    summary: "A defender flying at you off-balance is a driving lane, not a contest: one hard dribble turns it into a dunk.",
    body_md:
      "When the ball swings and a defender has to closeout in a hurry, they're moving forward with momentum they can't stop on a dime. Edwards reads that instantly: one hard, direct dribble past a hard closeout beats it clean, because the defender's own speed is working against them. Why it works: a fast closeout that's off-balance is easier to beat than a defender standing still in position. Counter: teach an \"under control\" closeout: high hand, choppy feet, sacrificing a fraction of a second of contest for balance, rather than flying at the shooter.",
    difficulty: 2,
    sort_order: 6,
    clip: {
      youtube_id: "H5rT3ZEmVYg",
      start_sec: 0,
      title: "Anthony Edwards Dunk Against Kevin Durant",
      teams: ["MIN"],
      players: ["Anthony Edwards"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Defender's flying in hard, that's a driving lane opening up, not a good contest.", overlay: { arrows: [{ x1: 60, y1: 30, x2: 40, y2: 45 }] } },
      { t: 4, action: "note", caption: "One dribble and he's already by, the closeout's own momentum beat itself." },
      { t: 8, action: "note", caption: "A fast, off-balance closeout is easier to beat than a defender who just stood their ground." },
    ],
    diagram: {
      players: [
        { id: "5", x: 50, y: 40, team: "offense" },
        { id: "X", x: 62, y: 25, team: "defense" },
      ],
      ball: { x: 50, y: 40 },
      annotations: [{ type: "arrow", x1: 50, y1: 40, x2: 50, y2: 55, label: "attack" }],
    },
    quiz: [
      {
        prompt: "Why is a hard, fast closeout risky for a defender?",
        choices: [
          "Their own forward momentum makes it hard to stay in front of a direct drive",
          "It's an automatic foul",
          "It's illegal to closeout quickly",
          "It always leads to a steal",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "tatum-side-step-three",
    title: "The Side-Step Three",
    summary: "Lateral separation instead of backward separation: same idea as a step-back, different direction.",
    body_md:
      "Where a step-back creates space by moving straight back, the side-step creates it by moving sideways off a live dribble, using a hard crossover-style plant to shift the defender's weight the wrong way. Why it works: it's a smaller, quicker motion than a full step-back, so it's harder to anticipate and just as effective at clearing a contest. Counter: same family of answers as the step-back: stay low, don't bite on the crossover plant, and live with a slightly late closeout rather than lunging.",
    difficulty: 3,
    sort_order: 7,
    clip: {
      youtube_id: "QyZ_c0hqzD4",
      start_sec: 0,
      title: "The Jayson Tatum Side-Step, Broken Down",
      teams: ["BOS"],
      players: ["Jayson Tatum"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Hard plant to the side, not backward, watch where his weight shifts.", overlay: { arrows: [{ x1: 45, y1: 50, x2: 60, y2: 50 }] } },
      { t: 5, action: "note", caption: "Defender's weight is still going the other way when the shot goes up." },
      { t: 9, action: "note", caption: "Same idea as a step-back, just a smaller, quicker motion that's harder to see coming." },
    ],
    diagram: {
      players: [
        { id: "0", x: 45, y: 50, team: "offense" },
        { id: "X", x: 45, y: 42, team: "defense" },
      ],
      ball: { x: 45, y: 50 },
      annotations: [{ type: "arrow", x1: 45, y1: 50, x2: 62, y2: 50, label: "side-step" }],
    },
    quiz: [
      {
        prompt: "How does a side-step three differ from a step-back three?",
        choices: [
          "The separation is lateral instead of backward",
          "It can only be shot from half-court",
          "It requires a screen",
          "It's not actually a jump shot",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "sga-change-of-speed-drives",
    title: "Change-of-Speed Drives",
    summary: "Slow, slow, fast: the sudden acceleration into contact is what draws the whistle and gets to the rim.",
    body_md:
      "Gilgeous-Alexander drives at a deliberately uneven pace: slow enough to get the defender leaning and comfortable, then a sudden burst into their chest that either blows by them or draws contact on a shot attempt. Why it works: refs read sudden, decisive contact from the offensive player as a foul far more readily than a defender simply standing their ground against a steady drive. Counter: defenses coach players to stay low and \"give ground\" rather than absorb contact upright, taking away the foul look even if it means a step of separation.",
    difficulty: 3,
    sort_order: 8,
    clip: {
      youtube_id: "w3bgjTSO6_8",
      start_sec: 0,
      title: "Shai Gilgeous-Alexander Draws a Foul",
      teams: ["OKC"],
      players: ["Shai Gilgeous-Alexander"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Slow, controlled dribble, he's letting the defender get comfortable.", overlay: { circles: [{ x: 45, y: 45, r: 4 }] } },
      { t: 4, action: "note", caption: "Sudden burst into the body, that contact reads as a foul." },
      { t: 8, action: "note", caption: "Refs read sudden, decisive contact from the ball-handler as a foul far more readily than a set defender." },
    ],
    diagram: {
      players: [
        { id: "2", x: 40, y: 50, team: "offense" },
        { id: "X", x: 40, y: 40, team: "defense" },
      ],
      ball: { x: 40, y: 50 },
      annotations: [{ type: "arrow", x1: 40, y1: 50, x2: 40, y2: 30, label: "burst" }],
    },
    quiz: [
      {
        prompt: "What's the actual mechanism that draws the foul on this kind of drive?",
        choices: [
          "A sudden change of pace into contact, which reads as offensive initiative",
          "Traveling",
          "The defender always fouls on a slow drive",
          "It only works in the last two minutes of a game",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "flagg-switchable-defense",
    title: "Switchable Defense",
    summary: "One defender guarding multiple positions without a mismatch: size and lateral quickness both, at once.",
    body_md:
      "Switchability means a defender can guard a screen action by simply trading assignments with a teammate instead of fighting through or going under: no rotation, no gap in coverage. Why it works: most switch defenders are good at one half of it (big enough to guard forwards, or quick enough to guard guards) but not both; a player who can do both takes away the mismatch hunting that most offenses rely on. Counter: offenses try to force a switch and then immediately attack it with a second action before the defense can reset, rather than settling for the initial post-up or iso.",
    difficulty: 4,
    sort_order: 9,
    clip: {
      youtube_id: "EDbYcr18Dcg",
      start_sec: 0,
      title: "Cooper Flagg's Defensive Versatility, Guarding All 5 Positions",
      teams: ["DAL"],
      players: ["Cooper Flagg"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Screen coming, watch him switch instead of fighting through it.", overlay: { arrows: [{ x1: 45, y1: 40, x2: 60, y2: 45 }] } },
      { t: 5, action: "note", caption: "No gap, no mismatch, he just picked up the new assignment clean." },
      { t: 9, action: "note", caption: "That's real switchability: size for the bigs and quickness for the guards, both at once." },
    ],
    diagram: {
      players: [
        { id: "X1", x: 45, y: 40, team: "defense" },
        { id: "X2", x: 55, y: 45, team: "defense" },
        { id: "1", x: 45, y: 50, team: "offense" },
        { id: "2", x: 60, y: 40, team: "offense" },
      ],
      annotations: [{ type: "arrow", x1: 45, y1: 40, x2: 60, y2: 40, label: "switch" }],
    },
    quiz: [
      {
        prompt: "What makes a defender genuinely \"switchable,\" as opposed to just able to guard one type of player?",
        choices: [
          "Enough size for bigger players and enough lateral quickness for smaller ones, at the same time",
          "Being the tallest player on the floor",
          "Never guarding the same position twice in a game",
          "Playing zone defense exclusively",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "jokic-high-post-anticipation",
    title: "High-Post Anticipation",
    summary: "Operating from the elbow, he reads where the defense is about to break down before it actually does: the pass is thrown to a spot, not a person.",
    body_md:
      "Jokić spends most of his offense from the high post (the elbow area, above the free-throw line) rather than the block, which gives him a full view of the floor while the ball's still live. From there he's not reacting to who's open. He's throwing to where a cutter or shooter is about to be open, a half-second ahead of the defense. Why it works: by the time the defense reacts to the actual movement, the pass is already gone. Counter: some teams live with the deficit and simply refuse to help off shooters at all, taking away his easiest reads and forcing him to actually score instead of pass. You'll sometimes see this described as \"walling off\" the elbow. This same anticipation instinct is also what makes designed actions like the Spain pick-and-roll (a back screen set on the screener's own defender, right as the pick-and-roll starts, so that defender can't help without giving up a backdoor cut) so effective for him: it's a scripted version of the same \"attack the helper before he's ready\" idea.",
    difficulty: 4,
    sort_order: 10,
    clip: {
      youtube_id: "zDo1Dmlh_tw",
      start_sec: 0,
      title: "Jokić Knew the Play",
      teams: ["DEN"],
      players: ["Nikola Jokic"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Watch his eyes before the pass, he's already tracking where the cutter is about to be.", overlay: { arrows: [{ x1: 50, y1: 50, x2: 45, y2: 35 }] } },
      { t: 5, action: "note", caption: "The pass goes to a spot the defense hasn't reacted to yet, not to where the cutter already is." },
      { t: 9, action: "note", caption: "By the time the defense reacts to the actual movement, the ball's already gone." },
    ],
    diagram: {
      players: [
        { id: "PG", x: 50, y: 50, team: "offense" },
        { id: "5", x: 45, y: 35, team: "offense" },
        { id: "X5", x: 45, y: 42, team: "defense" },
        { id: "3", x: 65, y: 40, team: "offense" },
      ],
      ball: { x: 50, y: 50 },
      annotations: [
        { type: "label", x: 45, y: 30, text: "Spain PnR (designed version):" },
        { type: "screen", x: 47, y: 42 },
        { type: "arrow", x1: 65, y1: 40, x2: 47, y2: 40, label: "back screen" },
        { type: "arrow", x1: 45, y1: 35, x2: 40, y2: 50, label: "roll" },
      ],
    },
    quiz: [
      {
        prompt: "In Jokić's high-post playmaking, what does he actually throw the pass to?",
        choices: [
          "A spot the defense hasn't reacted to yet, not the cutter's current position",
          "Whoever is already standing wide open",
          "Always the same player on every possession",
          "The spot only after the cutter calls for it",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "drop-coverage-pick-and-roll",
    title: "Drop Coverage",
    summary: "The screener's defender sinks toward the rim instead of stepping up to the level of the screen, trading the mid-range for paint protection.",
    body_md:
      "In drop coverage, the screener's defender doesn't fight over the top of the ball screen or blitz out at the ball-handler. He retreats toward the rim instead, staying between the roller and the basket while the on-ball defender fights back over the top. Why it works: it takes away the two highest-value shots on the floor, a layup at the rim and a lob to the roller, by keeping a second body planted in the paint for the whole possession. Counter: a ball-handler who can shoot confidently off the dribble just pulls up in the space the drop defender conceded, at the elbow or the mid-range, since that's exactly the shot the coverage is built to allow.",
    difficulty: 3,
    sort_order: 17,
    clip: {
      youtube_id: "d2iHPvDq8i4",
      start_sec: 0,
      title: "What is drop defense ball screen coverage?",
      teams: [],
      players: [],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Screen's coming, watch the screener's defender instead of the ball.", overlay: { arrows: [{ x1: 55, y1: 45, x2: 50, y2: 60 }] } },
      { t: 5, action: "note", caption: "He's sinking toward the rim, not stepping up to meet the screen at all." },
      { t: 9, action: "note", caption: "That's the trade: the paint stays walled off, but the mid-range pull-up is sitting right there." },
    ],
    diagram: {
      players: [
        { id: "1", x: 45, y: 55, team: "offense" },
        { id: "5", x: 55, y: 45, team: "offense" },
        { id: "X1", x: 48, y: 48, team: "defense" },
        { id: "X5", x: 50, y: 65, team: "defense" },
      ],
      ball: { x: 45, y: 55 },
      annotations: [
        { type: "arrow", x1: 55, y1: 45, x2: 50, y2: 65, label: "drops back" },
        { type: "label", x: 45, y: 40, text: "mid-range window" },
      ],
    },
    quiz: [
      {
        prompt: "What does drop coverage give up in exchange for protecting the rim?",
        choices: [
          "A mid-range pull-up jumper for the ball-handler",
          "An automatic steal",
          "A guaranteed offensive foul",
          "Nothing, it has no tradeoff",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "flare-screen-shooter",
    title: "The Flare Screen",
    summary: "A screener seals a defender while the shooter cuts away from the ball, not toward it, popping to a new spot the defender can't get in front of.",
    body_md:
      "A flare screen is set on a teammate's defender while that teammate is moving away from the ball rather than toward it, popping out to open space as the screener's body seals off the direct path behind him. Why it works: the defender is fighting his own momentum in the wrong direction, chasing a man who's opening up further from the ball right as a second body cuts off the shortest route to him. Counter: the screener's own defender switches onto the shooter early, the two defenders trading assignments before the flare ever fully develops, rather than letting the original defender try to fight through it.",
    difficulty: 2,
    sort_order: 18,
    clip: {
      youtube_id: "Uu0iBPczS5s",
      start_sec: 0,
      title: "What's A Flare Screen?! Increase Your Basketball IQ!!!",
      teams: [],
      players: [],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Watch the screener set up on the shooter's defender, not on the ball-handler's.", overlay: { arrows: [{ x1: 40, y1: 50, x2: 65, y2: 30 }] } },
      { t: 5, action: "note", caption: "The shooter's flaring away from the ball, and the defender's stuck fighting the wrong direction." },
      { t: 9, action: "note", caption: "That's the whole idea: momentum going one way, the open shot appearing the other." },
    ],
    diagram: {
      players: [
        { id: "3", x: 40, y: 50, team: "offense" },
        { id: "X3", x: 42, y: 45, team: "defense" },
        { id: "5", x: 50, y: 55, team: "offense" },
      ],
      ball: { x: 50, y: 20 },
      annotations: [
        { type: "arrow", x1: 40, y1: 50, x2: 68, y2: 28, label: "flare" },
        { type: "label", x: 70, y: 22, text: "open catch" },
      ],
    },
    quiz: [
      {
        prompt: "Why is a flare screen effective at freeing a shooter?",
        choices: [
          "It seals the defender while the shooter moves away from the ball, fighting the defender's own momentum",
          "It's only legal to set away from the ball",
          "It requires the shooter to already be open",
          "It always results in a switch",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "post-up-up-and-under",
    title: "The Up-and-Under",
    summary: "A shot fake in the post that gets the defender airborne, then a step-through to the other side for a clean finish while he's still coming down.",
    body_md:
      "Working from the block with his back to the basket, the post player puts up a hard shot fake, hard enough that the defender leaves his feet to contest a shot that was never actually coming. The instant that defender commits to the air, the post player pivots under and steps through to the rim on the other side. Why it works: a defender who's already jumped can't change direction, so once the fake sells, the finish is unguarded no matter which way the step-through goes. Counter: defenders are coached to stay grounded on post fakes and contest with a straight-up hand instead of jumping, trading a slightly weaker contest for never surrendering the free look underneath.",
    difficulty: 3,
    sort_order: 19,
    clip: {
      youtube_id: "VTBMVKD23QA",
      start_sec: 0,
      title: "How to Do an Up & Under | Basketball Moves",
      teams: [],
      players: [],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Back to the basket on the block, this is the setup, watch for the fake next.", overlay: { arrows: [{ x1: 35, y1: 45, x2: 35, y2: 60 }] } },
      { t: 6, action: "note", caption: "Hard shot fake, the defender's already leaving his feet to contest it." },
      { t: 10, action: "note", caption: "Step-through to the other side while he's still in the air, nothing he can do about it now." },
    ],
    diagram: {
      players: [
        { id: "5", x: 35, y: 45, team: "offense" },
        { id: "X", x: 35, y: 40, team: "defense" },
      ],
      ball: { x: 35, y: 45 },
      annotations: [
        { type: "arrow", x1: 35, y1: 45, x2: 30, y2: 55, label: "fake" },
        { type: "arrow", x1: 30, y1: 55, x2: 42, y2: 50, label: "step-through" },
      ],
    },
    quiz: [
      {
        prompt: "Why does the up-and-under work once the shot fake gets the defender to jump?",
        choices: [
          "A defender in the air can't change direction to stop the step-through",
          "It's an automatic and-one every time",
          "The shot clock resets on a shot fake",
          "It only works against zone defenses",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "basketball",
    slug: "boxing-out-defensive-rebound",
    title: "Boxing Out",
    summary: "Finding your man and sealing him away from the rim the instant a shot goes up, before ever turning to look for the ball.",
    body_md:
      "The moment a shot leaves the shooter's hand, the defender's first move isn't to watch the flight of the ball, it's to find his man and get a body on him, sealing him away from the basket with a wide stance and a low center of gravity. Why it works: positioning wins more rebounds than jumping ability does, since a defender who's already sealed his man out has a clear path to the ball while the offensive player is still fighting just to get around him. Counter: offensive rebounders beat the box-out by moving before the shot goes up, crashing an angle the defender hasn't sealed yet, rather than trying to fight through a seal that's already locked in.",
    difficulty: 2,
    sort_order: 20,
    clip: {
      youtube_id: "Qddu76JrqF4",
      start_sec: 0,
      title: "Box Out In Basketball For Rebounds",
      teams: [],
      players: [],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Shot's up, watch the defender find his man instead of watching the ball.", overlay: { arrows: [{ x1: 50, y1: 55, x2: 50, y2: 65 }] } },
      { t: 4, action: "note", caption: "Wide stance, low center of gravity, he's sealing him away from the rim right now." },
      { t: 7, action: "note", caption: "The path to the ball is already clear, the rebound was decided before it even came off the rim." },
    ],
    diagram: {
      players: [
        { id: "X", x: 50, y: 60, team: "defense" },
        { id: "1", x: 50, y: 68, team: "offense" },
      ],
      ball: { x: 50, y: 30 },
      annotations: [
        { type: "arrow", x1: 50, y1: 68, x2: 50, y2: 60, label: "sealed" },
        { type: "label", x: 50, y: 25, text: "shot up" },
      ],
    },
    quiz: [
      {
        prompt: "What actually wins most rebounds, according to how boxing out works?",
        choices: [
          "Positioning and sealing your man before the ball arrives, not jumping ability",
          "Being the tallest player on the floor",
          "Standing directly under the rim at all times",
          "Fouling the shooter",
        ],
        answer_idx: 0,
      },
    ],
  },
  // Football: 3 offensive concepts, 3 defensive, sourced the same way as
  // the basketball set (short clips, verified live via oEmbed before
  // inclusion, a mix of real game moments and short explainer clips from
  // team/league/coaching channels since scheme concepts like Cover 2 or an
  // RPO read don't always map to one flashy highlight the way a dunk does).
  {
    sport_slug: "football",
    slug: "play-action-pass",
    title: "Play-Action Pass",
    summary: "Fake the handoff hard enough and linebackers bite, opening throwing lanes that weren't there a half-second earlier.",
    body_md:
      "The quarterback opens like it's a run: same footwork, same fake, same eyes down at the mesh point with the running back. Why it works: linebackers and safeties read those first steps to decide run-or-pass, and a convincing fake buys the quarterback a full second defenders aren't ready for before anyone recovers into coverage. Counter: defenses train linebackers to read the offensive line's pads instead of the backfield fake, since linemen block pass protection differently than they block a real run no matter how good the ball fake looks.",
    difficulty: 2,
    sort_order: 11,
    diagramSurface: "field",
    clip: {
      youtube_id: "4hOALdGiL8w",
      start_sec: 0,
      title: "Play Action Myth",
      teams: [],
      players: [],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Watch the fake, same footwork and eyes as a real handoff.", overlay: { arrows: [{ x1: 50, y1: 50, x2: 50, y2: 40 }] } },
      { t: 5, action: "note", caption: "Linebackers bit on the run, that's the window opening downfield." },
      { t: 9, action: "note", caption: "The lie only works for a second, that's exactly how long the quarterback needs." },
    ],
    diagram: {
      players: [
        { id: "QB", x: 50, y: 40, team: "offense" },
        { id: "RB", x: 50, y: 48, team: "offense" },
        { id: "WR", x: 85, y: 20, team: "offense" },
        { id: "LB", x: 50, y: 30, team: "defense" },
      ],
      ball: { x: 50, y: 40 },
      annotations: [
        { type: "arrow", x1: 50, y1: 30, x2: 50, y2: 45, label: "bites on fake" },
        { type: "arrow", x1: 50, y1: 40, x2: 82, y2: 22, label: "throw" },
      ],
    },
    quiz: [
      {
        prompt: "What actually creates the throwing window on a play-action pass?",
        choices: [
          "Linebackers reading the fake and stepping toward the line of scrimmage",
          "The offensive line always missing their blocks",
          "It's illegal to defend a fake handoff",
          "The quarterback running faster than the defense",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "football",
    slug: "rpo-read",
    title: "The RPO Read",
    summary: "One player, usually an unblocked defender, decides whether the play turns into a run or a pass after the snap.",
    body_md:
      "In a run-pass option the quarterback doesn't decide run or pass in the huddle, he decides after the snap by reading one specific defender left unblocked on purpose. Why it works: that defender is stuck in a lose-lose spot, if he crashes down to stop the run he leaves his pass responsibility wide open, if he stays back in coverage the running lane is free. Counter: defenses assign that same defender to simply stay disciplined and hold his run/pass conflict rather than reacting hard either way, accepting a smaller gain instead of the big one the offense is hunting for.",
    difficulty: 4,
    sort_order: 12,
    diagramSurface: "field",
    clip: {
      youtube_id: "elVo3sM1oho",
      start_sec: 0,
      title: "What Are RPOs?",
      teams: [],
      players: [],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Watch this one defender, he's unblocked on purpose.", overlay: { circles: [{ x: 60, y: 32, r: 5 }] } },
      { t: 5, action: "note", caption: "The quarterback is reading him, not calling a run or pass before the snap." },
      { t: 9, action: "note", caption: "Whichever way that defender commits, the offense already has the answer." },
    ],
    diagram: {
      players: [
        { id: "QB", x: 50, y: 40, team: "offense" },
        { id: "RB", x: 50, y: 48, team: "offense" },
        { id: "WR", x: 80, y: 35, team: "offense" },
        { id: "X", x: 65, y: 32, team: "defense" },
      ],
      ball: { x: 50, y: 40 },
      annotations: [
        { type: "label", x: 65, y: 26, text: "unblocked, in conflict" },
        { type: "arrow", x1: 50, y1: 40, x2: 78, y2: 34, label: "quick throw" },
      ],
    },
    quiz: [
      {
        prompt: "What decides whether an RPO becomes a run or a pass?",
        choices: [
          "How one specific unblocked defender reacts after the snap",
          "A coin flip before the play",
          "The quarterback always chooses before the snap",
          "The crowd noise",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "football",
    slug: "beating-press-coverage-football",
    title: "Beating Press Coverage",
    summary: "A quick, violent release at the line beats a jam before the defender's hands ever get set.",
    body_md:
      "Press coverage means the defender lines up right on the receiver, trying to jam him at the snap and throw the route off its timing before it even starts. The release move (a hard step one way, a shoulder dip, a swipe of the defender's hands) is designed to beat that jam in the first two steps. Why it works: a defender in press has to react to the receiver's first move, so a decisive, sudden release beats a defender who's still deciding which way to slide. Counter: defensive backs train their own hand technique and footwork to stay square and mirror the release instead of committing early to a guess.",
    difficulty: 3,
    sort_order: 13,
    diagramSurface: "field",
    clip: {
      youtube_id: "ocnoTeeZ9z0",
      start_sec: 0,
      title: "Wide Receiver Techniques: Shock Release",
      teams: [],
      players: [],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Defender's right on him, that's press, and the release starts right here.", overlay: { arrows: [{ x1: 40, y1: 50, x2: 40, y2: 40 }] } },
      { t: 5, action: "note", caption: "One hard step and a shoulder dip, that's the move beating the jam." },
      { t: 9, action: "note", caption: "The defender had to react to that first step, and reacting is already too slow." },
    ],
    diagram: {
      players: [
        { id: "WR", x: 40, y: 50, team: "offense" },
        { id: "CB", x: 40, y: 42, team: "defense" },
      ],
      annotations: [{ type: "arrow", x1: 40, y1: 50, x2: 55, y2: 30, label: "release" }],
    },
    quiz: [
      {
        prompt: "Why does a quick, decisive release move beat press coverage?",
        choices: [
          "It forces the defender to react instead of dictating the matchup",
          "It's illegal for a defender to touch a receiver at all",
          "The receiver is always faster in press situations",
          "Press coverage doesn't allow any contact",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "football",
    slug: "cover-2-zone-drop",
    title: "Cover 2 Zone Drop",
    summary: "Two deep safeties split the field in half, everyone else drops into a zone underneath instead of chasing a receiver man to man.",
    body_md:
      "In Cover 2, two safeties each take one deep half of the field while the cornerbacks and linebackers drop into underneath zones, reading the quarterback's eyes instead of locking onto one receiver. Why it works: no single receiver can beat it deep alone, since there's always a safety over the top of his half, and the underneath defenders can react to wherever the ball actually goes instead of guessing. Counter: offenses attack the seams, the gaps between the two deep safeties and the underneath zone, and the middle of the field where neither safety has full responsibility.",
    difficulty: 3,
    sort_order: 14,
    diagramSurface: "field",
    clip: {
      youtube_id: "0lnP_jB1q2A",
      start_sec: 0,
      title: "Football 101: Cover 2 Defense, Explained by Jessie Bates III",
      teams: ["ATL"],
      players: ["Jessie Bates III"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Two safeties, each holding one half deep, that's the whole idea of Cover 2.", overlay: { circles: [{ x: 30, y: 15, r: 5 }, { x: 70, y: 15, r: 5 }] } },
      { t: 6, action: "note", caption: "Everyone underneath is reading the quarterback's eyes, not chasing a man." },
      { t: 10, action: "note", caption: "That's why it works: no one receiver can beat the whole shell alone." },
    ],
    diagram: {
      players: [
        { id: "S1", x: 30, y: 12, team: "defense" },
        { id: "S2", x: 70, y: 12, team: "defense" },
        { id: "C1", x: 10, y: 30, team: "defense" },
        { id: "C2", x: 90, y: 30, team: "defense" },
        { id: "WR", x: 50, y: 15, team: "offense" },
      ],
      annotations: [{ type: "label", x: 50, y: 8, text: "seam, the gap between the two safeties" }],
    },
    quiz: [
      {
        prompt: "What's the main defensive idea behind Cover 2?",
        choices: [
          "Two safeties split deep responsibility while everyone else plays zone underneath",
          "Every defender covers a specific receiver man to man",
          "It only defends against the run",
          "Cover 2 means two extra pass rushers",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "football",
    slug: "edge-rush-win",
    title: "Winning the Edge Rush",
    summary: "Beating the tackle's first punch and turning the corner before the quarterback ever finishes his drop.",
    body_md:
      "An edge rusher's whole rep is decided in the first two steps, win the tackle's initial punch with a hand swipe or a dip of the shoulder, and there's a straight line to the quarterback. Why it works: an offensive tackle has to protect against both the speed rush around the edge and the counter move back inside, so a rusher who threatens both keeps the tackle guessing and off balance. Counter: tackles train to mirror the rusher's hips rather than his hands, and offenses will chip the edge rusher with a tight end or running back to slow the first step down before the tackle ever has to handle him alone.",
    difficulty: 3,
    sort_order: 15,
    diagramSurface: "field",
    clip: {
      youtube_id: "75FUDgVKzVg",
      start_sec: 0,
      title: "Myles Garrett Strip Sack on Baker Mayfield",
      teams: ["CLE"],
      players: ["Myles Garrett"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Watch the first punch, win this and the rest of the rep is already decided.", overlay: { arrows: [{ x1: 25, y1: 40, x2: 55, y2: 35 }] } },
      { t: 5, action: "note", caption: "He's turned the corner, the tackle's a half-step too slow to recover." },
      { t: 8, action: "note", caption: "That's the whole rep: two steps at the line, then the sack was already coming." },
    ],
    diagram: {
      players: [
        { id: "DE", x: 25, y: 40, team: "defense" },
        { id: "OT", x: 32, y: 38, team: "offense" },
        { id: "QB", x: 55, y: 30, team: "offense" },
      ],
      annotations: [{ type: "arrow", x1: 25, y1: 40, x2: 53, y2: 31, label: "turns the corner" }],
    },
    quiz: [
      {
        prompt: "When is an edge rush rep usually decided?",
        choices: [
          "In the first couple of steps, winning the initial hand fight with the tackle",
          "Only after the quarterback has thrown the ball",
          "It's decided entirely by straight-line speed",
          "The rusher always has to wait for a blitz call",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "football",
    slug: "run-fit-discipline",
    title: "Run Fit Discipline",
    summary: "Every defender owns one gap. Fill the wrong one and the whole scheme breaks, no matter how fast anyone runs.",
    body_md:
      "Every run defense assigns each defender a specific gap between two offensive linemen to fill, not just a general area to cover. Why it works: as long as every gap is accounted for, the running back has nowhere untouched to go, since even a free defender who's out of position creates the exact crease the offense is looking for. Counter: offenses use misdirection, motion, and pulling linemen specifically to make a disciplined defender guess wrong and vacate his gap a half-second before the ball actually gets there.",
    difficulty: 4,
    sort_order: 16,
    diagramSurface: "field",
    clip: {
      youtube_id: "u7sjtJfJuAk",
      start_sec: 0,
      title: "Brady Explaining the \"A Gap\"",
      teams: [],
      players: ["Tom Brady"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Each defender owns one gap here, not just a general area.", overlay: { arrows: [{ x1: 50, y1: 45, x2: 50, y2: 35 }] } },
      { t: 5, action: "note", caption: "Watch him stay in his gap even as the play tries to pull him out of it." },
      { t: 9, action: "note", caption: "One free gap is all a run needs, discipline is what closes it." },
    ],
    diagram: {
      players: [
        { id: "C", x: 50, y: 45, team: "offense" },
        { id: "G", x: 42, y: 45, team: "offense" },
        { id: "G", x: 58, y: 45, team: "offense" },
        { id: "MLB", x: 50, y: 32, team: "defense" },
        { id: "RB", x: 50, y: 52, team: "offense" },
      ],
      annotations: [{ type: "label", x: 46, y: 45, text: "A gap" }],
    },
    quiz: [
      {
        prompt: "What breaks a disciplined run defense?",
        choices: [
          "Even one defender leaving his assigned gap",
          "A defense with too many players on the field",
          "Running the ball only on 3rd down",
          "The offense huddling before the play",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "football",
    slug: "zone-read",
    title: "The Zone Read",
    summary: "The quarterback doesn't decide before the snap: he reads the backside defensive end and only pulls the ball if that end crashes down to chase the running back.",
    body_md:
      "The offensive line blocks it like an ordinary inside zone run, and the backside defensive end is left unblocked on purpose. The quarterback watches that one defender through the mesh point: if he crashes down to chase the running back, the quarterback pulls the ball and runs the edge himself. Why it works: the defense is a man short no matter which way that end goes, since blocking him would just take a gap away from the run and leave someone else uncovered. Counter: teams assign a spy or a scrape exit defender specifically to shadow the quarterback's keep lane, accepting a free run at the running back in exchange for never leaving the quarterback unaccounted for.",
    difficulty: 3,
    sort_order: 21,
    diagramSurface: "field",
    clip: {
      youtube_id: "p2HP9T3jz2c",
      start_sec: 0,
      title: "Fast Quarterback + Outside Zone = Defensive Nightmare",
      teams: [],
      players: [],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Watch the backside end, he's the read, not a blocked man.", overlay: { arrows: [{ x1: 65, y1: 40, x2: 52, y2: 48 }] } },
      { t: 5, action: "note", caption: "Quarterback pulls it, that end just took himself out of the play." },
      { t: 9, action: "note", caption: "Why it works: the defense is a man short no matter which way he goes." },
    ],
    diagram: {
      players: [
        { id: "QB", x: 50, y: 45, team: "offense" },
        { id: "RB", x: 50, y: 52, team: "offense" },
        { id: "DE", x: 68, y: 40, team: "defense" },
      ],
      ball: { x: 50, y: 45 },
      annotations: [
        { type: "arrow", x1: 68, y1: 40, x2: 55, y2: 50, label: "crashes, so QB pulls" },
        { type: "arrow", x1: 50, y1: 45, x2: 75, y2: 30, label: "keep" },
      ],
    },
    quiz: [
      {
        prompt: "What decides whether the quarterback keeps the ball or hands it off on a zone read?",
        choices: [
          "How the backside, unblocked defensive end reacts to the mesh point",
          "A signal from the sideline after the snap",
          "The running back always gets the ball first",
          "Which hash mark the ball is snapped from",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "football",
    slug: "screen-pass-vs-blitz",
    title: "Screen Pass vs. the Blitz",
    summary: "A pass thrown behind the line of scrimmage turns a hard-charging pass rush's own speed against it, leaving defenders sprinting the wrong direction when the catch happens.",
    body_md:
      "The quarterback sells a normal dropback while the offensive line lets the rush come free for a beat, then releases downfield to set up in front of the running back as blockers. Why it works: an aggressive rush is already running full speed upfield past the line of scrimmage, so by the time defenders realize the ball is behind them, their own momentum is carrying them the wrong way to make the tackle. Counter: defenses teach rushers to keep their eyes on the backfield and stay under control instead of selling out for the sack, and assign a defender to read screen-blocking angles instead of just rushing blind.",
    difficulty: 2,
    sort_order: 22,
    diagramSurface: "field",
    clip: {
      youtube_id: "h3x6GzPpD-s",
      start_sec: 0,
      title: "39-Yard TD: Warren Scores on a Screen Pass",
      teams: ["PIT"],
      players: ["Jaylen Warren", "Aaron Rodgers"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Rush is crashing hard upfield, the line is letting them go.", overlay: { arrows: [{ x1: 55, y1: 20, x2: 70, y2: 8 }] } },
      { t: 5, action: "note", caption: "Ball's already out to the back, with blockers stacked up in front of him." },
      { t: 9, action: "note", caption: "Why it works: the rush's own speed just carried them past the play, they can't get back in time." },
    ],
    diagram: {
      players: [
        { id: "QB", x: 50, y: 40, team: "offense" },
        { id: "RB", x: 30, y: 45, team: "offense" },
        { id: "OL", x: 35, y: 40, team: "offense" },
        { id: "DE", x: 55, y: 20, team: "defense" },
      ],
      ball: { x: 30, y: 45 },
      annotations: [
        { type: "arrow", x1: 50, y1: 40, x2: 30, y2: 45, label: "screen throw" },
        { type: "arrow", x1: 55, y1: 20, x2: 70, y2: 10, label: "rush runs past the play" },
      ],
    },
    quiz: [
      {
        prompt: "Why does an aggressive pass rush make a screen pass more effective, not less?",
        choices: [
          "The rushers are already running upfield past the play, so they can't get back in time to make the tackle",
          "Screens are only legal against a blitz",
          "It forces the defense to call a timeout",
          "The offensive line is not allowed to block downfield otherwise",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "football",
    slug: "press-man-bail-technique",
    title: "Press-Man Bail Technique",
    summary: "A cornerback presses at the line to threaten a jam, then opens his hips and runs stride for stride with the receiver instead of staying glued to him.",
    body_md:
      "At the snap the cornerback shows press, daring the receiver to release into him, but instead of staying square and jamming, he opens his hips into a backpedal turned sprint and runs from a cushion instead of grabbing for the receiver. Why it works: the receiver still has to respect the jam that never fully arrives, which slows his release just enough for the defender to match his speed once he opens up. Counter: receivers train a hard, sudden release to attack the cushion immediately, forcing the corner to commit to the bail before he's actually ready, and route runners use double moves that punish a defender already running full speed in one direction.",
    difficulty: 3,
    sort_order: 23,
    diagramSurface: "field",
    clip: {
      youtube_id: "VixJb7qj5r8",
      start_sec: 0,
      title: "Cornerbacks Don't Get Beat Doing This: Bail Technique",
      teams: [],
      players: [],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Corner shows press right at the line, watch his feet, not his hands.", overlay: { arrows: [{ x1: 40, y1: 42, x2: 42, y2: 20 }] } },
      { t: 5, action: "note", caption: "He opens his hips and bails instead of jamming, now he's running with the route." },
      { t: 9, action: "note", caption: "That's the technique: threaten the jam, then run the route from a cushion instead of grabbing for it." },
    ],
    diagram: {
      players: [
        { id: "CB", x: 40, y: 42, team: "defense" },
        { id: "WR", x: 40, y: 50, team: "offense" },
      ],
      annotations: [
        { type: "arrow", x1: 40, y1: 42, x2: 42, y2: 15, label: "bail, opens and runs" },
        { type: "arrow", x1: 40, y1: 50, x2: 40, y2: 18, label: "release downfield" },
      ],
    },
    quiz: [
      {
        prompt: "What does the bail technique actually rely on to work?",
        choices: [
          "The threat of a jam that never fully arrives, which still slows the receiver's release",
          "The cornerback being taller than the receiver",
          "A safety always doubling the same receiver",
          "The receiver running the wrong route",
        ],
        answer_idx: 0,
      },
    ],
  },
  {
    sport_slug: "football",
    slug: "blitz-pickup-pass-protection",
    title: "Blitz Pickup",
    summary: "A running back scans for the one rusher the offensive line's blocking scheme leaves free, then steps up to cut him off before he ever reaches the quarterback.",
    body_md:
      "Pass protection starts with the offensive line taking the defenders they're assigned, but the running back's job is to find whoever's left over, the blitzer no one up front has. Why it works: picking him up in the backfield, before he ever reaches the pocket, buys the quarterback the same clean pocket he'd have against a simple four-man rush, no matter how many extra defenders the defense sends. Counter: defenses stack the protection's math by bringing more rushers than the back and line can account for, or disguise which defender is actually coming until it's too late for the back to get to him in time.",
    difficulty: 3,
    sort_order: 24,
    diagramSurface: "field",
    clip: {
      youtube_id: "XMCfWBJKsNI",
      start_sec: 0,
      title: "Saquon Barkley's Blitz Pickup",
      teams: ["PHI"],
      players: ["Saquon Barkley"],
      season: "2025-26",
      orientation: "portrait",
    },
    beats: [
      { t: 2, action: "note", caption: "Watch him scan before the snap, he's already looking for the free rusher.", overlay: { arrows: [{ x1: 62, y1: 32, x2: 52, y2: 44 }] } },
      { t: 5, action: "note", caption: "He steps up and cuts the blitzer off in the backfield, before the rusher ever reaches the pocket." },
      { t: 9, action: "note", caption: "Why it works: the pocket stays clean, no matter how many extra defenders the blitz sent." },
    ],
    diagram: {
      players: [
        { id: "QB", x: 50, y: 38, team: "offense" },
        { id: "RB", x: 50, y: 48, team: "offense" },
        { id: "LB", x: 62, y: 32, team: "defense" },
      ],
      ball: { x: 50, y: 38 },
      annotations: [
        { type: "arrow", x1: 62, y1: 32, x2: 52, y2: 42, label: "blitz" },
        { type: "arrow", x1: 50, y1: 48, x2: 53, y2: 43, label: "picks him up" },
      ],
    },
    quiz: [
      {
        prompt: "What is the running back's actual job on a pass protection snap?",
        choices: [
          "Identify and block whichever rusher the offensive line's assignments don't already cover",
          "Always run a route regardless of the blitz",
          "Block the same defender every play",
          "Stay behind the quarterback and never move",
        ],
        answer_idx: 0,
      },
    ],
  },
];

// Slugs from earlier seed runs that got renamed or dropped (dead clip
// replacements, content rework), cleaned up so re-running `npm run seed`
// doesn't leave orphaned rows behind under old names.
const RETIRED_SLUGS = ["lebron-downhill-drive-and-kick", "jokic-spain-pnr"];

async function main() {
  const { data: sportRows, error: sportErr } = await supabase
    .from("sports")
    .upsert(SPORTS, { onConflict: "slug" })
    .select();
  if (sportErr || !sportRows) throw sportErr;
  const sportIdBySlug: Record<string, string> = {};
  for (const s of sportRows) sportIdBySlug[s.slug] = s.id;

  await supabase.from("concepts").delete().in("slug", RETIRED_SLUGS);

  for (const c of CONCEPTS) {
    const { data: concept, error: conceptErr } = await supabase
      .from("concepts")
      .upsert(
        {
          sport_id: sportIdBySlug[c.sport_slug],
          slug: c.slug,
          title: c.title,
          summary: c.summary,
          body_md: c.body_md,
          difficulty: c.difficulty,
          sort_order: c.sort_order,
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (conceptErr || !concept) {
      console.error(`concept ${c.slug} failed`, conceptErr);
      continue;
    }

    // Re-running this script re-seeds a concept from scratch: clear out
    // whatever it already had (previous clip/breakdown/diagram/quiz) so
    // repeat runs don't pile up duplicates.
    const { data: oldBreakdowns } = await supabase
      .from("breakdowns")
      .select("clip_id")
      .eq("concept_id", concept.id);
    await supabase.from("quiz_items").delete().eq("concept_id", concept.id);
    await supabase.from("diagrams").delete().eq("concept_id", concept.id);
    await supabase.from("breakdowns").delete().eq("concept_id", concept.id);
    await supabase.from("clip_concepts").delete().eq("concept_id", concept.id);
    const oldClipIds = [...new Set((oldBreakdowns ?? []).map((b) => b.clip_id))];
    if (oldClipIds.length > 0) {
      await supabase.from("clips").delete().in("id", oldClipIds);
    }

    const { data: clip, error: clipErr } = await supabase
      .from("clips")
      .insert({
        youtube_id: c.clip.youtube_id,
        start_sec: c.clip.start_sec,
        title: c.clip.title,
        teams: c.clip.teams,
        players: c.clip.players,
        season: c.clip.season,
        orientation: c.clip.orientation,
      })
      .select()
      .single();
    if (clipErr || !clip) {
      console.error(`clip for ${c.slug} failed`, clipErr);
      continue;
    }

    await supabase.from("clip_concepts").insert({ clip_id: clip.id, concept_id: concept.id });
    await supabase.from("breakdowns").insert({ clip_id: clip.id, concept_id: concept.id, beats: c.beats });
    await supabase
      .from("diagrams")
      .insert({ concept_id: concept.id, surface: c.diagramSurface ?? "halfcourt", spec: c.diagram });
    if (c.quiz.length > 0) {
      await supabase.from("quiz_items").insert(c.quiz.map((q) => ({ concept_id: concept.id, ...q })));
    }

    console.log(`seeded: ${c.title}`);
  }

  // Belt and suspenders: retired-concept cleanup only catches orphans made
  // by *this* run. Sweep for any clip left over from further back (a
  // concept that got deleted some other way, a slug rename before
  // RETIRED_SLUGS existed) so orphaned rows don't just accumulate forever.
  const { data: linkedClips } = await supabase.from("clip_concepts").select("clip_id");
  const linkedIds = new Set((linkedClips ?? []).map((r) => r.clip_id));
  const { data: allClips } = await supabase.from("clips").select("id");
  const orphanIds = (allClips ?? []).map((c) => c.id).filter((id) => !linkedIds.has(id));
  if (orphanIds.length > 0) {
    await supabase.from("clips").delete().in("id", orphanIds);
    console.log(`removed ${orphanIds.length} orphaned clip(s)`);
  }
}

main().then(() => {
  console.log("done");
  process.exit(0);
});
