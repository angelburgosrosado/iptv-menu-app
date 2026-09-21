var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// apps/api/src/server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app,
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_body_parser = __toESM(require("body-parser"));
var import_config = require("@iptv-menu/config");
var import_logging7 = require("@iptv-menu/logging");
var import_auth = require("@iptv-menu/auth");
var import_db2 = require("@iptv-menu/db");
var import_storage = require("@iptv-menu/storage");
var import_billing = require("@iptv-menu/billing");
var import_jobs = require("@iptv-menu/jobs");

// apps/api/src/middleware/workspaceGuard.ts
var import_db = require("@iptv-menu/db");
var workspaceRepo = new import_db.WorkspaceRepository();
async function attachWorkspaceContext(req, res, next) {
  try {
    const workspaceId = req.headers["x-workspace-id"];
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized: Missing user credentials" });
    }
    if (!workspaceId) {
      const workspacesList = await workspaceRepo.listUserWorkspaces(uid);
      if (workspacesList.length === 0) {
        try {
          const newWs = await workspaceRepo.createWorkspace({
            workspaceId: `ws_${Math.random().toString(36).substring(2, 12)}`,
            name: "Personal Workspace",
            ownerUid: uid,
            plan: "free",
            subscriptionStatus: "active",
            entitlements: {
              maxPlaylists: 1,
              maxHostedPlaylists: 0,
              maxDailyCleanups: 1,
              maxMonthlyBuilds: 0,
              allowBrandingCustomization: false,
              allowWhiteLabel: false
            },
            usage: {
              activePlaylistsCount: 0,
              activeHostedPlaylistsCount: 0,
              dailyCleanupsUsed: 0,
              monthlyBuildsUsed: 0
            },
            stripeSubscriptionId: null,
            stripeCustomerId: null,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          req.workspace = newWs;
          return next();
        } catch (wsErr) {
          return res.status(404).json({ error: "No workspace found. Please create one." });
        }
      }
      req.workspace = workspacesList[0];
      return next();
    }
    const workspace = await workspaceRepo.getWorkspace(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    if (workspace.ownerUid !== uid) {
      return res.status(403).json({ error: "Forbidden: You do not own this workspace" });
    }
    req.workspace = workspace;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
function checkWorkspaceQuota(key) {
  return (req, res, next) => {
    const workspace = req.workspace;
    if (!workspace) {
      return res.status(500).json({ error: "Internal Error: Workspace context missing" });
    }
    if (workspace.plan !== "free" && workspace.subscriptionStatus !== "active") {
      return res.status(402).json({ error: "Payment required: Subscription is inactive" });
    }
    const entitlementValue = workspace.entitlements[key];
    if (typeof entitlementValue === "boolean") {
      if (!entitlementValue) {
        return res.status(403).json({
          error: `Upgrade required: Feature [${String(key)}] is not enabled on the ${workspace.plan} plan.`
        });
      }
      return next();
    }
    if (typeof entitlementValue === "number") {
      let currentUsage = 0;
      if (key === "maxPlaylists") {
        currentUsage = workspace.usage.activePlaylistsCount;
      } else if (key === "maxHostedPlaylists") {
        currentUsage = workspace.usage.activeHostedPlaylistsCount;
      } else if (key === "maxDailyCleanups") {
        currentUsage = workspace.usage.dailyCleanupsUsed;
      } else if (key === "maxMonthlyBuilds") {
        currentUsage = workspace.usage.monthlyBuildsUsed;
      }
      if (currentUsage >= entitlementValue) {
        return res.status(403).json({
          error: `Quota exceeded: Limit for [${String(key)}] is ${entitlementValue}. Current usage: ${currentUsage}. Please upgrade your plan.`
        });
      }
    }
    next();
  };
}

// apps/api/src/services/streamProxyService.ts
var import_node_stream = require("node:stream");
var import_logging = require("@iptv-menu/logging");
var logger = new import_logging.Logger("stream-proxy");
var DEFAULT_UPSTREAM_USER_AGENT = "VLC/3.0.18 LibVLC/3.0.18";
function isSafeTargetUrl(rawUrl, forceStrictCheck = false) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "Invalid URL format" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: "Protocol must be http or https" };
  }
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "169.254.169.254") {
    return { safe: false, reason: "Access to private or loopback addresses is prohibited" };
  }
  const allowLocal = !forceStrictCheck && (process.env.ALLOW_LOCAL_PROXY === "true" || process.env.NODE_ENV === "test");
  if (!allowLocal) {
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "0.0.0.0" || hostname.startsWith("10.") || hostname.startsWith("192.168.")) {
      return { safe: false, reason: "Access to private or loopback addresses is prohibited" };
    }
    if (hostname.startsWith("172.")) {
      const parts = hostname.split(".");
      if (parts.length >= 2) {
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) {
          return { safe: false, reason: "Access to private addresses is prohibited" };
        }
      }
    }
  }
  return { safe: true, parsedUrl: parsed };
}
function rewriteM3u8Manifest(manifest, baseUrl, proxyEndpoint = "/api/stream/proxy") {
  const lines = manifest.split(/\r?\n/);
  const rewrittenLines = [];
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) {
      rewrittenLines.push(rawLine);
      continue;
    }
    if (trimmed.startsWith("#")) {
      if (trimmed.includes('URI="')) {
        const rewrittenTag = trimmed.replace(/URI="([^"]+)"/g, (_, uri) => {
          try {
            const absoluteUrl = new URL(uri, baseUrl).href;
            const uaParam = "&ua=" + encodeURIComponent(proxyEndpoint.includes("&ua=") ? new URL(proxyEndpoint, "http://localhost").searchParams.get("ua") || "" : "");
            return `URI="${proxyEndpoint.split("&ua=")[0]}?url=${encodeURIComponent(absoluteUrl)}${uaParam !== "&ua=" ? uaParam : ""}"`;
          } catch {
            return `URI="${uri}"`;
          }
        });
        rewrittenLines.push(rewrittenTag);
      } else {
        rewrittenLines.push(rawLine);
      }
    } else {
      try {
        const absoluteUrl = new URL(trimmed, baseUrl).href;
        const uaParam = "&ua=" + encodeURIComponent(proxyEndpoint.includes("&ua=") ? new URL(proxyEndpoint, "http://localhost").searchParams.get("ua") || "" : "");
        rewrittenLines.push(`${proxyEndpoint.split("&ua=")[0]}?url=${encodeURIComponent(absoluteUrl)}${uaParam !== "&ua=" ? uaParam : ""}`);
      } catch {
        rewrittenLines.push(trimmed);
      }
    }
  }
  return rewrittenLines.join("\n");
}
async function handleStreamProxy(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  const targetUrl = req.query.url;
  if (!targetUrl) {
    res.status(400).json({ error: "Missing stream target URL (?url=...)" });
    return;
  }
  const validation = isSafeTargetUrl(targetUrl);
  if (!validation.safe) {
    res.status(400).json({ error: validation.reason || "Forbidden stream URL target" });
    return;
  }
  const customUserAgent = req.query.ua;
  const abortController = new AbortController();
  req.on("close", () => {
    abortController.abort();
  });
  try {
    const upstreamHeaders = {
      "User-Agent": customUserAgent || DEFAULT_UPSTREAM_USER_AGENT,
      "Accept": "*/*"
    };
    if (req.headers.range) {
      upstreamHeaders["Range"] = req.headers.range;
    }
    const upstreamResponse = await fetch(targetUrl, {
      method: req.method === "HEAD" ? "HEAD" : "GET",
      headers: upstreamHeaders,
      signal: abortController.signal,
      redirect: "follow"
    });
    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      logger.warn(`Upstream returned error status ${upstreamResponse.status}`, { targetUrl });
      res.status(upstreamResponse.status).json({
        error: `Upstream stream server responded with HTTP ${upstreamResponse.status}`,
        statusCode: upstreamResponse.status,
        targetUrl
      });
      return;
    }
    const contentType = upstreamResponse.headers.get("content-type") || "";
    const finalBaseUrl = upstreamResponse.url || targetUrl;
    const isM3u8Url = targetUrl.toLowerCase().includes(".m3u8") || finalBaseUrl.toLowerCase().includes(".m3u8");
    const isM3u8Mime = contentType.includes("mpegurl") || contentType.includes("application/x-mpegURL");
    if (isM3u8Url || isM3u8Mime) {
      const text = await upstreamResponse.text();
      if (text.trim().startsWith("#EXTM3U") || text.includes("#EXTINF")) {
        let proxyEndpointUrl = "/api/stream/proxy";
        if (customUserAgent) {
          proxyEndpointUrl += `&ua=${encodeURIComponent(customUserAgent)}`;
        }
        const rewritten = rewriteM3u8Manifest(text, finalBaseUrl, proxyEndpointUrl);
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.status(upstreamResponse.status).send(rewritten);
        return;
      }
      res.setHeader("Content-Type", contentType || "application/octet-stream");
      res.status(upstreamResponse.status).send(text);
      return;
    }
    const resolvedContentType = contentType || (targetUrl.toLowerCase().includes(".ts") ? "video/mp2t" : "application/octet-stream");
    res.setHeader("Content-Type", resolvedContentType);
    res.setHeader("Accept-Ranges", "bytes");
    const contentLength = upstreamResponse.headers.get("content-length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }
    const contentRange = upstreamResponse.headers.get("content-range");
    if (contentRange) {
      res.setHeader("Content-Range", contentRange);
    }
    res.setHeader("Cache-Control", "public, max-age=86400");
    if (req.method === "HEAD") {
      res.status(upstreamResponse.status).end();
      return;
    }
    if (upstreamResponse.body) {
      res.status(upstreamResponse.status);
      const nodeStream = import_node_stream.Readable.fromWeb(upstreamResponse.body);
      nodeStream.pipe(res);
    } else {
      res.status(upstreamResponse.status).end();
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    logger.error("Stream proxy relay failed", { error: error.message, targetUrl });
    if (!res.headersSent) {
      res.status(502).json({ error: "Stream proxy failed to reach upstream video host", details: error.message });
    }
  }
}

// apps/api/src/services/channelMetadataService.ts
var import_logging2 = require("@iptv-menu/logging");
var logger2 = new import_logging2.Logger("channel-metadata-service");
var COUNTRY_NAMES = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  GB: "United Kingdom",
  FR: "France",
  DE: "Germany",
  ES: "Spain",
  IT: "Italy",
  BR: "Brazil",
  IN: "India",
  PH: "Philippines",
  DO: "Dominican Republic",
  PR: "Puerto Rico",
  AU: "Australia",
  JP: "Japan",
  KR: "South Korea",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  UN: "International / Unknown"
};
var normalize = (value) => (value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
var ChannelMetadataService = class _ChannelMetadataService {
  static instance;
  index = null;
  isRefreshing = false;
  ttlMs = 1e3 * 60 * 60 * 12;
  // 12 hours
  constructor() {
  }
  static getInstance() {
    if (!_ChannelMetadataService.instance) {
      _ChannelMetadataService.instance = new _ChannelMetadataService();
    }
    return _ChannelMetadataService.instance;
  }
  async getIndex(forceRefresh = false) {
    const isStale = !this.index || Date.now() - this.index.lastLoaded > this.ttlMs;
    if ((isStale || forceRefresh) && !this.isRefreshing) {
      await this.refreshIndex();
    }
    return this.index || this.createFallbackIndex();
  }
  async refreshIndex() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    try {
      logger2.info("Fetching iptv-org channels dataset...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15e3);
      const [channelsRes, countriesRes] = await Promise.allSettled([
        fetch("https://iptv-org.github.io/api/channels.json", { signal: controller.signal }),
        fetch("https://iptv-org.github.io/api/countries.json", { signal: controller.signal })
      ]);
      clearTimeout(timeoutId);
      let channelsData = [];
      if (channelsRes.status === "fulfilled" && channelsRes.value.ok) {
        channelsData = await channelsRes.value.json();
        logger2.info(`Loaded ${channelsData.length} channels from iptv-org`);
      } else {
        logger2.warn("Failed to fetch remote channels.json from iptv-org, using fallback index");
      }
      const countryMap = new Map(Object.entries(COUNTRY_NAMES));
      if (countriesRes.status === "fulfilled" && countriesRes.value.ok) {
        try {
          const countriesData = await countriesRes.value.json();
          for (const c of countriesData) {
            if (c.code && c.name) {
              countryMap.set(c.code.toUpperCase(), c.name);
            }
          }
        } catch {
        }
      }
      this.index = this.buildIndex(channelsData, countryMap);
    } catch (err) {
      logger2.error("Error refreshing iptv-org channel index", err);
      if (!this.index) {
        this.index = this.createFallbackIndex();
      }
    } finally {
      this.isRefreshing = false;
    }
  }
  buildIndex(records, countryMap) {
    const byId = /* @__PURE__ */ new Map();
    const byNameCountry = /* @__PURE__ */ new Map();
    const byName = /* @__PURE__ */ new Map();
    for (const item of records) {
      if (item.id) {
        byId.set(item.id.toLowerCase(), item);
      }
      const country = (item.country || "").toUpperCase();
      const names = [item.name, ...item.alt_names || [], item.network].filter(Boolean);
      for (const rawName of names) {
        const norm = normalize(rawName);
        if (!norm) continue;
        if (country) {
          const composite = `${norm}__${country}`;
          if (!byNameCountry.has(composite)) {
            byNameCountry.set(composite, item);
          }
        }
        if (!byName.has(norm)) {
          byName.set(norm, item);
        }
      }
    }
    return {
      byId,
      byNameCountry,
      byName,
      countryMap: countryMap || new Map(Object.entries(COUNTRY_NAMES)),
      lastLoaded: Date.now()
    };
  }
  async enrichChannels(channels) {
    const index = await this.getIndex();
    let enrichedCount = 0;
    const enriched = channels.map((channel) => {
      const tvgId = (channel.tvgId || channel.epgChannelId || "").trim().toLowerCase();
      const direct = tvgId ? index.byId.get(tvgId) : void 0;
      const countryCode = (channel.countryCode || channel.tvgCountry || "").toUpperCase();
      const normName = normalize(channel.name);
      const byCountryMatch = countryCode ? index.byNameCountry.get(`${normName}__${countryCode}`) : void 0;
      const nameMatch = index.byName.get(normName);
      const match = direct || byCountryMatch || nameMatch;
      if (!match) {
        const resolvedCountry2 = countryCode || "UN";
        return {
          ...channel,
          countryCode: resolvedCountry2,
          countryName: channel.countryName || index.countryMap.get(resolvedCountry2) || resolvedCountry2,
          metadataSource: channel.metadataSource || "playlist"
        };
      }
      enrichedCount++;
      const resolvedCountry = (countryCode || match.country || "UN").toUpperCase();
      const canonicalCategories = Array.isArray(match.categories) && match.categories.length > 0 ? match.categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(" / ") : channel.group;
      return {
        ...channel,
        id: channel.id || match.id,
        name: channel.name || match.name,
        logo: channel.logo || match.logo || void 0,
        group: canonicalCategories || channel.group || "General",
        tvgId: channel.tvgId || match.id,
        epgChannelId: channel.epgChannelId || match.id,
        countryCode: resolvedCountry,
        countryName: channel.countryName || index.countryMap.get(resolvedCountry) || resolvedCountry,
        metadataSource: "iptv-org"
      };
    });
    return {
      channels: enriched,
      enrichedCount,
      totalCount: channels.length
    };
  }
  getStats() {
    return {
      channelsCount: this.index?.byId.size || 0,
      countriesCount: this.index?.countryMap.size || 0,
      lastLoaded: this.index?.lastLoaded ? new Date(this.index.lastLoaded).toISOString() : null,
      isRefreshing: this.isRefreshing
    };
  }
  createFallbackIndex() {
    const fallbackChannels = [
      { id: "CNNInternational.us", name: "CNN International", country: "US", categories: ["news"] },
      { id: "Azteca7.mx", name: "Azteca 7", country: "MX", categories: ["entertainment"] },
      { id: "WAPATV.pr", name: "WAPA TV", country: "PR", categories: ["general"] },
      { id: "BBCNews.uk", name: "BBC News", country: "GB", categories: ["news"] },
      { id: "Univision.us", name: "Univision", country: "US", categories: ["general"] },
      { id: "Telemundo.us", name: "Telemundo", country: "US", categories: ["general"] },
      { id: "ESPN.us", name: "ESPN", country: "US", categories: ["sports"] }
    ];
    return this.buildIndex(fallbackChannels);
  }
};
var channelMetadataService = ChannelMetadataService.getInstance();

// apps/api/src/services/epgService.ts
var import_logging3 = require("@iptv-menu/logging");
var logger3 = new import_logging3.Logger("epg-service");
function parseXmltvDate(rawDate) {
  if (!rawDate) return null;
  const cleaned = rawDate.trim();
  const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-]\d{4}))?/);
  if (!match) {
    const fallbackParsed = Date.parse(cleaned);
    return Number.isFinite(fallbackParsed) ? new Date(fallbackParsed).toISOString() : null;
  }
  const [, year, month, day, hour, minute, second, tz] = match;
  let iso = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  if (tz) {
    const tzFormatted = `${tz.slice(0, 3)}:${tz.slice(3)}`;
    iso += tzFormatted;
  } else {
    iso += "Z";
  }
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
var EpgService = class _EpgService {
  static instance;
  // Map of channelId (lowercase) -> list of programmes sorted by start time
  scheduleMap = /* @__PURE__ */ new Map();
  lastRefreshedAt = 0;
  isIngesting = false;
  constructor() {
  }
  static getInstance() {
    if (!_EpgService.instance) {
      _EpgService.instance = new _EpgService();
    }
    return _EpgService.instance;
  }
  /**
   * Fast regular expression-based XMLTV parser for low memory footprint
   */
  ingestXmltv(xmlContent, sourcePriority = 10) {
    let count = 0;
    const programmeRegex = /<programme\s+([^>]+)>([\s\S]*?)<\/programme>/gi;
    let match;
    while ((match = programmeRegex.exec(xmlContent)) !== null) {
      const attributesStr = match[1];
      const bodyStr = match[2];
      const startAttr = attributesStr.match(/start=["']([^"']+)["']/i)?.[1];
      const stopAttr = attributesStr.match(/stop=["']([^"']+)["']/i)?.[1];
      const channelAttr = attributesStr.match(/channel=["']([^"']+)["']/i)?.[1];
      if (!channelAttr || !startAttr) continue;
      const titleMatch = bodyStr.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = bodyStr.match(/<desc[^>]*>([^<]+)<\/desc>/i);
      const categoryMatches = [...bodyStr.matchAll(/<category[^>]*>([^<]+)<\/category>/gi)].map((m) => m[1].trim());
      const startIso = parseXmltvDate(startAttr);
      const stopIso = parseXmltvDate(stopAttr) || (startIso ? new Date(Date.parse(startIso) + 36e5).toISOString() : null);
      if (!startIso || !stopIso) continue;
      const programme = {
        channelId: channelAttr.trim(),
        title: titleMatch ? titleMatch[1].trim() : "Live Broadcast",
        desc: descMatch ? descMatch[1].trim() : void 0,
        start: startIso,
        stop: stopIso,
        category: categoryMatches.length > 0 ? categoryMatches : void 0,
        sourcePriority
      };
      this.addProgramme(programme);
      count++;
    }
    this.purgeExpired();
    return count;
  }
  addProgramme(programme) {
    const key = programme.channelId.toLowerCase();
    const existing = this.scheduleMap.get(key) || [];
    const isDuplicate = existing.some((p) => p.start === programme.start);
    if (!isDuplicate) {
      existing.push(programme);
      existing.sort((a, b) => a.start.localeCompare(b.start));
      this.scheduleMap.set(key, existing);
    }
  }
  /**
   * Fetches external XMLTV endpoints and loads them into the EPG index
   */
  async fetchAndIngestFeeds(urls) {
    if (this.isIngesting) {
      return { ingestedCount: 0, channelsCount: this.scheduleMap.size };
    }
    this.isIngesting = true;
    let totalIngested = 0;
    try {
      for (const url of urls) {
        try {
          logger3.info(`Fetching EPG XMLTV feed from: ${url}`);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2e4);
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            const xmlText = await res.text();
            const ingested = this.ingestXmltv(xmlText);
            totalIngested += ingested;
            logger3.info(`Ingested ${ingested} programmes from ${url}`);
          } else {
            logger3.warn(`EPG Feed returned ${res.status}: ${url}`);
          }
        } catch (feedErr) {
          logger3.error(`Failed to ingest EPG feed ${url}`, feedErr);
        }
      }
      this.lastRefreshedAt = Date.now();
    } finally {
      this.isIngesting = false;
    }
    return {
      ingestedCount: totalIngested,
      channelsCount: this.scheduleMap.size
    };
  }
  /**
   * Returns Now and Next programme information for the specified channel IDs
   */
  getNowNext(channelIds) {
    const result = {};
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    for (const rawId of channelIds) {
      const key = rawId.toLowerCase();
      const programmes = this.scheduleMap.get(key) || [];
      if (programmes.length === 0) {
        const nowMs = Date.now();
        const start = new Date(nowMs - nowMs % 18e5).toISOString();
        const stop = new Date(Date.parse(start) + 36e5).toISOString();
        const nextStop = new Date(Date.parse(stop) + 36e5).toISOString();
        result[rawId] = {
          now: {
            channelId: rawId,
            title: "Live Transmission",
            desc: "Regular continuous broadcast",
            start,
            stop,
            sourcePriority: 1
          },
          next: {
            channelId: rawId,
            title: "Upcoming Broadcast",
            desc: "Scheduled programming",
            start: stop,
            stop: nextStop,
            sourcePriority: 1
          }
        };
        continue;
      }
      const nowProg = programmes.find((p) => p.start <= nowIso && p.stop > nowIso) || programmes[0];
      const nextProg = programmes.find((p) => p.start >= nowProg.stop) || programmes[1];
      result[rawId] = {
        now: nowProg,
        next: nextProg
      };
    }
    return result;
  }
  /**
   * Returns schedule for a specific channel for up to `hoursAhead`
   */
  getSchedule(channelId, hoursAhead = 24) {
    const key = channelId.toLowerCase();
    const programmes = this.scheduleMap.get(key) || [];
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const cutoffIso = new Date(Date.now() + hoursAhead * 36e5).toISOString();
    return programmes.filter((p) => p.stop > nowIso && p.start < cutoffIso);
  }
  /**
   * Removes programmes older than cutoff hours to maintain lean memory footprint
   */
  purgeExpired(retentionHours = 6) {
    const cutoffIso = new Date(Date.now() - retentionHours * 36e5).toISOString();
    for (const [key, programmes] of this.scheduleMap.entries()) {
      const filtered = programmes.filter((p) => p.stop >= cutoffIso);
      if (filtered.length > 0) {
        this.scheduleMap.set(key, filtered);
      } else {
        this.scheduleMap.delete(key);
      }
    }
  }
  getStats() {
    let totalProgrammes = 0;
    for (const p of this.scheduleMap.values()) {
      totalProgrammes += p.length;
    }
    return {
      channelsWithSchedule: this.scheduleMap.size,
      totalProgrammes,
      lastRefreshedAt: this.lastRefreshedAt ? new Date(this.lastRefreshedAt).toISOString() : null,
      isIngesting: this.isIngesting
    };
  }
};
var epgService = EpgService.getInstance();

