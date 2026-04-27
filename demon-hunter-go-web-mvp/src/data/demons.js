export const DEMONS = [
  {
    id: 'nebelzahn',
    name: 'Nebelzahn',
    title: 'Dämon der Rastlosigkeit',
    biome: 'city',
    rarity: 'common',
    baseBindChance: 0.62,
    resistance: 22,
    preferredRitual: 'breath',
    art: '🌫️',
    flavor: 'Er kaut an Gedanken, bis sie wie Kiesel im Kopf klappern.',
    effect: '+5 EXP, wenn du ihn bindest.'
  },
  {
    id: 'murrgoth',
    name: 'Murrgoth',
    title: 'Flüsterer des Aufschiebens',
    biome: 'city',
    rarity: 'uncommon',
    baseBindChance: 0.48,
    resistance: 35,
    preferredRitual: 'task',
    art: '🕯️',
    flavor: 'Er sagt: gleich. Immer gleich. Niemals jetzt.',
    effect: '+10 EXP beim ersten Tages-To-do.'
  },
  {
    id: 'laternenmaul',
    name: 'Laternenmaul',
    title: 'Dämon nächtlicher Gedanken',
    biome: 'city',
    rarity: 'rare',
    baseBindChance: 0.35,
    resistance: 52,
    preferredRitual: 'gratitude',
    art: '🏮',
    flavor: 'Es frisst Straßenlicht und spuckt Erinnerungen aus.',
    effect: '+1 Bindungsbonus bei Dankbarkeitsnotizen.'
  },
  {
    id: 'wurzelfiep',
    name: 'Wurzelfiep',
    title: 'Kleiner Wächter der Pausen',
    biome: 'nature',
    rarity: 'common',
    baseBindChance: 0.67,
    resistance: 18,
    preferredRitual: 'walk',
    art: '🌿',
    flavor: 'Es klingt wie ein Ast, der sich räuspert.',
    effect: '+8 EXP nach Natur-Spaziergängen.'
  },
  {
    id: 'aschefink',
    name: 'Aschefink',
    title: 'Vogel der Erschöpfung',
    biome: 'nature',
    rarity: 'uncommon',
    baseBindChance: 0.46,
    resistance: 38,
    preferredRitual: 'breath',
    art: '🐦‍⬛',
    flavor: 'Seine Flügel schlagen leise, als wären sie aus Müdigkeit.',
    effect: '+10 EXP, wenn du eine Pause bewusst einträgst.'
  },
  {
    id: 'moosnarr',
    name: 'Moosnarr',
    title: 'Der freundliche Irrweg',
    biome: 'nature',
    rarity: 'rare',
    baseBindChance: 0.32,
    resistance: 58,
    preferredRitual: 'walk',
    art: '🍄',
    flavor: 'Er führt dich nicht falsch. Nur anders richtig.',
    effect: '+15 EXP, wenn du einen neuen Weg markierst.'
  },
  {
    id: 'uferling',
    name: 'Uferling',
    title: 'Dämon der stillen Übergänge',
    biome: 'water',
    rarity: 'common',
    baseBindChance: 0.64,
    resistance: 20,
    preferredRitual: 'senses',
    art: '💧',
    flavor: 'Er zählt Wellen, bis du langsamer atmest.',
    effect: '+5 EXP bei Sinnesritualen.'
  },
  {
    id: 'schwester-morrow',
    name: 'Schwester Morrow',
    title: 'Dämonin der Melancholie',
    biome: 'water',
    rarity: 'rare',
    baseBindChance: 0.30,
    resistance: 62,
    preferredRitual: 'gratitude',
    art: '🖤',
    flavor: 'Sie weint nicht um dich. Sie weint mit dir.',
    effect: '+20 EXP für eine ehrliche Notiz.'
  },
  {
    id: 'brueckenklaue',
    name: 'Brückenklaue',
    title: 'Hüterin des Dazwischen',
    biome: 'water',
    rarity: 'uncommon',
    baseBindChance: 0.44,
    resistance: 41,
    preferredRitual: 'walk',
    art: '🌉',
    flavor: 'Sie lebt dort, wo man rüber muss, bevor man bereit ist.',
    effect: '+12 EXP nach 800 Schritten.'
  }
];

export const RARITY_LABELS = {
  common: 'Gewöhnlich',
  uncommon: 'Ungewöhnlich',
  rare: 'Selten'
};
