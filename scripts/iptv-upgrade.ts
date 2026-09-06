/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  PlaylistChannel,
  UpgradeAppConfig,
  Json
} from '../src/types/iptv';
import {
  readJson,
  writeJson,
  buildIptvOrgIndex,
  enrichChannels,
  buildCountrySections,
  readPublicXmltvDirectory,
  mergeProgrammes,
  generateCountryMarkup,
  generateReactSectionPatch
} from '../src/utils/channelEnrichment';

export async function runIptvUpgrade(customConfigPath?: string) {
  const configPath = customConfigPath || 'config/iptv-upgrade.config.json';
  
  const config = await readJson<UpgradeAppConfig>(configPath, {
    paths: {
      channelsFile: 'data/channels.json',
      iptvOrgChannelsFile: 'data/iptv-org/channels.json',
      iptvOrgCountriesFile: 'data/iptv-org/countries.json',
      publicXmltvDirectory: 'data/xmltv/public',
      outputDirectory: 'output/iptv-upgrade-artifacts'
    },
    epg: {
      timezone: 'UTC',
      providers: [
        {
          key: 'licensed-primary',
          kind: 'licensed',
          priority: 1,
          enabled: true,
          baseUrl: 'https://licensed-epg.example.com',
          token: 'ENV_LICENSED_EPG_TOKEN'
        },
        {
          key: 'open-epg',
          kind: 'public-xmltv',
          priority: 2,
          enabled: true,
          baseUrl: 'https://public-xmltv.example.com'
        },
        {
          key: 'community-country-feeds',
          kind: 'community',
          priority: 3,
          enabled: true
        }
      ],
      fallbackWindowHours: 12,
      includeUnmatchedChannels: true
    }
  });

  console.log(`[IPTV Upgrade] Reading channels from: ${config.paths.channelsFile}`);
  const channels = await readJson<PlaylistChannel[]>(config.paths.channelsFile, [
    {
      id: 'us-cnn-demo',
      name: 'CNN International',
      url: 'https://sample-stream.example.com/cnn.m3u8',
      group: 'News',
      tvgCountry: 'US',
      countryCode: 'US'
    },
    {
      id: 'mx-azteca-demo',
      name: 'Azteca 7',
      url: 'https://sample-stream.example.com/azteca.m3u8',
      group: 'Entertainment',
      tvgCountry: 'MX',
      countryCode: 'MX'
    },
    {
      id: 'pr-wapa-demo',
      name: 'WAPA TV',
      url: 'https://sample-stream.example.com/wapa.m3u8',
      group: 'General',
      tvgCountry: 'PR',
      countryCode: 'PR'
    }
  ]);

  console.log(`[IPTV Upgrade] Loaded ${channels.length} source channels`);

  const iptvOrgChannels = await readJson<Json[]>(config.paths.iptvOrgChannelsFile, [
    {
      id: 'cnn-us',
      name: 'CNN International',
      country: 'US',
      category: 'News',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/CNN.svg',
      lang: 'en'
    },
    {
      id: 'azteca7-mx',
      name: 'Azteca 7',
      country: 'MX',
      category: 'Entertainment',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Azteca_7_logo.png',
      lang: 'es'
    }
  ]);

  const iptvOrgCountries = await readJson<Json[]>(config.paths.iptvOrgCountriesFile, [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'MX', name: 'Mexico' },
    { code: 'PR', name: 'Puerto Rico' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'GB', name: 'United Kingdom' }
  ]);

  const publicProgrammes = await readPublicXmltvDirectory(config.paths.publicXmltvDirectory);

  const iptvOrgIndex = buildIptvOrgIndex(iptvOrgChannels);
  const enrichedChannels = enrichChannels(channels, iptvOrgIndex);
  const countrySections = buildCountrySections(enrichedChannels, iptvOrgCountries);
  const mergedProgrammes = mergeProgrammes([], publicProgrammes, config.epg.fallbackWindowHours);

  const outDir = config.paths.outputDirectory;
  await fs.mkdir(outDir, { recursive: true });

  await writeJson(path.join(outDir, 'channels.enriched.json'), enrichedChannels);
  await writeJson(path.join(outDir, 'channels.by-country.json'), countrySections);
  await writeJson(path.join(outDir, 'epg.public-merged.json'), mergedProgrammes);
  await fs.writeFile(path.join(outDir, 'country-sections.html'), generateCountryMarkup(countrySections));
  await fs.writeFile(path.join(outDir, 'CountryChannelSections.tsx'), generateReactSectionPatch());
  await fs.writeFile(
    path.join(outDir, 'README.md'),
    `# IPTV format upgrade\n\nThis script adds:\n- iptv-org metadata enrichment for channel names, logos, groups, and country codes\n- country-divided channel sections for the UI\n- improved public XMLTV feed ingestion and merge output\n- a provider stack that treats XMLTV as the interchange layer and a licensed EPG source as the primary schedule backbone\n\n## Recommended integration points\n1. Extend your Channel interface with countryCode, language, epgChannelId, and metadataSource.\n2. Run this script in CI after playlist ingestion and before frontend build publication.\n3. Point the app's country browser page to channels.by-country.json or the generated TSX component.\n4. Replace the placeholder licensed provider URL with your real commercial EPG API and inject credentials through environment variables.\n5. Keep public XMLTV feeds as fallback-only data and prefer the licensed provider when duplicate schedule rows exist.\n`
  );

  console.log(`[IPTV Upgrade] Successfully written upgrade artifacts to: ${outDir}`);
  return {
    enrichedCount: enrichedChannels.length,
    countryCount: countrySections.length,
    programmeCount: mergedProgrammes.length,
    outDir
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runIptvUpgrade().catch((error) => {
    console.error('[IPTV Upgrade Error]:', error);
    process.exit(1);
  });
}