// apps/api/src/services/adsenseService.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_logging4 = require("@iptv-menu/logging");
var logger4 = new import_logging4.Logger("adsense-service");
var DEFAULT_CLIENT_ID = process.env.VITE_ADSENSE_CLIENT_ID || process.env.ADSENSE_CLIENT_ID || "ca-pub-1578853238313624";
var DEFAULT_SLOTS = {
  topBannerSlot: "8849201938",
  // Designated Area: Workspace Top Header
  bottomBannerSlot: "9938102948",
  // Designated Area: Workspace Bottom Leaderboard
  sidebarSlot: "7748192031",
  // Designated Area: EPG & Sidebar Inspector
  channelListSlot: "6638192042",
  // Designated Area: Channel List Inline
  playerOverlaySlot: "5529102831"
  // Designated Area: Stream Player / Simulator
};
var DEFAULT_CONFIG = {
  enabled: true,
  clientId: DEFAULT_CLIENT_ID,
  testMode: false,
  autoAdsEnabled: false,
  slots: DEFAULT_SLOTS,
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  updatedBy: "system-default"
};
var AdSenseService = class {
  config;
  filePath;
  constructor() {
    this.filePath = import_path.default.resolve(process.cwd(), "data", "adsense_config.json");
    this.config = { ...DEFAULT_CONFIG };
    this.loadFromDisk();
  }
  /**
   * Normalizes client publisher ID to ensure ca-pub- format
   */
  normalizeClientId(raw) {
    if (!raw) return DEFAULT_CLIENT_ID;
    const clean = raw.trim();
    if (clean.startsWith("ca-pub-")) return clean;
    if (clean.startsWith("pub-")) return `ca-${clean}`;
    if (/^\d+$/.test(clean)) return `ca-pub-${clean}`;
    return clean;
  }
  /**
   * Loads saved configuration from local disk persistence
   */
  loadFromDisk() {
    try {
      if (import_fs.default.existsSync(this.filePath)) {
        const raw = import_fs.default.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          this.config = {
            ...DEFAULT_CONFIG,
            ...parsed,
            slots: {
              ...DEFAULT_SLOTS,
              ...parsed.slots || {}
            },
            clientId: this.normalizeClientId(parsed.clientId)
          };
          logger4.info(`Loaded AdSense config from disk (publisher: ${this.config.clientId}, enabled: ${this.config.enabled})`);
          return;
        }
      }
    } catch (err) {
      logger4.warn("Could not read adsense_config.json from disk, falling back to defaults", err);
    }
  }
  /**
   * Persists configuration to disk
   */
  saveToDisk() {
    try {
      const dir = import_path.default.dirname(this.filePath);
      if (!import_fs.default.existsSync(dir)) {
        import_fs.default.mkdirSync(dir, { recursive: true });
      }
      import_fs.default.writeFileSync(this.filePath, JSON.stringify(this.config, null, 2), "utf-8");
      logger4.info(`Persisted AdSense configuration to ${this.filePath}`);
    } catch (err) {
      logger4.warn("Could not persist adsense_config.json to disk", err);
    }
  }
  /**
   * Retrieve active Google AdSense settings
   */
  async getConfig() {
    return { ...this.config, slots: { ...this.config.slots } };
  }
  /**
   * Update Google AdSense settings and persist
   */
  async updateConfig(updates) {
    const nextClientId = updates.clientId ? this.normalizeClientId(updates.clientId) : this.config.clientId;
    const mergedSlots = {
      ...this.config.slots,
      ...updates.slots || {}
    };
    for (const key of Object.keys(mergedSlots)) {
      if (typeof mergedSlots[key] === "string") {
        mergedSlots[key] = mergedSlots[key].trim();
      }
    }
    this.config = {
      ...this.config,
      clientId: nextClientId,
      enabled: updates.enabled !== void 0 ? Boolean(updates.enabled) : this.config.enabled,
      testMode: updates.testMode !== void 0 ? Boolean(updates.testMode) : this.config.testMode,
      autoAdsEnabled: updates.autoAdsEnabled !== void 0 ? Boolean(updates.autoAdsEnabled) : this.config.autoAdsEnabled,
      slots: mergedSlots,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: updates.updatedBy || "admin"
    };
    this.saveToDisk();
    return this.getConfig();
  }
  /**
   * Reset to factory defaults
   */
  async resetToDefaults() {
    this.config = { ...DEFAULT_CONFIG, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    this.saveToDisk();
    return this.getConfig();
  }
};
var adsenseService = new AdSenseService();

