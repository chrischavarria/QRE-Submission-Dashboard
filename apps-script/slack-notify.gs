const SCRIPT_TOKEN = 'qre-dashboard';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');

    if (payload.token !== SCRIPT_TOKEN) {
      return jsonResponse({ ok: false, reason: 'Invalid token' });
    }

    const webhookUrl = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
    if (!webhookUrl) {
      return jsonResponse({ ok: false, reason: 'Missing SLACK_WEBHOOK_URL script property' });
    }

    const record = payload.record || {};
    const department = record.review_department || record.department || 'Other';
    const statusText = payload.type === 'approved' ? 'approved and tracked' : 'submitted';
    const category = record.qre_category || 'Pending review';
    const qreItems = Array.isArray(record.qre_items) ? record.qre_items.join(', ') : 'Not selected';

    const text = [
      `QRE variance ${statusText}`,
      `Department: ${department}`,
      `Reported by: ${record.reported_by || 'N/A'}`,
      `Event date: ${record.event_date || 'N/A'}`,
      `Category: ${category}`,
      `Metric item(s): ${qreItems}`,
      `Approved by: ${record.pharmacist_name || 'N/A'}`,
      `Issue: ${record.complaint || 'No issue text'}`
    ].join('\n');

    const slackResponse = UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text }),
      muteHttpExceptions: true
    });

    const statusCode = slackResponse.getResponseCode();
    if (statusCode < 200 || statusCode >= 300) {
      return jsonResponse({
        ok: false,
        reason: `Slack returned ${statusCode}: ${slackResponse.getContentText()}`
      });
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, reason: error.message });
  }
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
