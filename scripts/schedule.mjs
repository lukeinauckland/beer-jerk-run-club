const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return [year, month, day].join("-");
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isChristmasBreakDate(date, rule) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (month === rule.startMonth && day >= rule.startDay)
    || (month === rule.endMonth && day <= rule.endDay);
}

export function shiftedRunForMonday(monday, publicHolidays) {
  const note = publicHolidays[dateKey(monday)] || "";
  return {
    date: note ? addDays(monday, 1) : monday,
    note
  };
}

function lastSundayOfSeptember(year) {
  const date = new Date(year, 8, 30);
  date.setDate(date.getDate() - date.getDay());
  return startOfDay(date);
}

function firstSundayOfApril(year) {
  const date = new Date(year, 3, 1);
  date.setDate(date.getDate() + ((7 - date.getDay()) % 7));
  return startOfDay(date);
}

export function daylightSavingStartMonday(year) {
  return addDays(lastSundayOfSeptember(year), 1);
}

export function daylightSavingEndMonday(year) {
  return addDays(firstSundayOfApril(year), 1);
}

export function summerSeasonStartForMonday(monday) {
  const date = startOfDay(monday);
  const currentYearStart = daylightSavingStartMonday(date.getFullYear());
  return date >= currentYearStart
    ? currentYearStart
    : daylightSavingStartMonday(date.getFullYear() - 1);
}

export function isSummerMonday(monday) {
  const date = startOfDay(monday);
  const start = summerSeasonStartForMonday(date);
  const end = daylightSavingEndMonday(start.getFullYear() + 1);
  return date >= start && date < end;
}

function rotationIndex(value, length) {
  return ((value % length) + length) % length;
}

function weeksBetween(start, end) {
  return Math.round((startOfDay(end) - startOfDay(start)) / WEEK_MS);
}

export function routeNameForMonday(monday, schedule) {
  if (monday.getDay() !== 1) {
    throw new Error("Route dates must be Mondays.");
  }

  if (isSummerMonday(monday)) {
    if (!schedule.summerRotation?.length) {
      throw new Error("Summer rotation has no routes.");
    }
    const summerStart = summerSeasonStartForMonday(monday);
    return schedule.summerRotation[rotationIndex(weeksBetween(summerStart, monday), schedule.summerRotation.length)];
  }

  if (!schedule.rotation?.length) {
    throw new Error("Winter rotation has no routes.");
  }
  const anchorIndex = schedule.rotation.indexOf(schedule.anchorRoute);
  if (anchorIndex === -1) {
    throw new Error("Winter anchor route is not in the winter rotation.");
  }
  const anchorMonday = parseLocalDate(schedule.anchorMonday);
  return schedule.rotation[rotationIndex(anchorIndex + weeksBetween(anchorMonday, monday), schedule.rotation.length)];
}
