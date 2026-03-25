import { NextRequest, NextResponse } from "next/server";

// Service URLs - In production, these would be environment variables
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || "http://127.0.0.1:8001";
const AI_SERVICE = process.env.AI_SERVICE_URL || "http://127.0.0.1:8002";
const DATA_SERVICE = process.env.DATA_SERVICE_URL || "http://127.0.0.1:8003";
const PDF_SERVICE = process.env.PDF_SERVICE_URL || "http://127.0.0.1:8005";

export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 🔐 1. SECURE AUTH VALIDATION (Via Auth Service)
    // ---------------------------------------------------------
    let role = "guest";
    let user_email: string | null = null;

    const authHeader = req.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const verifyRes = await fetch(`${AUTH_SERVICE}/verify`, {
          method: "GET",
          headers: { "Authorization": authHeader },
        });

        if (verifyRes.ok) {
          const authData = await verifyRes.json();
          role = authData.role;
          user_email = authData.email;
          console.log(`✅ Auth Verified: ${user_email} (${role})`);
        } else {
          console.warn("⚠️ Auth Service rejected token. Falling back to guest.");
        }
      } catch (err) {
        console.error("❌ Auth Service is DOWN:", err);
        // We still allow 'guest' access even if Auth service is flaky
      }
    }

    // ---------------------------------------------------------
    // 📥 2. DATA ORCHESTRATION
    // ---------------------------------------------------------
    const body = await req.json();

    // 1. AI SERVICE (Itinerary is for everyone)
    const aiRes = await fetch(`${AI_SERVICE}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        user_email,
        user_type: role, // Securely injected role
      }),
    });

    if (!aiRes.ok) throw new Error("AI service failed");
    const aiData = await aiRes.json();

    // 🟢 GUEST FLOW: Stop here and return JSON
    if (role === "guest") {
      return NextResponse.json(aiData);
    }

    // 2. DATA SERVICE (Flights, Hotels, Trains - Free & Premium only)
    const [hotelsRes, flightsRes, trainsRes] = await Promise.all([
      fetch(`${DATA_SERVICE}/hotels?location=${body.destination}`),
      fetch(`${DATA_SERVICE}/flights?origin=${body.origin}&destination=${body.destination}`),
      fetch(`${DATA_SERVICE}/trains?origin=${body.origin}&destination=${body.destination}`),
    ]);

    const hotels = hotelsRes.ok ? await hotelsRes.json() : [];
    const flights = flightsRes.ok ? await flightsRes.json() : [];
    const trains = trainsRes.ok ? await trainsRes.json() : [];

    const fullPlan = { ...aiData, hotels, flights, trains };

    // 🔵 FREE USER FLOW: Return full JSON
    if (role === "free") {
      return NextResponse.json(fullPlan);
    }

    // 🟣 PREMIUM FLOW: Convert to PDF
    if (role === "premium") {
      const pdfRes = await fetch(`${PDF_SERVICE}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPlan),
      });

      if (!pdfRes.ok) {
        console.error("❌ PDF Service failed. Sending JSON instead.");
        return NextResponse.json(fullPlan); // Fallback to JSON if PDF fails
      }

      const buffer = await pdfRes.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=travel_plan.pdf",
        },
      });
    }

    return NextResponse.json(aiData); // Final safety fallback

  } catch (error) {
    console.error("❌ BFF ORCHESTRATION ERROR:", error);
    return NextResponse.json({ error: "System error" }, { status: 500 });
  }
}