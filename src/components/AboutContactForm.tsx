"use client";

import { useState } from "react";

const CONTACT_EMAIL = "bigpinkenergy@gmail.com";

export function AboutContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = projectType
      ? `Portfolio enquiry: ${projectType}`
      : "Portfolio enquiry";
    const body = [
      `Name: ${name || "-"}`,
      `Email: ${email || "-"}`,
      `Project type: ${projectType || "-"}`,
      "",
      message || "Hi, I'd love to chat about a project.",
    ].join("\n");

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm uppercase tracking-[0.14em] text-white/78">
            Name
          </span>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-[1.2rem] border border-white/18 bg-white/12 px-4 py-3 text-white outline-none transition placeholder:text-white/45 focus:border-white/50 focus:bg-white/18"
            placeholder="Your name"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm uppercase tracking-[0.14em] text-white/78">
            Email
          </span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-[1.2rem] border border-white/18 bg-white/12 px-4 py-3 text-white outline-none transition placeholder:text-white/45 focus:border-white/50 focus:bg-white/18"
            placeholder="you@example.com"
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm uppercase tracking-[0.14em] text-white/78">
          Project type
        </span>
        <input
          type="text"
          name="projectType"
          value={projectType}
          onChange={(event) => setProjectType(event.target.value)}
          className="w-full rounded-[1.2rem] border border-white/18 bg-white/12 px-4 py-3 text-white outline-none transition placeholder:text-white/45 focus:border-white/50 focus:bg-white/18"
          placeholder="Commission, collab, design, photo shoot..."
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm uppercase tracking-[0.14em] text-white/78">
          Message
        </span>
        <textarea
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          className="w-full rounded-[1.2rem] border border-white/18 bg-white/12 px-4 py-3 text-white outline-none transition placeholder:text-white/45 focus:border-white/50 focus:bg-white/18"
          placeholder="Tell me about the idea, timeline, or mood you're aiming for."
          required
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="rounded-full border border-[#8b0f57] bg-[#8b0f57] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#6f0c45] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          Send enquiry
        </button>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-sm uppercase tracking-[0.14em] text-white/84 transition hover:text-white"
        >
          {CONTACT_EMAIL}
        </a>
      </div>
    </form>
  );
}
