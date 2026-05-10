"use client";

import { useState } from "react";
import { pushAnalyticsEvent } from "@/components/analytics/analytics";

const WEB3FORMS_ACCESS_KEY = "0298bff7-9490-4cde-9a42-26922dc72d82";
const fieldClassName =
  "w-full rounded-[1.2rem] border border-white/18 bg-white/12 px-4 py-3 text-white outline-none transition placeholder:text-white/45 focus:border-white/50 focus:bg-white/18 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/6 disabled:text-white/45 disabled:placeholder:text-white/35";

export function AboutContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    const formData = new FormData(event.currentTarget);

    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: projectType
        ? `Portfolio enquiry: ${projectType}`
        : "Portfolio enquiry",
      name,
      email,
      project_type: projectType,
      message,
      botcheck: formData.get("botcheck") ?? "",
    };

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { success?: boolean };

      if (!response.ok || !result.success) {
        throw new Error("Submission failed");
      }

      pushAnalyticsEvent("email_send_success", {
        form_name: "about_contact_form",
        project_type: projectType || "unspecified",
      });
      setName("");
      setEmail("");
      setProjectType("");
      setMessage("");
      setStatus("sent");
    } catch {
      pushAnalyticsEvent("email_send_error", {
        form_name: "about_contact_form",
        project_type: projectType || "unspecified",
      });
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="sr-only">Name</span>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={status === "sent" || status === "sending"}
            className={fieldClassName}
            placeholder="NAME"
          />
        </label>

        <label className="block">
          <span className="sr-only">Email</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === "sent" || status === "sending"}
            className={fieldClassName}
            placeholder="EMAIL"
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="sr-only">Project type</span>
        <input
          type="text"
          name="projectType"
          value={projectType}
          onChange={(event) => setProjectType(event.target.value)}
          disabled={status === "sent" || status === "sending"}
          className={fieldClassName}
          placeholder="PROJECT TYPE"
        />
      </label>

      <label className="block">
        <span className="sr-only">Message</span>
        <textarea
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={status === "sent" || status === "sending"}
          rows={6}
          className={fieldClassName}
          placeholder="MESSAGE"
          required
        />
      </label>

      <div>
        <button
          type="submit"
          disabled={status === "sent" || status === "sending"}
          className="rounded-full border border-[#8b0f57] bg-[#8b0f57] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6f0c45] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:border-white/18 disabled:bg-white/18 disabled:text-white/45 disabled:hover:bg-white/18"
        >
          {status === "sending" ? "SENDING" : "SUBMIT"}
        </button>
      </div>

      {status === "sent" ? (
        <p className="text-center text-sm font-semibold text-white/82">
          Thanks for your email!
        </p>
      ) : null}

      {status === "error" ? (
        <p className="text-sm font-semibold text-white/82">
          SOMETHING WENT WRONG. PLEASE TRY AGAIN.
        </p>
      ) : null}
    </form>
  );
}
