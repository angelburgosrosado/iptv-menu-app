/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel } from "../types/iptv";

export const MELHATA_XTREAM_CONFIG = {
  serverUrl: "https://iptv-org.github.io",
  username: "public",
  password: "open",
  name: "Verified Public Feeds"
};

export function createMelhataChannels(username = 'public', password = 'open', serverUrl = 'https://iptv-org.github.io'): Channel[] {
  return MELHATA_CHANNELS;
}

export const MELHATA_CHANNELS: Channel[] = [
  {
    "id": "public_nasa_tv",
    "name": "NASA TV (Public Domain)",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg",
    "url": "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
    "group": "DOCUMENTARY & SCIENCE",
    "tvgId": "NasaTV.us",
    "countryCode": "US",
    "countryName": "United States",
    "resolution": "1080p",
    "bitrate": "4.5 Mbps",
    "fps": 60,
    "pingMs": 18,
    "codec": "H.264 / AAC",
    "streamType": "live",
    "directSource": "m3u"
  },
  {
    "id": "public_dw_english",
    "name": "DW English (Deutsche Welle)",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/7/75/Deutsche_Welle_symbol.svg",
    "url": "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
    "group": "INTERNATIONAL NEWS",
    "tvgId": "DWE.de",
    "countryCode": "DE",
    "countryName": "Germany",
    "resolution": "1080p",
    "bitrate": "3.8 Mbps",
    "fps": 50,
    "pingMs": 22,
    "codec": "H.264 / AAC",
    "streamType": "live",
    "directSource": "m3u"
  },
  {
    "id": "public_france24_en",
    "name": "France 24 English",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/6/6b/France_24_logo.svg",
    "url": "https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8",
    "group": "INTERNATIONAL NEWS",
    "tvgId": "France24English.fr",
    "countryCode": "FR",
    "countryName": "France",
    "resolution": "1080p",
    "bitrate": "3.5 Mbps",
    "fps": 50,
    "pingMs": 25,
    "codec": "H.264 / AAC",
    "streamType": "live",
    "directSource": "m3u"
  },
  {
    "id": "public_bloomberg_quicktake",
    "name": "Bloomberg Originals (FAST)",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/5/56/Bloomberg_News_Logo.svg",
    "url": "https://bloomberg.com/media-manifest/streams/us.m3u8",
    "group": "BUSINESS & FINANCE",
    "tvgId": "BloombergTV.us",
    "countryCode": "US",
    "countryName": "United States",
    "resolution": "1080p",
    "bitrate": "4.2 Mbps",
    "fps": 60,
    "pingMs": 20,
    "codec": "H.264 / AAC",
    "streamType": "live",
    "directSource": "m3u"
  },
  {
    "id": "public_redbull_tv",
    "name": "Red Bull TV",
    "logo": "https://upload.wikimedia.org/wikipedia/en/f/f5/Red_Bull_TV_logo.svg",
    "url": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
    "group": "SPORTS & ACTION",
    "tvgId": "RedBullTV.at",
    "countryCode": "AT",
    "countryName": "Austria",
    "resolution": "1080p",
    "bitrate": "5.0 Mbps",
    "fps": 60,
    "pingMs": 28,
    "codec": "H.264 / AAC",
    "streamType": "live",
    "directSource": "m3u"
  },
  {
    "id": "public_euronews_en",
    "name": "Euronews English",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/0/02/Euronews_2016_logo.svg",
    "url": "https://euronews-euronews-world-1-us.plex.tv/hls/main/live.m3u8",
    "group": "INTERNATIONAL NEWS",
    "tvgId": "EuronewsEnglish.fr",
    "countryCode": "FR",
    "countryName": "France",
    "resolution": "1080p",
    "bitrate": "3.6 Mbps",
    "fps": 50,
    "pingMs": 24,
    "codec": "H.264 / AAC",
    "streamType": "live",
    "directSource": "m3u"
  },
  {
    "id": "public_aljazeera_en",
    "name": "Al Jazeera English",
    "logo": "https://upload.wikimedia.org/wikipedia/en/f/f2/Al_Jazeera_English_logo.svg",
    "url": "https://live-hls-web-aje.getaj.net/AJE/01.m3u8",
    "group": "INTERNATIONAL NEWS",
    "tvgId": "AlJazeeraEnglish.qa",
    "countryCode": "QA",
    "countryName": "Qatar",
    "resolution": "1080p",
    "bitrate": "4.0 Mbps",
    "fps": 50,
    "pingMs": 30,
    "codec": "H.264 / AAC",
    "streamType": "live",
    "directSource": "m3u"
  },
  {
    "id": "public_cspan_1",
    "name": "C-SPAN 1 Public Affairs",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/3/36/C-SPAN_logo_2019.svg",
    "url": "https://cspan1-lh.akamaihd.net/i/cspan1_1@304727/master.m3u8",
    "group": "PUBLIC AFFAIRS",
    "tvgId": "CSPAN1.us",
    "countryCode": "US",
    "countryName": "United States",
    "resolution": "720p",
    "bitrate": "2.8 Mbps",
    "fps": 30,
    "pingMs": 21,
    "codec": "H.264 / AAC",
    "streamType": "live",
    "directSource": "m3u"
  }
];
