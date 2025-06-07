import React from 'react';
import { View, Text, TextInput } from 'react-native';

export default function AddHabitScreen() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Add New Habit</Text>
      <Text>Name</Text>
      <TextInput style={{ borderWidth: 1, marginVertical: 10 }} placeholder="e.g. Drink Water" />
      <Text>Frequency</Text>
      <TextInput style={{ borderWidth: 1, marginVertical: 10 }} placeholder="e.g. Daily" />
    </View>
  );
}