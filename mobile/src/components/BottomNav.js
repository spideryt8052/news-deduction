import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function BottomNav({ activeTab, onTabSelect }) {
  const tabs = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'analyze', label: 'Analyze', icon: '🔍' },
    { key: 'history', label: 'History', icon: '📜' },
    { key: 'learn', label: 'Learn', icon: '💡' },
    { key: 'settings', label: 'About', icon: '⚙️' },
  ];

  return (
    <View style={styles.navBar}>
      {tabs.map((t) => {
        const isActive = activeTab === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tabItem}
            onPress={() => onTabSelect(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && styles.activeIcon]}>{t.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#0d1527',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingBottom: 16,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.6,
  },
  activeIcon: {
    opacity: 1,
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  activeLabel: {
    color: '#06b6d4',
    fontWeight: '700',
  },
});
