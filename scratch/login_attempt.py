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
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://tvpluspanel.ru/login"
}

req = urllib.request.Request("https://tvpluspanel.ru/login", headers=headers)
with opener.open(req, timeout=10) as resp:
    html = resp.read().decode("utf-8", errors="ignore")

# Extract all input tags and values
pattern = r'<input[^>]*name=["\']([^"\']+)["\'][^>]*value=["\']([^"\']*)["\']'
inputs_dict = dict(re.findall(pattern, html))
print("Found default inputs:", inputs_dict)

# Also check for inputs where value comes before name
pattern2 = r'<input[^>]*value=["\']([^"\']*)["\'][^>]*name=["\']([^"\']+)["\']'
for val, name in re.findall(pattern2, html):
    inputs_dict[name] = val

inputs_dict['uname'] = 'angelburgos'
inputs_dict['upass'] = '75727572'

print("Submitting login form with payload keys:", list(inputs_dict.keys()))

post_data = urllib.parse.urlencode(inputs_dict).encode('utf-8')
login_req = urllib.request.Request("https://tvpluspanel.ru/login.php", data=post_data, headers=headers)

try:
    with opener.open(login_req, timeout=10) as login_resp:
        login_html = login_resp.read().decode("utf-8", errors="ignore")
        print("Login response status:", login_resp.status)
        print("Login response URL:", login_resp.url)
        print("Cookies:", [c.name for c in cj])
        print("Response snippet:", login_html[:500])
        
        # Check dashboard
        dash_req = urllib.request.Request("https://tvpluspanel.ru/index.php", headers=headers)
        with opener.open(dash_req, timeout=10) as dash_resp:
            dash_html = dash_resp.read().decode("utf-8", errors="ignore")
            print("Dashboard status:", dash_resp.status)
            print("Dashboard snippet:", dash_html[:500])
            # search for links or hostnames
            links = re.findall(r'href=["\']([^"\']+)["\']', dash_html)
            print("Dashboard links:", links[:15])
            # search for server DNS / host
            servers = re.findall(r'(https?://[a-zA-Z0-9.-]+(?::[0-9]+)?)', dash_html)
            print("Detected servers in dashboard:", set(servers))
except Exception as e:
    print("Login error:", e)
