import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

interface Document {
  id: string;
  name: string;
  type: 'PDF' | 'Excel' | 'Image' | 'Autre';
  size: string;
  category: 'Devis' | 'Facture' | 'Plan' | 'Catalogue' | 'Autre';
  created_at: string;
  client_name?: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Devis PAC Martin Dupont.pdf',
    type: 'PDF',
    size: '2.4 MB',
    category: 'Devis',
    created_at: '2025-01-15',
    client_name: 'Martin Dupont',
  },
  {
    id: '2',
    name: 'Catalogue Daikin 2025.pdf',
    type: 'PDF',
    size: '15.2 MB',
    category: 'Catalogue',
    created_at: '2025-01-10',
  },
  {
    id: '3',
    name: 'Plan salle de bain Sophie.jpg',
    type: 'Image',
    size: '1.8 MB',
    category: 'Plan',
    created_at: '2025-01-12',
    client_name: 'Sophie Bernard',
  },
];

export default function DocumentsScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents] = useState(mockDocuments);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  const categories = ['Tous', 'Devis', 'Facture', 'Plan', 'Catalogue', 'Autre'];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF': return 'document-text';
      case 'Excel': return 'grid';
      case 'Image': return 'image';
      default: return 'document';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PDF': return '#FF6B6B';
      case 'Excel': return '#00D4AA';
      case 'Image': return '#007AFF';
      default: return '#666';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Devis': return '#FF6B35';
      case 'Facture': return '#00D4AA';
      case 'Plan': return '#007AFF';
      case 'Catalogue': return '#9B59B6';
      default: return '#666';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.client_name && doc.client_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Tous' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled) {
        Alert.alert('Documents sélectionnés', `${result.assets.length} document(s) prêt(s) pour upload`);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sélection du document');
    }
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentIcon}>
          <Ionicons 
            name={getTypeIcon(item.type) as any} 
            size={24} 
            color={getTypeColor(item.type)} 
          />
        </View>
        
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.documentSize}>{item.size}</Text>
          {item.client_name && (
            <Text style={styles.clientName}>Client: {item.client_name}</Text>
          )}
        </View>

        <View style={styles.documentMeta}>
          <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.dateText}>{item.created_at}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryButton = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonActive
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category && styles.categoryButtonTextActive
      ]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un document..."
            placeholderTextColor="#666"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleDocumentPicker}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={({ item }) => renderCategoryButton(item)}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <FlatList
        data={filteredDocuments}
        renderItem={renderDocumentItem}
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
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoriesList: {
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  documentCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  documentIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  documentInfo: {
    flex: 1,
    marginRight: 12,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  documentMeta: {
    alignItems: 'flex-end',
  },
  categoryTag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
});