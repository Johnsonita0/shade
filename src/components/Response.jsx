import { useMemo, useState } from "react";
import { randomAosAnimation } from "../aosAnimations.js";
import { getCalendarLinks } from "../lib/calendar.js";
import { supabase } from "../lib/supabase.js";
import ShadeCalendar from "./ShadeCalendar.jsx";

export default function Response({
  accepted,
  submittedChoice,
  followUpSubmitted,
  onSubmitted,
  onFollowUpSubmitted,
  onClose,
}) {
  const animation = useMemo(() => randomAosAnimation(), [accepted]);
  const [followUpType, setFollowUpType] = useState("");
  const [reason, setReason] = useState("");
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const timeZone = submittedChoice?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const calendarLinks = useMemo(
    () => submittedChoice ? getCalendarLinks({ ...submittedChoice, timeZone }) : null,
    [submittedChoice, timeZone],
  );

  if (accepted && submittedChoice) {
    const date = new Date(`${submittedChoice.date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const [hours, minutes] = submittedChoice.time.split(":").map(Number);
    const time = new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    async function submitFollowUp(event) {
      event.preventDefault();
      if (!followUpType || !reason.trim() || isSubmittingFollowUp || !supabase) return;

      setIsSubmittingFollowUp(true);
      setFollowUpMessage("");
      try {
        const { error } = await supabase.from("dinner_choices").insert({
          response: followUpType,
          selected_date: null,
          selected_time: null,
          time_zone: timeZone,
          reason: reason.trim(),
        });
        if (error) throw error;
        onFollowUpSubmitted(followUpType);
      } catch (error) {
        console.error("Could not submit the follow-up response.", error);
        setFollowUpMessage("That didn't go through just yet. Please try again.");
      } finally {
        setIsSubmittingFollowUp(false);
      }
    }

    return (
      <section className="content response response-celebration" aria-labelledby="response-title">
        <p className="eyebrow" data-aos={animation}>Thank you for choosing</p>
        <h2 id="response-title" data-aos={animation}>The apology sit-out is set!</h2>
        <p className="response-date" data-aos={animation}>{date}<span aria-hidden="true"> · </span>{time}</p>
        <p className="response-copy celebration-copy" data-aos={animation}>
          I&apos;m so happy and looking forward to it, Shade. If plans change, just let me know—no pressure.
        </p>
        <a className="primary-button" href={calendarLinks} target="_blank" rel="noreferrer">
          Add to Google Calendar
        </a>
        <section className="follow-up" aria-labelledby="follow-up-title">
          {followUpSubmitted ? (
            <p className="follow-up-confirmation" role="status">Thanks for letting me know. I&apos;ll respect that.</p>
          ) : (
            <>
              <button
                className="follow-up-toggle secondary-button"
                type="button"
                aria-expanded={showFollowUpForm}
                aria-controls={showFollowUpForm ? "follow-up-content" : undefined}
                onClick={() => setShowFollowUpForm((isOpen) => !isOpen)}
              >
                {showFollowUpForm ? "Close plans-changed options" : "If plans change"}
              </button>
              {showFollowUpForm && (
                <div id="follow-up-content">
                  <h3 id="follow-up-title">What would you prefer?</h3>
                  <p>You can ask to reschedule or say “maybe later.” This is optional and only shared when submitted.</p>
                  <form className="follow-up-form" onSubmit={submitFollowUp}>
                    <label htmlFor="follow-up-type">What would you like?</label>
                    <select
                      id="follow-up-type"
                      value={followUpType}
                      onChange={(event) => setFollowUpType(event.target.value)}
                      required
                    >
                      <option value="">Choose one</option>
                      <option value="reschedule_requested">Please ask me about rescheduling</option>
                      <option value="maybe_later">Maybe later</option>
                    </select>
                    <label htmlFor="follow-up-reason">A reason or note (required)</label>
                    <textarea
                      id="follow-up-reason"
                      maxLength={500}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      required
                      rows={3}
                    />
                    {followUpMessage && <p className="calendar-error" role="alert">{followUpMessage}</p>}
                    <button className="secondary-button" type="submit" disabled={!followUpType || !reason.trim() || isSubmittingFollowUp}>
                      {isSubmittingFollowUp ? "Sending..." : "Send follow-up"}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      </section>
    );
  }

  if (accepted) return <ShadeCalendar onSubmitted={onSubmitted} />;

  return (
    <section className="content response" aria-labelledby="response-title">
      <p className="eyebrow" data-aos={animation}>Of course</p>
      <h2 id="response-title" data-aos={animation}>No pressure at all.</h2>
      <p className="response-copy" data-aos={animation}>
        Thank you for letting me know and for reading this. No pressure at all—I respect where you&apos;re at.
      </p>
      <div className="response-actions">
        <button className="text-button" type="button" onClick={onClose}>
          Close this note
        </button>
      </div>
    </section>
  );
}
