export type Sport = {
  id: string;
  name: string;
  slug: string;
};

export type Concept = {
  id: string;
  sport_id: string;
  parent_id: string | null;
  slug: string;
  title: string;
  summary: string | null;
  body_md: string | null;
  difficulty: number;
  sort_order: number;
};

export type Clip = {
  id: string;
  youtube_id: string;
  start_sec: number;
  end_sec: number | null;
  title: string;
  teams: string[];
  players: string[];
  season: string | null;
  quality: "canonical" | "counter" | "failed";
  status: "active" | "dead";
  orientation: "landscape" | "portrait";
};

export type BeatOverlayArrow = { x1: number; y1: number; x2: number; y2: number };
export type BeatOverlayCircle = { x: number; y: number; r: number };

export type Beat = {
  t: number;
  action: "pause" | "note";
  caption: string;
  overlay?: { arrows?: BeatOverlayArrow[]; circles?: BeatOverlayCircle[] };
  resume_after?: number | null;
};

export type Breakdown = {
  id: string;
  clip_id: string;
  concept_id: string;
  beats: Beat[];
};

export type DiagramPlayer = { id: string; x: number; y: number; team: "offense" | "defense" };
export type DiagramAnnotation =
  | { type: "arrow"; x1: number; y1: number; x2: number; y2: number; label?: string }
  | { type: "screen"; x: number; y: number }
  | { type: "label"; x: number; y: number; text: string };

export type DiagramSpec = {
  players: DiagramPlayer[];
  ball?: { x: number; y: number };
  annotations: DiagramAnnotation[];
};

export type Diagram = {
  id: string;
  concept_id: string;
  surface: string;
  spec: DiagramSpec;
};

export type QuizItem = {
  id: string;
  concept_id: string;
  clip_id: string | null;
  diagram_id: string | null;
  prompt: string;
  choices: string[];
  answer_idx: number;
};

export type ConceptWithRelations = Concept & {
  sport?: Sport;
  clips?: (Clip & { breakdown?: Breakdown })[];
  diagram?: Diagram;
  quiz_items?: QuizItem[];
  children?: Concept[];
};
