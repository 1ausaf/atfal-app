"use client";

import React from "react";

export type LetterValues = {
  myName: string;
  fatherName: string;
  age: string;
  grade: string;
  letterBody: string;
  signatureName: string;
  address: string;
};

function UnderlineInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      className={
        "bg-black/5 border border-black/15 rounded-md px-2 py-1 text-black/90 placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-amber-400/30 " +
        (className ?? "")
      }
    />
  );
}

function LineTextarea({
  value,
  onChange,
  disabled,
  placeholder,
  heightClassName,
}: {
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  heightClassName: string;
}) {
  return (
    <textarea
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      className={
        "w-full bg-transparent border-none rounded-none outline-none focus:outline-none resize-none text-black/90 placeholder:text-black/25 px-2 py-1 " +
        heightClassName
      }
      // Simulate the ruled lines from the PDF.
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 19px, rgba(0,0,0,0.18) 20px)",
        backgroundSize: "100% 20px",
        lineHeight: "20px",
      }}
    />
  );
}

export function LetterToHuzoorTemplate({
  mode,
  values,
  onChangeValues,
  disabled,
}: {
  mode: "edit" | "view";
  values: LetterValues;
  onChangeValues?: (next: LetterValues) => void;
  disabled?: boolean;
}) {
  const setField = (field: keyof LetterValues, v: string) => {
    if (mode !== "edit") return;
    onChangeValues?.({ ...values, [field]: v });
  };

  const isEdit = mode === "edit";

  return (
    <div
      className="bg-white text-black p-7"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <p className="text-sm font-semibold mb-2">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>

      <p className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-sans)" }}>
        In the Name of Allah, Most Gracious, Ever Merciful
      </p>

      <p className="text-sm mb-4">Dearest Huzoor (aa),</p>

      <p
        className="text-sm mb-4"
        style={{ fontFamily: "var(--font-arabic)", direction: "rtl", textAlign: "right" }}
      >
        السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ
      </p>

      <p className="text-sm mb-4">
        I pray that may Allah the Almighty always be with you and grant you a long and healthy life. Ameen!
      </p>

      <div className="text-sm mb-4">
        <div className="mb-1">
          My name is{" "}
          {isEdit ? (
            <UnderlineInput
              disabled={disabled}
              value={values.myName}
              onChange={(v) => setField("myName", v)}
              className="w-[14rem]"
              placeholder="Your name"
            />
          ) : (
            <span className="inline-block min-w-[14rem] border-b border-black/70">{values.myName || "__________"}</span>
          )}
        </div>
        <div className="mb-1">
          My father&apos;s name is{" "}
          {isEdit ? (
            <UnderlineInput
              disabled={disabled}
              value={values.fatherName}
              onChange={(v) => setField("fatherName", v)}
              className="w-[14rem]"
              placeholder="Father's name"
            />
          ) : (
            <span className="inline-block min-w-[14rem] border-b border-black/70">{values.fatherName || "__________"}</span>
          )}
        </div>
        <div className="mb-1">
          I am{" "}
          {isEdit ? (
            <UnderlineInput
              disabled={disabled}
              value={values.age}
              onChange={(v) => setField("age", v)}
              className="w-[4rem] text-center"
              placeholder="Age"
            />
          ) : (
            <span className="inline-block min-w-[4rem] border-b border-black/70 text-center">
              {values.age || "____"}
            </span>
          )}{" "}
          years old. I am in grade{" "}
          {isEdit ? (
            <UnderlineInput
              disabled={disabled}
              value={values.grade}
              onChange={(v) => setField("grade", v)}
              className="w-[5rem] text-center"
              placeholder="Grade"
            />
          ) : (
            <span className="inline-block min-w-[5rem] border-b border-black/70 text-center">
              {values.grade || "______"}
            </span>
          )}
          .
        </div>
      </div>

      <div className="text-sm mb-4">
        {isEdit ? (
          <LineTextarea
            disabled={disabled}
            value={values.letterBody}
            onChange={(v) => setField("letterBody", v)}
            heightClassName="h-[160px]"
            placeholder="Write anything to beloved Huzoor (aa) (request for prayers, advice, general etc)"
          />
        ) : (
          <div
            className="h-[160px] w-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 19px, rgba(0,0,0,0.18) 20px)",
              backgroundSize: "100% 20px",
              lineHeight: "20px",
              padding: "0px 4px",
            }}
          >
            {values.letterBody ? (
              <pre className="whitespace-pre-wrap m-0 text-black/90 text-sm" style={{ fontFamily: "inherit" }}>
                {values.letterBody}
              </pre>
            ) : null}
          </div>
        )}
      </div>

      <p className="text-sm mb-4">
        May Allah strengthen your hands and enable all the Atfal of the Jama’at to always remain connected to Khilafat. Ameen!
      </p>

      <p className="text-sm mb-4">Wassalam.</p>

      <p className="text-sm mb-2">Yours sincerely,</p>

      <div className="text-sm">
        <div className="mb-2">
          Name:{" "}
          {isEdit ? (
            <UnderlineInput
              disabled={disabled}
              value={values.signatureName}
              onChange={(v) => setField("signatureName", v)}
              className="w-[22rem]"
              placeholder="Signature name"
            />
          ) : (
            <span className="inline-block min-w-[22rem] border-b border-black/70">{values.signatureName || "__________________"}</span>
          )}
        </div>

        <div>
          Address:{" "}
          {isEdit ? (
            <UnderlineInput
              disabled={disabled}
              value={values.address}
              onChange={(v) => setField("address", v)}
              className="w-[22rem]"
              placeholder="Street number, street name, postal code, Toronto, Ontario"
            />
          ) : (
            <span className="inline-block min-w-[22rem] border-b border-black/70">{values.address || "__________________"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

