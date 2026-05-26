import { addMinutes, areIntervalsOverlapping } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'

export function toUtc(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone)
}
export function toTz(date: Date, timezone: string): Date {
  return toZonedTime(date, timezone)
}
export function generateSlots(
  start: Date,
  end: Date,
  durationMin: number,
  bufferMin: number,
): Array<{ startsAt: Date; endsAt: Date }> {
  const slots: Array<{ startsAt: Date; endsAt: Date }> = []
  let current = start
  const step = durationMin + bufferMin
  while (addMinutes(current, durationMin) <= end) {
    slots.push({ startsAt: current, endsAt: addMinutes(current, durationMin) })
    current = addMinutes(current, step)
  }
  return slots
}
export function hasConflict(
  startsAt: Date,
  endsAt: Date,
  existing: Array<{ startsAt: Date; endsAt: Date }>,
): boolean {
  return existing.some((b) =>
    areIntervalsOverlapping(
      { start: startsAt, end: endsAt },
      { start: b.startsAt, end: b.endsAt },
      { inclusive: false },
    ),
  )
}
