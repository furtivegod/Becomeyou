import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendMagicLink } from "@/lib/email";
import { generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check required environment variables
    const requiredEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      JWT_SECRET: process.env.JWT_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error("Missing environment variables:", missingVars);
      return NextResponse.json(
        {
          error: "Server configuration error",
          missing: missingVars,
        },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get("x-samcart-signature");

    console.log("=== SAMCART WEBHOOK DEBUG ===");
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    console.log("Body:", body);
    console.log("Signature:", signature);
    console.log("================================");

    // Parse the SamCart webhook data
    const samcartData = JSON.parse(body);

    console.log(
      "Received SamCart webhook data:",
      JSON.stringify(samcartData, null, 2)
    );

    // Check for event type (for lead add events)
    const eventType =
      samcartData.event ||
      samcartData.type ||
      samcartData.action ||
      samcartData.event_type;
    const isLeadAdd =
      eventType === "LeadAdded" ||
      eventType === "lead.added" ||
      eventType === "lead_add" ||
      eventType === "lead_added" ||
      samcartData.lead ||
      samcartData.lead_id;

    // Extract data from SamCart webhook payload
    // For order complete events: data is nested under customer/order/products
    // For lead add events: data is at the top level
    const customerEmail = isLeadAdd
      ? samcartData.email
      : samcartData.customer?.email;
    const orderId = samcartData.order?.id;
    const status = samcartData.products?.[0]?.status || "completed"; // Get status from products array
    const customerFirstName = isLeadAdd
      ? samcartData.first_name
      : samcartData.customer?.first_name;
    const customerLastName = isLeadAdd
      ? samcartData.last_name
      : samcartData.customer?.last_name;
    const customerName =
      customerFirstName && customerLastName
        ? `${customerFirstName} ${customerLastName}`
        : customerFirstName || null;

    console.log("Extracted data:", {
      customerEmail,
      orderId,
      status,
      customerFirstName,
      customerName,
      eventType,
      isLeadAdd,
    });

    // Process both order complete (Charged) and lead add events
    const isOrderComplete = status === "Charged";

    if (!isOrderComplete && !isLeadAdd) {
      console.log(
        "Event not recognized (not Charged order or lead add), skipping. Status:",
        status,
        "EventType:",
        eventType
      );
      return NextResponse.json({
        message: "Event not recognized, skipping",
        status,
        eventType,
      });
    }

    // Email is required for both order and lead events
    if (!customerEmail) {
      console.error("Missing required data: customer email");
      return NextResponse.json(
        { error: "Missing customer email" },
        { status: 400 }
      );
    }

    // Order ID is only required for order complete events
    if (isOrderComplete && !orderId) {
      console.error("Missing required data: order ID for order complete event");
      return NextResponse.json(
        { error: "Missing order ID for order complete event" },
        { status: 400 }
      );
    }

    // Test database connection
    try {
      const { data: testConnection } = await supabaseAdmin
        .from("users")
        .select("count")
        .limit(1);
      console.log("Database connection successful");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Database connection failed", details: dbError },
        { status: 500 }
      );
    }

    // Create or get user
    let { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, created_at, user_name")
      .eq("email", customerEmail)
      .single();

    if (userError && userError.code === "PGRST116") {
      // User doesn't exist, create them with name from SamCart
      console.log(
        "Creating new user:",
        customerEmail,
        "with name:",
        customerName
      );
      const { data: newUser, error: createError } = await supabaseAdmin
        .from("users")
        .insert({
          email: customerEmail,
          user_name: customerName || null,
        })
        .select("id, email, created_at, user_name")
        .single();

      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Failed to create user", details: createError },
          { status: 500 }
        );
      }
      user = newUser;
    } else if (userError) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user", details: userError },
        { status: 500 }
      );
    } else if (user && !user.user_name && customerName) {
      // Update existing user with name if we have it and they don't have a name
      console.log(
        "Updating existing user with name from SamCart:",
        customerName
      );
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          user_name: customerName,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating user name:", updateError);
        // Don't fail the webhook for this
      }
    }

    if (!user) {
      console.error("User not found after creation/fetch");
      return NextResponse.json({ error: "User not found" }, { status: 500 });
    }

    console.log("User processed:", user.id);

    // Create order record only for order complete events
    let orderRow:
      | { id: string; user_id: string; provider_ref: string; status: string }
      | undefined;
    if (isOrderComplete && orderId) {
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: user.id,
          provider_ref: orderId.toString(), // Convert to string
          status: "completed",
        })
        .select("id, user_id, provider_ref, status")
        .single();

      if (orderError) {
        const isUniqueViolation =
          (orderError as unknown as { code?: string }).code === "23505";
        if (isUniqueViolation) {
          // Fetch existing order row by provider_ref
          console.log("Order already exists, fetching existing:", orderId);
          const { data: existingOrder, error: selectError } =
            await supabaseAdmin
              .from("orders")
              .select("id, user_id, provider_ref, status")
              .eq("provider_ref", orderId.toString())
              .single();
          if (selectError || !existingOrder) {
            console.error("Error selecting existing order:", selectError);
            return NextResponse.json(
              { error: "Failed to get existing order", details: selectError },
              { status: 500 }
            );
          }
          orderRow = existingOrder;
        } else {
          console.error("Error creating order:", orderError);
          return NextResponse.json(
            { error: "Failed to create order", details: orderError },
            { status: 500 }
          );
        }
      } else {
        orderRow = order as unknown as typeof orderRow;
      }

      console.log("Order processed:", orderRow?.id);
    } else {
      console.log("Skipping order creation for lead add event");
    }

    // Create assessment session
    console.log("Creating session for user:", user.id);

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .insert({ user_id: user.id, status: "active" })
      .select("*")
      .single();

    if (sessionError) {
      console.error("Session creation failed:", sessionError);
      return NextResponse.json(
        {
          error: "Failed to create session",
          details: sessionError,
          table: "sessions",
          userId: user.id,
        },
        { status: 500 }
      );
    }

    const sessionId = session?.id;
    if (!sessionId) {
      console.error("Session created but no ID returned:", session);
      return NextResponse.json(
        { error: "Failed to create session - no ID" },
        { status: 500 }
      );
    }

    console.log("Session created:", sessionId);

    // Generate magic link
    const token = generateToken(sessionId, customerEmail);
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/assessment/${sessionId}?token=${token}`;

    // Send magic link email
    let emailed = false;
    let emailError: any = null;

    try {
      console.log(
        "Sending magic link email to:",
        customerEmail,
        "with firstName:",
        customerFirstName
      );
      await sendMagicLink(customerEmail, sessionId, customerFirstName);
      emailed = true;
      console.log("Magic link email sent successfully");
    } catch (emailErr) {
      emailError = emailErr;
      console.error("Failed to send magic link email:", emailErr);
      // Don't fail the webhook if email fails
    }

    return NextResponse.json({
      verified: true,
      event_type: isOrderComplete ? "order_complete" : "lead_add",
      emailed,
      email_to: customerEmail,
      user,
      order: orderRow,
      session_id: sessionId,
      magic_link: magicLink,
      email_error: emailError ? emailError.message : null,
      debug_info: {
        received_headers: Object.fromEntries(request.headers.entries()),
        received_body: samcartData,
        eventType,
        isLeadAdd,
        isOrderComplete,
      },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
