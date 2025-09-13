import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Chantier {
  id: string;
  client_name: string;
  adresse: string;
  type: 'Plomberie' | 'Chauffage' | 'Climatisation';
  status: 'En cours' | 'Terminé' | 'Planifié';
  date_debut: string;
  date_fin?: string;
  notes: string;
}

const mockChantiers: Chantier[] = [
  {
    id: '1',
    client_name: 'Martin Dupont',
    adresse: '123 Rue de la Paix, 75001 Paris',
    type: 'Chauffage',
    status: 'En cours',
    date_debut: '2025-01-15',
    notes: 'Installation PAC air/eau - Devis validé',
  },
  {
    id: '2',
    client_name: 'Sophie Bernard',
    adresse: '45 Avenue des Champs, 92100 Boulogne',
    type: 'Plomberie',
    status: 'Planifié',
    date_debut: '2025-01-20',
    notes: 'Rénovation salle de bain complète',
  },
];

export default function ChantiersScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [chantiers] = useState(mockChantiers);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Plomberie': return '#007AFF';
      case 'Chauffage': return '#FF6B35';
      case 'Climatisation': return '#00D4AA';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours': return '#FF6B35';
      case 'Terminé': return '#00D4AA';
      case 'Planifié': return '#007AFF';
      default: return '#666';
    }
  };

  const renderChantierItem = ({ item }: { item: Chantier }) => (
    <TouchableOpacity style={styles.chantierCard}>
      <View style={styles.chantierHeader}>
        <View style={styles.chantierInfo}>
          <Text style={styles.clientName}>{item.client_name}</Text>
          <Text style={styles.adresse}>{item.adresse}</Text>
          <Text style={styles.notes}>{item.notes}</Text>
        </View>
        
        <View style={styles.chantierMeta}>
          <View style={[styles.typeTag, { backgroundColor: getTypeColor(item.type) }]}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
          <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.dateInfo}>
        <Ionicons name="calendar-outline" size={16} color="#999" />
        <Text style={styles.dateText}>Début: {item.date_debut}</Text>
        {item.date_fin && (
          <Text style={styles.dateText}>Fin: {item.date_fin}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un chantier..."
            placeholderTextColor="#666"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chantiers}
        renderItem={renderChantierItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  chantierCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  chantierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chantierInfo: {
    flex: 1,
    marginRight: 12,
  },
  chantierMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  adresse: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#ccc',
    fontStyle: 'italic',
  },
  typeTag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statusTag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
  },
});