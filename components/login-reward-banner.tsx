"use client";

import React, { useState, useEffect } from "react";

const STORAGE_KEY_PREFIX = "loginRewardShown_";

export function LoginRewardBanner({
  pointsAwardedToday,
  currentStreak,
  streakBonusAwarded,
  todayKey,
}: {
  pointsAwardedToday: number;
  currentStreak: number;
  streakBonusAwarded: boolean;
  todayKey: string;
}) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (pointsAwardedToday <= 0) return;
    const key = STORAGE_KEY_PREFIX + todayKey;
    try {
      if (sessionStorage.getItem(key)) return;
      setShow(true);
    } catch {
      setShow(true);
    }
  }, [pointsAwardedToday, todayKey]);

  function handleDismiss() {
    setDismissed(true);
    setShow(false);
    try {
      sessionStorage.setItem(STORAGE_KEY_PREFIX + todayKey, "1");
    } catch {
      // ignore
    }
  }

  if (!show || dismissed || pointsAwardedToday <= 0) return null;

  return React.createElement(
    "div",
    {
      role: "alert",
      className:
        "mb-6 rounded-2xl border-2 border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
    },
    React.createElement(
      "div",
      null,
      streakBonusAwarded
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement("p", {
              className: "font-medium text-emerald-800 dark:text-emerald-200",
            }, "You earned 1050 points (50 daily login + 1000 streak bonus)!"),
            React.createElement("p", {
              className: "text-sm text-emerald-700 dark:text-emerald-300 mt-0.5",
            }, "Your streak has reset — log in 7 days in a row again for another 1000 pts.")
          )
        : React.createElement(
            React.Fragment,
            null,
            React.createElement("p", {
              className: "font-medium text-emerald-800 dark:text-emerald-200",
            }, "You earned 50 points for daily login!"),
            React.createElement("p", {
              className: "text-sm text-emerald-700 dark:text-emerald-300 mt-0.5",
            }, `Current streak: ${currentStreak}/7 days. Log in ${Math.max(0, 7 - currentStreak)} more days in a row for 1000 bonus points.`)
          )
    ),
    React.createElement(
      "button",
      {
        type: "button",
        onClick: handleDismiss,
        className:
          "shrink-0 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors",
        "aria-label": "Dismiss",
      },
      "Dismiss"
    )
  );
}

export function LoginStreakDisplay({
  currentStreak,
}: {
  currentStreak: number;
}) {
  const remaining = Math.max(0, 7 - currentStreak);
  return React.createElement(
    "div",
    {
      className:
        "rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-2.5 inline-flex items-center gap-2",
    },
    React.createElement("span", {
      className: "text-sm font-medium text-emerald-800 dark:text-emerald-200",
    }, `Login streak: ${currentStreak}/7 days`),
    currentStreak < 7 &&
      React.createElement("span", {
        className: "text-xs text-emerald-600 dark:text-emerald-400",
      }, `${remaining} more for 1000 pts`)
  );
}
