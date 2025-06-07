import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import axios from 'axios';

export default function CoachingScreen() {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a motivational habit coach. Keep advice short, practical, and encouraging.',
            },
            {
              role: 'user',
              content: 'Give me a daily habit tip.',
            },
          ],
        },
        {
          headers: {
            'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
            'Content-Type': 'application/json',
          },
        }
      );
      setAdvice(response.data.choices[0].message.content);
    } catch (error) {
      setAdvice('Error fetching advice.');
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>AI Coaching</Text>
      <Button title="Get Advice" onPress={getAdvice} />
      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : null}
      <Text style={{ marginTop: 20 }}>{advice}</Text>
    </View>
  );
}