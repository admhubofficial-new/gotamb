import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="vendor-home" />
      <Stack.Screen name="vendor-items" />
      <Stack.Screen name="customer-home" />
      <Stack.Screen name="customer-order" />
      <Stack.Screen name="driver-home" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="test-supabase" />
    </Stack>
  );
}
