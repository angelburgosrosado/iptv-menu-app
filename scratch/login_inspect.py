import urllib.request
import urllib.parse
import http.cookiejar
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx)
)

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# 1. Fetch login page
req = urllib.request.Request("https://tvpluspanel.ru/login", headers=headers)
try:
    with opener.open(req, timeout=10) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
        print("Login page status:", resp.status)
        # Search for csrf token
        csrf_matches = re.findall(r'name=["\'](_token|csrf[-_]token)["\']\s+value=["\']([^"\']+)["\']', html)
        print("CSRF matches:", csrf_matches)
        
        # Look for form action
        form_actions = re.findall(r'<form[^>]*action=["\']([^"\']*)["\']', html)
        print("Form action:", form_actions)

        # Look for inputs
        inputs = re.findall(r'<input[^>]*name=["\']([^"\']+)["\']', html)
        print("Input names:", inputs)
except Exception as e:
    print("Error fetching login page:", e)
