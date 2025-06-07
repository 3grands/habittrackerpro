import React from 'react';
import { View, Text } from 'react-native';

export default function ProgressScreen() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Progress</Text>
      <Text>Streak: 7 days</Text>
      <Text>Habits Completed: 21</Text>
    </View>
  );
}