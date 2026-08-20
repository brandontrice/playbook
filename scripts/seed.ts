// One-off local seed script. Uses the service-role key to bypass RLS —
// never deploy this key, run this locally only: `npm run seed`.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
}
const supabase = createClient(url, serviceRoleKey);

type SeedConcept = {
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  difficulty: number;
  sort_order: number;
  clip: { youtube_id: string; start_sec: number; title: string; teams: string[]; players: string[]; season: string };
  beats: unknown[];
  diagram: unknown;
  quiz: { prompt: string; choices: string[]; answer_idx: number }[];
};

const SPORT = { name: "Basketball", slug: "basketball" };

// Top-10 2025-26 NBA jersey-sales players (per NBA.com/NBPA, Aug 2026), one
// signature concept each. Clip picks are candidates sourced from public
// highlight/breakdown videos — swap any of them from the admin screen.
// Beat timestamps are round-number placeholders (I can't watch/frame-verify
// video) — refine them to the actual moment while watching, in Admin.
const CONCEPTS: SeedConcept[] = [
  {
    slug: "curry-relocation-shooting",
    title: "Relocation Shooting",
    summary: "Give up the ball, then immediately move to a new spot — the defense has to solve you all over again.",
    body_md:
      "Most shooters stand still after passing. Curry never does — the instant the ball leaves his hands he's already sprinting to a new spot behind the arc, forcing his defender to navigate through traffic to stay attached. Why it works: a defender who was in perfect position to contest now has to fight through a screen or a crowd just to get back to the same spot, and by the time they do, Curry's moved again. Counter: teams try to \"body\" him with a physical, non-switching defender assigned to trail him full-time regardless of the play, refusing to help off him even for a second.",
    difficulty: 2,
    sort_order: 1,
    clip: {
      youtube_id: "lfvb8zNsJbo",
      start_sec: 0,
      title: "How Stephen Curry's Off-Ball Movement Gets His Teammates Open",
      teams: ["GSW"],
      players: ["Stephen Curry"],
      season: "2025-26",
    },
    beats: [
      { t: 5, action: "pause", caption: "Curry just passed — watch what he does next instead of standing still.", overlay: { arrows: [{ x1: 40, y1: 60, x2: 65, y2: 25 }] } },
      { t: 12, action: "pause", caption: "He's relocated to a new catch spot before the defense could recover.", resume_after: 3 },
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
    slug: "luka-stepback-three",
    title: "The Step-Back Three",
    summary: "Create a full stride of separation from a live dribble, then rise before the defender can close it.",
    body_md:
      "The step-back uses a hard dribble into the defender's space, then a push backward off two feet to create separation right as the shot goes up — by the time the defender reacts, the space is already gone. Why it works: NBA closeout speed can't cover a full backward step in the half-second it takes to rise and fire, especially with a shooter this size shooting over the top. Counter: defenders try to bait the step-back into a contested long two by giving a half-step of space early, or use verticality/late high hands rather than closing hard and getting hung in the air.",
    difficulty: 3,
    sort_order: 2,
    clip: {
      youtube_id: "dsz0D6Jsj5c",
      start_sec: 0,
      title: "Every Luka Dončić Step-Back 3 of the 2022-23 Season",
      teams: ["DAL"],
      players: ["Luka Doncic"],
      season: "2022-23",
    },
    beats: [
      { t: 6, action: "pause", caption: "Live dribble, defender square — this is the setup, not the shot yet.", overlay: { arrows: [{ x1: 45, y1: 50, x2: 45, y2: 35 }] } },
      { t: 10, action: "pause", caption: "The push-back happens as the gather starts — separation before the rise, not during it.", resume_after: 3 },
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
    slug: "brunson-mid-range-hesitation",
    title: "Mid-Range Hesitation",
    summary: "A change of pace, not a burst of speed — freezing the defender's hips is what creates the pull-up window.",
    body_md:
      "Brunson isn't the fastest player on the floor, so he wins with pace instead — a hesitation dribble that makes the defender's hips guess wrong for a fraction of a second is all he needs to get to his pull-up spot. Why it works: most drives beat a defender with speed; this beats them with timing, which means it works just as well against faster, longer defenders. Counter: defenses drop a big into the gap early to wall off the mid-range window entirely, forcing the pull-up to happen further from the rim.",
    difficulty: 2,
    sort_order: 3,
    clip: {
      youtube_id: "AQ2ysW9JeGI",
      start_sec: 0,
      title: "Jalen Brunson Best Highlights — 2026 NBA Playoffs & Finals",
      teams: ["NYK"],
      players: ["Jalen Brunson"],
      season: "2025-26",
    },
    beats: [
      { t: 8, action: "pause", caption: "Watch his hips, not the ball — that hesitation is what freezes the defender.", overlay: { circles: [{ x: 45, y: 45, r: 4 }] } },
      { t: 13, action: "pause", caption: "One beat of hesitation bought him the space for the pull-up.", resume_after: 3 },
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
    slug: "wembanyama-weakside-rim-protection",
    title: "Weak-Side Rim Protection",
    summary: "Helping from the gap without fouling — length lets you contest straight up instead of chasing the block.",
    body_md:
      "Weak-side rim protection means leaving your own assignment for a split second to help at the rim when the ball beats the on-ball defender — the hard part is timing it so you arrive as a wall, not as a foul. Why it works: elite length lets a helper contest straight up (verticality) instead of lunging across the driver's path, which is both safer and more effective than a chase-down. Counter: offenses attack it by immediately swinging the ball to whoever the helper just left open, punishing the gap he vacated.",
    difficulty: 3,
    sort_order: 4,
    clip: {
      youtube_id: "9WGDgZZNyZw",
      start_sec: 0,
      title: "Victor Wembanyama Shot Blocking Highlights",
      teams: ["SAS"],
      players: ["Victor Wembanyama"],
      season: "2025-26",
    },
    beats: [
      { t: 4, action: "pause", caption: "He starts on the weak side — this isn't his man driving.", overlay: { arrows: [{ x1: 70, y1: 20, x2: 50, y2: 45 }] } },
      { t: 9, action: "pause", caption: "Straight up, not across the body — that's verticality, not a foul.", resume_after: 3 },
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
    slug: "lebron-downhill-drive-and-kick",
    title: "Downhill Drive-and-Kick",
    summary: "Attack the rim hard enough that two defenders commit — then the pass, not the drive, is the actual weapon.",
    body_md:
      "The drive is bait. Once LeBron gets downhill and a second defender steps up to help at the rim, he's already found the open man before the pass leaves his hand — the read happens mid-drive, not after. Why it works: it turns a 1-on-1 into a numbers game the defense can't win — they either give up the layup or give up an open three. Counter: teams pre-rotate a low man early and live with a slightly worse shot than a wide-open corner three, rather than help late and get killed by the kick-out.",
    difficulty: 3,
    sort_order: 5,
    clip: {
      youtube_id: "peFqYsbWUeE",
      start_sec: 0,
      title: "LeBron James Isolation Scoring/Playmaking Highlights",
      teams: ["LAL"],
      players: ["LeBron James"],
      season: "2025-26",
    },
    beats: [
      { t: 7, action: "pause", caption: "He's already downhill — watch the second defender start to help.", overlay: { arrows: [{ x1: 45, y1: 55, x2: 50, y2: 30 }] } },
      { t: 11, action: "pause", caption: "Kick-out before the help even fully arrives — the read was made a beat early.", resume_after: 3 },
    ],
    diagram: {
      players: [
        { id: "23", x: 45, y: 55, team: "offense" },
        { id: "X1", x: 48, y: 45, team: "defense" },
        { id: "X2", x: 55, y: 30, team: "defense" },
        { id: "C", x: 80, y: 50, team: "offense" },
      ],
      ball: { x: 45, y: 55 },
      annotations: [{ type: "arrow", x1: 45, y1: 55, x2: 78, y2: 50, label: "kick-out" }],
    },
    quiz: [
      {
        prompt: "What forces the defense into a losing decision in a drive-and-kick?",
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
    slug: "edwards-attacking-closeouts",
    title: "Attacking Closeouts",
    summary: "A defender flying at you off-balance is a driving lane, not a contest — one hard dribble turns it into a dunk.",
    body_md:
      "When the ball swings and a defender has to closeout in a hurry, they're moving forward with momentum they can't stop on a dime. Edwards reads that instantly — one hard, direct dribble past a hard closeout beats it clean, because the defender's own speed is working against them. Why it works: a fast closeout that's off-balance is easier to beat than a defender standing still in position. Counter: teach a \"under control\" closeout — high hand, choppy feet, sacrificing a fraction of a second of contest for balance — rather than flying at the shooter.",
    difficulty: 2,
    sort_order: 6,
    clip: {
      youtube_id: "4UBLPe1tBIM",
      start_sec: 0,
      title: "15 Minutes of Anthony Edwards' Best Career Dunks",
      teams: ["MIN"],
      players: ["Anthony Edwards"],
      season: "2025-26",
    },
    beats: [
      { t: 5, action: "pause", caption: "Defender's flying in hard — that's a driving lane opening up, not a good contest.", overlay: { arrows: [{ x1: 60, y1: 30, x2: 40, y2: 45 }] } },
      { t: 9, action: "pause", caption: "One dribble and he's already by — the closeout's own momentum beat itself.", resume_after: 3 },
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
    slug: "tatum-side-step-three",
    title: "The Side-Step Three",
    summary: "Lateral separation instead of backward separation — same idea as a step-back, different direction.",
    body_md:
      "Where a step-back creates space by moving straight back, the side-step creates it by moving sideways off a live dribble, using a hard crossover-style plant to shift the defender's weight the wrong way. Why it works: it's a smaller, quicker motion than a full step-back, so it's harder to anticipate and just as effective at clearing a contest. Counter: same family of answers as the step-back — stay low, don't bite on the crossover plant, and live with a slightly late closeout rather than lunging.",
    difficulty: 3,
    sort_order: 7,
    clip: {
      youtube_id: "QrvoNtvISS4",
      start_sec: 0,
      title: "Jayson Tatum's Unguardable Side-Step Highlights",
      teams: ["BOS"],
      players: ["Jayson Tatum"],
      season: "2025-26",
    },
    beats: [
      { t: 5, action: "pause", caption: "Hard plant to the side, not backward — watch where his weight shifts.", overlay: { arrows: [{ x1: 45, y1: 50, x2: 60, y2: 50 }] } },
      { t: 9, action: "pause", caption: "Defender's weight is still going the other way when the shot goes up.", resume_after: 3 },
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
    slug: "sga-change-of-speed-drives",
    title: "Change-of-Speed Drives",
    summary: "Slow, slow, fast — the sudden acceleration into contact is what draws the whistle and gets to the rim.",
    body_md:
      "Gilgeous-Alexander drives at a deliberately uneven pace — slow enough to get the defender leaning and comfortable, then a sudden burst into their chest that either blows by them or draws contact on a shot attempt. Why it works: refs read sudden, decisive contact from the offensive player as a foul far more readily than a defender simply standing their ground against a steady drive. Counter: defenses coach players to stay low and \"give ground\" rather than absorb contact upright, taking away the foul look even if it means a step of separation.",
    difficulty: 3,
    sort_order: 8,
    clip: {
      youtube_id: "Mo4ni69qUbY",
      start_sec: 0,
      title: "Shai Gilgeous-Alexander Drawing Fouls — OKC Thunder",
      teams: ["OKC"],
      players: ["Shai Gilgeous-Alexander"],
      season: "2025-26",
    },
    beats: [
      { t: 6, action: "pause", caption: "Slow, controlled dribble — he's letting the defender get comfortable.", overlay: { circles: [{ x: 45, y: 45, r: 4 }] } },
      { t: 10, action: "pause", caption: "Sudden burst into the body — that contact reads as a foul.", resume_after: 3 },
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
    slug: "flagg-switchable-defense",
    title: "Switchable Defense",
    summary: "One defender guarding multiple positions without a mismatch — size and lateral quickness both, at once.",
    body_md:
      "Switchability means a defender can guard a screen action by simply trading assignments with a teammate instead of fighting through or going under — no rotation, no gap in coverage. Why it works: most switch defenders are good at one half of it (big enough to guard forwards, or quick enough to guard guards) but not both; a player who can do both takes away the mismatch hunting that most offenses rely on. Counter: offenses try to force a switch and then immediately attack it with a second action before the defense can reset, rather than settling for the initial post-up or iso.",
    difficulty: 4,
    sort_order: 9,
    clip: {
      youtube_id: "1kLjd0DY3lE",
      start_sec: 0,
      title: "Cooper Flagg Shows off His Two-Way Versatility",
      teams: ["DAL"],
      players: ["Cooper Flagg"],
      season: "2025-26",
    },
    beats: [
      { t: 6, action: "pause", caption: "Screen coming — watch him switch instead of fighting through it.", overlay: { arrows: [{ x1: 45, y1: 40, x2: 60, y2: 45 }] } },
      { t: 10, action: "pause", caption: "No gap, no mismatch — he just picked up the new assignment clean.", resume_after: 3 },
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
    slug: "jokic-spain-pnr",
    title: "Spain Pick-and-Roll",
    summary: "A three-man action: a back screen on the screener's defender turns a simple pick-and-roll into a two-way trap.",
    body_md:
      "The Spain pick-and-roll adds a third player who sets a back screen on the roll man's defender, right as the pick-and-roll starts. Why it works: it attacks the exact defender who'd normally help — the screener's man — so if he stays home to stop the roll, he gets backscreened and can't help; if he helps anyway, the roller is wide open at the rim. Counter: switch everything, so there's no defender left in a position to be back-screened in the first place — which is exactly why Spain PnR is most common against teams that drop or hedge instead of switch.",
    difficulty: 4,
    sort_order: 10,
    clip: {
      youtube_id: "NblTrosH6Cc",
      start_sec: 0,
      title: "Nikola Jokić — High-Post Playmaking",
      teams: ["DEN"],
      players: ["Nikola Jokic"],
      season: "2025-26",
    },
    beats: [
      { t: 4, action: "pause", caption: "Standard pick-and-roll shape so far — ball-handler and screener.", overlay: { arrows: [{ x1: 50, y1: 50, x2: 45, y2: 35 }] } },
      { t: 8, action: "pause", caption: "Third man back-screens the screener's defender — that's the Spain action.", overlay: { arrows: [{ x1: 65, y1: 40, x2: 45, y2: 40 }] } },
      { t: 13, action: "pause", caption: "Screener's defender is boxed in — he can't help without giving up the backdoor.", resume_after: 3 },
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
        { type: "screen", x: 47, y: 42 },
        { type: "arrow", x1: 65, y1: 40, x2: 47, y2: 40, label: "back screen" },
        { type: "arrow", x1: 45, y1: 35, x2: 40, y2: 50, label: "roll" },
      ],
    },
    quiz: [
      {
        prompt: "What does the back screen in a Spain pick-and-roll specifically target?",
        choices: [
          "The roll man's own defender, taking away their ability to help",
          "The ball-handler's defender",
          "The weak-side corner shooter's defender",
          "It's decorative and doesn't affect the defense",
        ],
        answer_idx: 0,
      },
    ],
  },
];

async function main() {
  const { data: sport, error: sportErr } = await supabase
    .from("sports")
    .upsert(SPORT, { onConflict: "slug" })
    .select()
    .single();
  if (sportErr || !sport) throw sportErr;

  for (const c of CONCEPTS) {
    const { data: concept, error: conceptErr } = await supabase
      .from("concepts")
      .upsert(
        {
          sport_id: sport.id,
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

    const { data: clip, error: clipErr } = await supabase
      .from("clips")
      .insert({
        youtube_id: c.clip.youtube_id,
        start_sec: c.clip.start_sec,
        title: c.clip.title,
        teams: c.clip.teams,
        players: c.clip.players,
        season: c.clip.season,
      })
      .select()
      .single();
    if (clipErr || !clip) {
      console.error(`clip for ${c.slug} failed`, clipErr);
      continue;
    }

    await supabase.from("clip_concepts").insert({ clip_id: clip.id, concept_id: concept.id });
    await supabase.from("breakdowns").insert({ clip_id: clip.id, concept_id: concept.id, beats: c.beats });
    await supabase.from("diagrams").insert({ concept_id: concept.id, spec: c.diagram });
    if (c.quiz.length > 0) {
      await supabase.from("quiz_items").insert(c.quiz.map((q) => ({ concept_id: concept.id, ...q })));
    }

    console.log(`seeded: ${c.title}`);
  }
}

main().then(() => {
  console.log("done");
  process.exit(0);
});
