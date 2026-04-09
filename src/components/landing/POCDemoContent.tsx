"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Status = "complete" | "partial" | "needs-work";

function StatusBadge({ status }: { status: Status }) {
  const config = {
    complete: { label: "Complete", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", color: "#10b981" },
    partial: { label: "Partially Wired", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", color: "#f59e0b" },
    "needs-work": { label: "Needs Integration", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", color: "#f87171" },
  }[status];
  return (
    <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.6875rem", fontWeight: 600, background: config.bg, border: `1px solid ${config.border}`, color: config.color, letterSpacing: "0.02em", textTransform: "uppercase" }}>
      {config.label}
    </span>
  );
}

function SectionHeader({ number, title, route, status }: { number: number; title: string; route: string; status: Status }) {
  return (
    <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "6px" }}>
          <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9375rem", fontWeight: 700, flexShrink: 0 }}>{number}</span>
          <h2 style={{ fontSize: "1.625rem", fontWeight: 600, color: "#fff", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", margin: 0 }}>{title}</h2>
        </div>
        <span style={{ fontSize: "0.75rem", color: "#4b5563", fontFamily: "'JetBrains Mono', monospace", marginLeft: "50px" }}>{route}</span>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

function Annotation({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "24px", padding: "18px 22px", background: "linear-gradient(135deg, rgba(59,130,246,0.04), rgba(139,92,246,0.04))", border: "1px solid rgba(59,130,246,0.12)", borderRadius: "12px", fontSize: "0.875rem", lineHeight: 1.7, color: "#94a3b8" }}>
      {children}
    </div>
  );
}

function MockScreen({ children, noPadding }: { children: React.ReactNode; noPadding?: boolean }) {
  return (
    <div style={{ background: "#0d1117", border: "1px solid #1e2633", borderRadius: "14px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03) inset" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "11px 16px", borderBottom: "1px solid #1e2633", background: "#080c14" }}>
        <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#28c840" }} />
        <div style={{ flex: 1, background: "#131a27", borderRadius: "7px", padding: "5px 16px", fontSize: "0.6875rem", color: "#4b5563", textAlign: "center", marginLeft: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          joinweve.com
        </div>
      </div>
      <div style={{ padding: noPadding ? 0 : "28px", minHeight: noPadding ? undefined : "300px" }}>{children}</div>
    </div>
  );
}

function AuthMock({ glowColor, children }: { glowColor: string; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", minHeight: "460px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "45%", left: "50%", width: "600px", height: "600px", transform: "translate(-50%, -50%)", background: `radial-gradient(circle, ${glowColor} 0%, transparent 60%)`, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%" }}>{children}</div>
      <div style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", width: "120px", height: "1px", background: "linear-gradient(90deg, transparent, #374151, transparent)" }} />
    </div>
  );
}

function AuthCard({ wide, children }: { wide?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: wide ? "520px" : "420px", width: "100%", margin: "0 auto", background: "rgba(17,24,39,0.8)", border: "1px solid #1f2937", borderRadius: "16px", padding: "40px 32px", backdropFilter: "blur(16px)" }}>
      {children}
    </div>
  );
}

function AuthInput({ label, value, type, optional }: { label: string; value: string; type?: string; optional?: boolean }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", marginBottom: "6px", fontSize: "0.6875rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
        {label}
        {optional && <span style={{ color: "#4b5563", textTransform: "none", letterSpacing: "normal", fontWeight: 400 }}> (Optional)</span>}
      </label>
      <div style={{ background: "#0f172a", border: "1px solid #1e2633", borderRadius: "8px", padding: "11px 14px", color: type === "password" ? "#4b5563" : "#e5e7eb", fontSize: "0.875rem", letterSpacing: type === "password" ? "0.15em" : "normal" }}>{value}</div>
    </div>
  );
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const gradients = ["linear-gradient(135deg, #3b82f6, #8b5cf6)", "linear-gradient(135deg, #f59e0b, #ef4444)", "linear-gradient(135deg, #10b981, #3b82f6)", "linear-gradient(135deg, #ec4899, #8b5cf6)", "linear-gradient(135deg, #06b6d4, #10b981)"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: gradients[Math.abs(hash) % gradients.length], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: 600, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
      {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
    </div>
  );
}

function Tag({ label, color = "#3b82f6" }: { label: string; color?: string }) {
  return <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "0.6875rem", fontWeight: 500, background: `${color}15`, color, border: `1px solid ${color}25` }}>{label}</span>;
}

function WeveLogo({ boltWidth = 320, fontSize = "4.5rem", marginRight = -200 }: { boltWidth?: number; fontSize?: string; marginRight?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0px" }}>
      <Image src="/logo.png" alt="" width={boltWidth} height={80} className="object-contain" style={{ clipPath: "inset(0 67% 0 0)", filter: "invert(1) hue-rotate(180deg) saturate(3) brightness(0.45)", marginRight }} />
      <span style={{ fontSize, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>Weve</span>
    </div>
  );
}

const navItems = [
  { id: "splash", label: "Splash", num: 1 },
  { id: "signup", label: "Signup", num: 2 },
  { id: "login", label: "Login", num: 3 },
  { id: "verify", label: "Verify", num: 4 },
  { id: "welcome", label: "Welcome", num: 5 },
  { id: "dashboard", label: "Dashboard", num: 6 },
  { id: "pf-engine", label: "PF Engine", num: 7 },
  { id: "marketplace", label: "Marketplace", num: 8 },
  { id: "messages", label: "Messages", num: 9 },
  { id: "profile", label: "Profile", num: 10 },
];

function StickyNav({ activeSection }: { activeSection: string }) {
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1e2633", padding: "0 24px", display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: "2px", overflowX: "auto", scrollbarWidth: "none", maxWidth: "1000px", width: "100%", justifyContent: "center" }}>
        {navItems.map(({ id, label, num }) => {
          const isActive = activeSection === id;
          return (
            <a key={id} href={`#${id}`} style={{ padding: "12px 12px", fontSize: "0.7rem", fontWeight: isActive ? 600 : 400, color: isActive ? "#fff" : "#6b7280", textDecoration: "none", borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent", transition: "all 0.2s", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "16px", height: "16px", borderRadius: "4px", background: isActive ? "#3b82f6" : "#1f2937", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.5625rem", fontWeight: 700, color: isActive ? "#fff" : "#6b7280", transition: "all 0.2s" }}>{num}</span>
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export function POCDemoContent() {
  const [activeSection, setActiveSection] = useState("splash");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { threshold: 0.3, rootMargin: "-80px 0px -40% 0px" }
    );
    navItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: "#000", color: "#e5e7eb", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", scrollBehavior: "smooth" }}>
      {/* Hero */}
      <div style={{ padding: "100px 24px 72px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "30%", left: "30%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%)", pointerEvents: "none", transform: "translate(-50%, -50%)" }} />
        <div style={{ position: "absolute", top: "60%", right: "20%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)", pointerEvents: "none", transform: "translate(50%, -50%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
            <WeveLogo boltWidth={180} fontSize="2.5rem" marginRight={-110} />
          </div>
          <h1 style={{ fontSize: "3rem", fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em", marginBottom: "16px", lineHeight: 1.1 }}>POC Walkthrough</h1>
          <p style={{ fontSize: "1.125rem", color: "#6b7280", maxWidth: "560px", margin: "0 auto 32px", lineHeight: 1.6 }}>
            Complete user journey for the Plausible Fiction proof of concept. 10 screens, from registration to marketplace collaboration.
          </p>
          <div style={{ display: "inline-flex", gap: "1px", background: "#1e2633", borderRadius: "12px", overflow: "hidden", marginBottom: "32px" }}>
            {[{ label: "Screens", value: "10" }, { label: "Status", value: "POC" }, { label: "Auth", value: "Supabase" }, { label: "AI", value: "Claude" }].map(({ label, value }) => (
              <div key={label} style={{ padding: "14px 24px", background: "#0d1117", textAlign: "center" }}>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff" }}>{value}</div>
                <div style={{ fontSize: "0.6875rem", color: "#4b5563", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            {["React + Vite", "TypeScript", "Tailwind CSS", "Supabase", "Framer Motion", "Anthropic Claude"].map((tech) => (
              <span key={tech} style={{ padding: "5px 14px", borderRadius: "20px", background: "#111827", border: "1px solid #1e2633", fontSize: "0.75rem", color: "#6b7280" }}>{tech}</span>
            ))}
          </div>
        </div>
      </div>

      <StickyNav activeSection={activeSection} />

      {/* Section 1: Splash */}
      <section id="splash" style={{ padding: "72px 24px", maxWidth: "1000px", margin: "0 auto", width: "100%", borderBottom: "1px solid #111827" }}>
        <SectionHeader number={1} title="Splash Page" route="/" status="complete" />
        <MockScreen>
          <AuthMock glowColor="rgba(59,130,246,0.15)">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <WeveLogo boltWidth={240} fontSize="3.5rem" marginRight={-150} />
              <p style={{ color: "#6b7280", fontSize: "1.125rem", fontWeight: 300, marginTop: "24px", letterSpacing: "0.05em" }}>Plausible futures, built together</p>
            </div>
          </AuthMock>
        </MockScreen>
        <Annotation>Animated landing with logo reveal and tagline. Auto-redirects after 5 seconds — authenticated users go to <strong style={{ color: "#d1d5db" }}>Dashboard</strong>, new visitors go to <strong style={{ color: "#d1d5db" }}>Signup</strong>. Uses Framer Motion for bolt icon color animation and text fade-in.</Annotation>
      </section>

      {/* Section 2: Signup */}
      <section id="signup" style={{ padding: "72px 24px", maxWidth: "1000px", margin: "0 auto", width: "100%", borderBottom: "1px solid #111827" }}>
        <SectionHeader number={2} title="Create Account" route="/signup" status="complete" />
        <MockScreen>
          <AuthMock glowColor="rgba(16,185,129,0.1)">
            <AuthCard wide>
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <h3 style={{ fontSize: "1.875rem", fontWeight: 600, color: "#fff", marginBottom: "8px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>Join Weve</h3>
                <p style={{ color: "#6b7280", fontSize: "0.9375rem" }}>Create your account to get started</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <AuthInput label="First Name" value="Alexis" />
                <AuthInput label="Last Name" value="Spivak" />
              </div>
              <AuthInput label="Email" value="alexis@example.com" />
              <AuthInput label="Password" value="••••••••••••" type="password" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px", marginTop: "-8px" }}>
                {["8+ chars", "Uppercase", "Lowercase", "Number"].map((req) => (
                  <span key={req} style={{ fontSize: "0.625rem", padding: "2px 8px", borderRadius: "4px", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>✓ {req}</span>
                ))}
              </div>
              <AuthInput label="Zip Code" value="90210" />
              <AuthInput label="Phone" value="1234567890" optional />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: "0.625rem", fontWeight: 700 }}>✓</span></div>
                <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>I agree to the <span style={{ color: "#10b981", textDecoration: "underline", textUnderlineOffset: "2px" }}>Terms &amp; Conditions</span></span>
              </div>
              <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", padding: "13px", borderRadius: "10px", textAlign: "center", color: "#fff", fontWeight: 600, fontSize: "0.9375rem", boxShadow: "0 4px 12px rgba(16,185,129,0.25)" }}>Sign Up</div>
              <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.875rem", color: "#6b7280" }}>Already have an account? <span style={{ color: "#10b981", fontWeight: 500 }}>Log In</span></p>
              <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.6875rem", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em" }}>Powered by PlausibleFiction</p>
            </AuthCard>
          </AuthMock>
        </MockScreen>
        <Annotation>Supabase Auth with email/password. Collects first name, last name, email, password (with inline strength requirements), zip code, and optional phone. Terms agreement opens a modal. Green accent throughout.</Annotation>
      </section>

      {/* Section 3: Login */}
      <section id="login" style={{ padding: "72px 24px", maxWidth: "1000px", margin: "0 auto", width: "100%", borderBottom: "1px solid #111827" }}>
        <SectionHeader number={3} title="Login" route="/login" status="complete" />
        <MockScreen>
          <AuthMock glowColor="rgba(59,130,246,0.12)">
            <AuthCard>
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "1.875rem", fontWeight: 600, color: "#fff", marginBottom: "8px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>Welcome Back</h3>
                <p style={{ color: "#6b7280", fontSize: "0.9375rem" }}>Log in to continue to PlausibleFiction</p>
              </div>
              <AuthInput label="Email" value="alexis@example.com" />
              <AuthInput label="Password" value="••••••••••••" type="password" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: "0.625rem", fontWeight: 700 }}>✓</span></div>
                  <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>Keep me logged in</span>
                </div>
                <span style={{ fontSize: "0.875rem", color: "#3b82f6", fontWeight: 500 }}>Forgot password?</span>
              </div>
              <div style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", padding: "13px", borderRadius: "10px", textAlign: "center", color: "#fff", fontWeight: 600, fontSize: "0.9375rem", boxShadow: "0 4px 12px rgba(59,130,246,0.25)" }}>Log In</div>
              <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.875rem", color: "#6b7280" }}>Don&apos;t have an account? <span style={{ color: "#3b82f6", fontWeight: 500 }}>Sign Up</span></p>
            </AuthCard>
          </AuthMock>
        </MockScreen>
        <Annotation>Supabase signInWithPassword. &quot;Keep me logged in&quot; checkbox and &quot;Forgot password?&quot; link. Blue accent. Redirects to Dashboard on success.</Annotation>
      </section>

      {/* Section 4: Verify Email */}
      <section id="verify" style={{ padding: "72px 24px", maxWidth: "1000px", margin: "0 auto", width: "100%", borderBottom: "1px solid #111827" }}>
        <SectionHeader number={4} title="Verify Email" route="/verify-email" status="complete" />
        <MockScreen>
          <AuthMock glowColor="rgba(139,92,246,0.12)">
            <AuthCard>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
                  <svg width="36" height="36" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 600, color: "#fff", marginBottom: "16px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>Check Your Email</h3>
                <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "0.9375rem" }}>You&apos;re almost there!</p>
                <p style={{ color: "#6b7280", marginBottom: "8px", fontSize: "0.875rem" }}>We sent a 6-digit verification code to <strong style={{ color: "#e5e7eb" }}>alexis@example.com</strong>.</p>
                <p style={{ color: "#6b7280", marginBottom: "24px", fontSize: "0.875rem" }}>Enter the code below to activate your account.</p>
                <div style={{ background: "#0f172a", border: "1px solid #1e2633", borderRadius: "8px", padding: "16px", fontSize: "1.5rem", textAlign: "center", letterSpacing: "0.5em", color: "#e5e7eb", marginBottom: "20px" }}>4 2 0 8 6 1</div>
                <div style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", padding: "13px", borderRadius: "10px", textAlign: "center", color: "#fff", fontWeight: 600, fontSize: "0.9375rem", boxShadow: "0 4px 12px rgba(139,92,246,0.25)", marginBottom: "24px" }}>Verify Email</div>
                <div style={{ borderTop: "1px solid #1f2937", paddingTop: "24px" }}>
                  <p style={{ fontSize: "0.8125rem", color: "#4b5563", marginBottom: "16px" }}>Didn&apos;t receive it?</p>
                  <div style={{ padding: "13px", borderRadius: "8px", textAlign: "center", color: "#8b5cf6", fontWeight: 600, fontSize: "0.9375rem", border: "1px solid rgba(139,92,246,0.3)" }}>Resend Code</div>
                </div>
              </div>
            </AuthCard>
          </AuthMock>
        </MockScreen>
        <Annotation>Supabase verifyOtp with 6-digit code. Purple accent. Includes resend with cooldown.</Annotation>
      </section>

      {/* Section 5: Welcome */}
      <section id="welcome" style={{ padding: "72px 24px", maxWidth: "1000px", margin: "0 auto", width: "100%", borderBottom: "1px solid #111827" }}>
        <SectionHeader number={5} title="Welcome" route="/welcome" status="complete" />
        <MockScreen>
          <AuthMock glowColor="rgba(59,130,246,0.15)">
            <div style={{ textAlign: "center", position: "relative" }}>
              <p style={{ fontSize: "2rem", fontWeight: 400, color: "#9ca3af", marginBottom: "12px", fontFamily: "'Outfit', sans-serif" }}>You are now a member of the</p>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}><WeveLogo boltWidth={200} fontSize="3rem" marginRight={-125} /></div>
              <p style={{ fontSize: "2.5rem", fontWeight: 600, marginBottom: "40px", background: "linear-gradient(135deg, #3b82f6 0%, #ef4444 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Outfit', sans-serif" }}>community!</p>
              <AuthCard><p style={{ fontSize: "0.8125rem", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Welcome</p><h3 style={{ fontSize: "2rem", fontWeight: 600, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>alexiss210</h3></AuthCard>
              <p style={{ marginTop: "40px", fontSize: "0.875rem", color: "#4b5563" }}>Redirecting to tutorial...</p>
            </div>
          </AuthMock>
        </MockScreen>
        <Annotation>First-login-only screen. Sets is_first_login: false in Supabase user metadata. Shows auto-generated username. Auto-navigates to Dashboard after 6 seconds.</Annotation>
      </section>

      {/* Section 6: Dashboard - abbreviated structure */}
      <section id="dashboard" style={{ padding: "72px 24px", maxWidth: "1000px", margin: "0 auto", width: "100%", borderBottom: "1px solid #111827" }}>
        <SectionHeader number={6} title="Dashboard" route="/dashboard" status="complete" />
        <MockScreen noPadding>
          <div style={{ display: "flex", minHeight: "500px" }}>
            <div style={{ width: "220px", borderRight: "1px solid #1e2633", flexShrink: 0, background: "#080c14", display: "flex", flexDirection: "column", padding: "16px 14px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
                <Image src="/logo.png" alt="" width={100} height={40} className="object-contain" style={{ clipPath: "inset(0 67% 0 0)", filter: "invert(1) hue-rotate(180deg) saturate(3) brightness(0.45)", marginRight: "-62px" }} />
                <span style={{ fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif", fontSize: "1.25rem" }}>Weve</span>
              </div>
              {[{ icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Home", active: true }, { icon: "M12 4v16m8-8H4", label: "New PF" }, { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", label: "Marketplace" }, { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Messages" }].map(({ icon, label, active }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", background: active ? "rgba(59,130,246,0.08)" : "transparent", color: active ? "#3b82f6" : "#4b5563", fontSize: "0.875rem", marginBottom: "2px", fontWeight: active ? 500 : 400 }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
                  {label}
                </div>
              ))}
              <div style={{ borderTop: "1px solid #1e2633", margin: "0 14px", padding: "16px 0" }}>
                <div style={{ fontSize: "0.625rem", color: "#374151", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: "12px", fontWeight: 600 }}>My PFs</div>
                {["Community Solar Plan", "Bike Share Network"].map((pf) => <div key={pf} style={{ padding: "7px 12px", fontSize: "0.8125rem", color: "#4b5563", borderRadius: "6px" }}>{pf}</div>)}
              </div>
            </div>
            <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", marginBottom: "22px", fontFamily: "'Outfit', sans-serif" }}>Welcome back, Alexis</h3>
              <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Continue Where You Left Off</span>
                  <span style={{ fontSize: "0.6875rem", color: "#6b7280" }}>2h ago</span>
                </div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: "1.125rem", marginBottom: "8px" }}>Community Solar Plan</div>
                <p style={{ fontSize: "0.8125rem", color: "#9ca3af", lineHeight: 1.4, marginBottom: "12px" }}>&quot;Classic collective action problem! Here&apos;s a plausible path...&quot;</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1, height: "4px", background: "#1f2937", borderRadius: "2px", overflow: "hidden" }}><div style={{ width: "35%", height: "100%", background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", borderRadius: "2px" }} /></div>
                  <span style={{ fontSize: "0.6875rem", color: "#6b7280" }}>35%</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                {[{ icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", label: "Browse Marketplace" }, { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Messages" }].map(({ icon, label }) => (
                  <div key={label} style={{ padding: "16px", background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", color: "#fff", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
                    {label}
                  </div>
                ))}
              </div>
              <div style={{ background: "#111827", borderRadius: "12px", padding: "18px 22px", border: "1px solid #1e2633" }}>
                <div style={{ fontSize: "0.625rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "10px" }}>Recommended for You</div>
                {[{ title: "Climate Tech Startup Roadmap", author: "sarah_k", cat: "Business" }, { title: "Cooperative Housing Model", author: "marcus_j", cat: "Community" }].map(({ title, author, cat }) => (
                  <div key={title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #1e2633" }}>
                    <div><div style={{ color: "#e5e7eb", fontSize: "0.875rem", fontWeight: 500 }}>{title}</div><div style={{ fontSize: "0.6875rem", color: "#374151" }}>by @{author}</div></div>
                    <Tag label={cat} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MockScreen>
        <Annotation>Main hub. &quot;Continue Where You Left Off&quot; with progress bar, Quick Actions, Your Saves, Recent Activity, Recommended for You. Sidebar lists saved PFs and navigation.</Annotation>
      </section>

      {/* Section 7: PF Engine - abbreviated */}
      <section id="pf-engine" style={{ padding: "72px 24px", maxWidth: "1000px", margin: "0 auto", width: "100%", borderBottom: "1px solid #111827" }}>
        <SectionHeader number={7} title="PF Engine" route="/dashboard → New PF" status="complete" />
        <MockScreen noPadding>
          <div style={{ display: "flex", minHeight: "500px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #1e2633" }}>
              <div style={{ padding: "14px 22px", borderBottom: "1px solid #1e2633", fontSize: "0.8125rem", fontWeight: 600, color: "#e5e7eb", display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} /> Conversation</div>
              <div style={{ flex: 1, padding: "22px" }}>
                {[{ role: "ai", text: "Tell me about the future you'd like to build. What's the goal?" }, { role: "user", text: "I want to create a community solar project for my neighborhood. About 50 homes sharing a solar installation." }, { role: "ai", text: "A community solar project for 50 homes — that's ambitious and practical. What's your biggest concern: funding, permits, or getting neighbors on board?" }].map(({ role, text }, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "18px", flexDirection: role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: role === "ai" ? "linear-gradient(135deg, #3b82f6, #8b5cf6)" : "#1e2633", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", color: "#fff", fontWeight: 700, flexShrink: 0 }}>{role === "ai" ? "PF" : "AS"}</div>
                    <div style={{ background: role === "ai" ? "#111827" : "rgba(59,130,246,0.08)", border: `1px solid ${role === "ai" ? "#1e2633" : "rgba(59,130,246,0.15)"}`, borderRadius: role === "ai" ? "4px 12px 12px 12px" : "12px 4px 12px 12px", padding: "11px 15px", fontSize: "0.8125rem", color: "#d1d5db", lineHeight: 1.6, maxWidth: "78%" }}>{text}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "14px 22px", borderTop: "1px solid #1e2633", display: "flex", gap: "10px" }}>
                <div style={{ flex: 1, background: "#111827", border: "1px solid #1e2633", borderRadius: "10px", padding: "11px 14px", fontSize: "0.8125rem", color: "#374151" }}>Type your response...</div>
                <div style={{ background: "linear-gradient(135deg, #3b82f6, #7c3aed)", borderRadius: "10px", padding: "11px 20px", fontSize: "0.8125rem", color: "#fff", fontWeight: 500 }}>Send</div>
              </div>
            </div>
            <div style={{ width: "300px", flexShrink: 0, display: "flex", flexDirection: "column", background: "#080c14" }}>
              <div style={{ padding: "14px 22px", borderBottom: "1px solid #1e2633", fontSize: "0.8125rem", fontWeight: 600, color: "#e5e7eb" }}>Your Story</div>
              <div style={{ flex: 1, padding: "22px" }}>
                <h4 style={{ color: "#e5e7eb", fontSize: "1rem", fontWeight: 600, marginBottom: "10px" }}>Community Solar Plan</h4>
                <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.6, marginBottom: "20px" }}>A community solar installation serving 50 homes. Structured as a cooperative...</p>
                <div style={{ borderTop: "1px solid #1e2633", paddingTop: "14px" }}>
                  <div style={{ fontSize: "0.625rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", fontWeight: 600 }}>Key Tasks Identified</div>
                  {["Form founding member group (5 households)", "Research local permitting requirements", "Get 3 quotes from solar installers", "Draft cooperative agreement"].map((task, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px", fontSize: "0.8125rem", color: "#9ca3af" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "5px", background: "#111827", border: "1px solid #1e2633", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5625rem", color: "#374151", flexShrink: 0, marginTop: "1px" }}>{i + 1}</div>
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </MockScreen>
        <Annotation>The core AI experience. User converses with the PF Engine; it extracts tasks and builds a narrative in &quot;Your Story.&quot; AI powered by Anthropic Claude.</Annotation>
      </section>

      {/* Section 8: Marketplace - abbreviated */}
      <section id="marketplace" style={{ padding: "72px 24px", maxWidth: "1000px", margin: "0 auto", width: "100%", borderBottom: "1px solid #111827" }}>
        <SectionHeader number={8} title="Marketplace" route="/marketplace" status="partial" />
        <MockScreen noPadding>
          <div style={{ padding: "24px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", fontFamily: "'Outfit', sans-serif", margin: 0 }}>Marketplace</h3>
              <div style={{ background: "#111827", border: "1px solid #1e2633", padding: "8px 16px", borderRadius: "10px", fontSize: "0.8125rem", color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}>Search marketplace...</div>
            </div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", marginBottom: "12px" }}>Gaps to Fill <span style={{ padding: "3px 8px", background: "#1f2937", borderRadius: "12px", fontSize: "0.75rem", color: "#9ca3af", fontWeight: 400 }}>8</span></div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>{["All", "Open", "Fork Only", "Trending"].map((tab, i) => <div key={tab} style={{ padding: "8px 18px", borderRadius: "20px", fontSize: "0.8125rem", background: i === 0 ? "linear-gradient(90deg, #3b82f6, #6366f1)" : "transparent", color: i === 0 ? "#fff" : "#6b7280", fontWeight: i === 0 ? 600 : 400, border: i === 0 ? "none" : "1px solid #1e2633" }}>{tab}</div>)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {[{ title: "Climate Tech Startup Roadmap", author: "sarah_k", cat: "Business", saves: 47 }, { title: "Community Solar Project", author: "alex_m", cat: "Sustainability", saves: 32 }, { title: "Universal Basic AI", author: "marcus_j", cat: "Technology", saves: 28 }, { title: "Cooperative Housing Model", author: "elena_r", cat: "Community", saves: 19 }].map(({ title, author, cat, saves }) => (
                <div key={title} style={{ background: "#111827", borderRadius: "12px", overflow: "hidden", border: "1px solid #1e2633" }}>
                  <div style={{ height: "80px", background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" }} />
                  <div style={{ padding: "14px" }}>
                    <div style={{ color: "#e5e7eb", fontWeight: 600, fontSize: "0.9375rem", marginBottom: "4px" }}>{title}</div>
                    <div style={{ fontSize: "0.75rem", color: "#3b82f6", marginBottom: "10px" }}>@{author}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", borderTop: "1px solid #1f2937", paddingTop: "10px", fontSize: "0.75rem", color: "#6b7280" }}>Save · {saves}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MockScreen>
        <Annotation>Browse published Plausible Fictions. Gaps to Fill, feed filter tabs, masonry-style cards. Supabase functions exist but pages still fall back to mock data — needs full wiring.</Annotation>
      </section>

      {/* Section 9: Messages - abbreviated */}
      <section id="messages" style={{ padding: "72px 24px", maxWidth: "1000px", margin: "0 auto", width: "100%", borderBottom: "1px solid #111827" }}>
        <SectionHeader number={9} title="Messages" route="/messages" status="partial" />
        <MockScreen noPadding>
          <div style={{ display: "flex", minHeight: "440px" }}>
            <div style={{ width: "260px", borderRight: "1px solid #1e2633", flexShrink: 0, background: "#080c14" }}>
              <div style={{ padding: "14px 22px", borderBottom: "1px solid #1e2633", fontSize: "0.8125rem", fontWeight: 600, color: "#e5e7eb" }}>Messages</div>
              {[{ name: "Elena Rodriguez", msg: "That sounds great! Let's do it", time: "2m", unread: true }, { name: "Marcus Johnson", msg: "Thanks for the feedback", time: "1h", unread: false }].map(({ name, msg, time, unread }) => (
                <div key={name} style={{ display: "flex", gap: "10px", padding: "14px 18px", borderBottom: "1px solid #1e2633", background: name === "Elena Rodriguez" ? "rgba(59,130,246,0.04)" : "transparent" }}>
                  <Avatar name={name} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}><span style={{ fontSize: "0.8125rem", fontWeight: unread ? 600 : 400, color: unread ? "#fff" : "#9ca3af" }}>{name}</span><span style={{ fontSize: "0.625rem", color: "#374151" }}>{time}</span></div>
                    <div style={{ fontSize: "0.75rem", color: unread ? "#6b7280" : "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "12px 22px", borderBottom: "1px solid #1e2633", display: "flex", alignItems: "center", gap: "10px" }}><Avatar name="Elena Rodriguez" size={30} /><span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#e5e7eb" }}>Elena Rodriguez</span><span style={{ fontSize: "0.625rem", color: "#10b981", marginLeft: "8px" }}>online</span></div>
              <div style={{ flex: 1, padding: "22px" }}>
                {[{ from: "elena", text: "Hey! I saw your Community Solar Plan. Really interesting approach." }, { from: "me", text: "Thanks! The hardest part is the neighbor outreach." }, { from: "elena", text: "That sounds great! Let's do it" }].map(({ from, text }, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: from === "me" ? "flex-end" : "flex-start", marginBottom: "14px" }}>
                    <div style={{ background: from === "me" ? "rgba(59,130,246,0.1)" : "#111827", border: `1px solid ${from === "me" ? "rgba(59,130,246,0.2)" : "#1e2633"}`, borderRadius: from === "me" ? "12px 4px 12px 12px" : "4px 12px 12px 12px", padding: "11px 15px", fontSize: "0.8125rem", color: "#d1d5db", maxWidth: "70%", lineHeight: 1.6 }}>{text}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "14px 22px", borderTop: "1px solid #1e2633", display: "flex", gap: "10px" }}>
                <div style={{ flex: 1, background: "#111827", border: "1px solid #1e2633", borderRadius: "10px", padding: "11px 14px", fontSize: "0.8125rem", color: "#374151" }}>Type a message...</div>
                <div style={{ background: "linear-gradient(135deg, #3b82f6, #7c3aed)", borderRadius: "10px", padding: "11px 20px", fontSize: "0.8125rem", color: "#fff", fontWeight: 500 }}>Send</div>
              </div>
            </div>
          </div>
        </MockScreen>
        <Annotation>Direct messaging. Conversation list with unread indicators. Real-time chat via Supabase. POC: chat only — no negotiations.</Annotation>
      </section>

      {/* Section 10: Profile */}
      <section id="profile" style={{ padding: "72px 24px", maxWidth: "1000px", margin: "0 auto", width: "100%", borderBottom: "1px solid #111827" }}>
        <SectionHeader number={10} title="Member Profile" route="/member/:username" status="partial" />
        <MockScreen>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", marginBottom: "28px" }}>
              <Avatar name="Elena Rodriguez" size={76} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", margin: "0 0 4px 0", fontFamily: "'Outfit', sans-serif" }}>Elena Rodriguez</h3>
                <div style={{ fontSize: "0.8125rem", color: "#374151", marginBottom: "10px" }}>@elena_r · Joined September 2025</div>
                <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>I run a logistics company, about 15 people. My daughter and I paint together on weekends. I&apos;ve been trying to learn my mom&apos;s mole recipe...</p>
              </div>
            </div>
            <div style={{ marginBottom: "28px" }}>
              {[{ label: "Interests", items: ["Art", "Gardening", "Teaching", "Cooking", "Storytelling"], color: "#8b5cf6" }, { label: "Skills & Resources", items: ["Languages", "Education", "Photography"], color: "#10b981" }, { label: "Learning", items: ["Permaculture", "Vibe Coding", "Facilitation"], color: "#f59e0b" }].map(({ label, items, color }) => (
                <div key={label} style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.625rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", fontWeight: 600 }}>{label}</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>{items.map((item) => <Tag key={item} label={item} color={color} />)}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid #1e2633", paddingTop: "22px" }}>
              <div style={{ fontSize: "0.625rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px", fontWeight: 600 }}>Published PFs (7)</div>
              {[{ title: "Climate Resilient Cities 2050", cat: "Sustainability" }, { title: "Cooperative Housing Model", cat: "Community" }, { title: "Downtown Delivery Network", cat: "Business" }].map(({ title, cat }) => (
                <div key={title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1e2633" }}>
                  <span style={{ color: "#e5e7eb", fontSize: "0.875rem" }}>{title}</span>
                  <Tag label={cat} color={cat === "Sustainability" ? "#10b981" : cat === "Community" ? "#f59e0b" : "#3b82f6"} />
                </div>
              ))}
            </div>
          </div>
        </MockScreen>
        <Annotation>Public profiles show bio, interests, skills/resources, learning goals, and published PFs. Fetches via getProfileWithStats(), falls back to mock data.</Annotation>
      </section>

      {/* Handoff Section */}
      <div style={{ padding: "72px 24px 100px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", marginBottom: "12px" }}>Handoff Summary</h2>
          <p style={{ color: "#4b5563", fontSize: "1rem" }}>What&apos;s built, what needs work, and the tech stack</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "36px" }}>
          <div style={{ background: "#0d1117", border: "1px solid #1e2633", borderRadius: "14px", padding: "24px", borderTop: "3px solid #10b981" }}>
            <div style={{ fontSize: "0.6875rem", color: "#10b981", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px", fontWeight: 700 }}>Complete</div>
            <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "0.8125rem", color: "#9ca3af", lineHeight: 2.2 }}>
              <li>Supabase Auth (full flow)</li><li>PF Engine conversation</li><li>Story extraction</li><li>Dashboard layout</li><li>All page UI components</li><li>Responsive design</li><li>Profile system</li><li>Password reset flow</li>
            </ul>
          </div>
          <div style={{ background: "#0d1117", border: "1px solid #1e2633", borderRadius: "14px", padding: "24px", borderTop: "3px solid #f59e0b" }}>
            <div style={{ fontSize: "0.6875rem", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px", fontWeight: 700 }}>Needs Integration</div>
            <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "0.8125rem", color: "#9ca3af", lineHeight: 2.2 }}>
              <li>Marketplace → Supabase</li><li>Messages → Supabase</li><li>PF publish to marketplace</li><li>Save PFs to profile</li><li>Member profile stats</li><li>Apply DB schema (SQL ready)</li><li>LLM proxy deployment</li>
            </ul>
          </div>
          <div style={{ background: "#0d1117", border: "1px solid #1e2633", borderRadius: "14px", padding: "24px", borderTop: "3px solid #374151" }}>
            <div style={{ fontSize: "0.6875rem", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px", fontWeight: 700 }}>Deferred to MVP</div>
            <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "0.8125rem", color: "#4b5563", lineHeight: 2.2 }}>
              <li>Flowchart visualization</li><li>Split view</li><li>Negotiations</li><li>Notifications</li><li>Onboarding flow</li><li>Teams</li><li>Analytics</li><li>Community/Forums</li>
            </ul>
          </div>
        </div>
        <div style={{ background: "#0d1117", border: "1px solid #1e2633", borderRadius: "14px", padding: "24px", marginBottom: "36px" }}>
          <div style={{ fontSize: "0.6875rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px", fontWeight: 700 }}>Tech Stack</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[{ label: "React 19", color: "#3b82f6" }, { label: "Vite", color: "#8b5cf6" }, { label: "TypeScript", color: "#3b82f6" }, { label: "Tailwind CSS", color: "#06b6d4" }, { label: "Framer Motion", color: "#ec4899" }, { label: "Supabase", color: "#10b981" }, { label: "Anthropic Claude", color: "#f59e0b" }, { label: "React Router v6", color: "#ef4444" }, { label: "React Flow", color: "#8b5cf6" }].map(({ label, color }) => (
              <span key={label} style={{ padding: "6px 14px", borderRadius: "8px", background: `${color}10`, border: `1px solid ${color}20`, fontSize: "0.75rem", color, fontWeight: 500 }}>{label}</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "center", color: "#374151", fontSize: "0.8125rem", lineHeight: 1.8 }}>
          <p>POC: 10 screens · Supabase Auth + Postgres · AI conversation engine</p>
          <p style={{ marginTop: "4px" }}>Full app (22 pages) archived in snapshots directory</p>
        </div>
      </div>
    </div>
  );
}
