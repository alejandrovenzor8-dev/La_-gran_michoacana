import React from 'react';
import { View, Image } from 'react-native';
import { Text } from 'react-native-paper';

export const LogoHeader = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: 40, height: 40, borderRadius: 8 }}
      />
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
        La Michoacana
      </Text>
    </View>
  );
};
