import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";

const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dateTimes = Array.from({ length: 9 }, (_, index) => {
  const minutesAfterFive = index * 30;
  const totalMinutes = 17 * 60 + minutesAfterFive;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getCalendarDays(month) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - mondayOffset);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const visibleDayCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: visibleDayCount }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export default function ShadeCalendar({ onSubmitted }) {
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const days = useMemo(() => getCalendarDays(month), [month]);

  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const isCurrentOrPastMonth =
    month.getFullYear() < today.getFullYear() ||
    (month.getFullYear() === today.getFullYear() && month.getMonth() <= today.getMonth());
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";

  async function submitChoice(event) {
    event.preventDefault();
    if (!selectedDate || !selectedTime || isSubmitting) return;
    if (!supabase) {
      setErrorMessage("The calendar is waiting for its private connection. Please try again later.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.from("dinner_choices").insert({
        response: "date_selected",
        selected_date: selectedDate,
        selected_time: selectedTime,
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (error) {
        console.error("Could not submit the chosen date and time.", error);
        setErrorMessage("That didn't go through just yet. Please try again.");
        return;
      }

      onSubmitted(selectedDate, selectedTime, Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (error) {
      console.error("Could not submit the chosen date and time.", error);
      setErrorMessage("That didn't go through just yet. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="shade-calendar" aria-labelledby="calendar-title">
      <div className="calendar-heading">
        <p className="eyebrow">Choose a shawarma date</p>
        <h2 id="calendar-title">Shade Calendar</h2>
        <p className="calendar-intro">Pick a day and a time that feel good to you. No rush.</p>
      </div>

      <form className="calendar-form" onSubmit={submitChoice}>
        <div className="calendar-layout">
          <section className="calendar-panel" aria-label="Choose a date">
            <div className="calendar-month">
              <button
                className="calendar-arrow"
                type="button"
                aria-label="Previous month"
                disabled={isCurrentOrPastMonth}
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              >
                ‹
              </button>
              <h3>{monthLabel}</h3>
              <button
                className="calendar-arrow"
                type="button"
                aria-label="Next month"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              >
                ›
              </button>
            </div>
            <div className="calendar-grid calendar-weekdays" aria-hidden="true">
              {weekdayNames.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="calendar-grid calendar-days">
              {days.map((date) => {
                const dateValue = formatDate(date);
                const isCurrentMonth = date.getMonth() === month.getMonth();
                const isPast = date < today;

                return (
                  <button
                    className={[
                      "calendar-day",
                      !isCurrentMonth && "is-outside-month",
                      dateValue === selectedDate && "is-selected",
                      dateValue === formatDate(today) && "is-today",
                    ].filter(Boolean).join(" ")}
                    type="button"
                    key={dateValue}
                    disabled={isPast}
                    aria-label={date.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    aria-pressed={dateValue === selectedDate}
                    onClick={() => {
                      setSelectedDate(dateValue);
                      setErrorMessage("");
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="time-panel" aria-label="Choose a time">
            <p className="time-panel-label">Choose your time</p>
            <p className="time-panel-note">
              {selectedDateLabel || "First, choose a day"}
            </p>
            <div className="time-options">
              {dateTimes.map((time) => (
                <button
                  className={`time-option${selectedTime === time ? " is-selected" : ""}`}
                  type="button"
                  key={time}
                  aria-pressed={selectedTime === time}
                  onClick={() => {
                    setSelectedTime(time);
                    setErrorMessage("");
                  }}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          </section>
        </div>

        {errorMessage && <p className="calendar-error" role="alert">{errorMessage}</p>}

        <div className="calendar-submit-row">
          <p className="calendar-private-note">
            Your chosen date, time, and timezone will only be shared when you submit. We will not access your Google account.
          </p>
          <button
            className="primary-button calendar-submit"
            type="submit"
            disabled={!selectedDate || !selectedTime || isSubmitting}
          >
            {isSubmitting ? "Sending your choice..." : "Send my choice"}
          </button>
        </div>
      </form>
    </section>
  );
}
