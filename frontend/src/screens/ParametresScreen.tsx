import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'expo-router';

export default function ParametresScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          }
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'Gestion des utilisateurs',
      icon: 'people-outline',
      onPress: () => console.log('Gestion utilisateurs'),
      adminOnly: true,
    },
    {
      title: 'Permissions',
      icon: 'shield-checkmark-outline',
      onPress: () => console.log('Permissions'),
      adminOnly: true,
    },
    {
      title: 'Synchronisation MEG',
      icon: 'sync-outline',
      onPress: () => console.log('Sync MEG'),
      adminOnly: false,
    },
    {
      title: 'Stockage hors-ligne',
      icon: 'download-outline',
      onPress: () => console.log('Stockage'),
      adminOnly: false,
    },
    {
      title: 'Sauvegarde',
      icon: 'cloud-upload-outline',
      onPress: () => console.log('Sauvegarde'),
      adminOnly: true,
    },
    {
      title: 'À propos',
      icon: 'information-circle-outline',
      onPress: () => console.log('À propos'),
      adminOnly: false,
    },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  const renderMenuItem = (item: any) => (
    <TouchableOpacity 
      key={item.title}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={item.icon as any} size={24} color="#007AFF" />
        <Text style={styles.menuItemTitle}>{item.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Profil utilisateur */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={40} color="#007AFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.username}</Text>
            <Text style={styles.profileRole}>
              {user?.role === 'admin' ? 'Administrateur' : 'Employé'}
            </Text>
          </View>
        </View>

        {/* Permissions utilisateur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accès autorisés</Text>
          <View style={styles.permissionsGrid}>
            {Object.entries(user?.permissions || {}).map(([key, value]) => (
              <View key={key} style={styles.permissionItem}>
                <View style={[
                  styles.permissionStatus,
                  { backgroundColor: value ? '#00D4AA' : '#FF6B6B' }
                ]}>
                  <Ionicons 
                    name={value ? 'checkmark' : 'close'} 
                    size={16} 
                    color="#fff" 
                  />
                </View>
                <Text style={styles.permissionText}>
                  {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu principal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <View style={styles.menuList}>
            {visibleMenuItems.map(renderMenuItem)}
          </View>
        </View>

        {/* Informations système */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dernière sync</Text>
              <Text style={styles.infoValue}>Jamais</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stockage utilisé</Text>
              <Text style={styles.infoValue}>0 MB</Text>
            </View>
          </View>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2a2a2a',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#007AFF',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  permissionStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#fff',
  },
  menuList: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    color: '#fff',
  },
  infoCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#999',
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
});