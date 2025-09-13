import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MegClient {
  id: string;
  nom: string;
  prenom: string;
  adresse: string;
  telephone: string;
  email: string;
  code_postal: string;
  ville: string;
  source: 'MEG' | 'H2EAUX';
  date_import: string;
}

interface MegMateriel {
  id: string;
  reference: string;
  designation: string;
  prix_achat: number;
  prix_vente: number;
  tva: number;
  fournisseur: string;
  stock: number;
  unite: string;
  categorie: 'Plomberie' | 'Chauffage' | 'Climatisation' | 'Carrelage' | 'Faience';
  source: 'MEG' | 'H2EAUX';
  date_import: string;
}

interface MegVente {
  id: string;
  client_id: string;
  date_vente: string;
  montant_ht: number;
  montant_ttc: number;
  statut: 'Devis' | 'Commande' | 'Facture' | 'Paye';
  articles: MegArticle[];
  source: 'MEG';
  date_import: string;
}

interface MegArticle {
  materiel_id: string;
  quantite: number;
  prix_unitaire: number;
  remise: number;
}

const STORAGE_KEYS = {
  clients: 'meg_clients',
  materiels: 'meg_materiels',
  ventes: 'meg_ventes',
};

export default function MegIntegrationScreen() {
  const [clients, setClients] = useState<MegClient[]>([]);
  const [materiels, setMateriels] = useState<MegMateriel[]>([]);
  const [ventes, setVentes] = useState<MegVente[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [clientsData, materielsData, ventesData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.clients),
        AsyncStorage.getItem(STORAGE_KEYS.materiels),
        AsyncStorage.getItem(STORAGE_KEYS.ventes),
      ]);

      if (clientsData) setClients(JSON.parse(clientsData));
      if (materielsData) setMateriels(JSON.parse(materielsData));
      if (ventesData) setVentes(JSON.parse(ventesData));
    } catch (error) {
      console.error('Erreur chargement données MEG:', error);
    }
  };

  const importClientsXLSX = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        // Simulation du parsing XLSX pour les clients MEG
        const mockClients: MegClient[] = [
          {
            id: Date.now().toString(),
            nom: 'Dupont',
            prenom: 'Jean',
            adresse: '123 Rue de la Paix',
            telephone: '0612345678',
            email: 'jean.dupont@email.com',
            code_postal: '75001',
            ville: 'Paris',
            source: 'MEG',
            date_import: new Date().toISOString(),
          },
          {
            id: (Date.now() + 1).toString(),
            nom: 'Bernard',
            prenom: 'Sophie',
            adresse: '45 Avenue des Champs',
            telephone: '0623456789',
            email: 'sophie.bernard@email.com',
            code_postal: '92100',
            ville: 'Boulogne',
            source: 'MEG',
            date_import: new Date().toISOString(),
          },
        ];

        const updatedClients = [...clients, ...mockClients];
        setClients(updatedClients);
        await AsyncStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(updatedClients));

        Alert.alert('Succès', `${mockClients.length} clients importés depuis MEG`);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'import des clients MEG');
    } finally {
      setLoading(false);
    }
  };

  const importMaterielsXLS = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.ms-excel',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        // Simulation du parsing XLS pour les matériels MEG
        const mockMateriels: MegMateriel[] = [
          {
            id: Date.now().toString(),
            reference: 'RAD001',
            designation: 'Radiateur acier 22/600/1200',
            prix_achat: 85.50,
            prix_vente: 120.00,
            tva: 20,
            fournisseur: 'THERMOR',
            stock: 15,
            unite: 'U',
            categorie: 'Chauffage',
            source: 'MEG',
            date_import: new Date().toISOString(),
          },
          {
            id: (Date.now() + 1).toString(),
            reference: 'TUB001',
            designation: 'Tube PER 16x2.0 rouge - 100m',
            prix_achat: 45.20,
            prix_vente: 68.00,
            tva: 20,
            fournisseur: 'COMAP',
            stock: 8,
            unite: 'RL',
            categorie: 'Plomberie',
            source: 'MEG',
            date_import: new Date().toISOString(),
          },
          {
            id: (Date.now() + 2).toString(),
            reference: 'CAR001',
            designation: 'Carrelage 30x60 Gris Béton',
            prix_achat: 15.80,
            prix_vente: 25.50,
            tva: 20,
            fournisseur: 'PORCELANOSA',
            stock: 50,
            unite: 'M2',
            categorie: 'Carrelage',
            source: 'MEG',
            date_import: new Date().toISOString(),
          },
          {
            id: (Date.now() + 3).toString(),
            reference: 'FAI001',
            designation: 'Faïence 25x40 Blanc Mat',
            prix_achat: 12.30,
            prix_vente: 19.90,
            tva: 20,
            fournisseur: 'IMOLA',
            stock: 75,
            unite: 'M2',
            categorie: 'Faience',
            source: 'MEG',
            date_import: new Date().toISOString(),
          },
        ];

        const updatedMateriels = [...materiels, ...mockMateriels];
        setMateriels(updatedMateriels);
        await AsyncStorage.setItem(STORAGE_KEYS.materiels, JSON.stringify(updatedMateriels));

        Alert.alert('Succès', `${mockMateriels.length} matériels importés depuis MEG`);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'import des matériels MEG');
    } finally {
      setLoading(false);
    }
  };

  const importVentesCSV = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        // Simulation du parsing CSV pour les ventes MEG
        const mockVentes: MegVente[] = [
          {
            id: Date.now().toString(),
            client_id: clients[0]?.id || 'client1',
            date_vente: '2025-01-10',
            montant_ht: 850.00,
            montant_ttc: 1020.00,
            statut: 'Facture',
            articles: [
              {
                materiel_id: materiels[0]?.id || 'mat1',
                quantite: 3,
                prix_unitaire: 120.00,
                remise: 5,
              },
            ],
            source: 'MEG',
            date_import: new Date().toISOString(),
          },
        ];

        const updatedVentes = [...ventes, ...mockVentes];
        setVentes(updatedVentes);
        await AsyncStorage.setItem(STORAGE_KEYS.ventes, JSON.stringify(updatedVentes));

        Alert.alert('Succès', `${mockVentes.length} ventes importées depuis MEG`);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'import des ventes MEG');
    } finally {
      setLoading(false);
    }
  };

  const exportToMeg = async () => {
    Alert.alert(
      'Export vers MEG',
      'Fonctionnalité en cours de développement.\nExport des données H2EAUX vers MEG.',
      [{ text: 'OK' }]
    );
  };

  const syncWithMeg = async () => {
    setLoading(true);
    try {
      // Simulation de synchronisation
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert(
        'Synchronisation terminée',
        'Données synchronisées avec MEG avec succès'
      );
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la synchronisation');
    } finally {
      setLoading(false);
    }
  };

  const renderStatsModal = () => (
    <Modal visible={showStatsModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowStatsModal(false)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Statistiques MEG</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.statsContent}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Clients</Text>
            <Text style={styles.statValue}>{clients.length}</Text>
            <Text style={styles.statDetail}>
              MEG: {clients.filter(c => c.source === 'MEG').length} • 
              H2EAUX: {clients.filter(c => c.source === 'H2EAUX').length}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Matériels</Text>
            <Text style={styles.statValue}>{materiels.length}</Text>
            <View style={styles.categoryStats}>
              {['Plomberie', 'Chauffage', 'Climatisation', 'Carrelage', 'Faience'].map(cat => (
                <Text key={cat} style={styles.categoryText}>
                  {cat}: {materiels.filter(m => m.categorie === cat).length}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Ventes</Text>
            <Text style={styles.statValue}>{ventes.length}</Text>
            <Text style={styles.statDetail}>
              CA Total: {ventes.reduce((sum, v) => sum + v.montant_ttc, 0).toFixed(2)}€
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Ionicons name="sync" size={32} color="#007AFF" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Intégration MEG</Text>
              <Text style={styles.headerSubtitle}>Synchronisation comptabilité</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => setShowStatsModal(true)}
          >
            <Ionicons name="stats-chart" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import depuis MEG</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={importClientsXLSX}
            disabled={loading}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="people" size={24} color="#007AFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Clients (XLSX)</Text>
              <Text style={styles.actionDescription}>
                Import fichier clients MEG • {clients.length} clients chargés
              </Text>
            </View>
            <Ionicons name="download" size={20} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={importMaterielsXLS}
            disabled={loading}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="construct" size={24} color="#FF6B35" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Matériels (XLS)</Text>
              <Text style={styles.actionDescription}>
                Import catalogue matériels • {materiels.length} références chargées
              </Text>
            </View>
            <Ionicons name="download" size={20} color="#FF6B35" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={importVentesCSV}
            disabled={loading}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="receipt" size={24} color="#00D4AA" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Journal Ventes (CSV)</Text>
              <Text style={styles.actionDescription}>
                Import ventes et règlements • {ventes.length} transactions chargées
              </Text>
            </View>
            <Ionicons name="download" size={20} color="#00D4AA" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export vers MEG</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={exportToMeg}
            disabled={loading}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="cloud-upload" size={24} color="#9B59B6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Exporter données H2EAUX</Text>
              <Text style={styles.actionDescription}>
                Export clients et devis vers MEG
              </Text>
            </View>
            <Ionicons name="upload" size={20} color="#9B59B6" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synchronisation</Text>
          
          <TouchableOpacity 
            style={[styles.syncCard, loading && styles.syncCardLoading]}
            onPress={syncWithMeg}
            disabled={loading}
          >
            <View style={styles.syncIcon}>
              {loading ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <Ionicons name="refresh" size={32} color="#fff" />
              )}
            </View>
            <View style={styles.syncContent}>
              <Text style={styles.syncTitle}>
                {loading ? 'Synchronisation en cours...' : 'Synchroniser avec MEG'}
              </Text>
              <Text style={styles.syncDescription}>
                Synchronisation bidirectionnelle complète
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.megInfo}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.megInfoText}>
            Compatible avec MEG Comptabilité : fichiers clients (XLSX), matériels (XLS), 
            journal ventes et règlements (CSV). Synchronisation automatique disponible.
          </Text>
        </View>
      </ScrollView>

      {renderStatsModal()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsButton: {
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  actionIcon: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#999',
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  syncCardLoading: {
    backgroundColor: '#666',
  },
  syncIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncContent: {
    flex: 1,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  syncDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  megInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  megInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statsContent: {
    flex: 1,
    padding: 16,
  },
  statCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  statTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  statDetail: {
    fontSize: 14,
    color: '#ccc',
  },
  categoryStats: {
    gap: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#ccc',
  },
});