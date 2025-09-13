import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

interface ChantierData {
  id: string;
  client_name: string;
  adresse: string;
  type: 'Plomberie' | 'Chauffage' | 'Climatisation';
  sous_type: 'SDB_Creation' | 'SDB_Renovation' | 'SDB_Amenagement' | 'Installation_Chauffage' | 'Reparation' | 'Autre';
  status: 'En_cours' | 'Termine' | 'Planifie' | 'Devis';
  date_debut: string;
  date_fin?: string;
  notes_generales: string;
  
  // Données techniques détaillées
  pieces: ChantierPiece[];
  mesures_manuelles: MesureManuelle[];
  photos_techniques: PhotoTechnique[];
  fiches_techniques: FicheTechnique[];
  
  // Configuration personnalisable
  onglets_personnalises: OngletPersonnalise[];
  
  created_at: string;
  updated_at: string;
}

interface ChantierPiece {
  id: string;
  nom: string; // "Salle de bain principale", "WC", etc.
  type: 'SDB' | 'WC' | 'Cuisine' | 'Autre';
  dimensions: {
    longueur: number;
    largeur: number;
    hauteur: number;
    surface: number;
  };
  elements: ElementPiece[];
  plan_photo?: string; // Base64 de la photo plan
  plan_dimensions_validees: boolean;
  carrelage_sol?: CarrelageInfo;
  carrelage_mur?: CarrelageInfo;
  faience?: FaienceInfo;
  hsp?: number; // Hauteur sous plancher
  notes_stylet?: string; // Annotations au stylet
}

interface ElementPiece {
  id: string;
  type: 'Douche' | 'Baignoire' | 'Lavabo' | 'WC' | 'Bidet' | 'Meuble' | 'Porte' | 'Fenetre';
  nom: string;
  dimensions?: {
    longueur?: number;
    largeur?: number;
    hauteur?: number;
  };
  position: {
    x: number;
    y: number;
  };
  notes?: string;
}

interface MesureManuelle {
  id: string;
  nom: string;
  valeur: number;
  unite: 'mm' | 'cm' | 'm';
  piece_id: string;
  notes?: string;
  photo_associee?: string;
}

interface PhotoTechnique {
  id: string;
  nom: string;
  base64_data: string;
  piece_id?: string;
  notes: string;
  date_prise: string;
  type: 'Plan' | 'Detail' | 'Probleme' | 'Reference';
}

interface FicheTechnique {
  id: string;
  type: 'SDB_Creation' | 'SDB_Renovation' | 'SDB_Amenagement' | 'Installation_Chauffage';
  donnees: any; // Structure flexible selon le type
  completude: number; // Pourcentage de completion 0-100
}

interface OngletPersonnalise {
  id: string;
  nom: string;
  icone: string;
  champs: ChampPersonnalise[];
  ordre: number;
}

interface ChampPersonnalise {
  id: string;
  nom: string;
  type: 'texte' | 'nombre' | 'photo' | 'note_stylet' | 'liste';
  valeur: any;
  obligatoire: boolean;
}

interface CarrelageInfo {
  format: string;
  couleur: string;
  surface_totale: number;
  quantite_estimee: number;
  notes?: string;
}

interface FaienceInfo {
  hauteur: number;
  format: string;
  couleur: string;
  surface_totale: number;
  quantite_estimee: number;
  notes?: string;
}

const TYPES_CHANTIER = ['Plomberie', 'Chauffage', 'Climatisation'];
const SOUS_TYPES = {
  'Plomberie': ['SDB_Creation', 'SDB_Renovation', 'SDB_Amenagement', 'Reparation'],
  'Chauffage': ['Installation_Chauffage', 'Reparation', 'Maintenance'],
  'Climatisation': ['Installation_Clim', 'Reparation', 'Maintenance']
};

const STATUS_OPTIONS = ['Planifie', 'En_cours', 'Termine', 'Devis'];

const STORAGE_KEY = 'h2eaux_chantiers';

