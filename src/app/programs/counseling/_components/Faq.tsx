"use client";

import { useState } from "react";
import { COUNSELING_FAQ } from "../content";
import { ChevronDownIcon } from "./Icons";

/**
 * [10] FAQ — 아코디언(첫 항목 기본 open, 단일 open 토글).
 */
export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="section" id="faq">
      <div className="wrap-3">
        <div className="s-header">
          <span className="eyebrow f-up">
            <span className="dot" />
            FAQ
          </span>
          <h2 className="f-up delay-1">
            자주 묻는 <em>질문</em>
          </h2>
        </div>
        <div className="faq-list">
          {COUNSELING_FAQ.map((f, i) => (
            <div className={`faq-item ${open === i ? "open" : ""} f-up`} key={f.question}>
              <button
                type="button"
                className="faq-q"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span>Q. {f.question}</span>
                <ChevronDownIcon />
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">{f.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
