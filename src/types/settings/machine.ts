// Machine rank related types

export type SmelterRank = "arc" | "plane" | "negentropy";
export type AssemblerRank = "mk1" | "mk2" | "mk3" | "recomposing";
export type ChemicalPlantRank = "standard" | "quantum";
export type MatrixLabRank = "standard" | "self-evolution";

export interface MachineRankSettings {
  Smelt: SmelterRank;
  Assemble: AssemblerRank;
  Chemical: ChemicalPlantRank;
  Research: MatrixLabRank;
  Refine: string; // Oil Refinery (usually only one type)
  Particle: string; // Miniature Particle Collider (usually only one type)
}
