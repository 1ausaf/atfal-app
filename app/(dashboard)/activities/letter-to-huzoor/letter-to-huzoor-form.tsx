"use client";

import { useMemo, useState } from "react";
import { LetterToHuzoorTemplate, type LetterValues } from "./letter-template";

function validateLetterPayload(p: LetterValues): string | null {
  if (!p.myName.trim()) return "Please enter your name.";
  if (!p.fatherName.trim()) return "Please enter your father’s name.";
  if (!p.age.trim()) return "Please enter your age.";
  if (!p.grade.trim()) return "Please enter your grade.";
  if (!p.letterBody.trim()) return "Please write your letter message.";
  if (!p.signatureName.trim()) return "Please enter your signature name.";
  if (!p.address.trim()) return "Please enter your address.";
  return null;
}

export function LetterToHuzoorForm() {
  const [stage, setStage] = useState<"editing" | "animating">("editing");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialPayload: LetterValues = useMemo(
    () => ({
      myName: "",
      fatherName: "",
      age: "",
      grade: "",
      letterBody: "",
      signatureName: "",
      address: "",
    }),
    []
  );

  const [payload, setPayload] = useState<LetterValues>(initialPayload);

  async function onSendLetter() {
    if (stage !== "editing") return;
    setError(null);

    const validationError = validateLetterPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setStage("animating");
    setSent(false);

    try {
      const res = await fetch("/api/activities/letter-to-huzoor/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letter_payload: payload }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to submit letter. Please try again.");
      }

      // Match the animation timing so the message appears after it.
      setTimeout(() => {
        setSent(true);
        setIsSubmitting(false);
      }, 1500);
    } catch (e) {
      setStage("editing");
      setIsSubmitting(false);
      setError(e instanceof Error ? e.message : "Failed to submit letter.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card-kid p-0" aria-label="Letter to Huzoor">
        <div
          className={`relative w-full mx-auto ${
            stage === "animating" ? "animate-letter-fold-fly pointer-events-none" : ""
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          <LetterToHuzoorTemplate mode="edit" values={payload} onChangeValues={setPayload} disabled={stage !== "editing"} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void onSendLetter()}
          disabled={stage !== "editing" || isSubmitting}
          className="btn-kid-primary px-6 py-3 rounded-gta text-sm font-semibold self-start"
        >
          {isSubmitting ? "Sending..." : "SEND LETTER"}
        </button>

        {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}

        {sent && (
          <p className="text-gta-textSecondary text-sm">
            JazakAllah for submitting your letter to Huzoor! Please remember to confirm that you did write
            the letter to Huzoor in the monthly Saiq Form!
          </p>
        )}
      </div>
    </div>
  );
}

