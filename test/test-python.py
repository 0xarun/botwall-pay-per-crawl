import requests
import json
import base64
from nacl.signing import SigningKey

"""
---
REAL BOT TESTING INSTRUCTIONS:

1. Fill in your real bot's details below:
   - BOT_ID: Your bot's bot_id (from dashboard or DB)
   - PRIVATE_KEY_B64: Your bot's private key (base64, shown ONCE at registration)
   - DOMAIN: The domain you want to test (should match a site in your DB)
   - PRICE: The price-per-crawl for that domain (or higher)

2. Make sure you have 'pynacl' installed:
   pip install pynacl

3. Run this script. The 'call_with_real_bot' function will attempt a real, valid signed request.
---
"""

# === FILL THESE IN ===
BOT_ID = "a264baf5-e642-4130-912c-f219f579d93e"
PRIVATE_KEY_B64 = "eqP6FkBOXRUfO6u/Eh/MrGwp6Ho35ZQWNCEq/NctOcDMTgFNPOwdHIjv4ErrSAxLDC4LGWap5ZxUoXogAzv2DQ=="
DOMAIN = "localhost"  # or your real test domain
PRICE = 0.01  # set to your site's price_per_crawl or higher

# =====================

def call_protected_api():
    url = "http://localhost:3002/api/protected"
    try:
        response = requests.get(url)
        print(f"[No Bot Headers] Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        try:
            data = response.json()
            print(f"Response JSON: {json.dumps(data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Response Text: {response.text}")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the server is running on localhost:3002")
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")

def call_with_crawler_id_only():
    url = "http://localhost:3002/api/protected"
    headers = {
        "crawler-id": "testbot"
    }
    try:
        response = requests.get(url, headers=headers)
        print(f"[crawler-id only] Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        try:
            data = response.json()
            print(f"Response JSON: {json.dumps(data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Response Text: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Bot request error: {e}")

def call_with_bot_user_agent():
    url = "http://localhost:3002/api/protected"
    headers = {
        "User-Agent": "GPTBot"
    }
    try:
        response = requests.get(url, headers=headers)
        print(f"[User-Agent: GPTBot] Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        try:
            data = response.json()
            print(f"Response JSON: {json.dumps(data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Response Text: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Bot request error: {e}")

def call_with_bot_headers(case):
    url = "http://localhost:3002/api/protected"
    headers = {
        "crawler-id": "testbot",
        "crawler-max-price": "0.01",
        "signature-input": "testinput",
        "signature": "dGVzdHNpZw=="  # base64 for 'testsig', not a real signature
    }
    if case == "invalid_signature":
        headers["signature"] = "invalidsignature"
    elif case == "low_price":
        headers["crawler-max-price"] = "0.001"
    try:
        response = requests.get(url, headers=headers)
        print(f"[{case}] Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        try:
            data = response.json()
            print(f"Response JSON: {json.dumps(data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Response Text: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Bot request error: {e}")

def call_with_real_bot():
    url = "http://localhost:3002/api/protected"
    # --- Canonical signature-input ---
    signature_input = "crawler-id crawler-max-price"
    headers = {
        "crawler-id": BOT_ID,
        "crawler-max-price": str(PRICE),
        "signature-input": signature_input
    }
    # Build canonical message
    message = " ".join([headers[h] for h in signature_input.split()])
    # Sign with Ed25519
    try:
        private_key_bytes = base64.b64decode(PRIVATE_KEY_B64)
        signing_key = SigningKey(private_key_bytes[:32])
        signature = signing_key.sign(message.encode()).signature
        signature_b64 = base64.b64encode(signature).decode()
        headers["signature"] = signature_b64
    except Exception as e:
        print(f"[Real Bot] Error generating signature: {e}")
        return
    try:
        response = requests.get(url, headers=headers)
        print(f"[Real Bot] Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        try:
            data = response.json()
            print(f"Response JSON: {json.dumps(data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Response Text: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"[Real Bot] Request error: {e}")

if __name__ == "__main__":
    print("Trying basic request (no bot headers)...")
    call_protected_api()
    print("\n" + "="*50 + "\n")
    print("Trying with crawler-id only...")
    call_with_crawler_id_only()
    print("\n" + "="*50 + "\n")
    print("Trying with User-Agent: GPTBot...")
    call_with_bot_user_agent()
    print("\n" + "="*50 + "\n")
    print("Trying with valid bot headers (dummy signature)...")
    call_with_bot_headers("valid")
    print("\n" + "="*50 + "\n")
    print("Trying with invalid signature...")
    call_with_bot_headers("invalid_signature")
    print("\n" + "="*50 + "\n")
    print("Trying with too low price...")
    call_with_bot_headers("low_price")
    print("\n" + "="*50 + "\n")
    print("Trying with REAL bot and valid Ed25519 signature...")
    call_with_real_bot()