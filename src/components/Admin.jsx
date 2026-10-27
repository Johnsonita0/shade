import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

function formatTimestamp(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSelectedDate(value) {
  if (!value) return null;
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatSelectedTime(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setIsCheckingSession(false);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setErrorMessage(error.message);
      setSession(data.session);
      setIsCheckingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setErrorMessage("");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadEvents = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("dinner_choices")
      .select("id, response, selected_date, selected_time, time_zone, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Could not load invitation responses.", error);
      setErrorMessage("Could not load submitted calendar choices. Check that this account has admin access and the Supabase policies are installed.");
    } else {
      setEvents(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (session) void loadEvents();
  }, [session, loadEvents]);

  async function signIn(event) {
    event.preventDefault();
    if (!supabase) return;
    setErrorMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMessage(error.message);
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setErrorMessage(error.message);
  }

  async function deleteEvent(event) {
    if (!window.confirm("Delete this submitted response permanently?")) return;
    setDeletingId(event.id);
    setErrorMessage("");
    const { error } = await supabase.from("dinner_choices").delete().eq("id", event.id);
    if (error) {
      console.error("Could not delete the submitted response.", error);
      setErrorMessage("Could not delete that response. Check admin access and the Supabase delete policy.");
    } else {
      setEvents((current) => current.filter((entry) => entry.id !== event.id));
    }
    setDeletingId("");
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <a className="admin-brand" href="/" aria-label="Back to Shade's note">s.</a>
          <span className="admin-overline">Private space</span>
        </header>

        {!isSupabaseConfigured ? (
          <section className="admin-card">
            <p className="eyebrow">Almost ready</p>
            <h1>Connect your private dashboard.</h1>
            <p>
              Add your Supabase project URL and publishable anon key to the local <code>.env</code>
              file, then apply <code>supabase/schema.sql</code> in the Supabase SQL Editor.
              Never use a service-role key in the browser app.
            </p>
          </section>
        ) : isCheckingSession ? (
          <section className="admin-card" role="status">Checking your secure sign-in...</section>
        ) : !session ? (
          <section className="admin-card admin-login-card">
            <p className="eyebrow">Just for you</p>
            <h1>Your private back office.</h1>
            <p>Sign in with the Supabase Auth account you marked as an admin.</p>
            <form className="admin-login-form" onSubmit={signIn}>
              <label>
                Email
                <input
                  autoComplete="username"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {errorMessage && <p className="admin-error" role="alert">{errorMessage}</p>}
              <button className="primary-button" type="submit">Sign in</button>
            </form>
          </section>
        ) : session.user.app_metadata?.role !== "admin" ? (
          <section className="admin-card">
            <p className="eyebrow">Private access</p>
            <h1>This account isn't an admin.</h1>
            <p>Set this user's Supabase app metadata role to <code>admin</code>, then sign in again.</p>
            {errorMessage && <p className="admin-error" role="alert">{errorMessage}</p>}
            <button className="secondary-button" type="button" onClick={signOut}>Sign out</button>
          </section>
        ) : (
          <>
            <section className="admin-title-row">
              <div>
                <p className="eyebrow">Shade Calendar</p>
                <h1>Her date choice</h1>
                <p>Only responses she selects or dates and times she submits appear here.</p>
              </div>
              <div className="admin-actions">
                <button className="secondary-button" type="button" onClick={() => void loadEvents()} disabled={isLoading}>
                  {isLoading ? "Refreshing..." : "Refresh"}
                </button>
                <button className="secondary-button" type="button" onClick={signOut}>Sign out</button>
              </div>
            </section>

            {errorMessage && <p className="admin-error admin-banner" role="alert">{errorMessage}</p>}

            <section className="admin-stats" aria-label="Response summary">
              <article>
                <span>Responses received</span>
                <strong>{events.length}</strong>
              </article>
              <article>
                <span>Maybe later</span>
                <strong>{events.filter((event) => event.response === "maybe_later").length}</strong>
              </article>
              <article>
                <span>Shawarma dates</span>
                <strong>{events.filter((event) => event.response === "date_selected").length}</strong>
              </article>
              <article>
                <span>Reschedule requests</span>
                <strong>{events.filter((event) => event.response === "reschedule_requested").length}</strong>
              </article>
            </section>

            <section className="admin-card activity-card">
              <div className="activity-heading">
                <h2>Her responses</h2>
                <span>Responses appear newest first</span>
              </div>
              {events.length === 0 ? (
                <p className="admin-empty">No response has been submitted yet.</p>
              ) : (
                <ol className="activity-list">
                  {events.map((event) => (
                    <li key={event.id} className="activity-item">
                      <span className="activity-dot" aria-hidden="true" />
                      <div className="activity-copy">
                        <strong>
                          {event.response === "maybe_later"
                            ? "Maybe later"
                            : event.response === "reschedule_requested"
                              ? "Reschedule requested"
                              : "Shawarma date chosen"}
                        </strong>
                        <span>{event.response === "date_selected" ? "Shade Calendar" : "Follow-up"}</span>
                        {(event.selected_date || event.selected_time) && (
                          <span className="activity-choice">
                            {formatSelectedDate(event.selected_date)}
                            {event.selected_date && event.selected_time ? " · " : ""}
                            {formatSelectedTime(event.selected_time)}
                            {event.time_zone ? ` · ${event.time_zone}` : ""}
                          </span>
                        )}
                        {event.reason && <span className="activity-reason">“{event.reason}”</span>}
                        <time dateTime={event.created_at}>{formatTimestamp(event.created_at)}</time>
                      </div>
                      <button
                        className="activity-delete"
                        type="button"
                        onClick={() => void deleteEvent(event)}
                        disabled={deletingId === event.id}
                        aria-label={`Delete ${event.response.replaceAll("_", " ")} response from ${formatTimestamp(event.created_at)}`}
                      >
                        {deletingId === event.id ? "Deleting..." : "Delete"}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <p className="admin-privacy">
              Only a response she explicitly selects or a date and time she submits are stored.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
