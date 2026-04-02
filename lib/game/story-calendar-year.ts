/** In-game age 8 maps to `anchorYear` (default: device calendar year when called). */
export function calendarYearForStoryAge(
  gameAge: number,
  anchorYear: number = new Date().getFullYear(),
): number {
  return anchorYear + (gameAge - 8);
}
