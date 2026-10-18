#!/usr/bin/env python3
"""
IPTV Stream Quality & Health Checker
Probes live IPTV streams using concurrent ffprobe workers.
"""

import argparse
import concurrent.futures
import json
import logging
import os
import subprocess
import sys
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("IPTVStreamChecker")


class IPTVStreamChecker:
    def __init__(
        self,
        base_url: str,
        username: str,
        password: str,
        timeout: int = 8,
        max_workers: int = 25,
        container_ext: str = "ts",
    ):
        """
        :param base_url: IPTV server URL, e.g., 'http://server.domain.com:8080'
        :param username: Xtream Codes username
        :param password: Xtream Codes password
        :param timeout: Maximum seconds ffprobe will wait before aborting
        :param max_workers: Number of concurrent streams to test in parallel
        :param container_ext: Stream extension (e.g. 'ts' or 'm3u8')
        """
        self.base_url = base_url.rstrip("/") if base_url else ""
        self.username = username
        self.password = password
        self.timeout = timeout
        self.max_workers = max_workers
        self.container_ext = container_ext

    def fetch_streams(self) -> List[Dict[str, Any]]:
        """
        Makes an HTTP GET request to the IPTV panel API and constructs playback URLs.
        """
        if not self.base_url or not self.username or not self.password:
            logger.error("Missing base_url, username, or password for Xtream Codes API.")
            return []

        params = urllib.parse.urlencode(
            {
                "username": self.username,
                "password": self.password,
                "action": "get_live_streams",
            }
        )
        api_url = f"{self.base_url}/player_api.php?{params}"

        logger.info(f"Fetching stream list from panel: {self.base_url}...")

        req = urllib.request.Request(
            api_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status != 200:
                    logger.error(f"API request failed with status: {response.status}")
                    return []
                raw_data = response.read().decode("utf-8")
                stream_list = json.loads(raw_data)
        except Exception as e:
            logger.error(f"Failed to fetch streams from API: {e}")
            return []

        if not isinstance(stream_list, list):
            logger.error("Unexpected API response format (expected a list).")
            return []

        extracted_streams = []
        for item in stream_list:
            stream_id = item.get("stream_id")
            name = item.get("name", "Unknown Channel")

            if stream_id is not None:
                # Construct direct playback URL: http://host:port/username/password/stream_id.ts
                direct_url = (
                    f"{self.base_url}/{self.username}/{self.password}/"
                    f"{stream_id}.{self.container_ext}"
                )
                extracted_streams.append(
                    {
                        "stream_id": stream_id,
                        "name": name,
                        "category_id": item.get("category_id"),
                        "stream_url": direct_url,
                    }
                )

        logger.info(f"Successfully retrieved {len(extracted_streams)} streams.")
        return extracted_streams

    def analyze_stream(self, stream_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Probes a single stream using ffprobe with a strict timeout.
        Ensures dead streams terminate without blocking execution.
        """
        stream_url = stream_info["stream_url"]

        command = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_streams",
            "-show_format",
            stream_url,
        ]

        result_payload = {
            "stream_id": stream_info.get("stream_id", "unknown"),
            "name": stream_info.get("name", "Unknown Channel"),
            "stream_url": stream_url,
            "status": "Offline",
            "details": None,
        }

        try:
            # subprocess.run handles child process kill on timeout automatically
            proc = subprocess.run(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=self.timeout,
                text=True,
            )

            if proc.returncode != 0:
                result_payload["details"] = {"reason": f"ffprobe exited with code {proc.returncode}"}
                return result_payload

            probe_data = json.loads(proc.stdout)

            # Validation logic: check for at least one video codec entry
            video_stream = next(
                (s for s in probe_data.get("streams", []) if s.get("codec_type") == "video"),
                None,
            )

            audio_stream = next(
                (s for s in probe_data.get("streams", []) if s.get("codec_type") == "audio"),
                None,
            )

            if video_stream:
                result_payload["status"] = "Online"
                result_payload["details"] = {
                    "video_codec": video_stream.get("codec_name"),
                    "audio_codec": audio_stream.get("codec_name") if audio_stream else "N/A",
                    "resolution": f"{video_stream.get('width')}x{video_stream.get('height')}",
                    "fps": video_stream.get("r_frame_rate", "N/A"),
                    "bitrate": probe_data.get("format", {}).get("bit_rate", "N/A"),
                }
            else:
                result_payload["details"] = {"reason": "No video codec detected in stream"}

        except subprocess.TimeoutExpired:
            result_payload["details"] = {"reason": f"Connection timed out (>{self.timeout}s)"}
        except json.JSONDecodeError:
            result_payload["details"] = {"reason": "ffprobe returned malformed JSON or empty output"}
        except Exception as e:
            result_payload["details"] = {"reason": str(e)}

        return result_payload

    def run_check(
        self, 
        stream_limit: Optional[int] = None, 
        custom_streams: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Runs the stream verification pipeline concurrently using ThreadPoolExecutor.
        """
        streams = custom_streams if custom_streams is not None else self.fetch_streams()
        if stream_limit:
            streams = streams[:stream_limit]

        logger.info(
            f"Analyzing {len(streams)} streams with {self.max_workers} concurrent workers..."
        )

        report = {
            "summary": {
                "total_tested": len(streams),
                "online_count": 0,
                "offline_count": 0,
            },
            "online": [],
            "offline": [],
        }

        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_stream = {
                executor.submit(self.analyze_stream, s): s for s in streams
            }

            for future in concurrent.futures.as_completed(future_to_stream):
                result = future.result()
                if result["status"] == "Online":
                    report["online"].append(result)
                    logger.info(
                        f"[ONLINE]  {result['name']} ({result['details']['resolution']})"
                    )
                else:
                    report["offline"].append(result)
                    logger.warning(
                        f"[OFFLINE] {result['name']} - Reason: {result['details']['reason']}"
                    )

        report["summary"]["online_count"] = len(report["online"])
        report["summary"]["offline_count"] = len(report["offline"])

        return report


# Demo FAST Streams bundled with the application
DEMO_STREAMS = [
    {
        "stream_id": "demo-nasa-tv-hd",
        "name": "NASA TV HD",
        "stream_url": "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
    },
    {
        "stream_id": "demo-bloomberg-tv",
        "name": "Bloomberg Television",
        "stream_url": "https://bloomberg.com/media-manifest/streams/us.m3u8",
    },
    {
        "stream_id": "demo-redbull-tv",
        "name": "Red Bull TV",
        "stream_url": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
    },
    {
        "stream_id": "demo-aljazeera-eng",
        "name": "Al Jazeera English",
        "stream_url": "https://live-hls-web-aje.getaj.net/AJE/01.m3u8",
    },
    {
        "stream_id": "demo-dw-english",
        "name": "DW English",
        "stream_url": "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
    },
    {
        "stream_id": "demo-france24-en",
        "name": "France 24 English",
        "stream_url": "https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8",
    },
    {
        "stream_id": "demo-sintel-4k",
        "name": "Sintel (4K UHD Movie)",
        "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    },
]


def main():
    parser = argparse.ArgumentParser(description="IPTV Stream Quality & Health Checker")
    parser.add_argument("--host", default=os.getenv("IPTV_PANEL_HOST", ""), help="Xtream Codes server URL (e.g. http://server.com:8080)")
    parser.add_argument("--user", default=os.getenv("IPTV_PANEL_USER", ""), help="Xtream Codes username")
    parser.add_argument("--password", default=os.getenv("IPTV_PANEL_PASS", ""), help="Xtream Codes password")
    parser.add_argument("--limit", type=int, default=50, help="Maximum streams to test (default: 50)")
    parser.add_argument("--workers", type=int, default=25, help="Number of concurrent workers (default: 25)")
    parser.add_argument("--timeout", type=int, default=8, help="ffprobe timeout in seconds (default: 8)")
    parser.add_argument("--ext", default="ts", help="Container extension: ts or m3u8 (default: ts)")
    parser.add_argument("--output", default="stream_status_report.json", help="Output report file (default: stream_status_report.json)")
    parser.add_argument("--test-demo", action="store_true", help="Test bundled public FAST demo streams directly")

    args = parser.parse_args()

    # Determine mode
    if args.test_demo or not (args.host and args.user and args.password):
        if not args.test_demo:
            print("\nNotice: No panel credentials provided via --host, --user, --password or environment variables.")
            print("Switching to testing bundled public FAST demo channels...\n")
            print("Usage with Xtream Codes panel:")
            print("  python3 scripts/iptv_stream_checker.py --host http://server:8080 --user YOUR_USER --password YOUR_PASS --limit 50\n")

        checker = IPTVStreamChecker(
            base_url="",
            username="",
            password="",
            timeout=args.timeout,
            max_workers=args.workers,
            container_ext=args.ext,
        )
        report = checker.run_check(stream_limit=args.limit, custom_streams=DEMO_STREAMS)
    else:
        checker = IPTVStreamChecker(
            base_url=args.host,
            username=args.user,
            password=args.password,
            timeout=args.timeout,
            max_workers=args.workers,
            container_ext=args.ext,
        )
        report = checker.run_check(stream_limit=args.limit)

    # Save output to JSON report file
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=4)

    print("\n" + "=" * 45)
    print("           STREAM CHECK SUMMARY")
    print("=" * 45)
    print(f"Total Tested: {report['summary']['total_tested']}")
    print(f"Online:       {report['summary']['online_count']} ✅")
    print(f"Offline/Dead: {report['summary']['offline_count']} ❌")
    print(f"Report saved: {args.output}")
    print("=" * 45 + "\n")


if __name__ == "__main__":
    main()
