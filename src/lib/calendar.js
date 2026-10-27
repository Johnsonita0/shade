const EVENT_TITLE = "🌯 Shawarma date with Shade";
const EVENT_DURATION_MINUTES = 60;

function localDateTime(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function utcCalendarDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function googleLocalDate(date, time) {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}

function escapeIcsText(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function getCalendarLinks({ date, time, timeZone }) {
  const start = localDateTime(date, time);
  const end = new Date(start.getTime() + EVENT_DURATION_MINUTES * 60_000);
  const iconUrl = `${window.location.origin}/shawarma.svg`;
  const description = [
    "A relaxed shawarma date with Shade.",
    `Event icon: ${iconUrl}`,
    "The attached calendar file includes reminders at the event time and 30 minutes before.",
    "Google Calendar's add-event link uses your calendar's default reminder settings.",
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

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shade Calendar//Shawarma date//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID?.() || `${Date.now()}@shade-calendar`}`,
    `DTSTAMP:${utcCalendarDate(new Date())}`,
    `DTSTART:${utcCalendarDate(start)}`,
    `DTEND:${utcCalendarDate(end)}`,
    `SUMMARY:${escapeIcsText(EVENT_TITLE)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `URL:${iconUrl}`,
    `ATTACH;FMTTYPE=image/svg+xml;VALUE=URI:${iconUrl}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:PT0S",
    `DESCRIPTION:${escapeIcsText(`${EVENT_TITLE} is now.`)}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-PT30M",
    `DESCRIPTION:${escapeIcsText(`${EVENT_TITLE} is in 30 minutes.`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    googleUrl: googleUrl.toString(),
    downloadUrl,
    fileName: `shawarma-date-${date}.ics`,
  };
}
