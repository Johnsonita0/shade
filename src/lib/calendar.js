const EVENT_TITLE = "Apology sit-out with Shade";
const EVENT_DURATION_MINUTES = 60;

function localDateTime(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function googleLocalDate(date, time) {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}

export function getCalendarLinks({ date, time, timeZone }) {
  const start = localDateTime(date, time);
  const end = new Date(start.getTime() + EVENT_DURATION_MINUTES * 60_000);
  const description = [
    "A chance to share an apology and spend time together with Shade.",
  ].join("\n");
  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", EVENT_TITLE);
  googleUrl.searchParams.set("dates", `${googleLocalDate(date, time)}/${googleLocalDate(
    `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
    `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
  )}`);
  googleUrl.searchParams.set("ctz", timeZone);
  googleUrl.searchParams.set("details", description);

  return googleUrl.toString();
}
