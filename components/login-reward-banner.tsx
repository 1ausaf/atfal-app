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
        "mb-6 rounded-gta border-2 border-amber-400 bg-[rgba(255,215,0,0.25)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 dark:border-amber-600 dark:bg-amber-900/30",
    },
    React.createElement(
      "div",
      null,
      streakBonusAwarded
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement("p", {
              className: "font-bold text-gta-text",
            }, "You earned 1050 points (50 daily login + 1000 streak bonus)!"),
            React.createElement("p", {
              className: "text-sm text-gta-textSecondary mt-0.5",
            }, "Your streak has reset — log in 7 days in a row again for another 1000 pts.")
          )
        : React.createElement(
            React.Fragment,
            null,
            React.createElement("p", {
              className: "font-bold text-gta-text",
            }, "You earned 50 points for daily login!"),
            React.createElement("p", {
              className: "text-sm text-gta-textSecondary mt-0.5",
            }, `Current streak: ${currentStreak}/7 days. Log in ${Math.max(0, 7 - currentStreak)} more days in a row for 1000 bonus points.`)
          )
    ),
    React.createElement(
      "button",
      {
        type: "button",
        onClick: handleDismiss,
        className:
          "shrink-0 px-3 py-1.5 text-sm font-semibold text-green-800 hover:bg-amber-200/50 rounded-gta-sm transition-colors dark:text-emerald-200 dark:hover:bg-amber-800/50",
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
        "rounded-gta-sm border border-amber-400 bg-[rgba(255,215,0,0.25)] px-4 py-2.5 inline-flex items-center gap-2 dark:border-amber-600 dark:bg-amber-900/30",
    },
    React.createElement("span", {
      className: "text-sm font-semibold text-gta-text",
    }, `Login streak: ${currentStreak}/7 days`),
    currentStreak < 7 &&
      React.createElement("span", {
        className: "text-xs text-green-800 font-medium dark:text-emerald-200",
      }, `${remaining} more for 1000 pts`)
  );
}