export default function ChantiersScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [chantiers, setChantiers] = useState<ChantierData[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedChantier, setSelectedChantier] = useState<ChantierData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [newChantier, setNewChantier] = useState<Partial<ChantierData>>({
    client_name: '',
    adresse: '',
    type: 'Plomberie',
    sous_type: 'SDB_Creation',
    status: 'Planifie',
    date_debut: new Date().toISOString().split('T')[0],
    notes_generales: '',
    pieces: [],
    mesures_manuelles: [],
    photos_techniques: [],
    fiches_techniques: [],
    onglets_personnalises: [],
  });

  useEffect(() => {
    loadChantiers();
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise', 
        'L\'accès à la caméra est nécessaire pour prendre des photos de chantier'
      );
    }
  };

  const loadChantiers = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setChantiers(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur chargement chantiers:', error);
    }
  };

  const saveChantiers = async (chantiersData: ChantierData[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chantiersData));
      setChantiers(chantiersData);
    } catch (error) {
      console.error('Erreur sauvegarde chantiers:', error);
    }
  };

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
      case 'En_cours': return '#FF6B35';
      case 'Termine': return '#00D4AA';
      case 'Planifie': return '#007AFF';
      case 'Devis': return '#9B59B6';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'En_cours': return 'En cours';
      case 'Termine': return 'Terminé';
      case 'Planifie': return 'Planifié';
      case 'Devis': return 'Devis';
      default: return status;
    }
  };

  const getSousTypeText = (sousType: string) => {
    switch (sousType) {
      case 'SDB_Creation': return 'Création SDB';
      case 'SDB_Renovation': return 'Rénovation SDB';
      case 'SDB_Amenagement': return 'Aménagement SDB';
      case 'Installation_Chauffage': return 'Installation Chauffage';
      case 'Installation_Clim': return 'Installation Clim';
      case 'Reparation': return 'Réparation';
      case 'Maintenance': return 'Maintenance';
      default: return sousType;
    }
  };

  const handleCreateChantier = async () => {
    if (!newChantier.client_name?.trim() || !newChantier.adresse?.trim()) {
      Alert.alert('Erreur', 'Le nom du client et l\'adresse sont obligatoires');
      return;
    }

    const chantierData: ChantierData = {
      id: Date.now().toString(),
      client_name: newChantier.client_name!,
      adresse: newChantier.adresse!,
      type: newChantier.type!,
      sous_type: newChantier.sous_type!,
      status: newChantier.status!,
      date_debut: newChantier.date_debut!,
      date_fin: newChantier.date_fin,
      notes_generales: newChantier.notes_generales || '',
      pieces: [],
      mesures_manuelles: [],
      photos_techniques: [],
      fiches_techniques: [],
      onglets_personnalises: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedChantiers = [...chantiers, chantierData];
    await saveChantiers(updatedChantiers);

    setShowAddModal(false);
    setNewChantier({
      client_name: '',
      adresse: '',
      type: 'Plomberie',
      sous_type: 'SDB_Creation',
      status: 'Planifie',
      date_debut: new Date().toISOString().split('T')[0],
      notes_generales: '',
      pieces: [],
      mesures_manuelles: [],
      photos_techniques: [],
      fiches_techniques: [],
      onglets_personnalises: [],
    });

    Alert.alert('Succès', 'Chantier créé avec succès');
  };

  const openChantierDetail = (chantier: ChantierData) => {
    setSelectedChantier(chantier);
    setShowDetailModal(true);
  };

  const takePlotPhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const photo = result.assets[0];
        
        // Ici on pourrait intégrer une librairie de détection de plans
        // Pour l'instant, on simule la fonctionnalité
        Alert.alert(  
          'Photo Plan Prise',
          'Fonctionnalité de conversion automatique en plan avec mesures sera disponible prochainement. La photo a été sauvegardée.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Ajouter la photo aux photos techniques
                if (selectedChantier && photo.base64) {
                  const newPhoto: PhotoTechnique = {
                    id: Date.now().toString(),
                    nom: `Plan ${new Date().toLocaleTimeString()}`,
                    base64_data: photo.base64,
                    notes: 'Photo plan - Conversion en cours de développement',
                    date_prise: new Date().toISOString(),
                    type: 'Plan',
                  };

                  const updatedChantier = {
                    ...selectedChantier,
                    photos_techniques: [...selectedChantier.photos_techniques, newPhoto],
                    updated_at: new Date().toISOString(),
                  };

                  const updatedChantiers = chantiers.map(c => 
                    c.id === selectedChantier.id ? updatedChantier : c
                  );
                  
                  saveChantiers(updatedChantiers);
                  setSelectedChantier(updatedChantier);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la prise de photo');
    }
  };

  const filteredChantiers = chantiers.filter(chantier =>
    chantier.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chantier.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chantier.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderChantierItem = ({ item }: { item: ChantierData }) => (
    <TouchableOpacity 
      style={styles.chantierCard}
      onPress={() => openChantierDetail(item)}
    >
      <View style={styles.chantierHeader}>
        <View style={styles.chantierInfo}>
          <Text style={styles.clientName}>{item.client_name}</Text>
          <Text style={styles.adresse}>{item.adresse}</Text>
          <Text style={styles.sousType}>{getSousTypeText(item.sous_type)}</Text>
          <Text style={styles.notes}>{item.notes_generales}</Text>
        </View>
        
        <View style={styles.chantierMeta}>
          <View style={[styles.typeTag, { backgroundColor: getTypeColor(item.type) }]}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
          <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.chantierStats}>
        <View style={styles.statItem}>
          <Ionicons name="camera" size={16} color="#007AFF" />
          <Text style={styles.statText}>{item.photos_techniques.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="home" size={16} color="#00D4AA" />
          <Text style={styles.statText}>{item.pieces.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="ruler" size={16} color="#FF6B35" />
          <Text style={styles.statText}>{item.mesures_manuelles.length}</Text>
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

  const renderCreationStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Informations générales</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Client *</Text>
              <TextInput
                style={styles.input}
                value={newChantier.client_name}
                onChangeText={(text) => setNewChantier({...newChantier, client_name: text})}
                placeholder="Nom du client"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresse *</Text>
              <TextInput
                style={styles.input}
                value={newChantier.adresse}
                onChangeText={(text) => setNewChantier({...newChantier, adresse: text})}
                placeholder="Adresse complète du chantier"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type de travaux</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeSelectionRow}>
                  {TYPES_CHANTIER.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeSelectionButton,
                        { backgroundColor: getTypeColor(type) },
                        newChantier.type === type && styles.typeSelectionButtonActive
                      ]}
                      onPress={() => setNewChantier({
                        ...newChantier, 
                        type: type as ChantierData['type'],
                        sous_type: SOUS_TYPES[type as keyof typeof SOUS_TYPES][0] as ChantierData['sous_type']
                      })}
                    >
                      <Text style={styles.typeSelectionText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sous-type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeSelectionRow}>
                  {SOUS_TYPES[newChantier.type as keyof typeof SOUS_TYPES]?.map((sousType) => (
                    <TouchableOpacity
                      key={sousType}
                      style={[
                        styles.sousTypeButton,
                        newChantier.sous_type === sousType && styles.sousTypeButtonActive
                      ]}
                      onPress={() => setNewChantier({...newChantier, sous_type: sousType as ChantierData['sous_type']})}
                    >
                      <Text style={[
                        styles.sousTypeText,
                        newChantier.sous_type === sousType && styles.sousTypeTextActive
                      ]}>
                        {getSousTypeText(sousType)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date de début</Text>
              <TextInput
                style={styles.input}
                value={newChantier.date_debut}
                onChangeText={(text) => setNewChantier({...newChantier, date_debut: text})}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

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
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsHeader}>
        <Text style={styles.statsText}>
          {chantiers.length} chantier(s) • {chantiers.filter(c => c.status === 'En_cours').length} en cours
        </Text>
      </View>

      <FlatList
        data={filteredChantiers}
        renderItem={renderChantierItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>Aucun chantier</Text>
            <Text style={styles.emptySubtext}>Créez votre premier chantier</Text>
          </View>
        }
      />

      {/* Modal création chantier */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau Chantier</Text>
            <TouchableOpacity onPress={handleCreateChantier}>
              <Text style={styles.saveButton}>Créer</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView style={styles.stepContent}>
              {renderCreationStep()}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Modal détail chantier */}
      {selectedChantier && (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedChantier.client_name}
              </Text>
              <TouchableOpacity onPress={takePlotPhoto}>
                <Ionicons name="camera" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailContent}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Informations Chantier</Text>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Client:</Text>
                  <Text style={styles.detailValue}>{selectedChantier.client_name}</Text>
                  
                  <Text style={styles.detailLabel}>Adresse:</Text>
                  <Text style={styles.detailValue}>{selectedChantier.adresse}</Text>
                  
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedChantier.type} - {getSousTypeText(selectedChantier.sous_type)}</Text>
                  
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedChantier.status) }]}>
                    <Text style={styles.statusBadgeText}>{getStatusText(selectedChantier.status)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Photos Techniques ({selectedChantier.photos_techniques.length})</Text>
                {selectedChantier.photos_techniques.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.photosRow}>
                      {selectedChantier.photos_techniques.map((photo) => (
                        <View key={photo.id} style={styles.photoItem}>
                          <View style={styles.photoPlaceholder}>
                            <Ionicons name="image" size={32} color="#007AFF" />
                          </View>
                          <Text style={styles.photoName} numberOfLines={1}>{photo.nom}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptySectionText}>Aucune photo</Text>
                    <TouchableOpacity style={styles.addPhotoButton} onPress={takePlotPhoto}>
                      <Ionicons name="camera" size={20} color="#007AFF" />
                      <Text style={styles.addPhotoText}>Prendre une photo plan</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Pièces ({selectedChantier.pieces.length})</Text>
                {selectedChantier.pieces.length === 0 && (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptySectionText}>Aucune pièce définie</Text>
                    <TouchableOpacity style={styles.addButton}>
                      <Ionicons name="add" size={20} color="#007AFF" />
                      <Text style={styles.addButtonText}>Ajouter une pièce</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Mesures Manuelles ({selectedChantier.mesures_manuelles.length})</Text>
                {selectedChantier.mesures_manuelles.length === 0 && (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptySectionText}>Aucune mesure</Text>
                    <TouchableOpacity style={styles.addButton}>
                      <Ionicons name="add" size={20} color="#007AFF" />
                      <Text style={styles.addButtonText}>Ajouter une mesure</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.functionalityNote}>
                <Ionicons name="information-circle" size={20} color="#007AFF" />
                <Text style={styles.functionalityNoteText}>
                  🚧 Fonctionnalités avancées en développement :
                  {"\n"}• Conversion photo → plan automatique
                  {"\n"}• Mesures par caméra (style MagicPlan)
                  {"\n"}• Annotations au stylet
                  {"\n"}• Calculs carrelage/faïence
                  {"\n"}• Onglets personnalisables
                </Text>
              </View>
            </ScrollView>
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
  statsHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statsText: {
    color: '#666',
    fontSize: 14,
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
  sousType: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
    fontWeight: '500',
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
  chantierStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#999',
    fontSize: 12,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
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
  typeSelectionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeSelectionButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    opacity: 0.7,
  },
  typeSelectionButtonActive: {
    opacity: 1,
  },
  typeSelectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  sousTypeButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sousTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  sousTypeText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  sousTypeTextActive: {
    color: '#fff',
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  detailLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
    marginTop: 8,
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoItem: {
    alignItems: 'center',
    width: 80,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoName: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
  emptySection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptySectionText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPhotoText: {
    color: '#007AFF',
    fontSize: 14,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  functionalityNote: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  functionalityNoteText: {
    flex: 1,
    color: '#007AFF',
    fontSize: 14,
    lineHeight: 20,
  },
});