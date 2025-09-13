import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DocumentItem {
  id: string;
  name: string;
  type: 'PDF' | 'Excel' | 'Image' | 'Autre';
  size: string;
  category: 'Devis' | 'Facture' | 'Plan' | 'Catalogue' | 'Fiche_Technique' | 'Autre';
  created_at: string;
  client_name?: string;
  local_uri: string; // Stockage local pour hors-ligne
  base64_data?: string; // Pour affichage
  offline_available: boolean;
}

const CATEGORIES = [
  'Tous', 'Devis', 'Facture', 'Plan', 'Catalogue', 'Fiche_Technique', 'Autre'
];

const STORAGE_KEY = 'h2eaux_documents';

export default function DocumentsScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [newDocumentData, setNewDocumentData] = useState({
    category: 'Devis' as DocumentItem['category'],
    client_name: '',
    notes: '',
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const storedDocs = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedDocs) {
        setDocuments(JSON.parse(storedDocs));
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    }
  };

  const saveDocuments = async (docs: DocumentItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
      setDocuments(docs);
    } catch (error) {
      console.error('Erreur sauvegarde documents:', error);
    }
  };

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
      case 'Fiche_Technique': return '#E67E22';
      default: return '#666';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDocumentPicker = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Créer un dossier documents dans le stockage local si nécessaire
        const documentsDir = FileSystem.documentDirectory + 'h2eaux_documents/';
        const dirInfo = await FileSystem.getInfoAsync(documentsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
        }

        // Copier le fichier dans le stockage local
        const fileName = `${Date.now()}_${asset.name}`;
        const localUri = documentsDir + fileName;
        await FileSystem.copyAsync({
          from: asset.uri,
          to: localUri,
        });

        // Lire le fichier en base64 pour l'affichage (si c'est une image ou petit PDF)
        let base64Data = '';
        if (asset.size && asset.size < 5 * 1024 * 1024) { // Moins de 5MB
          try {
            if (asset.mimeType?.startsWith('image/')) {
              base64Data = await FileSystem.readAsStringAsync(localUri, {
                encoding: FileSystem.EncodingType.Base64,
              });
            }
          } catch (error) {
            console.log('Impossible de lire en base64:', error);
          }
        }

        // Déterminer le type de fichier
        let fileType: DocumentItem['type'] = 'Autre';
        if (asset.mimeType?.includes('pdf')) fileType = 'PDF';
        else if (asset.mimeType?.includes('excel') || asset.mimeType?.includes('spreadsheet')) fileType = 'Excel';
        else if (asset.mimeType?.startsWith('image/')) fileType = 'Image';

        const newDocument: DocumentItem = {
          id: Date.now().toString(),
          name: asset.name || 'Document sans nom',
          type: fileType,
          size: formatFileSize(asset.size || 0),
          category: newDocumentData.category,
          created_at: new Date().toISOString().split('T')[0],
          client_name: newDocumentData.client_name,
          local_uri: localUri,
          base64_data: base64Data,
          offline_available: true,
        };

        const updatedDocs = [...documents, newDocument];
        await saveDocuments(updatedDocs);
        
        setShowAddModal(false);
        setNewDocumentData({
          category: 'Devis',
          client_name: '',
          notes: '',
        });

        Alert.alert('Succès', 'Document ajouté et disponible hors-ligne !');
      }
    } catch (error) {
      console.error('Erreur import document:', error);
      Alert.alert('Erreur', 'Erreur lors de l\'import du document');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (doc: DocumentItem) => {
    Alert.alert(
      'Supprimer le document',
      `Êtes-vous sûr de vouloir supprimer "${doc.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Supprimer le fichier local
              const fileInfo = await FileSystem.getInfoAsync(doc.local_uri);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(doc.local_uri);
              }

              // Supprimer de la liste
              const updatedDocs = documents.filter(d => d.id !== doc.id);
              await saveDocuments(updatedDocs);
              
              Alert.alert('Succès', 'Document supprimé');
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          }
        }
      ]
    );
  };

  const openDocument = async (doc: DocumentItem) => {
    try {
      // Vérifier si le fichier existe toujours
      const fileInfo = await FileSystem.getInfoAsync(doc.local_uri);
      if (!fileInfo.exists) {
        Alert.alert('Erreur', 'Le fichier n\'existe plus sur cet appareil');
        return;
      }

      // Pour l'instant, on affiche juste les infos
      // Plus tard, on ajoutera un visualiseur PDF intégré
      setSelectedDocument(doc);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.client_name && doc.client_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Tous' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderDocumentItem = ({ item }: { item: DocumentItem }) => (
    <TouchableOpacity 
      style={styles.documentCard}
      onPress={() => openDocument(item)}
    >
      <View style={styles.documentHeader}>
        <View style={styles.documentIcon}>
          <Ionicons 
            name={getTypeIcon(item.type) as any} 
            size={24} 
            color={getTypeColor(item.type)} 
          />
          {item.offline_available && (
            <View style={styles.offlineIndicator}>
              <Ionicons name="cloud-done" size={12} color="#00D4AA" />
            </View>
          )}
        </View>
        
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.documentSize}>{item.size} • Hors-ligne</Text>
          {item.client_name && (
            <Text style={styles.clientName}>Client: {item.client_name}</Text>
          )}
        </View>

        <View style={styles.documentMeta}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteDocument(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
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
          onPress={() => setShowAddModal(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="add" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {documents.length} document(s) • {documents.filter(d => d.offline_available).length} hors-ligne
        </Text>
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {CATEGORIES.map(renderCategoryButton)}
        </ScrollView>
      </View>

      <FlatList
        data={filteredDocuments}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>Aucun document</Text>
            <Text style={styles.emptySubtext}>Ajoutez vos devis et documents</Text>
          </View>
        }
      />

      {/* Modal d'ajout de document */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ajouter Document</Text>
            <TouchableOpacity onPress={handleDocumentPicker}>
              <Text style={styles.saveButton}>Importer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categorySelectionRow}>
                  {CATEGORIES.slice(1).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categorySelectionButton,
                        newDocumentData.category === cat && styles.categorySelectionButtonActive
                      ]}
                      onPress={() => setNewDocumentData({...newDocumentData, category: cat as DocumentItem['category']})}
                    >
                      <Text style={[
                        styles.categorySelectionText,
                        newDocumentData.category === cat && styles.categorySelectionTextActive
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Client (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={newDocumentData.client_name}
                onChangeText={(text) => setNewDocumentData({...newDocumentData, client_name: text})}
                placeholder="Nom du client"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newDocumentData.notes}
                onChangeText={(text) => setNewDocumentData({...newDocumentData, notes: text})}
                placeholder="Notes sur ce document..."
                placeholderTextColor="#666"
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Les documents seront stockés localement et accessibles hors-ligne
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal d'affichage document */}
      {selectedDocument && (
        <Modal
          visible={!!selectedDocument}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <SafeAreaView style={styles.viewerContainer}>
            <View style={styles.viewerHeader}>
              <TouchableOpacity onPress={() => setSelectedDocument(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {selectedDocument.name}
              </Text>
              <TouchableOpacity>
                <Ionicons name="share-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.viewerContent}>
              <View style={styles.documentPreview}>
                <Ionicons 
                  name={getTypeIcon(selectedDocument.type) as any} 
                  size={64} 
                  color={getTypeColor(selectedDocument.type)} 
                />
                <Text style={styles.previewText}>
                  Aperçu du document : {selectedDocument.name}
                </Text>
                <Text style={styles.previewSubtext}>
                  Type: {selectedDocument.type} • Taille: {selectedDocument.size}
                </Text>
                <Text style={styles.previewSubtext}>
                  Stocké localement • Disponible hors-ligne
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )}
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
  statsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statsText: {
    color: '#666',
    fontSize: 14,
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
    position: 'relative',
    marginRight: 12,
    marginTop: 2,
  },
  offlineIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 2,
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
    color: '#00D4AA',
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
  deleteButton: {
    padding: 4,
    marginBottom: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  cancelButton: {
    color: '#FF6B6B',
    fontSize: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  categorySelectionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categorySelectionButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categorySelectionButtonActive: {
    backgroundColor: '#007AFF',
  },
  categorySelectionText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  categorySelectionTextActive: {
    color: '#fff',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#007AFF',
    fontSize: 14,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  viewerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  viewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentPreview: {
    alignItems: 'center',
    padding: 32,
  },
  previewText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  previewSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
});