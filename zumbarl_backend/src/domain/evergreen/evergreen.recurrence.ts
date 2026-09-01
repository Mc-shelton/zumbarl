type RecurrenceType = 'NONE' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'CUSTOM'

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]))
  return values as ZonedParts
}

function zonedPartsToUtc(parts: ZonedParts, timeZone: string) {
  let guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getZonedParts(new Date(guess), timeZone)
    const desiredWallTime = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
    const actualWallTime = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second)
    guess += desiredWallTime - actualWallTime
  }
  return new Date(guess)
}

function addLocalPeriod(date: Date, timeZone: string, recurrenceType: RecurrenceType, interval = 1) {
  if (recurrenceType === 'NONE') return null
  const parts = getZonedParts(date, timeZone)
  const wall = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second))
  if (recurrenceType === 'WEEKLY') wall.setUTCDate(wall.getUTCDate() + 7 * interval)
  if (recurrenceType === 'MONTHLY') wall.setUTCMonth(wall.getUTCMonth() + interval)
  if (recurrenceType === 'QUARTERLY') wall.setUTCMonth(wall.getUTCMonth() + 3 * interval)
  if (recurrenceType === 'CUSTOM') wall.setUTCDate(wall.getUTCDate() + interval)
  return zonedPartsToUtc({
    year: wall.getUTCFullYear(),
    month: wall.getUTCMonth() + 1,
    day: wall.getUTCDate(),
    hour: wall.getUTCHours(),
    minute: wall.getUTCMinutes(),
    second: wall.getUTCSeconds()
  }, timeZone)
}

function calculateNextCohortDates(input: {
  recurrenceType: RecurrenceType
  timezone: string
  interval?: number
  applicationOpensAt: Date
  applicationClosesAt: Date
  placementStartsAt: Date
  placementEndsAt: Date
}) {
  const { recurrenceType, timezone, interval = 1 } = input
  if (recurrenceType === 'NONE') return null
  return {
    applicationOpensAt: addLocalPeriod(input.applicationOpensAt, timezone, recurrenceType, interval)!,
    applicationClosesAt: addLocalPeriod(input.applicationClosesAt, timezone, recurrenceType, interval)!,
    placementStartsAt: addLocalPeriod(input.placementStartsAt, timezone, recurrenceType, interval)!,
    placementEndsAt: addLocalPeriod(input.placementEndsAt, timezone, recurrenceType, interval)!
  }
}

export { calculateNextCohortDates, addLocalPeriod }
