/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Dual TV and Mobile Support.
 *
 * Ensures the AndroidManifest.xml satisfies both Amazon Appstore / Fire TV
 * and standard Android Mobile requirements:
 * 1. Sets touchscreen hardware to optional (required=false) so Fire TV doesn't reject it.
 * 2. Sets leanback software to optional (required=false) so mobile phones don't reject it.
 * 3. Adds LEANBACK_LAUNCHER intent alongside standard LAUNCHER so the app shows in the Fire TV App Grid.
 * 4. Enables proper TV orientation and config change flags.
 */
function withTvSupport(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Initialize uses-feature array
    androidManifest['uses-feature'] = androidManifest['uses-feature'] || [];

    // Filter out existing entries to prevent duplicates
    androidManifest['uses-feature'] = androidManifest['uses-feature'].filter(
      (f) =>
        f.$['android:name'] !== 'android.hardware.touchscreen' &&
        f.$['android:name'] !== 'android.software.leanback'
    );

    // 1. Touchscreen NOT required (Allows Fire TV / Firestick installation)
    androidManifest['uses-feature'].push({
      $: {
        'android:name': 'android.hardware.touchscreen',
        'android:required': 'false',
      },
    });

    // 2. Leanback NOT required (Allows Mobile phone / Tablet installation)
    androidManifest['uses-feature'].push({
      $: {
        'android:name': 'android.software.leanback',
        'android:required': 'false',
      },
    });

    // 3. Configure Main Activity with Dual Launcher Intent (Phone + Fire TV)
    const mainApplication = androidManifest.application?.[0];
    if (mainApplication && mainApplication.activity) {
      const mainActivity = mainApplication.activity.find((a) =>
        a['intent-filter']?.some((filter) =>
          filter.action?.some((act) => act.$['android:name'] === 'android.intent.action.MAIN')
        )
      );

      if (mainActivity) {
        mainActivity['intent-filter'] = mainActivity['intent-filter'] || [];
        const mainFilter = mainActivity['intent-filter'].find((filter) =>
          filter.action?.some((act) => act.$['android:name'] === 'android.intent.action.MAIN')
        );

        if (mainFilter) {
          mainFilter.category = mainFilter.category || [];

          // Standard Mobile Launcher
          if (!mainFilter.category.some((c) => c.$['android:name'] === 'android.intent.category.LAUNCHER')) {
            mainFilter.category.push({
              $: { 'android:name': 'android.intent.category.LAUNCHER' },
            });
          }

          // Amazon Fire TV & Android TV Leanback Launcher
          if (!mainFilter.category.some((c) => c.$['android:name'] === 'android.intent.category.LEANBACK_LAUNCHER')) {
            mainFilter.category.push({
              $: { 'android:name': 'android.intent.category.LEANBACK_LAUNCHER' },
            });
          }
        }

        // Allow dynamic orientation rotation across Phone & TV
        mainActivity.$['android:screenOrientation'] = 'user';
        mainActivity.$['android:configChanges'] =
          'keyboard|keyboardHidden|orientation|screenSize|screenLayout|smallestScreenSize|uiMode';
      }
    }

    return config;
  });
}

module.exports = withTvSupport;
