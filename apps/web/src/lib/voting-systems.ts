export const VOTING_SYSTEMS = {
  fibonacci: {
    label: "Fibonacci",
    values: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
  },
  power: {
    label: "Power of 2",
    values: [0, 1, 2, 4, 8, 16],
  },
} as const;

export type VotingSystemKey = keyof typeof VOTING_SYSTEMS;

export function getCardValues(system: VotingSystemKey): readonly number[] {
  return VOTING_SYSTEMS[system].values;
}
