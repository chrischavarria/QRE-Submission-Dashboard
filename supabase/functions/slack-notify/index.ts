import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const webhookByDepartment: Record<string, string | undefined> = {
  "Front": Deno.env.get("SLACK_WEBHOOK_FRONT"),
  "Lab": Deno.env.get("SLACK_WEBHOOK_LAB"),
  "Contract Fulfillment": Deno.env.get("SLACK_WEBHOOK_CONTRACT_FULFILLMENT"),
  "Front Fulfillment": Deno.env.get("SLACK_WEBHOOK_FRONT_FULFILLMENT"),
  "RPh": Deno.env.get("SLACK_WEBHOOK_RPH"),
  "Other": Deno.env.get("SLACK_WEBHOOK_OTHER")
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json({ ok: false, reason: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  const { type, record } = await req.json();
  const department = record.review_department || record.department || "Other";
  const webhookUrl = webhookByDepartment[department] || webhookByDepartment.Other;

  if (!webhookUrl) {
    return Response.json(
      { ok: false, reason: `No Slack webhook configured for ${department}. Set SLACK_WEBHOOK_OTHER or a department-specific secret.` },
      { status: 200, headers: corsHeaders }
    );
  }

  const statusText = type === "approved" ? "approved and tracked" : "submitted";
  const text = [
    `QRE variance ${statusText}`,
    `Department: ${department}`,
    `Reported by: ${record.reported_by || "N/A"}`,
    `Event date: ${record.event_date || "N/A"}`,
    `Category: ${record.qre_category || "Pending review"}`,
    `Issue: ${record.complaint || "No issue text"}`
  ].join("\n");

  const slackResponse = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text })
  });

  if (!slackResponse.ok) {
    const errorText = await slackResponse.text();
    return Response.json(
      { ok: false, reason: `Slack returned ${slackResponse.status}: ${errorText}` },
      { status: 200, headers: corsHeaders }
    );
  }

  return Response.json({ ok: true }, { headers: corsHeaders });
});
