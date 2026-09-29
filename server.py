import http.server
import socketserver
import json
import os
import smtplib
import random
import mimetypes
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

mimetypes.init()
mimetypes.add_type("image/webp", ".webp")

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Configuration for SMTP (Optional: fill in to send real emails via Gmail/Outlook/SendGrid)
# For Gmail: Use an "App Password" (https://myaccount.google.com/apppasswords)
SMTP_CONFIG_FILE = os.path.join(DIRECTORY, "email_config.json")

def load_smtp_config():
    default_config = {
        "enabled": False,
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 587,
        "use_tls": True,
        "sender_email": "allocations@bmw-m-motorsport.com",
        "sender_name": "BMW M Bavaria Performance",
        "smtp_username": "",
        "smtp_password": ""
    }
    if not os.path.exists(SMTP_CONFIG_FILE):
        with open(SMTP_CONFIG_FILE, "w") as f:
            json.dump(default_config, f, indent=2)
        return default_config
    try:
        with open(SMTP_CONFIG_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading SMTP config: {e}")
        return default_config

def generate_booking_email_html(customer_name, customer_email, model_name, booking_date, phone, booking_id):
    model_display = {
        "m3": "BMW M3 Competition Sedan (503 HP • S58 TwinPower Turbo)",
        "m4": "BMW M4 CSL Coupe (543 HP • Track Spec)",
        "m2": "BMW M2 Coupe (453 HP • 6-Speed Manual / M Steptronic)",
        "x5m": "BMW X5 M Competition (617 HP • V8 Twin-Turbo SAV)",
        "i4": "BMW i4 M50 Gran Coupe (536 HP • 100% Electric Dual Motor)",
        "ix": "BMW iX M60 Electric (610 HP • Dual E-Motor All-Wheel Drive)"
    }.get(model_name.lower(), model_name.upper())

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Your BMW M Test Drive Confirmation</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #0A0A0A;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #FFFFFF;
    }}
    .email-container {{
      max-width: 600px;
      margin: 20px auto;
      background-color: #121214;
      border: 1px solid #27272a;
      border-radius: 12px;
      overflow: hidden;
    }}
    .m-stripes {{
      display: flex;
      height: 6px;
      width: 100%;
    }}
    .stripe-1 {{ flex: 1; background-color: #81C4FF; }}
    .stripe-2 {{ flex: 1; background-color: #0066B1; }}
    .stripe-3 {{ flex: 1; background-color: #E4002B; }}
    .email-header {{
      padding: 32px 30px 20px 30px;
      text-align: center;
      background: radial-gradient(circle at 50% 0%, #1e293b 0%, #121214 70%);
      border-bottom: 1px solid #27272a;
    }}
    .logo-badge {{
      display: inline-block;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.2em;
      color: #38bdf8;
      margin-bottom: 10px;
      text-transform: uppercase;
    }}
    h1 {{
      margin: 0 0 8px 0;
      font-size: 26px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .booking-id {{
      display: inline-block;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 14px;
      border-radius: 20px;
      font-family: monospace;
      font-size: 14px;
      color: #81C4FF;
      margin-top: 10px;
    }}
    .email-body {{
      padding: 30px;
    }}
    .greeting {{
      font-size: 17px;
      line-height: 1.5;
      color: #e4e4e7;
      margin-bottom: 24px;
    }}
    .details-card {{
      background-color: #18181b;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }}
    .detail-row {{
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      font-size: 14px;
    }}
    .detail-row:last-child {{
      border-bottom: none;
    }}
    .detail-label {{
      color: #a1a1aa;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.05em;
    }}
    .detail-val {{
      font-weight: 700;
      color: #FFFFFF;
      text-align: right;
    }}
    .highlight-val {{
      color: #38bdf8;
    }}
    .perks-section {{
      background: rgba(28, 105, 212, 0.08);
      border-left: 3px solid #1C69D4;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 24px;
    }}
    .perks-title {{
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #81C4FF;
      margin-bottom: 8px;
      text-transform: uppercase;
    }}
    .perk-item {{
      font-size: 13px;
      color: #d4d4d8;
      line-height: 1.5;
      margin: 4px 0;
    }}
    .instructions {{
      font-size: 13px;
      color: #a1a1aa;
      line-height: 1.6;
      border-top: 1px solid #27272a;
      padding-top: 20px;
    }}
    .email-footer {{
      padding: 24px 30px;
      background-color: #0d0d0f;
      text-align: center;
      border-top: 1px solid #27272a;
      font-size: 12px;
      color: #71717a;
      line-height: 1.5;
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="m-stripes">
      <div class="stripe-1"></div>
      <div class="stripe-2"></div>
      <div class="stripe-3"></div>
    </div>
    
    <div class="email-header">
      <div class="logo-badge">///M MOTORSPORT EXPERIENCE</div>
      <h1>TEST DRIVE CONFIRMED</h1>
      <div class="booking-id">PASS REF: {booking_id}</div>
    </div>

    <div class="email-body">
      <p class="greeting">
        Dear <strong>{customer_name}</strong>,<br><br>
        Your reservation for the ultimate driving experience has been locked into the Bavaria Motorsport allocation system. Get ready to experience track-tuned dynamics firsthand.
      </p>

      <div class="details-card">
        <div class="detail-row">
          <span class="detail-label">Vehicle</span>
          <span class="detail-val highlight-val">{model_display}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Preferred Date</span>
          <span class="detail-val">{booking_date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location</span>
          <span class="detail-val">Bavaria M Performance Center • VIP Track Course</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Registered Phone</span>
          <span class="detail-val">{phone}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration</span>
          <span class="detail-val">45 Minutes + Launch Control Session</span>
        </div>
      </div>

      <div class="perks-section">
        <div class="perks-title">Included in Your VIP Session:</div>
        <div class="perk-item">✓ Dedicated BMW M Product Specialist & Driving Coach</div>
        <div class="perk-item">✓ Dynamic highway curve route & launch control demonstration</div>
        <div class="perk-item">✓ Telemetry debrief & custom build allocation consultation</div>
      </div>

      <div class="instructions">
        <strong>Important Check-in Information:</strong><br>
        Please bring a valid driver's license upon arrival. Wear flat, closed-toe driving shoes for pedal ergonomics. If you need to reschedule or have questions, simply reply to this email or call our direct VIP line.
      </div>
    </div>

    <div class="email-footer">
      Bavaria Motor Works Retail Partner • Performance Division<br>
      Independent BMW retailer website. BMW and the BMW logo are trademarks of BMW AG.<br>
      This pass is non-transferable and issued exclusively to {customer_email}.
    </div>
  </div>
</body>
</html>"""

def send_real_email(recipient_email, subject, html_content):
    config = load_smtp_config()
    if not config.get("enabled", False) or not config.get("smtp_username"):
        print(f"[Email Simulator] Real SMTP is not configured in email_config.json.")
        return False, "SMTP not configured"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{config.get('sender_name', 'BMW M')} <{config.get('sender_email')}>"
        msg["To"] = recipient_email

        part_html = MIMEText(html_content, "html")
        msg.attach(part_html)

        server = smtplib.SMTP(config["smtp_server"], config["smtp_port"])
        if config.get("use_tls", True):
            server.starttls()
        server.login(config["smtp_username"], config["smtp_password"])
        server.sendmail(config["sender_email"], [recipient_email], msg.as_string())
        server.quit()
        print(f"[SMTP Success] Email successfully sent to {recipient_email}")
        return True, "Email sent successfully"
    except Exception as e:
        print(f"[SMTP Error] Failed to send email: {e}")
        return False, str(e)

class BMWAppHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        if self.path == "/api/book-test-drive":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            
            try:
                data = json.loads(body)
                name = data.get("name", "Driver")
                email = data.get("email", "")
                phone = data.get("phone", "")
                model = data.get("model", "m3")
                date = data.get("date", str(datetime.now().date()))

                # Generate unique booking ID
                booking_id = f"BMWM-{random.randint(100000, 999999)}"
                
                # Generate HTML email content
                html_email = generate_booking_email_html(name, email, model, date, phone, booking_id)

                # Save copy locally as latest confirmation HTML
                email_save_path = os.path.join(DIRECTORY, "last_confirmation_email.html")
                with open(email_save_path, "w", encoding="utf-8") as f:
                    f.write(html_email)

                # Generate RFC 822 .eml standard email file
                eml_save_path = os.path.join(DIRECTORY, "test_drive_confirmation.eml")
                msg = MIMEMultipart("alternative")
                msg["Subject"] = f"///M CONFIRMED: Your BMW Test Drive Allocation Pass [{booking_id}]"
                msg["From"] = "BMW M Bavaria Performance <allocations@bmw-m-motorsport.com>"
                msg["To"] = email
                msg["Date"] = datetime.now().strftime("%a, %d %b %Y %H:%M:%S +0000")
                msg["Message-ID"] = f"<{booking_id}@{socketserver.socket.gethostname()}>"
                
                plain_text = f"""BMW M MOTORSPORT EXPERIENCE
TEST DRIVE CONFIRMED - PASS REF: {booking_id}

Dear {name},

Your reservation for the ultimate driving machine has been locked into the Bavaria Motorsport allocation system.

VEHICLE: {model.upper()}
DATE: {date}
LOCATION: Bavaria M Performance Track Center
REGISTERED PHONE: {phone}
DURATION: 45 Minutes + Launch Control Session

Included:
- Dedicated BMW M Product Specialist & Driving Coach
- Dynamic highway curve route & launch control demonstration
- Telemetry debrief & custom build allocation consultation

Please bring a valid driver's license.
Issued exclusively to {email}.
"""
                msg.attach(MIMEText(plain_text, "plain"))
                msg.attach(MIMEText(html_email, "html"))

                with open(eml_save_path, "w", encoding="utf-8") as f:
                    f.write(msg.as_string())

                # Try sending real email if SMTP is configured
                smtp_sent, smtp_msg = send_real_email(
                    recipient_email=email,
                    subject=f"///M CONFIRMED: Your BMW Test Drive Allocation Pass [{booking_id}]",
                    html_content=html_email
                )

                response_payload = {
                    "success": True,
                    "bookingId": booking_id,
                    "recipient": email,
                    "name": name,
                    "model": model,
                    "date": date,
                    "smtpSent": smtp_sent,
                    "smtpMessage": smtp_msg,
                    "previewUrl": "/last_confirmation_email.html",
                    "emlUrl": "/test_drive_confirmation.eml",
                    "htmlEmail": html_email
                }

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(response_payload).encode("utf-8"))

            except Exception as e:
                import traceback
                print(f"[API ERROR] {e}")
                traceback.print_exc()
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))
            return

        super().do_POST()

def run_server():
    from http.server import ThreadingHTTPServer
    httpd = ThreadingHTTPServer(("", PORT), BMWAppHandler)
    httpd.daemon_threads = True
    print(f"BMW M High-Performance Multithreaded Server running on http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
