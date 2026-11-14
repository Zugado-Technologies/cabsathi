import { Ionicons } from '@expo/vector-icons';
import type { Place } from '@cabsathi/shared';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { colors, radius, shadow } from '../theme';

interface Props {
  value: Place | null;
  onChange: (p: Place | null) => void;
  placeholder: string;
  pinColor: string;
  trailing: 'clear' | 'search';
}

/** Location input with suggestions (local NCR list for now, Google Places later). */
export function PlaceField({ value, onChange, placeholder, pinColor, trailing }: Props) {
  const [text, setText] = useState(value?.name ?? '');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<Place[]>([]);

  useEffect(() => setText(value?.name ?? ''), [value]);

  useEffect(() => {
    if (!focused) return;
    const t = setTimeout(() => {
      api.places(text === value?.name ? '' : text).then(setResults).catch(() => setResults([]));
    }, 150);
    return () => clearTimeout(t);
  }, [text, focused, value?.name]);

  return (
    <View style={{ zIndex: focused ? 10 : 1 }}>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        <Ionicons name="location" size={20} color={pinColor} />
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            if (value) onChange(null);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />
        {trailing === 'clear' && text.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear"
            onPress={() => {
              setText('');
              onChange(null);
            }}
            style={styles.clear}
          >
            <Ionicons name="close" size={12} color={colors.white} />
          </Pressable>
        ) : (
          <Ionicons name="search" size={18} color={colors.textFaint} />
        )}
      </View>
      {focused && results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((p) => (
            <Pressable
              key={p.name}
              onPress={() => {
                onChange(p);
                setText(p.name);
                setFocused(false);
              }}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: '#F1F5FD' }]}
            >
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <Text style={styles.optionText}>{p.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  fieldFocused: { borderColor: colors.primaryLight },
  input: { flex: 1, fontSize: 16, paddingVertical: 12, color: colors.text, outlineStyle: 'none' } as never,
  clear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#A8B3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    ...shadow,
  },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  optionText: { fontSize: 15, color: colors.text },
});
