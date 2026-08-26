import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  dateKey,
  daylightSavingEndMonday,
  daylightSavingStartMonday,
  isChristmasBreakDate,
  isSummerMonday,
  parseLocalDate,
  routeNameForMonday,
  shiftedRunForMonday
} from "./schedule.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "content", "site.json"), "utf8"));
const schedule = data.schedule;

function date(value) {
  return parseLocalDate(value);
}

assert.equal(dateKey(daylightSavingStartMonday(2026)), "2026-09-28");
assert.equal(dateKey(daylightSavingEndMonday(2027)), "2027-04-05");
assert.equal(isSummerMonday(date("2026-09-21")), false);
assert.equal(isSummerMonday(date("2026-09-28")), true);
assert.equal(isSummerMonday(date("2027-03-29")), true);
assert.equal(isSummerMonday(date("2027-04-05")), false);

assert.equal(routeNameForMonday(date("2026-07-27"), schedule), "Grange Hill");
assert.equal(routeNameForMonday(date("2026-09-21"), schedule), "Beer Mile");
assert.equal(routeNameForMonday(date("2026-09-28"), schedule), "Domain Loop");
assert.equal(routeNameForMonday(date("2026-10-05"), schedule), "Beer Mile");
assert.equal(routeNameForMonday(date("2026-10-12"), schedule), "Grange Hill");
assert.equal(routeNameForMonday(date("2026-10-19"), schedule), "Maungawhau");
assert.equal(routeNameForMonday(date("2026-10-26"), schedule), "Domain Loop");
assert.ok(schedule.rotation.includes(routeNameForMonday(date("2027-04-05"), schedule)));

assert.equal(schedule.publicHolidays["2027-02-01"], "Auckland Anniversary");
assert.equal(schedule.publicHolidays["2027-03-29"], "Easter Monday");
assert.equal(schedule.publicHolidays["2027-01-25"], undefined);
assert.equal(dateKey(shiftedRunForMonday(date("2027-02-01"), schedule.publicHolidays).date), "2027-02-02");
assert.equal(dateKey(shiftedRunForMonday(date("2027-03-29"), schedule.publicHolidays).date), "2027-03-30");
assert.equal(shiftedRunForMonday(date("2027-04-05"), schedule.publicHolidays).note, "");

const latestHolidayYear = Math.max(...Object.keys(schedule.publicHolidays).map(value => Number(value.slice(0, 4))));
assert.ok(latestHolidayYear >= new Date().getFullYear() + 1, "Public holiday coverage must include next year.");

assert.equal(isChristmasBreakDate(date("2026-12-22"), schedule.christmasBreak), false);
assert.equal(isChristmasBreakDate(date("2026-12-23"), schedule.christmasBreak), true);
assert.equal(isChristmasBreakDate(date("2027-01-31"), schedule.christmasBreak), true);
assert.equal(isChristmasBreakDate(date("2027-02-01"), schedule.christmasBreak), false);

console.log("PASS seasonal schedule boundaries");
