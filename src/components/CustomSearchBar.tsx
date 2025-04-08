import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, COLORS, ICON_CONFIG } from '../styles/CustomSearchBar.styles';

interface CustomSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  style?: object;
  placeholderTextColor?: string;
}

const CustomSearchBar: React.FC<CustomSearchBarProps> = ({
  value,
  onChangeText,
  placeholder,
  style,
  placeholderTextColor = COLORS.placeholder,
}) => {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
      />
      <TouchableOpacity style={styles.iconContainer}>
        <Ionicons name="search" size={ICON_CONFIG.size} color={COLORS.iconColor} />
      </TouchableOpacity>
    </View>
  );
};

export default CustomSearchBar; 