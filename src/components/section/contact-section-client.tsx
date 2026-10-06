"use client";

import { useChat } from "@/components/chat/chat-provider";
import { AnimatedDotGrid } from "@/components/magicui/animated-dot-grid";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { getIcon } from "@/lib/icon-registry";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Check, Copy, Loader2, Mail, MapPin, Send, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface SocialLinkItem {
  id: string;
  platform: string;
  url: string;
}

interface ContactSectionClientProps {
  email: string;
  location: string;
  locationLink: string;
  socialLinks: SocialLinkItem[];
}

const SOCIAL_ICON_KEY: Record<string, string> = {
  GitHub: "github",
  LinkedIn: "linkedin",
  X: "x",
  Youtube: "youtube",
};

type Field = "name" | "email" | "subject" | "message";
type FormValues = Record<Field, string>;

const EMPTY_FORM: FormValues = { name: "", email: "", subject: "", message: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 text-sm shadow-xs transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60";

export function ContactSectionClient({ email, location, locationLink, socialLinks }: ContactSectionClientProps) {
  const { language } = useLanguage();
  const t = translations[language].contact;
  const chat = useChat();

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function validate(v: FormValues) {
    const next: Partial<Record<Field, string>> = {};
    if (v.name.trim().length < 2) next.name = t.errorName;
    if (!EMAIL_PATTERN.test(v.email.trim())) next.email = t.errorEmail;
    if (v.message.trim().length < 10) next.message = t.errorMessage;
    return next;
  }

  function update(field: Field, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot }),
      });
      if (res.ok) {
        setStatus("success");
        setValues(EMPTY_FORM);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) setFormError(t.errorRate);
      else if (data?.fields) setErrors(validate(values));
      else setFormError(t.errorGeneric);
    } catch {
      setFormError(t.errorGeneric);
    }
    setStatus("idle");
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  const fieldLabel = (field: Field, label: string, optional = false) => (
    <label htmlFor={`contact-${field}`} className="text-sm font-medium">
      {label}
      {optional && <span className="ml-1 text-xs font-normal text-muted-foreground">({t.optional})</span>}
    </label>
  );

  const fieldError = (field: Field) =>
    errors[field] ? (
      <p id={`contact-${field}-error`} className="text-xs text-destructive">
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="relative pt-4">
      {/* Sits on the card's top border; kept outside the clipped card so it isn't cut off. */}
      <div className="absolute left-1/2 top-0.5 z-20 -translate-x-1/2 rounded-xl border bg-primary px-4 py-1 shadow-xs">
        <span className="text-sm font-medium text-primary-foreground">{t.badge}</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border bg-card/80 shadow-sm">
        <AnimatedDotGrid
          className="absolute inset-x-0 top-0 h-2/3"
          maxOpacity={0.45}
          interactive
          style={{
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />

        <div className="relative z-10 flex flex-col gap-8 p-4 pt-10 sm:p-6 sm:pt-10 md:p-10">
          <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl">{t.title}</h2>

          <div className="-mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm">
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium">{t.available}</span>
            <span className="text-muted-foreground">· {t.responseTime}</span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Contact details */}
            <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">
              <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-background/70 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Mail className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-xs text-muted-foreground">{t.emailLabel}</span>
                  <a href={`mailto:${email}`} className="truncate text-sm font-medium hover:underline underline-offset-4">
                    {email}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={copyEmail}
                  aria-label={copied ? t.copied : t.copy}
                  title={copied ? t.copied : t.copy}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                </button>
              </div>

              {location && (
                <a
                  href={locationLink || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-3 rounded-xl border bg-background/70 p-4 transition-colors hover:border-foreground/20"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-xs text-muted-foreground">{t.locationLabel}</span>
                    <span className="truncate text-sm font-medium">{location}</span>
                  </div>
                </a>
              )}
            </div>

            {/* Form */}
            <div className="relative">
              <AnimatePresence mode="wait" initial={false}>
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="flex h-full min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border bg-background/70 p-8 text-center"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                      className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500"
                    >
                      <Check className="size-7" />
                    </motion.span>
                    <div className="flex flex-col gap-1">
                      <p className="text-lg font-semibold">{t.successTitle}</p>
                      <p className="text-sm text-muted-foreground">{t.successBody}</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setStatus("idle")}>
                      {t.sendAnother}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex flex-col gap-4 rounded-xl border bg-background/70 p-4 sm:p-5"
                  >
                    <p className="font-semibold">{t.formTitle}</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        {fieldLabel("name", t.name)}
                        <input
                          id="contact-name"
                          autoComplete="name"
                          value={values.name}
                          onChange={(e) => update("name", e.target.value)}
                          placeholder={t.namePlaceholder}
                          maxLength={100}
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={errors.name ? "contact-name-error" : undefined}
                          disabled={status === "sending"}
                          className={cn(inputClass, errors.name && "border-destructive/60")}
                        />
                        {fieldError("name")}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {fieldLabel("email", t.email)}
                        <input
                          id="contact-email"
                          type="email"
                          autoComplete="email"
                          value={values.email}
                          onChange={(e) => update("email", e.target.value)}
                          placeholder={t.emailPlaceholder}
                          maxLength={200}
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? "contact-email-error" : undefined}
                          disabled={status === "sending"}
                          className={cn(inputClass, errors.email && "border-destructive/60")}
                        />
                        {fieldError("email")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {fieldLabel("subject", t.subject, true)}
                      <input
                        id="contact-subject"
                        value={values.subject}
                        onChange={(e) => update("subject", e.target.value)}
                        placeholder={t.subjectPlaceholder}
                        maxLength={200}
                        disabled={status === "sending"}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {fieldLabel("message", t.message)}
                      <textarea
                        id="contact-message"
                        rows={5}
                        value={values.message}
                        onChange={(e) => update("message", e.target.value)}
                        placeholder={t.messagePlaceholder}
                        maxLength={5000}
                        aria-invalid={Boolean(errors.message)}
                        aria-describedby={errors.message ? "contact-message-error" : undefined}
                        disabled={status === "sending"}
                        className={cn(inputClass, "resize-y min-h-[120px]", errors.message && "border-destructive/60")}
                      />
                      {fieldError("message")}
                    </div>
                    {/* Honeypot: invisible to people, tempting to bots. */}
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      className="absolute -left-[9999px] h-px w-px opacity-0"
                    />
                    {formError && (
                      <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {formError}
                      </p>
                    )}
                    <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <a
                        href={`mailto:${email}`}
                        className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Mail className="size-3.5" />
                        {t.buttonText}
                      </a>
                      <Button type="submit" size="lg" disabled={status === "sending"} className="gap-2 rounded-xl">
                        {status === "sending" ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            {t.sending}
                          </>
                        ) : (
                          <>
                            <Send className="size-4" />
                            {t.send}
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {(socialLinks.length > 0 || chat) && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((social) => {
                    const Icon = getIcon(SOCIAL_ICON_KEY[social.platform]);
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.platform}
                        title={social.platform}
                        className="flex size-10 items-center justify-center rounded-xl border bg-background/70 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:text-foreground"
                      >
                        {Icon ? <Icon className="size-4" /> : social.platform.slice(0, 2)}
                      </a>
                    );
                  })}
                </div>
                {chat && (
                  <button
                    type="button"
                    onClick={() => chat.openChat()}
                    className="group flex items-center gap-2.5 rounded-xl border border-dashed bg-background/50 py-2 pl-2 pr-4 text-left transition-colors hover:border-foreground/30 hover:bg-background/80"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Sparkles className="size-3.5 transition-transform group-hover:rotate-12" />
                    </span>
                    <span className="text-sm">
                      <span className="text-muted-foreground">{t.askAi}</span>{" "}
                      <span className="font-medium">{t.askAiButton} →</span>
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
