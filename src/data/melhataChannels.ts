/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel } from "../types/iptv";

export const MELHATA_XTREAM_CONFIG = {
  serverUrl: "",
  username: "",
  password: "",
  name: "Custom Xtream Account"
};

export function createMelhataChannels(username = '', password = '', serverUrl = ''): Channel[] {
  return [];
}

/**
 * Empty by default. No preloaded streams, channels, or credentials are provided.
 * Channels are exclusively loaded when added by the user via Xtream Codes or M3U playlist.
 */
export const MELHATA_CHANNELS: Channel[] = [];
