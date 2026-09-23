import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <Text style={styles.logoIcon}>🛡️</Text>
      </View>
      <Text style={styles.title}>TruthShield</Text>
      <Text style={styles.tagline}>Think Before You Share</Text>
      <Text style={styles.subtitle}>Social Media & Misleading Information</Text>

      <ActivityIndicator size="small" color="#06b6d4" style={styles.spinner} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>MCA Project (2025–2027)</Text>
        <Text style={styles.footerSub}>GNIOT / Dr. A.P.J. Abdul Kalam Technical University</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06b6d4',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  spinner: {
    marginTop: 32,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  footerSub: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
  },
});
