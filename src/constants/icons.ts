// Centralized icon ID constants for machines and belts

export const ICONS = {
  // Conveyor belts
  belt: {
    mk1: 2001,
    mk2: 2002,
    mk3: 2003,
  },

  // Sorters
  sorter: {
    mk1: 2011,
    mk2: 2012,
    mk3: 2013,
    pile: 2014,
  },

  // Machines
  machine: {
    smelter: {
      arc: 2302,
      plane: 2315,
      negentropy: 2319,
    },
    assembler: {
      mk1: 2303,
      mk2: 2304,
      mk3: 2305,
      recomposing: 2318,
    },
    chemical: {
      standard: 2309,
      quantum: 2317,
    },
    research: {
      standard: 2901,
      'self-evolution': 2902,
    },
  },
} as const;

export type IconId = number;


