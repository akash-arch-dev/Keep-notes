import { Note, VocabularyItem } from '../types';

// Pre-crafted SVG sketch data URLs for instant visual richness
const CASTLE_SKETCH_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="%231e2124"/>
  <path d="M40 180 L360 180" stroke="%23fbbf24" stroke-width="3" stroke-dasharray="4 4"/>
  <path d="M70 180 L70 90 L110 90 L110 180 Z" fill="none" stroke="%23f59e0b" stroke-width="3"/>
  <path d="M60 90 L120 90 L120 70 L110 70 L110 80 L100 80 L100 70 L90 70 L90 80 L80 80 L80 70 L70 70 L70 80 L60 80 Z" fill="%23f59e0b"/>
  <path d="M290 180 L290 90 L330 90 L330 180 Z" fill="none" stroke="%23f59e0b" stroke-width="3"/>
  <path d="M280 90 L340 90 L340 70 L330 70 L330 80 L320 80 L320 70 L310 70 L310 80 L300 80 L300 70 L290 70 L290 80 L280 80 Z" fill="%23f59e0b"/>
  <path d="M110 180 L110 120 L290 120 L290 180 Z" fill="none" stroke="%23d97706" stroke-width="3"/>
  <path d="M175 180 C175 145 225 145 225 180 Z" fill="none" stroke="%23fbbf24" stroke-width="3"/>
  <path d="M200 60 L170 120 L230 120 Z" fill="none" stroke="%23f59e0b" stroke-width="3"/>
  <circle cx="200" cy="95" r="8" fill="%23fbbf24"/>
  <text x="200" y="215" font-family="monospace" font-size="13" fill="%23e5e7eb" text-anchor="middle">CITADEL OF THE VEILED MOON - SECTOR A</text>