// apps/api/src/services/streamHealthProber.ts
var import_logging5 = require("@iptv-menu/logging");
var logger5 = new import_logging5.Logger("stream-health-prober");
var StreamHealthProber = class _StreamHealthProber {
  static instance;
  cache = /* @__PURE__ */ new Map();
  cacheTtlMs = 1e3 * 60 * 15;
  // 15 minutes TTL
  constructor() {
  }
  static getInstance() {
    if (!_StreamHealthProber.instance) {
      _StreamHealthProber.instance = new _StreamHealthProber();
    }
    return _StreamHealthProber.instance;
  }
  /**
   * Probes an upstream stream URL (GET with Range header or fast HEAD)
   * to measure round-trip latency, HTTP status, and MIME format.
   */
  async probeStream(rawUrl, force = false) {
    const cached = this.cache.get(rawUrl);
    if (!force && cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
    const { safe, reason } = isSafeTargetUrl(rawUrl);
    if (!safe) {
      const failedResult = {
        url: rawUrl,
        isOnline: false,
        latencyMs: 0,
        isHls: false,
        corsHeadersPresent: false,
        error: reason || "URL not permitted",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      return failedResult;
    }
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6e3);
    try {
      const response = await fetch(rawUrl, {
        method: "GET",
        headers: {
          "User-Agent": DEFAULT_UPSTREAM_USER_AGENT,
          Range: "bytes=0-1024"
          // Request only first 1KB for minimal bandwidth consumption
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const contentType = response.headers.get("content-type") || "";
      const corsOrigin = response.headers.get("access-control-allow-origin");
      const isOnline = response.ok || response.status === 206 || response.status === 302 || response.status === 301;
      const isHls = contentType.includes("mpegurl") || rawUrl.toLowerCase().includes(".m3u8");
      const result = {
        url: rawUrl,
        isOnline,
        httpStatus: response.status,
        latencyMs,
        contentType,
        isHls,
        corsHeadersPresent: !!corsOrigin,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.cache.set(rawUrl, {
        result,
        expiresAt: Date.now() + this.cacheTtlMs
      });
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const isAbort = err.name === "AbortError";
      const errorResult = {
        url: rawUrl,
        isOnline: false,
        latencyMs,
        isHls: rawUrl.toLowerCase().includes(".m3u8"),
        corsHeadersPresent: false,
        error: isAbort ? "Probe timed out after 6000ms" : err.message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.cache.set(rawUrl, {
        result: errorResult,
        expiresAt: Date.now() + 1e3 * 60 * 2
        // Shorter cache for failures
      });
      return errorResult;
    }
  }
  /**
   * Batch probe up to 10 streams concurrently
   */
  async probeBatch(urls) {
    const limitedUrls = urls.slice(0, 10);
    const results = await Promise.all(limitedUrls.map((u) => this.probeStream(u)));
    const map = {};
    for (let i = 0; i < limitedUrls.length; i++) {
      map[limitedUrls[i]] = results[i];
    }
    return map;
  }
  getCacheSize() {
    return this.cache.size;
  }
  clearCache() {
    this.cache.clear();
  }
};
var streamHealthProber = StreamHealthProber.getInstance();

// apps/api/src/services/logoService.ts
var import_node_http = __toESM(require("node:http"));
var import_node_https = __toESM(require("node:https"));
var import_logging6 = require("@iptv-menu/logging");
var logger6 = new import_logging6.Logger("logo-proxy");
var CACHE_TTL_MS = 12 * 60 * 60 * 1e3;
var MAX_CACHE_ENTRIES = 500;
var logoCache = /* @__PURE__ */ new Map();
var GRADIENT_PALETTES = [
  ["#3b82f6", "#1d4ed8"],
  // Blue
  ["#8b5cf6", "#6d28d9"],
  // Purple
  ["#ec4899", "#be185d"],
  // Pink
  ["#06b6d4", "#0e7490"],
  // Cyan
  ["#10b981", "#047857"],
  // Emerald
  ["#f59e0b", "#b45309"],
  // Amber
  ["#6366f1", "#4338ca"],
  // Indigo
  ["#14b8a6", "#0f766e"],
  // Teal
  ["#f43f5e", "#be123c"]
  // Rose
];
function getPaletteForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[idx];
}
function extractInitials(name) {
  if (!name || !name.trim()) return "TV";
  const clean = name.replace(/[^\w\s]/gi, " ").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "TV";
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
}
function generateLogoSvg(name, size = 120) {
  const [startColor, endColor] = getPaletteForName(name);
  const initials = extractInitials(name);
  const fontSize = Math.round(size * 0.38);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${startColor}" />
      <stop offset="100%" stop-color="${endColor}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#grad)" />
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
  <text x="50%" y="54%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="900" fill="#ffffff" letter-spacing="1" text-anchor="middle" dominant-baseline="middle" filter="url(#shadow)">
    ${initials}
  </text>
</svg>`;
}
async function fetchAndCacheLogo(logoUrl) {
  const cached = logoCache.get(logoUrl);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }
  const check = isSafeTargetUrl(logoUrl);
  if (!check.safe) {
    logger6.warn(`Logo proxy blocked unsafe URL: ${logoUrl} (${check.reason})`);
    return null;
  }
  return new Promise((resolve) => {
    try {
      const parsed = check.parsedUrl || new URL(logoUrl);
      const isHttps = parsed.protocol === "https:";
      const client = isHttps ? import_node_https.default : import_node_http.default;
      const req = client.get(
        parsed.href,
        {
          headers: {
            "User-Agent": DEFAULT_UPSTREAM_USER_AGENT,
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
          },
          timeout: 6e3
        },
        (res) => {
          if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
            fetchAndCacheLogo(res.headers.location).then(resolve);
            return;
          }
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            resolve(null);
            return;
          }
          const contentType = res.headers["content-type"] || "image/png";
          const chunks = [];
          let totalBytes = 0;
          res.on("data", (chunk) => {
            totalBytes += chunk.length;
            if (totalBytes <= 5 * 1024 * 1024) {
              chunks.push(chunk);
            }
          });
          res.on("end", () => {
            const buffer = Buffer.concat(chunks);
            const entry = {
              buffer,
              contentType,
              cachedAt: Date.now()
            };
            if (logoCache.size >= MAX_CACHE_ENTRIES) {
              const firstKey = logoCache.keys().next().value;
              if (firstKey) logoCache.delete(firstKey);
            }
            logoCache.set(logoUrl, entry);
            resolve(entry);
          });
        }
      );
      req.on("error", () => resolve(null));
      req.on("timeout", () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

// apps/api/src/server.ts
var logger7 = new import_logging7.Logger("api-server");
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3001;
var userRepo = new import_db2.UserRepository();
var playlistRepo = new import_db2.PlaylistRepository();
var epgRepo = new import_db2.EpgRepository();
var buildRepo = new import_db2.BuildRepository();
var auditRepo = new import_db2.AuditLogRepository();
var workspaceRepo2 = new import_db2.WorkspaceRepository();
var appConfigRepo = new import_db2.AppConfigRepository();
app.use((0, import_cors.default)({ origin: true }));
app.use((req, res, next) => {
  if (req.originalUrl === "/api/webhooks/stripe" || req.originalUrl === "/api/billing/webhook") {
    next();
  } else {
    import_body_parser.default.json()(req, res, next);
  }
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    env: import_config.config.APP_ENV,
    service: "iptv-api"
  });
});
app.get("/api/public/adsense", async (req, res) => {
  try {
    const adsConfig = await adsenseService.getConfig();
    res.json({
      enabled: adsConfig.enabled,
      clientId: adsConfig.clientId,
      slots: adsConfig.slots,
      testMode: adsConfig.testMode ?? false,
      autoAdsEnabled: adsConfig.autoAdsEnabled ?? false,
      updatedAt: adsConfig.updatedAt
    });
  } catch (err) {
    logger7.error("Failed to retrieve public AdSense configuration", err);
    res.status(500).json({ error: "Failed to retrieve AdSense configuration" });
  }
});
app.get("/api/public/pricing", (req, res) => {
  res.json({
    plans: [
      {
        id: "free",
        name: "Free",
        price: 0,
        priceMonthly: 0,
        priceYearly: 0,
        description: "Perfect for exploring, validating, and parsing individual stream links.",
        features: [
          "1 M3U playlist upload & parser",
          "Web TV stream preview simulator",
          "Sample public IPTV channels",
          "Standard latency buffer settings",
          "Local M3U export & download"
        ]
      },
      {
        id: "pro",
        name: "Pro Streamer",
        price: 9.99,
        priceMonthly: 9.99,
        priceYearly: 7.99,
        stripePriceId: "price_pro_subscription",
        description: "Host, synchronize, and auto-clean live stream feeds.",
        features: [
          "Everything in Free tier",
          "Up to 10 active playlists & 5 hosted remote URLs",
          "Automated Stream Health Prober & dead link pruning",
          "20 daily automated stream cleanups",
          "Integrated live EPG (XMLTV) auto-feed",
          "Fast global CDN caching & sync links"
        ]
      },
      {
        id: "builder",
        name: "App Builder Suite",
        price: 29.99,
        priceMonthly: 29.99,
        priceYearly: 23.99,
        stripePriceId: "price_builder_subscription",
        description: "Launch and distribute white-label Android apps with remote OTA engine.",
        features: [
          "Everything in Pro tier",
          "10 cloud-compiled APK builds / mo (EAS)",
          "Dynamic Remote OTA App Engine (no reinstall needed)",
          "100% white-label branding & custom logos",
          "Direct APK downloads & install QR codes",
          "Dedicated developer support & SLA"
        ]
      }
    ]
  });
});
app.get("/api/public/devices", (req, res) => {
  res.json({
    certified: [
      { id: "shield_tv", brand: "NVIDIA", name: "Shield TV Pro 4K", status: "certified" },
      { id: "firestick_max", brand: "Amazon", name: "Fire TV Stick 4K Max", status: "certified" },
      { id: "chromecast_4k", brand: "Google", name: "Chromecast with Google TV", status: "certified" },
      { id: "formuler_z11", brand: "Formuler", name: "Z11 Pro Max Android Box", status: "certified" }
    ]
  });
});
app.post("/api/public/contact", async (req, res) => {
  const { name, email, message } = req.body;
  logger7.info("Contact request submitted", { name, email });
  res.status(200).json({ success: true, message: "Message sent successfully." });
});
app.post("/api/public/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await userRepo.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: "Account already exists. Please sign in instead." });
    }
    const uid = `usr_${Buffer.from(normalizedEmail).toString("hex").slice(0, 12)}`;
    const tokenPayload = {
      uid,
      sub: uid,
      email: normalizedEmail,
      name: normalizedEmail.split("@")[0],
      role: "user",
      subscriptionTier: "free",
      accountStatus: "active"
    };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");
    await userRepo.createUser({
      uid,
      email: normalizedEmail,
      displayName: normalizedEmail.split("@")[0],
      photoURL: null,
      role: "user",
      subscriptionTier: "free",
      accountStatus: "active",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return res.status(200).json({
      success: true,
      token,
      user: {
        uid,
        email: normalizedEmail,
        displayName: normalizedEmail.split("@")[0],
        role: "user",
        subscriptionTier: "free",
        isPremium: false
      }
    });
  } catch (error) {
    logger7.error("Auth register error", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/public/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === "angelburgosrosado@gmail.com") {
      if (password !== "Admin123") {
        return res.status(401).json({ error: "Invalid password for administrator account." });
      }
      const uid = "admin_angelburgos";
      const tokenPayload2 = {
        uid,
        sub: uid,
        email: "angelburgosrosado@gmail.com",
        name: "Angel Burgos",
        role: "admin",
        subscriptionTier: "builder",
        accountStatus: "active"
      };
      const token2 = Buffer.from(JSON.stringify(tokenPayload2)).toString("base64");
      let profile = await userRepo.getUser(uid);
      if (!profile) {
        await userRepo.createUser({
          uid,
          email: "angelburgosrosado@gmail.com",
          displayName: "Angel Burgos (CEO)",
          photoURL: null,
          role: "admin",
          subscriptionTier: "builder",
          accountStatus: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      return res.status(200).json({
        success: true,
        token: token2,
        user: {
          uid,
          email: "angelburgosrosado@gmail.com",
          displayName: "Angel Burgos (CEO)",
          role: "admin",
          subscriptionTier: "builder",
          isPremium: true
        }
      });
    }
    const user = await userRepo.getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: "Account not found. Please create an account first." });
    }
    const tokenPayload = {
      uid: user.uid,
      sub: user.uid,
      email: user.email,
      name: user.displayName,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      accountStatus: user.accountStatus
    };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");
    return res.status(200).json({
      success: true,
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        isPremium: user.role !== "user" || user.subscriptionTier !== "free"
      }
    });
  } catch (error) {
    logger7.error("Auth login error", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/v1/apps/:appId/config", async (req, res) => {
  try {
    const { appId } = req.params;
    const config2 = await appConfigRepo.getAppConfig(appId);
    if (!config2 || !config2.active) {
      return res.status(404).json({ error: "App configuration not found or currently inactive." });
    }
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json({
      appId: config2.appId,
      name: config2.name,
      slug: config2.slug,
      theme: config2.theme,
      playlistUrl: config2.playlistUrl,
      epgUrl: config2.epgUrl,
      announcement: config2.announcement,
      version: config2.version,
      updatedAt: config2.updatedAt
    });
  } catch (error) {
    logger7.error("Error serving dynamic app config", error);
    res.status(500).json({ error: error.message });
  }
});
app.use("/api/stream", (0, import_cors.default)({ origin: "*" }));
app.get("/api/stream/proxy", handleStreamProxy);
app.head("/api/stream/proxy", handleStreamProxy);
app.options("/api/stream/proxy", handleStreamProxy);
app.get("/api/stream/probe", async (req, res) => {
  const targetUrl = req.query.url || "";
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing required query parameter "url"' });
  }
  const force = req.query.force === "true";
  const result = await streamHealthProber.probeStream(targetUrl, force);
  res.json(result);
});
app.post("/api/stream/probe/batch", async (req, res) => {
  const { urls } = req.body;
  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: 'Expected "urls" array in request body' });
  }
  const results = await streamHealthProber.probeBatch(urls);
  res.json({ results, totalProbed: Object.keys(results).length });
});
app.use("/api/channels", (0, import_cors.default)({ origin: "*" }));
app.post("/api/channels/enrich", async (req, res) => {
  try {
    const { channels } = req.body;
    if (!Array.isArray(channels)) {
      return res.status(400).json({ error: "Expected channels array in request body" });
    }
    const result = await channelMetadataService.enrichChannels(channels);
    res.json(result);
  } catch (error) {
    logger7.error("Error enriching channels", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/channels/metadata/stats", async (req, res) => {
  try {
    res.json(channelMetadataService.getStats());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/channels/logo", async (req, res) => {
  const url = req.query.url || "";
  const name = req.query.name || "";
  if (!url) {
    const svg2 = generateLogoSvg(name || "TV");
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(svg2);
  }
  const cached = await fetchAndCacheLogo(url);
  if (cached) {
    res.setHeader("Content-Type", cached.contentType);
    res.setHeader("Cache-Control", "public, max-age=43200");
    return res.send(cached.buffer);
  }
  const svg = generateLogoSvg(name || "TV");
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(svg);
});
app.get("/api/channels/avatar", (req, res) => {
  const name = req.query.name || "TV";
  const size = Math.min(512, Math.max(32, parseInt(req.query.size, 10) || 120));
  const svg = generateLogoSvg(name, size);
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=604800");
  res.send(svg);
});
app.use("/api/export", (0, import_cors.default)({ origin: "*" }));
app.post("/api/export/playlist.m3u", (req, res) => {
  try {
    const { channels, playlistName, includeGroupTitle, includeLogos, includeEpgInfo } = req.body;
    if (!Array.isArray(channels)) {
      return res.status(400).json({ error: "Expected channels array in request body" });
    }
    const name = playlistName || "IPTV-Curated-Playlist";
    const header = `#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides.json" tvg-shift="0"
#PLAYLIST:${name}
`;
    const entries = channels.map((c) => {
      const tvgId = includeEpgInfo !== false && c.tvgId ? ` tvg-id="${c.tvgId}"` : "";
      const tvgName = includeEpgInfo !== false && c.tvgName ? ` tvg-name="${c.tvgName}"` : ` tvg-name="${c.name || "Channel"}"`;
      const tvgLogo = includeLogos !== false && c.logo ? ` tvg-logo="${c.logo}"` : "";
      const tvgCountry = c.countryCode ? ` tvg-country="${c.countryCode}"` : "";
      const tvgLanguage = c.language ? ` tvg-language="${c.language}"` : "";
      const groupTitle = includeGroupTitle !== false && c.group ? ` group-title="${c.group}"` : "";
      const extinf = `#EXTINF:-1${tvgId}${tvgName}${tvgLogo}${tvgCountry}${tvgLanguage}${groupTitle},${c.name || "Channel"}`;
      return `${extinf}
${c.url}`;
    });
    const m3uContent = header + entries.join("\n") + "\n";
    const filename = `${name.replace(/[^a-zA-Z0-9_-]/g, "_")}.m3u`;
    res.setHeader("Content-Type", "audio/x-mpegurl; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(m3uContent);
  } catch (error) {
    logger7.error("Error generating M3U playlist export", error);
    res.status(500).json({ error: error.message });
  }
});
app.use("/api/xtream", (0, import_cors.default)({ origin: "*" }));
app.get("/api/xtream/epg", async (req, res) => {
  try {
    const serverUrl = req.query.serverUrl || "";
    const username = req.query.username || "";
    const password = req.query.password || "";
    const streamId = req.query.streamId || "";
    const action = req.query.action === "get_simple_data_table" ? "get_simple_data_table" : "get_short_epg";
    const limit = parseInt(req.query.limit, 10) || 10;
    if (!serverUrl || !username || !password || !streamId) {
      return res.status(400).json({
        error: "Missing required parameters: serverUrl, username, password, and streamId are required."
      });
    }
    let baseUrl = serverUrl.trim().replace(/\/+$/, "");
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `http://${baseUrl}`;
    }
    const { safe, reason } = isSafeTargetUrl(baseUrl);
    if (!safe) {
      return res.status(403).json({ error: reason || "Access to private or loopback addresses is prohibited." });
    }
    const targetUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}&stream_id=${encodeURIComponent(streamId)}${action === "get_short_epg" ? `&limit=${limit}` : ""}`;
    const upstreamRes = await fetch(targetUrl, { signal: AbortSignal.timeout(8e3) });
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        error: `Upstream Xtream server returned HTTP ${upstreamRes.status}`
      });
    }
    const data = await upstreamRes.json().catch(() => null);
    const listings = data && Array.isArray(data.epg_listings) ? data.epg_listings : Array.isArray(data) ? data : [];
    res.json({
      success: true,
      streamId,
      action,
      totalListings: listings.length,
      listings
    });
  } catch (error) {
    logger7.error("Error proxying Xtream EPG request", error);
    res.status(500).json({ error: error.message || "Internal server error while fetching Xtream EPG" });
  }
});
app.use("/api/epg/live", (0, import_cors.default)({ origin: "*" }));
app.use("/api/epg/schedule", (0, import_cors.default)({ origin: "*" }));
app.get("/api/epg/live", async (req, res) => {
  try {
    const rawIds = req.query.channelIds || "";
    const channelIds = rawIds ? rawIds.split(",").map((id) => id.trim()).filter(Boolean) : [];
    const liveMap = epgService.getNowNext(channelIds);
    res.json({
      channels: liveMap,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger7.error("Error serving live EPG", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/epg/schedule/:channelId", async (req, res) => {
  try {
    const { channelId } = req.params;
    const hours = Number(req.query.hours) || 24;
    const schedule = epgService.getSchedule(channelId, hours);
    res.json({
      channelId,
      hours,
      programmes: schedule
    });
  } catch (error) {
    logger7.error("Error serving channel schedule", error);
    res.status(500).json({ error: error.message });
  }
});
app.use("/api/me", import_auth.authenticateFirebaseToken);
app.use("/api/playlists", import_auth.authenticateFirebaseToken, attachWorkspaceContext);
app.use("/api/epg", import_auth.authenticateFirebaseToken, attachWorkspaceContext);
app.use("/api/builds", import_auth.authenticateFirebaseToken, attachWorkspaceContext);
app.use("/api/apps", import_auth.authenticateFirebaseToken, attachWorkspaceContext);
app.use("/api/billing/create-checkout-session", import_auth.authenticateFirebaseToken);
app.use("/api/billing/create-portal-session", import_auth.authenticateFirebaseToken);
app.use("/api/workspaces", import_auth.authenticateFirebaseToken);
app.get("/api/me", async (req, res) => {
  try {
    const uid = req.user.uid;
    let profile = await userRepo.getUser(uid);
    if (!profile) {
      const newProfile = {
        uid,
        email: req.user.email || "",
        displayName: req.user.name || null,
        photoURL: req.user.picture || null,
        role: "user",
        subscriptionTier: "free",
        accountStatus: "active",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await userRepo.createUser(newProfile);
      profile = newProfile;
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.patch("/api/me/profile", async (req, res) => {
  try {
    const uid = req.user.uid;
    const { displayName, photoURL } = req.body;
    await userRepo.updateUser(uid, { displayName, photoURL });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/me/subscription", async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await userRepo.getUser(uid);
    res.json({
      uid,
      tier: profile?.subscriptionTier || "free",
      status: profile?.accountStatus || "active"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/playlists", checkWorkspaceQuota("maxPlaylists"), async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, sourceType, originalFileName } = req.body;
    const playlistId = `pl_${Math.random().toString(36).substring(2, 15)}`;
    const originalFilePath = `users/${uid}/uploads/${playlistId}_${originalFileName || "playlist.m3u"}`;
    const uploadUrl = await (0, import_storage.getSignedUrl)(import_config.config.GCS_UPLOAD_BUCKET, originalFilePath, "write");
    const playlist = {
      playlistId,
      uid,
      name,
      sourceType,
      originalFilePath,
      cleanedFilePath: null,
      channelCount: 0,
      status: "pending",
      visibility: "private",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await playlistRepo.createPlaylist(playlist);
    res.status(201).json({ playlist, uploadUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/playlists", async (req, res) => {
  try {
    const uid = req.user.uid;
    const list = await playlistRepo.listUserPlaylists(uid);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/playlists/:playlistId", async (req, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/playlists/:playlistId", async (req, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    if (playlist.originalFilePath) {
      await (0, import_storage.deleteFromBucket)(import_config.config.GCS_UPLOAD_BUCKET, playlist.originalFilePath).catch(() => {
      });
    }
    if (playlist.cleanedFilePath) {
      await (0, import_storage.deleteFromBucket)(import_config.config.GCS_OUTPUT_BUCKET, playlist.cleanedFilePath).catch(() => {
      });
    }
    await playlistRepo.deletePlaylist(playlistId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/playlists/:playlistId/parse", async (req, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    const runId = await (0, import_jobs.dispatchPlaylistJob)(playlistId, "parse");
    res.json({ success: true, runId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/playlists/:playlistId/clean", async (req, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    const runId = await (0, import_jobs.dispatchPlaylistJob)(playlistId, "clean");
    res.json({ success: true, runId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/playlists/:playlistId/validate", async (req, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    const runId = await (0, import_jobs.dispatchPlaylistJob)(playlistId, "validate");
    res.json({ success: true, runId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/playlists/:playlistId/runs", async (req, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    const runs = await playlistRepo.getPlaylistRuns(playlistId);
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/epg", checkWorkspaceQuota("maxHostedPlaylists"), async (req, res) => {
  try {
    const uid = req.user.uid;
    const { playlistId, urls, refreshIntervalHours } = req.body;
    const epgId = `epg_${Math.random().toString(36).substring(2, 15)}`;
    const feed = {
      epgId,
      uid,
      playlistId,
      status: "pending",
      sourceConfig: { urls, refreshIntervalHours },
      outputFilePath: `users/${uid}/epg/${epgId}_xmltv.xml`,
      lastGeneratedAt: null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await epgRepo.createEpg(feed);
    await (0, import_jobs.dispatchEpgJob)(epgId);
    res.status(201).json({ success: true, epgId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/epg", async (req, res) => {
  try {
    const uid = req.user.uid;
    const list = await epgRepo.listUserEpgs(uid);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/epg/:epgId", async (req, res) => {
  try {
    const { epgId } = req.params;
    const epg = await epgRepo.getEpg(epgId);
    if (!epg || epg.uid !== req.user.uid) {
      return res.status(404).json({ error: "EPG Feed not found" });
    }
    res.json(epg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/epg/sync", async (req, res) => {
  try {
    const { urls } = req.body || {};
    const targetUrls = Array.isArray(urls) && urls.length > 0 ? urls : ["https://iptv-org.github.io/epg/guides/us.xml"];
    const result = await epgService.fetchAndIngestFeeds(targetUrls);
    await channelMetadataService.refreshIndex();
    res.json({ success: true, ...result });
  } catch (error) {
    logger7.error("Error executing EPG sync", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/workspaces", async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name } = req.body;
    const workspaceId = `ws_${Math.random().toString(36).substring(2, 15)}`;
    const newWorkspace = {
      workspaceId,
      name,
      ownerUid: uid,
      plan: "free",
      subscriptionStatus: "active",
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      entitlements: {
        maxPlaylists: 1,
        maxHostedPlaylists: 0,
        maxDailyCleanups: 1,
        maxMonthlyBuilds: 0,
        allowBrandingCustomization: false,
        allowWhiteLabel: false
      },
      usage: {
        activePlaylistsCount: 0,
        activeHostedPlaylistsCount: 0,
        dailyCleanupsUsed: 0,
        monthlyBuildsUsed: 0
      },
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await workspaceRepo2.createWorkspace(newWorkspace);
    res.status(201).json(newWorkspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/workspaces", async (req, res) => {
  try {
    const uid = req.user.uid;
    let list = await workspaceRepo2.listUserWorkspaces(uid);
    if (list.length === 0) {
      const workspaceId = `ws_${Math.random().toString(36).substring(2, 15)}`;
      const personalWs = {
        workspaceId,
        name: "Personal Workspace",
        ownerUid: uid,
        plan: "free",
        subscriptionStatus: "active",
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        entitlements: {
          maxPlaylists: 1,
          maxHostedPlaylists: 0,
          maxDailyCleanups: 1,
          maxMonthlyBuilds: 0,
          allowBrandingCustomization: false,
          allowWhiteLabel: false
        },
        usage: {
          activePlaylistsCount: 0,
          activeHostedPlaylistsCount: 0,
          dailyCleanupsUsed: 0,
          monthlyBuildsUsed: 0
        },
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await workspaceRepo2.createWorkspace(personalWs);
      list = [personalWs];
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/workspaces/:workspaceId", async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const ws = await workspaceRepo2.getWorkspace(workspaceId);
    if (!ws || ws.ownerUid !== req.user.uid) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    res.json(ws);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/builds", checkWorkspaceQuota("maxMonthlyBuilds"), async (req, res) => {
  try {
    const uid = req.user.uid;
    const { appName, brandConfig, playlistSource, appConfigId } = req.body;
    const buildId = await (0, import_jobs.dispatchBuildJob)(uid, appName, brandConfig, playlistSource, appConfigId);
    if (req.workspace) {
      const currentUsed = req.workspace.usage?.monthlyBuildsUsed || 0;
      await workspaceRepo2.updateWorkspace(req.workspace.workspaceId, {
        usage: {
          ...req.workspace.usage,
          monthlyBuildsUsed: currentUsed + 1
        }
      });
      logger7.info("Tracked build quota usage in workspace", {
        workspaceId: req.workspace.workspaceId,
        monthlyBuildsUsed: currentUsed + 1
      });
    }
    res.status(201).json({ success: true, buildId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/builds", async (req, res) => {
  try {
    const uid = req.user.uid;
    const list = await buildRepo.listUserBuilds(uid);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/builds/:buildId", async (req, res) => {
  try {
    const { buildId } = req.params;
    const build = await buildRepo.getBuild(buildId);
    if (!build || build.uid !== req.user.uid) {
      return res.status(404).json({ error: "Build request not found" });
    }
    res.json(build);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/apps", async (req, res) => {
  try {
    const workspaceId = req.workspace.workspaceId;
    const list = await appConfigRepo.listAppConfigsByWorkspace(workspaceId);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/apps", async (req, res) => {
  try {
    const { name, theme, playlistUrl, epgUrl, announcement } = req.body;
    if (!name || !playlistUrl) {
      return res.status(400).json({ error: "App name and playlistUrl are required." });
    }
    const workspaceId = req.workspace.workspaceId;
    const uid = req.user.uid;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const appId = `app_${slug}_${Math.random().toString(36).substring(2, 7)}`;
    const created = await appConfigRepo.createAppConfig({
      appId,
      workspaceId,
      ownerUid: uid,
      name,
      slug,
      theme: theme || { primaryColor: "#059669", accentColor: "#f59e0b" },
      playlistUrl,
      epgUrl: epgUrl || null,
      announcement: announcement || null,
      active: true
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/apps/:appId", async (req, res) => {
  try {
    const { appId } = req.params;
    const config2 = await appConfigRepo.getAppConfig(appId);
    if (!config2 || config2.workspaceId !== req.workspace.workspaceId) {
      return res.status(404).json({ error: "App configuration not found." });
    }
    res.json(config2);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/apps/:appId", async (req, res) => {
  try {
    const { appId } = req.params;
    const existing = await appConfigRepo.getAppConfig(appId);
    if (!existing || existing.workspaceId !== req.workspace.workspaceId) {
      return res.status(404).json({ error: "App configuration not found." });
    }
    const { name, theme, playlistUrl, epgUrl, announcement, active } = req.body;
    const updated = await appConfigRepo.updateAppConfig(appId, {
      ...name !== void 0 && { name },
      ...theme !== void 0 && { theme },
      ...playlistUrl !== void 0 && { playlistUrl },
      ...epgUrl !== void 0 && { epgUrl },
      ...announcement !== void 0 && { announcement },
      ...active !== void 0 && { active }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/apps/:appId", async (req, res) => {
  try {
    const { appId } = req.params;
    const existing = await appConfigRepo.getAppConfig(appId);
    if (!existing || existing.workspaceId !== req.workspace.workspaceId) {
      return res.status(404).json({ error: "App configuration not found." });
    }
    await appConfigRepo.deleteAppConfig(appId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
var STRIPE_PRICE_MAP = {
  price_pro_monthly: import_config.config.STRIPE_PRICE_PRO_MONTHLY || "price_1UHwUyKXruwBPCzFT7aMvpJ6",
  price_pro_yearly: import_config.config.STRIPE_PRICE_PRO_YEARLY || "price_1UHwUzKXruwBPCzF2iAGrzwY",
  price_pro_lifetime: import_config.config.STRIPE_PRICE_PRO_LIFETIME || "price_1UHwUzKXruwBPCzFk6J0hUie",
  price_builder_monthly: import_config.config.STRIPE_PRICE_BUILDER_MONTHLY || "price_1UHwUzKXruwBPCzFCGewmHQf",
  price_builder_yearly: import_config.config.STRIPE_PRICE_BUILDER_YEARLY || "price_1UHwUzKXruwBPCzF4WJ4W6hQ",
  price_builder_lifetime: import_config.config.STRIPE_PRICE_BUILDER_LIFETIME || "price_1UHwUzKXruwBPCzFfophCqlM"
};
app.post("/api/billing/create-checkout-session", async (req, res) => {
  try {
    const uid = req.user.uid;
    const { priceId, successUrl, cancelUrl, mode = "subscription" } = req.body;
    const profile = await userRepo.getUser(uid);
    if (!profile) return res.status(404).json({ error: "User profile not found" });
    const stripeCustomerId = await (0, import_billing.createOrRetrieveCustomer)(profile.email, profile.displayName || profile.email);
    const resolvedPriceId = STRIPE_PRICE_MAP[priceId] || priceId;
    const url = await (0, import_billing.createCheckoutSession)(
      stripeCustomerId,
      profile.email,
      resolvedPriceId,
      successUrl,
      cancelUrl,
      { uid, email: profile.email, priceId: priceId || "", resolvedPriceId },
      mode
    );
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/billing/create-portal-session", async (req, res) => {
  try {
    const uid = req.user.uid;
    const { returnUrl } = req.body;
    const profile = await userRepo.getUser(uid);
    if (!profile) return res.status(404).json({ error: "User profile not found" });
    const stripeCustomerId = await (0, import_billing.createOrRetrieveCustomer)(profile.email, profile.displayName || profile.email);
    const url = await (0, import_billing.createBillingPortalSession)(stripeCustomerId, returnUrl);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
var handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = (0, import_billing.verifyWebhookSignature)(req.body, sig, import_config.config.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const uid = session.metadata?.uid;
      const planPriceId = session.line_items?.data?.[0]?.price?.id || session.metadata?.resolvedPriceId || session.metadata?.priceId;
      const isBuilder = planPriceId === "price_builder_subscription" || planPriceId === "price_enterprise_tier" || planPriceId === import_config.config.STRIPE_PRICE_BUILDER_MONTHLY || planPriceId === import_config.config.STRIPE_PRICE_BUILDER_YEARLY || planPriceId === import_config.config.STRIPE_PRICE_BUILDER_LIFETIME || planPriceId === "price_1UHwUzKXruwBPCzFCGewmHQf" || planPriceId === "price_1UHwUzKXruwBPCzF4WJ4W6hQ" || planPriceId === "price_1UHwUzKXruwBPCzFfophCqlM" || planPriceId === "price_1UHvjdKXruwBPCzFuZMwZsy6" || planPriceId === "price_1UHvjdKXruwBPCzFQm7p0Mtb" || planPriceId === "price_1UHvjdKXruwBPCzFXp3aW0yP" || planPriceId?.includes("builder") || planPriceId?.includes("enterprise");
      const tier = isBuilder ? "builder" : "pro";
      if (uid) {
        await userRepo.updateUser(uid, { subscriptionTier: tier });
        logger7.info(`Upgraded user tier via Stripe webhook`, { uid, tier, planPriceId });
        const userWorkspaces = await workspaceRepo2.listUserWorkspaces(uid);
        for (const ws of userWorkspaces) {
          const entitlements = isBuilder ? {
            maxPlaylists: 20,
            maxHostedPlaylists: 10,
            maxDailyCleanups: 50,
            maxMonthlyBuilds: 5,
            allowBrandingCustomization: true,
            allowWhiteLabel: true
          } : {
            maxPlaylists: 10,
            maxHostedPlaylists: 5,
            maxDailyCleanups: 20,
            maxMonthlyBuilds: 0,
            allowBrandingCustomization: false,
            allowWhiteLabel: false
          };
          await workspaceRepo2.updateWorkspace(ws.workspaceId, {
            plan: tier === "pro" ? "starter" : tier,
            subscriptionStatus: "active",
            stripeCustomerId: session.customer || ws.stripeCustomerId,
            stripeSubscriptionId: session.subscription || ws.stripeSubscriptionId,
            entitlements
          });
          logger7.info(`Promoted workspace entitlements via Stripe webhook`, {
            workspaceId: ws.workspaceId,
            tier,
            maxMonthlyBuilds: entitlements.maxMonthlyBuilds,
            allowWhiteLabel: entitlements.allowWhiteLabel
          });
        }
      }
    }
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const stripe = require("stripe")(import_config.config.STRIPE_SECRET_KEY);
      const customer = await stripe.customers.retrieve(customerId);
      const email = customer.email;
      if (email) {
        const user = await userRepo.getUserByEmail(email);
        if (user) {
          const uid = user.uid;
          await userRepo.updateUser(uid, { subscriptionTier: "free" });
          const userWorkspaces = await workspaceRepo2.listUserWorkspaces(uid);
          for (const ws of userWorkspaces) {
            await workspaceRepo2.updateWorkspace(ws.workspaceId, {
              plan: "free",
              subscriptionStatus: "canceled",
              entitlements: {
                maxPlaylists: 1,
                maxHostedPlaylists: 0,
                maxDailyCleanups: 1,
                maxMonthlyBuilds: 0,
                allowBrandingCustomization: false,
                allowWhiteLabel: false
              }
            });
          }
          logger7.info(`Downgraded user & workspaces due to Stripe subscription cancellation`, { uid });
        }
      }
    }
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      if (subscriptionId) {
        try {
          const stripe = require("stripe")(import_config.config.STRIPE_SECRET_KEY);
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const uid = sub.metadata?.uid;
          if (uid) {
            const userWorkspaces = await workspaceRepo2.listUserWorkspaces(uid);
            for (const ws of userWorkspaces) {
              await workspaceRepo2.updateWorkspace(ws.workspaceId, {
                usage: {
                  ...ws.usage,
                  monthlyBuildsUsed: 0,
                  dailyCleanupsUsed: 0
                }
              });
              logger7.info("Reset workspace monthly build quotas for new billing cycle", {
                workspaceId: ws.workspaceId,
                uid
              });
            }
          }
        } catch (subErr) {
          logger7.warn("Could not inspect subscription for cycle reset", subErr);
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    logger7.error("Stripe event parsing failure", err);
    res.status(500).json({ error: "Internal logic handler failed" });
  }
};
app.post("/api/webhooks/stripe", import_body_parser.default.raw({ type: "application/json" }), handleStripeWebhook);
app.post("/api/billing/webhook", import_body_parser.default.raw({ type: "application/json" }), handleStripeWebhook);
app.post("/api/internal/jobs/playlist-clean", async (req, res) => {
  logger7.info("Internal route invoked to trigger cleaning queue run");
  res.json({ success: true, processed: 0 });
});
app.post("/api/internal/jobs/playlist-validate", async (req, res) => {
  logger7.info("Internal route invoked to trigger validate queue run");
  res.json({ success: true, processed: 0 });
});
var adminGuard = [import_auth.authenticateFirebaseToken, (0, import_auth.authorizeRoles)(["admin"])];
app.get("/api/admin/metrics", adminGuard, async (req, res) => {
  try {
    let dbStatus = "operational";
    let dbLatencyMs = 0;
    if (process.env.DATABASE_URL) {
      try {
        const start = Date.now();
        const dbModule = await import("@iptv-menu/db");
        const db = dbModule.getDb();
        const { sql } = await import("drizzle-orm");
        await db.execute(sql`SELECT 1`);
        dbLatencyMs = Date.now() - start;
      } catch (dbErr) {
        dbStatus = "degraded";
      }
    }
    const [users, playlists, workspaces, builds, auditLogs] = await Promise.all([
      userRepo.listUsers(500).catch(() => []),
      playlistRepo.listAllPlaylists().catch(() => []),
      workspaceRepo2.listAllWorkspaces(500).catch(() => []),
      buildRepo.listAllBuilds().catch(() => []),
      auditRepo.listActions(50).catch(() => [])
    ]);
    const buildsByStatus = {
      queued: builds.filter((b) => b.status === "queued").length,
      building: builds.filter((b) => b.status === "building").length,
      completed: builds.filter((b) => b.status === "completed").length,
      failed: builds.filter((b) => b.status === "failed").length
    };
    const usersByRole = {
      free: users.filter((u) => u.subscriptionTier === "free" || !u.subscriptionTier).length,
      pro: users.filter((u) => u.subscriptionTier === "pro").length,
      builder: users.filter((u) => u.subscriptionTier === "builder").length,
      admin: users.filter((u) => u.role === "admin").length
    };
    const memory = process.memoryUsage();
    res.json({
      system: {
        status: "operational",
        env: import_config.config.APP_ENV,
        service: "iptv-api",
        stack: "Vercel / Neon PostgreSQL / Render Worker",
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        memory: {
          rssMb: Math.round(memory.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024))
        },
        database: {
          driver: "Neon Serverless (PostgreSQL)",
          status: dbStatus,
          latencyMs: dbLatencyMs
        },
        storage: {
          driver: process.env.BLOB_READ_WRITE_TOKEN ? "Vercel Blob" : "Dual-driver / Object Store",
          status: "ready"
        }
      },
      counts: {
        totalUsers: users.length,
        totalPlaylists: playlists.length,
        totalWorkspaces: workspaces.length,
        totalBuilds: builds.length,
        totalAuditLogs: auditLogs.length
      },
      buildsByStatus,
      usersByRole
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/users", adminGuard, async (req, res) => {
  try {
    const list = await userRepo.listUsers();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/users/:userId", adminGuard, async (req, res) => {
  try {
    const profile = await userRepo.getUser(req.params.userId);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.patch("/api/admin/users/:userId/role", adminGuard, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    await userRepo.updateUser(userId, { role });
    try {
      const firebaseAdmin = (0, import_auth.getFirebaseAdmin)();
      if (firebaseAdmin && typeof firebaseAdmin.auth === "function") {
        await firebaseAdmin.auth().setCustomUserClaims(userId, { role });
      }
    } catch (authErr) {
      logger7.warn("Could not sync custom claims with Firebase Admin", authErr);
    }
    const adminAction = {
      actionId: `act_${Math.random().toString(36).substring(2, 15)}`,
      adminUid: req.user.uid,
      actionType: "ROLE_UPDATE",
      targetType: "user",
      targetId: userId,
      notes: `Updated role to: ${role}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await auditRepo.logAction(adminAction);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.patch("/api/admin/users/:userId/status", adminGuard, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    await userRepo.updateUser(userId, { accountStatus: status });
    try {
      const firebaseAdmin = (0, import_auth.getFirebaseAdmin)();
      if (firebaseAdmin && typeof firebaseAdmin.auth === "function") {
        if (status === "suspended") {
          await firebaseAdmin.auth().revokeRefreshTokens(userId);
        }
        await firebaseAdmin.auth().setCustomUserClaims(userId, { accountStatus: status });
      }
    } catch (authErr) {
      logger7.warn("Could not sync session revocation with Firebase Admin", authErr);
    }
    const adminAction = {
      actionId: `act_${Math.random().toString(36).substring(2, 15)}`,
      adminUid: req.user.uid,
      actionType: "STATUS_UPDATE",
      targetType: "user",
      targetId: userId,
      notes: `Set account status to: ${status}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await auditRepo.logAction(adminAction);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/playlists", adminGuard, async (req, res) => {
  try {
    const list = await playlistRepo.listAllPlaylists();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/workspaces", adminGuard, async (req, res) => {
  try {
    const list = await workspaceRepo2.listAllWorkspaces(200);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.patch("/api/admin/workspaces/:workspaceId/quota", adminGuard, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { entitlements, usage, plan } = req.body;
    const existing = await workspaceRepo2.getWorkspace(workspaceId);
    if (!existing) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    await workspaceRepo2.updateWorkspace(workspaceId, {
      ...plan && { plan },
      ...entitlements && { entitlements: { ...existing.entitlements, ...entitlements } },
      ...usage && { usage: { ...existing.usage, ...usage } }
    });
    const adminAction = {
      actionId: `act_${Math.random().toString(36).substring(2, 15)}`,
      adminUid: req.user.uid,
      actionType: "WORKSPACE_QUOTA_UPDATE",
      targetType: "workspace",
      targetId: workspaceId,
      notes: `Updated quota/entitlements: ${JSON.stringify(req.body)}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await auditRepo.logAction(adminAction);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/jobs", adminGuard, async (req, res) => {
  try {
    const builds = await buildRepo.listAllBuilds();
    res.json({
      buildJobs: builds.slice(0, 50)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/admin/jobs/:jobType/:jobId/retry", adminGuard, async (req, res) => {
  try {
    const { jobType, jobId } = req.params;
    if (jobType === "build") {
      await buildRepo.updateBuild(jobId, { status: "queued", buildLogPath: null });
    }
    const adminAction = {
      actionId: `act_${Math.random().toString(36).substring(2, 15)}`,
      adminUid: req.user.uid,
      actionType: "JOB_RETRY",
      targetType: jobType,
      targetId: jobId,
      notes: `Admin triggered retry for ${jobType} job ${jobId}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await auditRepo.logAction(adminAction);
    res.json({ success: true, message: `Job ${jobId} reset to queued` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/audit-logs", adminGuard, async (req, res) => {
  try {
    const logs = await auditRepo.listActions();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/adsense", adminGuard, async (req, res) => {
  try {
    const config2 = await adsenseService.getConfig();
    res.json(config2);
  } catch (err) {
    logger7.error("Failed to retrieve admin AdSense configuration", err);
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/admin/adsense", adminGuard, async (req, res) => {
  try {
    const { clientId, enabled, testMode, autoAdsEnabled, slots } = req.body;
    const updatedConfig = await adsenseService.updateConfig({
      clientId,
      enabled: typeof enabled === "boolean" ? enabled : void 0,
      testMode: typeof testMode === "boolean" ? testMode : void 0,
      autoAdsEnabled: typeof autoAdsEnabled === "boolean" ? autoAdsEnabled : void 0,
      slots: slots && typeof slots === "object" ? slots : void 0,
      updatedBy: req.user?.email || req.user?.uid || "admin"
    });
    const adminAction = {
      actionId: `act_${Math.random().toString(36).substring(2, 15)}`,
      adminUid: req.user?.uid || "admin",
      actionType: "ADSENSE_CONFIG_UPDATE",
      targetType: "SYSTEM_SETTINGS",
      targetId: "adsense",
      notes: `Updated Google AdSense configuration (Publisher: ${updatedConfig.clientId}, Enabled: ${updatedConfig.enabled})`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await auditRepo.logAction(adminAction);
    res.json({
      success: true,
      message: "Google AdSense settings updated successfully",
      config: updatedConfig
    });
  } catch (err) {
    logger7.error("Failed to update AdSense configuration", err);
    res.status(500).json({ error: err.message });
  }
});
if (!process.env.VERCEL && (typeof require !== "undefined" && require.main === module)) {
  app.listen(PORT, "0.0.0.0", () => {
    logger7.info(`IPTV REST API Server is boot-running successfully on port ${PORT}`);
  });
}
var server_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
