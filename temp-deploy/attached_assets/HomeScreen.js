import React from 'react';
import { View, Text, Button } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Habit List</Text>
      <Button title="Add Habit" onPress={() => navigation.navigate('AddHabit')} />
      <Button title="Coaching" onPress={() => navigation.navigate('Coaching')} />
      <Button title="Progress" onPress={() => navigation.navigate('Progress')} />
    </View>
  );
}