</svg>`;

const SIGIL_SKETCH_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220">
  <rect width="320" height="220" fill="%232b1d38"/>
  <circle cx="160" cy="110" r="70" fill="none" stroke="%23c084fc" stroke-width="2.5"/>
  <polygon points="160,40 220,145 100,145" fill="none" stroke="%23e879f9" stroke-width="2"/>
  <polygon points="160,180 220,75 100,75" fill="none" stroke="%23a855f7" stroke-width="2"/>
  <circle cx="160" cy="110" r="20" fill="%23c084fc" opacity="0.4"/>
  <text x="160" y="200" font-family="sans-serif" font-size="11" fill="%23f3e8ff" text-anchor="middle" letter-spacing="2">GLYPH OF THE ASTRAL ANCHOR</text>
</svg>`;

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'The Citadel of the Veiled Moon',
    color: 'sand',
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    tags: ['#fantasy', '#chapter-1', '#worldbuilding'],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000 * 4,
    activePageIndex: 0,
    pages: [
      {
        id: 'p-1',
        title: 'Act I Scene Outline',
        content: `**Opening Image**:
The dusk bell strikes seven over the drowned spires. Rain falls steadily through the shattered stained glass of the upper nave.

**Key Beats**:
1. Lysander inspects the broken seal at the gatehouse.
2. The odor of *petrichor* and cold copper permeates the stones.
3. Encounter with the silent sentry—a message scratched in basalt: "The bell chimes backwards tonight."
4. Discovery of the celestial astrolabe missing three gears.`,
        media: [
          {
            id: 'm-1',
            type: 'drawing',
            url: CASTLE_SKETCH_SVG,
            name: 'Citadel Gatehouse Layout',
            caption: 'Architectural sketch of the north approach and gatehouse',
            createdAt: Date.now() - 86400000 * 2,
          },
        ],
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'p-2',
        title: 'Draft: The Broken Nave',
        content: `The bell struck seven, though no monk had climbed the belfry in forty winters.

Lysander paused on the third landing of the marble staircase, fingers curling against the damp hilt of his rapier. Rain hissed softly through the tracery overhead, filling the air with the deep *petrichor* of ancient soil and wet mortar.

"Step lightly, boy," whispered Master Caleb from the shadows behind. "The echoes in this stone do not answer to the living."

Ahead, the brass gates were forced outward, wrenched as if by the heave of an underground sea.`,
        media: [],
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 3600000 * 6,
      },
      {
        id: 'p-3',
        title: 'Sensory Details & Lore',
        content: `• **Lighting**: Indigo twilight fading into storm-gray. Torchlight sputters in the salt draft.
• **Sound**: Raindrops tapping rhythmically on oxidized copper bells like erratic fingers.
• **Smell**: Wet slate, old incense, ozone from a brewing electrical gale.
• **Dialogue note**: Caleb speaks with an archaic clipped cadence, never using contractions.`,
        media: [],
        createdAt: Date.now() - 3600000 * 5,
        updatedAt: Date.now() - 3600000 * 4,
      },
    ],
  },
  {
    id: 'note-2',
    title: 'Astral Magic: Sigils & Runes',
    color: 'storm',
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    tags: ['#magic-system', '#lore', '#sigils'],
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000,
    activePageIndex: 0,
    pages: [
      {
        id: 'p-201',
        title: 'Anchor Glyph Mechanism',
        content: `To bind a wanderer between realms, the sorcerer must trace the **Astral Anchor** in pulverized lapis and quicksilver.

The geometric interlocking triangles represent:
• The Upper Apex: Conscious intent
• The Lower Inversion: The tide of memory
• The Orbit: Tether to physical bloodline`,
        media: [
          {
            id: 'm-201',
            type: 'drawing',
            url: SIGIL_SKETCH_SVG,
            name: 'Glyph of Astral Anchor',
            caption: 'Primary stabilization diagram drawn during rite testing',
            createdAt: Date.now() - 86400000 * 3,
          },
        ],
        createdAt: Date.now() - 86400000 * 4,
        updatedAt: Date.now() - 86400000 * 3,
      },
      {
        id: 'p-202',
        title: 'Incantation & Cadence',
        content: `*Vespertine murmurs when opening the rift:*

"Sanguis terrae, stella cadens,
Revoca umbram in saecula."

Spoken in a hushed *susurrus* so the subterranean spirits do not awaken before the circle is closed.`,
        media: [],
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000,
      },
    ],
  },
  {
    id: 'note-3',
    title: 'Character Dossier: Lady Vespera',
    color: 'dusk',
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    tags: ['#characters', '#antagonist', '#dialogue'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 2,
    activePageIndex: 0,
    pages: [
      {
        id: 'p-301',
        title: 'Psychology & Motive',
        content: `**Role**: High Chancellor of the Silent Guild.
**Core Conflict**: Believes suppressing history is the only shield preventing the populace from descending into madness.
**Mannerism**: Never blinks during negotiations; rotates a silver signet ring with her left thumb whenever she calculates a deception.`,
        media: [],
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'p-302',
        title: 'Memorable Dialogue Quotes',
        content: `"Peace is not the absence of tragedy, Lysander. It is merely the discipline of forgetting who inflicted it."

"You speak of truth as though it were food. Feed a starving kingdom raw truth, and watch how quickly their bellies knot with poison."`,
        media: [],
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
      },
    ],
  },
  {
    id: 'note-4',
    title: 'Dialogue Polish: Dialect & Slang',
    color: 'mint',
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    tags: ['#dialogue', '#linguistics'],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
    activePageIndex: 0,
    pages: [
      {
        id: 'p-401',
        title: 'Dockside Slang',
        content: `• **"Salt-eyed"**: Someone who has stared into the deep trench too long; suspicious or erratic.
• **"Gull-talk"**: Empty promises or chatter made by politicians.
• **"Drown the lantern"**: Go to sleep or hide quickly when the patrol passes.
• **"By the brine"**: Common dockhand oath.`,
        media: [],
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now() - 86400000 * 2,
      },
    ],
  },
  {
    id: 'note-5',
    title: 'Poetry Draft: The Clockmaker’s Daughter',
    color: 'peach',
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    tags: ['#poetry', '#ballad'],
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 4,
    activePageIndex: 0,
    pages: [
      {
        id: 'p-501',
        title: 'Stanzas I & II',
        content: `She wound the brass springs tight as spun gold hair,
And set the pendulum to breathe cold air.
Each gear was etched with hours unbegun,
A clockwork cradle for a clockwork sun.

No second ticked without her father's prayer:
"Keep steady, cogs, lest time discover where
The shadows slip between the teeth of dawn,
And all our yesterdays are pulled and drawn."`,
        media: [],
        createdAt: Date.now() - 86400000 * 6,
        updatedAt: Date.now() - 86400000 * 4,
      },
    ],
  },
];

