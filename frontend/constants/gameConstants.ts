export const botStyles = [
  { id: 'regular', name: 'Regular Bot' },
  { id: 'emo', name: 'Emo Bot' },
  { id: 'rizz', name: 'Rizz Bot' },
  { id: 'bully', name: 'Bully Bot' },
] as const;

export type BotStyle = typeof botStyles[number]['id'];
