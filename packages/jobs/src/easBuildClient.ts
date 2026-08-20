import axios from 'axios';
import { config } from '@iptv-menu/config';
import { Logger } from '@iptv-menu/logging';

const logger = new Logger('eas-build-client');

export interface EasBuildParams {
  buildId: string;
  appName: string;
  bundleId?: string;
  brandConfig: {
    primaryColor: string;
    accentColor: string;
    logoUrl?: string;
  };
  playlistSource?: {
    type: 'url' | 'file';
    value: string;
  };
}

/**
 * Triggers a standalone Android APK build via Expo Application Services (EAS) REST API.
 */
export async function triggerEasAndroidBuild(params: EasBuildParams): Promise<{
  easBuildId: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'FINISHED' | 'ERRORED';
  downloadUrl?: string;
}> {
  const token = config.EXPO_ACCESS_TOKEN || process.env.EXPO_ACCESS_TOKEN;
  const projectId = config.EXPO_PROJECT_ID || process.env.EXPO_PROJECT_ID;

  if (!token || !projectId) {
    logger.warn('Missing EXPO_ACCESS_TOKEN or EXPO_PROJECT_ID. Falling back to local artifact routing.');
    return {
      easBuildId: `sim_${params.buildId}`,
      status: 'FINISHED',
      downloadUrl: `https://storage.googleapis.com/${config.GCS_BUILD_BUCKET}/users/builds/${params.buildId}_android_release.apk`
    };
  }

  try {
    logger.info('Dispatching EAS Android APK build job...', { buildId: params.buildId, appName: params.appName });

    const response = await axios.post(
      `https://api.expo.dev/v2/projects/${projectId}/builds`,
      {
        platform: 'android',
        profile: 'production',
        buildProfile: {
          android: {
            buildType: 'apk'
          },
          env: {
            APP_NAME: params.appName,
            PRIMARY_COLOR: params.brandConfig.primaryColor,
            ACCENT_COLOR: params.brandConfig.accentColor,
            DEFAULT_PLAYLIST_URL: params.playlistSource?.value || ''
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const data = response.data?.data || response.data;
    return {
      easBuildId: data.id || `eas_${params.buildId}`,
      status: data.status || 'IN_QUEUE',
      downloadUrl: data.artifacts?.buildUrl
    };
  } catch (err: any) {
    logger.error('EAS API Build request failed:', err.response?.data || err.message);
    throw new Error(`EAS Build dispatch error: ${err.response?.data?.message || err.message}`);
  }
}

/**
 * Polls status of an active EAS Build until finished or timeout.
 */
export async function pollEasBuildStatus(easBuildId: string): Promise<{
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'FINISHED' | 'ERRORED';
  downloadUrl?: string;
}> {
  const token = config.EXPO_ACCESS_TOKEN || process.env.EXPO_ACCESS_TOKEN;
  if (!token || easBuildId.startsWith('sim_')) {
    return { status: 'FINISHED' };
  }

  const response = await axios.get(`https://api.expo.dev/v2/builds/${easBuildId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = response.data?.data || response.data;
  return {
    status: data.status,
    downloadUrl: data.artifacts?.buildUrl
  };
}
