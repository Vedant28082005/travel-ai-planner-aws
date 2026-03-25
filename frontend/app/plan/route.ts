import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 🔥 Normalize user type (CRITICAL)
    const userType = String(body.user_type || "")
      .toLowerCase()
      .trim();

    console.log("📥 RAW user_type:", body.user_type);
    console.log("📥 NORMALIZED userType:", userType);

    // 🔹 1. AI SERVICE
    const AI_SERVICE = process.env.AI_SERVICE_URL || "http://127.0.0.1:8002";
    const aiRes = await fetch(`${AI_SERVICE}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        user_type: userType,
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error("❌ AI ERROR:", err);

      return NextResponse.json(
        { error: "AI service failed" },
        { status: 500 }
      );
    }

    const aiData = await aiRes.json();
    console.log("✅ AI response received");

    // 🟢 GUEST FLOW
    if (userType === "guest") {
      console.log("🟢 Guest flow");
      return NextResponse.json(aiData);
    }

    // 🔹 2. DATA SERVICE
    console.log("📡 Fetching data service...");

    const DATA_SERVICE = process.env.DATA_SERVICE_URL || "http://127.0.0.1:8003";
    const [hotelsRes, flightsRes, trainsRes] = await Promise.all([
      fetch(`${DATA_SERVICE}/hotels?location=${body.destination}`),
      fetch(`${DATA_SERVICE}/flights?origin=${body.origin}&destination=${body.destination}`),
      fetch(`${DATA_SERVICE}/trains?origin=${body.origin}&destination=${body.destination}`),
    ]);

    const hotels = hotelsRes.ok ? await hotelsRes.json() : [];
    const flights = flightsRes.ok ? await flightsRes.json() : [];
    const trains = trainsRes.ok ? await trainsRes.json() : [];

    console.log("✅ Data service responses ready");

    // 🔵 FREE FLOW
    if (userType === "free") {
      console.log("🔵 Free user flow");

      return NextResponse.json({
        ...aiData,
        hotels,
        flights,
        trains,
      });
    }

    // 🟣 PREMIUM FLOW → PDF
    if (userType === "premium") {
      console.log("🔥 PREMIUM FLOW STARTED");

      const payload = {
        ...aiData,
        hotels,
        flights,
        trains,
      };

      console.log("📦 Sending data to PDF service:", payload);

      const PDF_SERVICE = process.env.PDF_SERVICE_URL || "http://127.0.0.1:8005";
      const pdfRes = await fetch(`${PDF_SERVICE}/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("📄 PDF response status:", pdfRes.status);

      if (!pdfRes.ok) {
        const err = await pdfRes.text();
        console.error("❌ PDF SERVICE ERROR:", err);

        return NextResponse.json(
          { error: "PDF generation failed" },
          { status: 500 }
        );
      }

      const contentType = pdfRes.headers.get("content-type");

      console.log("📄 PDF content-type:", contentType);

      // 🔥 Ensure valid PDF
      if (!contentType || !contentType.includes("application/pdf")) {
        const text = await pdfRes.text();
        console.error("❌ INVALID PDF RESPONSE:", text);

        return NextResponse.json(
          { error: "Invalid PDF response" },
          { status: 500 }
        );
      }

      const buffer = await pdfRes.arrayBuffer();

      console.log("✅ PDF generated successfully");

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=travel_plan.pdf",
        },
      });
    }

    // ⚠️ FALLBACK
    console.warn("⚠️ Unknown user type:", userType);

    return NextResponse.json(aiData);

  } catch (error) {
    console.error("❌ MAIN ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}