export const INITIAL_VOCABULARY: VocabularyItem[] = [
  {
    id: 'vocab-1',
    word: 'Petrichor',
    definition: 'A pleasant, earthy scent produced using rainwater falling on dry soil or warm stones.',
    pronunciation: '/ˈpɛtrɪkɔːr/',
    etymology: 'Greek: petra (stone) + ichor (the ethereal blood of mythical gods).',
    exampleContext: 'The petrichor rose from the ancient cobblestones of the plaza, heralding the autumn storms.',
    tags: ['#sensory', '#atmosphere', '#nature', '#rain'],
    customFields: [
      { id: 'f1', key: 'Sensory Type', value: 'Olfactory (Smell)' },
      { id: 'f2', key: 'Tone / Mood', value: 'Nostalgic, earthy, melancholic' },
      { id: 'f3', key: 'Chapter Used', value: 'Chapter 1: The Broken Nave' },
    ],
    mapX: 220,
    mapY: 180,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'vocab-2',
    word: 'Susurrus',
    definition: 'A whispering, rustling, or murmuring sound, like wind blowing through dry leaves or muted whispers.',
    pronunciation: '/sʊˈsʌr.əs/',
    etymology: 'Latin: susurrare (to whisper, murmur).',
    exampleContext: 'A susurrus went around the crowded courtroom as Lady Vespera entered without her guard.',
    tags: ['#sound', '#sensory', '#dialogue', '#atmosphere'],
    customFields: [
      { id: 'f4', key: 'Sensory Type', value: 'Auditory (Sound)' },
      { id: 'f5', key: 'Intensity', value: 'Very subtle / quiet' },
      { id: 'f6', key: 'Synonym', value: 'Murmur, rustle, whisper' },
    ],
    mapX: 380,
    mapY: 140,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'vocab-3',
    word: 'Defenestration',
    definition: 'The act of throwing someone or something out of a window.',
    pronunciation: '/diːˌfɛn.ɪˈstreɪ.ʃən/',
    etymology: 'Latin: de (down from) + fenestra (window).',
    exampleContext: 'Lord Corvus survived two defenestrations solely due to the awning beneath his study.',
    tags: ['#action', '#historical', '#humor', '#violence'],
    customFields: [
      { id: 'f7', key: 'Action Type', value: 'Physical assassination / assault' },
      { id: 'f8', key: 'Tone', value: 'Macabre or absurdly formal' },
    ],
    mapX: 520,
    mapY: 260,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'vocab-4',
    word: 'Eldritch',
    definition: 'Weird, sinister, spectral, or otherworldly; evoking a sense of ancient cosmic dread.',
    pronunciation: '/ˈɛl.drɪtʃ/',
    etymology: 'Middle English / Scots: elfrich (pertaining to elves / otherworldly creatures).',
    exampleContext: 'An eldritch geometry governed the black basalt pillars of the Sunken Spire.',
    tags: ['#horror', '#magic', '#atmosphere', '#cosmic'],
    customFields: [
      { id: 'f9', key: 'Subgenre', value: 'Lovecraftian / Dark Fantasy' },
      { id: 'f10', key: 'Antonym', value: 'Mundane, familiar' },
      { id: 'f11', key: 'Related Concept', value: 'The Void Gate' },
    ],
    mapX: 180,
    mapY: 340,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'vocab-5',
    word: 'Sonder',
    definition: 'The profound realization that every random passerby is living a life as vivid and complex as your own.',
    pronunciation: '/ˈsɒn.dər/',
    etymology: 'The Dictionary of Obscure Sorrows (John Koenig).',
    exampleContext: 'Sitting on the train watching silhouettes against neon-lit windows, he felt a crushing pang of sonder.',
    tags: ['#emotion', '#philosophy', '#character-depth'],
    customFields: [
      { id: 'f12', key: 'Psychological State', value: 'Existential empathy' },
      { id: 'f13', key: 'Story Arc', value: 'Protagonist coming of age' },
    ],
    mapX: 350,
    mapY: 380,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'vocab-6',
    word: 'Mellifluous',
    definition: 'Sweet or musical; pleasant to hear; smoothly flowing like honey.',
    pronunciation: '/məˈlɪf.lu.əs/',
    etymology: 'Latin: mel (honey) + fluere (to flow).',
    exampleContext: 'Her voice had a mellifluous cadence that disarmed even the most hardened inquisitors.',
    tags: ['#sound', '#dialogue', '#sensory', '#character-trait'],
    customFields: [
      { id: 'f14', key: 'Sensory Type', value: 'Auditory & Tactile' },
      { id: 'f15', key: 'Associated Character', value: 'Lady Vespera' },
    ],
    mapX: 560,
    mapY: 120,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'vocab-7',
    word: 'Crepuscular',
    definition: 'Of, resembling, or relating to twilight; active during twilight hours (like certain creatures).',
    pronunciation: '/krɪˈpʌs.kjʊ.lər/',
    etymology: 'Latin: crepusculum (twilight, dusk).',
    exampleContext: 'Crepuscular bats swarmed from the hollowed gargoyles as the sun dipped behind the mountain ridge.',
    tags: ['#nature', '#atmosphere', '#twilight'],
    customFields: [
      { id: 'f16', key: 'Time of Day', value: 'Dusk / Dawn' },
      { id: 'f17', key: 'Mood', value: 'Gothic, liminal' },
    ],
    mapX: 200,
    mapY: 110,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
];
