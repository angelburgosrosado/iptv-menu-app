# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# react-native-mmkv
-keep class com.tencent.mmkv.** { *; }

# expo-video & AndroidX Media3 (ExoPlayer)
-keep class expo.modules.video.** { *; }
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# expo-image & Glide
-keep class expo.modules.image.** { *; }
-keep class com.bumptech.glide.** { *; }

# expo-secure-store
-keep class expo.modules.securestore.** { *; }

# React Native Screens & Safe Area
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }

