export const STANDARD_ISP_PROGRAMS = [
  'Sparklight Fiber',
  'T-Mobile Fiber',
  'AT&T Fiber',
  'Frontier Fiber',
  'Quantum Fiber',
  'Brightspeed',
  'Spectrum Gig',
  'Kinetic Fiber',
  'Google Fiber',
  'Optimum Fiber',
  'Ziply Fiber',
  'Cox Gigablast',
] as const;

export type StandardIspProgram = (typeof STANDARD_ISP_PROGRAMS)[number];

export const DEFAULT_ISP_PAY_RATES: Record<string, number> = {
  'Sparklight Fiber': 340,
  'T-Mobile Fiber': 340,
  'AT&T Fiber': 310,
  'Frontier Fiber': 330,
  'Quantum Fiber': 300,
  'Brightspeed': 280,
  'Spectrum Gig': 270,
  'Kinetic Fiber': 290,
  'Google Fiber': 320,
  'Optimum Fiber': 280,
  'Ziply Fiber': 290,
  'Cox Gigablast': 270,
};

export function getNormalizedPayRates(customRates?: Record<string, number>): Record<string, number> {
  return {
    ...DEFAULT_ISP_PAY_RATES,
    ...(customRates || {}),
  };
}
