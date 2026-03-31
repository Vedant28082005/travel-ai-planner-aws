"use client";

import { useEffect, useState } from "react";
import StatusBadge from './components/StatusBadge';

export default function Home() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(1);
  const [userType, setUserType] = useState("guest");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // 🔥 JWT ROLE INITIALIZATION
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserType(payload.role || "guest");
      } catch {
        setUserType("guest");
      }
    }
  }, []);

  // 🔥 API ORCHESTRATION
  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    if (!origin || !destination) {
      alert("Please enter both origin and destination");
      return;
    }

    setLoading(true);
    setResult(null);
    setPdfUrl(null); // Reset PDF URL on new submission

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/plan", {
        method: "POST",
        headers,
        body: JSON.stringify({ origin, destination, days }),
      });

      // 🟢 1. RENDER THE UI FOR EVERYONE
      const data = await res.json();
      setResult(data);

      // 🟣 2. HANDLE PREMIUM PDF DOWNLOAD
      // Instead of forcing a popup, we just save the secure AWS link to state
      const pdfLink = data.pdf_url || data.url;
      if (pdfLink) {
        setPdfUrl(pdfLink);
      }

    } catch (err) {
      console.error(err);
      setResult({ error: "Service unavailable. Please try again later." });
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  // 🔥 STRUCTURED UI RENDERER
  const renderResult = () => {
    if (!result) return null;
    if (result.error) return <div style={errorCard}>{result.error}</div>;

    return (
      <div style={resultWrapper}>
        <h2 style={sectionHeader}>Trip Overview to {result.destination}</h2>

        {/* 📄 NEW: Premium PDF Download Button */}
        {pdfUrl && (
          <div style={{ marginBottom: "25px" }}>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download>
              <button style={{...primaryBtn, background: "linear-gradient(135deg, #10b981, #059669)"}}>
                📄 Download Premium PDF Itinerary
              </button>
            </a>
          </div>
        )}

        {/* 💰 Budget Stats */}
        <div style={budgetGrid}>
          <div style={statBox}>
            <span style={statLabel}>Total Budget</span>
            <span style={statValue}>₹{result.budget?.total}</span>
          </div>
          <div style={statBox}>
            <span style={statLabel}>Accommodation</span>
            <span style={statValue}>₹{result.budget?.breakdown?.stay}</span>
          </div>
          <div style={statBox}>
            <span style={statLabel}>Food & Misc</span>
            <span style={statValue}>₹{result.budget?.breakdown?.food}</span>
          </div>
        </div>

        {/* 📅 Detailed Itinerary */}
        <h3 style={sectionHeader}>Day-Wise Itinerary</h3>
        {result.itinerary?.map((item: any, i: number) => (
          <div key={i} style={itineraryCard}>
            <div style={dayBadge}>Day {item.day}</div>
            <p style={itineraryText}>{item.plan}</p>
          </div>
        ))}

        {/* 🏨 Logistics (Visible for Free/Premium) */}
        {userType !== "guest" && (
          <>
            {result.hotels && result.hotels.length > 0 && (
              <>
                <h3 style={sectionHeader}>Recommended Stays</h3>
                <div style={horizontalScroll}>
                  {result.hotels.map((h: any, i: number) => (
                    <div key={i} style={miniCard}>
                      <div style={cardTitle}>{h.name}</div>
                      <div style={cardSub}>₹{h.price_per_night}/night • ⭐{h.rating}</div>
                      <div style={cardLoc}>{h.location}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {result.flights && result.flights.length > 0 && (
              <>
                <h3 style={sectionHeader}>Flights & Trains</h3>
                <div style={horizontalScroll}>
                  {result.flights.map((f: any, i: number) => (
                    <div key={i} style={miniCard}>
                      <div style={cardTitle}>{f.airline}</div>
                      <div style={cardSub}>₹{f.price} • {f.duration}</div>
                      <div style={cardLoc}>Dep: {f.departure}</div>
                    </div>
                  ))}
                  {result.trains?.map((t: any, i: number) => (
                    <div key={i} style={miniCard}>
                      <div style={cardTitle}>{t.train_name}</div>
                      <div style={cardSub}>₹{t.price} • {t.duration}</div>
                      <div style={cardLoc}>Dep: {t.departure}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* 💡 Recommendations */}
        <h3 style={sectionHeader}>Pro-Tips</h3>
        <div style={tipsBox}>
          {result.recommendations?.map((tip: string, i: number) => (
            <p key={i} style={tipText}>• {tip}</p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg">
      <div className="overlay">
        <div className="container" style={mainLayout}>

          {/* LEFT COLUMN: Input & Content */}
          <div style={leftColumn}>

            {/* 🆕 HEADER SECTION WITH STATUS BADGE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <p style={tag}>TRAVEL PLANNING</p>
                <h1 style={title}>YatraAI</h1>
              </div>
              <div style={{ marginTop: '20px' }}>
                <StatusBadge />
              </div>
            </div>

            <p style={subtitle}>AI-powered trip orchestration for modern travelers.</p>

            <div style={{ marginBottom: "20px" }}>
              {userType === "guest" ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a href="/login"><button style={btn}>Login</button></a>
                  <a href="/signup"><button style={btn}>Signup</button></a>
                </div>
              ) : (
                <button onClick={handleLogout} style={btn}>
                  Logout ({userType})
                </button>
              )}
            </div>

            <div style={card}>
              <input placeholder="From (Origin)" value={origin} onChange={(e) => setOrigin(e.target.value)} style={input} />
              <input placeholder="To (Destination)" value={destination} onChange={(e) => setDestination(e.target.value)} style={input} />
              <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} style={input} />
              <button onClick={handleSubmit} style={primaryBtn} disabled={loading}>
                {loading ? "Generating Your Experience..." : "Generate Plan"}
              </button>
            </div>

            <div style={roleInfo}>
              {userType === "guest" && "⚠️ Limited access: Login for transport & hotels"}
              {userType === "free" && "✅ Full Data Access Active"}
              {userType === "premium" && "🔥 Premium Features & PDF Active"}
            </div>

            {/* RESULTS RENDERED HERE */}
            {renderResult()}
          </div>

          {/* RIGHT COLUMN: Live Board */}
          <div style={liveBoard}>
            <h3 style={{ marginBottom: "5px" }}>Live board</h3>
            <p style={liveDesc}>Recent community searches.</p>

            <div style={tabs}>
              <button style={activeTab}>ALL</button>
              <button style={tab}>TRIPS</button>
            </div>

            <div style={scrollArea}>
              {[
                { type: "TRANSPORT", route: "Rajkot → Delhi", price: "₹4,200", tag: "Budget", time: "2 min ago" },
                { type: "VACATION", route: "Mumbai → Goa", price: "₹48,200", tag: "Luxury", time: "5 min ago" },
                { type: "TRANSPORT", route: "Bangalore → Kochi", price: "₹1,850", tag: "Economy", time: "8 min ago" },
              ].map((item, i) => (
                <div key={i} style={cardItem}>
                  <div style={topRow}>
                    <span style={item.type === "TRANSPORT" ? transportTag : vacationTag}>{item.type}</span>
                    <span style={price}>{item.price}</span>
                  </div>
                  <div style={route}>{item.route}</div>
                  <div style={bottomRow}>
                    <span style={subTag}>{item.tag}</span>
                    <span style={time}>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* 🎨 STYLES */
const mainLayout = { display: "flex", gap: "40px", padding: "40px", height: "100vh", boxSizing: "border-box" as const };
const leftColumn = { flex: 1, maxWidth: "650px", overflowY: "auto" as const, paddingRight: "20px" };
const tag = { letterSpacing: "2px", fontSize: "12px", color: "#3b82f6" };
const title = { fontSize: "64px", margin: "10px 0", fontWeight: "bold" };
const subtitle = { color: "#e5e7eb", lineHeight: "1.6", marginBottom: "20px" };
const card = { padding: "24px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "20px" };
const input = { width: "100%", marginBottom: "12px", padding: "14px", borderRadius: "10px", border: "1px solid #333", background: "#111", color: "white", outline: "none" };
const primaryBtn = { width: "100%", padding: "14px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" };
const btn = { padding: "10px 15px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" };
const roleInfo = { marginBottom: "20px", color: "#9ca3af", fontSize: "14px" };
const resultWrapper = { marginTop: "30px", paddingBottom: "50px" };
const sectionHeader = { fontSize: "20px", color: "#3b82f6", margin: "25px 0 15px 0", borderLeft: "4px solid #3b82f6", paddingLeft: "12px" };
const budgetGrid = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" };
const statBox = { background: "#1a1a1a", padding: "15px", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid rgba(255,255,255,0.1)" } as const;
const statLabel = { fontSize: "11px", color: "#d1d5db", textTransform: "uppercase", marginBottom: "4px" };
const statValue = { fontSize: "18px", fontWeight: "bold", color: "#10b981" };
const itineraryCard = { background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "15px", marginBottom: "15px", border: "1px solid rgba(255,255,255,0.05)" };
const dayBadge = { background: "#2563eb", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", display: "inline-block", marginBottom: "10px" };
const itineraryText = { fontSize: "14px", lineHeight: "1.7", color: "#d1d5db" };
const horizontalScroll = { display: "flex", gap: "15px", overflowX: "auto" as const, paddingBottom: "10px" };
const miniCard = { minWidth: "210px", background: "rgba(255,255,255,0.07)", padding: "18px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)" };
const cardTitle = { fontWeight: "bold", fontSize: "15px", marginBottom: "6px", color: "#ffffff" };
const cardSub = { fontSize: "13px", color: "#6ee7b7", fontWeight: "600" };
const cardLoc = { fontSize: "12px", color: "#9ca3af", marginTop: "6px" };
const tipsBox = { background: "rgba(59, 130, 246, 0.05)", padding: "20px", borderRadius: "12px", border: "1px dashed #3b82f6" };
const tipText = { fontSize: "13px", color: "#e5e7eb", marginBottom: "8px" };
const errorCard = { background: "rgba(239, 68, 68, 0.1)", padding: "20px", borderRadius: "12px", color: "#ef4444", border: "1px solid #ef4444" };
const liveBoard = { width: "320px", background: "rgba(255,255,255,0.05)", padding: "24px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", height: "fit-content", color: "#ffffff" };
const liveDesc = { fontSize: "13px", color: "#d1d5db", marginBottom: "15px" };
const tabs = { display: "flex", gap: "10px", marginBottom: "20px" };
const tab = { padding: "6px 14px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "none", fontSize: "12px" };
const activeTab = { ...tab, background: "#2563eb", color: "white" };
const scrollArea = { maxHeight: "450px", overflowY: "auto" as const };
const cardItem = { padding: "16px", borderRadius: "14px", background: "#0a0a0a", marginBottom: "12px", border: "1px solid #1a1a1a" };
const topRow = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const price = { color: "#10b981", fontWeight: "bold", fontSize: "16px" };
const route = { fontWeight: "bold", marginTop: "8px", fontSize: "15px", color: "#ffffff" };
const bottomRow = { display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "12px", color: "#d1d5db" };
const transportTag = { background: "#f59e0b", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", color: "black", fontWeight: "bold" };
const vacationTag = { background: "#3b82f6", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", color: "white", fontWeight: "bold" };
const subTag = { color: "#6ee7b7", fontSize: "11px", fontWeight: "600" };
const time = { opacity: 0.5 };
