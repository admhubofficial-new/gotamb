module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const plugins = [...(config.plugins ?? [])];

  if (googleMapsApiKey) {
    plugins.push([
      'react-native-maps',
      {
        androidGoogleMapsApiKey: googleMapsApiKey,
        iosGoogleMapsApiKey: googleMapsApiKey,
      },
    ]);
  }

  return {
    ...config,
    plugins,
    ios: {
      ...(config.ios ?? {}),
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        NSLocationWhenInUseUsageDescription:
          'goTamb menggunakan lokasi Anda untuk mencari vendor material terdekat dan menghitung radius pencarian.',
      },
    },
    android: {
      ...(config.android ?? {}),
      permissions: Array.from(
        new Set([
          ...(config.android?.permissions ?? []),
          'android.permission.ACCESS_COARSE_LOCATION',
          'android.permission.ACCESS_FINE_LOCATION',
        ]),
      ),
    },
  };
};
