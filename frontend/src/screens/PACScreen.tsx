import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CalculPAC {
  id: string;
  client_name: string;
  adresse: string;
  type_pac: 'Air_Eau' | 'Air_Air';
  
  // Données Air/Eau (basées sur vos documents)
  donnees_air_eau?: {
    surface_habitable: number;
    hauteur_sous_plafond: number;
    temperature_confort: number;
    isolation_murs: 'ITE' | 'Bien_isoles' | 'Isoles' | 'Pas_isoles';
    materiaux_murs: string;
    fenetres: 'Simple' | 'Double' | 'Triple';
    etat_fenetres: 'Tres_bon' | 'Bon' | 'Moyen' | 'Mauvais';
    isolation_toiture: 'Bien_isoles' | 'Isoles' | 'Peu_isoles' | 'Pas_isoles';
    isolation_rdc: boolean;
    sous_sol: 'Cave' | 'Vide_sanitaire' | 'Terre_plein';
    consommation_actuelle: {
      type: 'Gaz' | 'Fioul' | 'Electrique' | 'Bois';
      quantite: number;
      unite: string;
    };
    nombre_circuits: number;
    plancher_chauffant: boolean;
    radiateurs: boolean;
    nombre_radiateurs: number;
    temperature_depart: number;
    puissance_estimee: number;
    cop_estime: number;
  };
  
  // Données Air/Air (personnalisées)
  donnees_air_air?: {
    pieces: PieceAirAir[];
    delta_temperature: number; // Différence température extérieure/intérieure
    volume_total: number;
    puissance_totale_estimee: number;
    nombre_unites_interieures: number;
    type_installation: 'Mono_split' | 'Multi_split' | 'Gainable';
    niveau_isolation: 1 | 2 | 3 | 4 | 5; // 1=très mauvais, 5=excellent
    exposition_solaire: 'Nord' | 'Sud' | 'Est' | 'Ouest' | 'Multiple';
  };
  
  resultats?: {
    puissance_necessaire: number;
    cop_moyen: number;
    consommation_estimee: number;
    economies_annuelles: number;
    cout_installation: number;
    amortissement_annees: number;
  };
  
  notes: string;
  status: 'Brouillon' | 'Valide' | 'Envoye';
  created_at: string;
  updated_at: string;
}

interface PieceAirAir {
  id: string;
  nom: string;
  longueur: number;
  largeur: number;
  hauteur: number;
  volume: number;
  surface: number;
  temperature_souhaitee: number;
  puissance_estimee: number;
  type_unite: 'Murale' | 'Console' | 'Gainable' | 'Cassette';
}

const ISOLATION_MURS_OPTIONS = [
  { value: 'ITE', label: 'ITE (Isolation Thermique Extérieure)' },
  { value: 'Bien_isoles', label: 'Bien isolés (10cm)' },
  { value: 'Isoles', label: 'Isolés (5cm)' },
  { value: 'Pas_isoles', label: 'Pas isolés' },
];

const FENETRES_OPTIONS = [
  { value: 'Simple', label: 'Simple vitrage' },
  { value: 'Double', label: 'Double vitrage' },
  { value: 'Triple', label: 'Triple vitrage' },
];

const STORAGE_KEY = 'h2eaux_calculs_pac';

export default function PACScreen() {
  const [calculs, setCalculs] = useState<CalculPAC[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCalcul, setSelectedCalcul] = useState<CalculPAC | null>(null);
  const [activeTab, setActiveTab] = useState<'Air_Eau' | 'Air_Air'>('Air_Eau');
  const [currentStep, setCurrentStep] = useState(0);
  
  const [newCalcul, setNewCalcul] = useState<Partial<CalculPAC>>({
    client_name: '',
    adresse: '',
    type_pac: 'Air_Eau',
    notes: '',
    status: 'Brouillon',
  });

  useEffect(() => {
    loadCalculs();
  }, []);

  const loadCalculs = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCalculs(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur chargement calculs PAC:', error);
    }
  };

  const saveCalculs = async (calculData: CalculPAC[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(calculData));
      setCalculs(calculData);
    } catch (error) {
      console.error('Erreur sauvegarde calculs PAC:', error);
    }
  };

  const createCalcul = async () => {
    if (!newCalcul.client_name?.trim()) {
      Alert.alert('Erreur', 'Le nom du client est obligatoire');
      return;
    }

    const calculData: CalculPAC = {
      id: Date.now().toString(),
      client_name: newCalcul.client_name!,
      adresse: newCalcul.adresse || '',
      type_pac: newCalcul.type_pac!,
      donnees_air_eau: newCalcul.type_pac === 'Air_Eau' ? {
        surface_habitable: 0,
        hauteur_sous_plafond: 2.5,
        temperature_confort: 20,
        isolation_murs: 'Isoles',
        materiaux_murs: '',
        fenetres: 'Double',
        etat_fenetres: 'Bon',
        isolation_toiture: 'Isoles',
        isolation_rdc: false,
        sous_sol: 'Vide_sanitaire',
        consommation_actuelle: {
          type: 'Gaz',
          quantite: 0,
          unite: 'm³'
        },
        nombre_circuits: 1,
        plancher_chauffant: false,
        radiateurs: true,
        nombre_radiateurs: 0,
        temperature_depart: 65,
        puissance_estimee: 0,
        cop_estime: 3.5,
      } : undefined,
      donnees_air_air: newCalcul.type_pac === 'Air_Air' ? {
        pieces: [],
        delta_temperature: 30,
        volume_total: 0,
        puissance_totale_estimee: 0,
        nombre_unites_interieures: 1,
        type_installation: 'Mono_split',
        niveau_isolation: 3,
        exposition_solaire: 'Multiple',
      } : undefined,
      notes: newCalcul.notes || '',
      status: 'Brouillon',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedCalculs = [...calculs, calculData];
    await saveCalculs(updatedCalculs);

    setShowModal(false);
    setNewCalcul({
      client_name: '',
      adresse: '',
      type_pac: 'Air_Eau',
      notes: '',
      status: 'Brouillon',
    });
    setCurrentStep(0);

    Alert.alert('Succès', 'Calcul PAC créé avec succès');
  };

  const calculerPuissanceAirEau = (donnees: any): number => {
    // Calcul basique basé sur surface et isolation
    const coeffIsolation = {
      'ITE': 40,
      'Bien_isoles': 50,
      'Isoles': 65,
      'Pas_isoles': 80
    };
    
    const coeff = coeffIsolation[donnees.isolation_murs as keyof typeof coeffIsolation] || 65;
    return Math.round(donnees.surface_habitable * coeff);
  };

  const calculerPuissanceAirAir = (donnees: any): number => {
    // Calcul basé sur volume et delta température
    const coeffVolume = 35; // W/m³
    const coeffIsolation = [1.4, 1.2, 1.0, 0.9, 0.8][donnees.niveau_isolation - 1];
    const coeffDelta = donnees.delta_temperature / 30; // Référence 30°C
    
    return Math.round(donnees.volume_total * coeffVolume * coeffIsolation * coeffDelta);
  };

  const renderCalculItem = ({ item }: { item: CalculPAC }) => (
    <TouchableOpacity 
      style={styles.calculCard}
      onPress={() => {
        setSelectedCalcul(item);
        setShowModal(true);
      }}
    >
      <View style={styles.calculHeader}>
        <View style={styles.calculInfo}>
          <Text style={styles.clientName}>{item.client_name}</Text>
          {item.adresse && <Text style={styles.adresse}>{item.adresse}</Text>}
          <View style={styles.typeContainer}>
            <View style={[
              styles.typeTag,
              { backgroundColor: item.type_pac === 'Air_Eau' ? '#007AFF' : '#00D4AA' }
            ]}>
              <Text style={styles.typeText}>PAC {item.type_pac.replace('_', '/')}</Text>
            </View>
            <View style={[
              styles.statusTag,
              { backgroundColor: item.status === 'Valide' ? '#00D4AA' : '#FF9500' }
            ]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.calculMeta}>
          {item.resultats && (
            <View style={styles.resultatPreview}>
              <Text style={styles.puissanceText}>
                {item.resultats.puissance_necessaire}W
              </Text>
              <Text style={styles.copText}>
                COP: {item.resultats.cop_moyen}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAirEauForm = () => {
    const donnees = newCalcul.donnees_air_eau;
    if (!donnees) return null;

    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Caractéristiques du bâtiment</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Surface habitable chauffée (m²) *</Text>
              <TextInput
                style={styles.input}
                value={donnees.surface_habitable.toString()}
                onChangeText={(text) => setNewCalcul({
                  ...newCalcul,
                  donnees_air_eau: {
                    ...donnees,
                    surface_habitable: parseInt(text) || 0
                  }
                })}
                placeholder="120"
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hauteur sous plafond (m)</Text>
              <TextInput
                style={styles.input}
                value={donnees.hauteur_sous_plafond.toString()}
                onChangeText={(text) => setNewCalcul({
                  ...newCalcul,
                  donnees_air_eau: {
                    ...donnees,
                    hauteur_sous_plafond: parseFloat(text) || 2.5
                  }
                })}
                placeholder="2.5"
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Température de confort (°C)</Text>
              <TextInput
                style={styles.input}
                value={donnees.temperature_confort.toString()}
                onChangeText={(text) => setNewCalcul({
                  ...newCalcul,
                  donnees_air_eau: {
                    ...donnees,
                    temperature_confort: parseInt(text) || 20
                  }
                })}
                placeholder="20"
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Isolation des murs</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsRow}>
                  {ISOLATION_MURS_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        donnees.isolation_murs === option.value && styles.optionButtonActive
                      ]}
                      onPress={() => setNewCalcul({
                        ...newCalcul,
                        donnees_air_eau: {
                          ...donnees,
                          isolation_murs: option.value as any
                        }
                      })}
                    >
                      <Text style={[
                        styles.optionText,
                        donnees.isolation_murs === option.value && styles.optionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        );
      
      case 1:
        const puissanceCalculee = calculerPuissanceAirEau(donnees);
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Résultats du calcul</Text>
            
            <View style={styles.resultatCard}>
              <View style={styles.resultatItem}>
                <Text style={styles.resultatLabel}>Puissance nécessaire</Text>
                <Text style={styles.resultatValue}>{puissanceCalculee} W</Text>
              </View>
              
              <View style={styles.resultatItem}>
                <Text style={styles.resultatLabel}>COP estimé</Text>
                <Text style={styles.resultatValue}>{donnees.cop_estime}</Text>
              </View>
              
              <View style={styles.resultatItem}>
                <Text style={styles.resultatLabel}>Consommation estimée</Text>
                <Text style={styles.resultatValue}>
                  {Math.round(puissanceCalculee / donnees.cop_estime)} W élec.
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes complémentaires</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newCalcul.notes}
                onChangeText={(text) => setNewCalcul({...newCalcul, notes: text})}
                placeholder="Observations, recommandations..."
                placeholderTextColor="#666"
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  const renderAirAirForm = () => {
    const donnees = newCalcul.donnees_air_air;
    if (!donnees) return null;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Configuration PAC Air/Air</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Volume total à climatiser (m³) *</Text>
          <TextInput
            style={styles.input}
            value={donnees.volume_total.toString()}
            onChangeText={(text) => setNewCalcul({
              ...newCalcul,
              donnees_air_air: {
                ...donnees,
                volume_total: parseInt(text) || 0
              }
            })}
            placeholder="300"
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Delta température (°C)</Text>
          <Text style={styles.inputSubLabel}>Différence entre température extérieure max et intérieure souhaitée</Text>
          <TextInput
            style={styles.input}
            value={donnees.delta_temperature.toString()}
            onChangeText={(text) => setNewCalcul({
              ...newCalcul,
              donnees_air_air: {
                ...donnees,
                delta_temperature: parseInt(text) || 30
              }
            })}
            placeholder="30"
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Niveau d'isolation (1-5)</Text>
          <View style={styles.isolationSlider}>
            {[1, 2, 3, 4, 5].map((niveau) => (
              <TouchableOpacity
                key={niveau}
                style={[
                  styles.isolationButton,
                  donnees.niveau_isolation === niveau && styles.isolationButtonActive
                ]}
                onPress={() => setNewCalcul({
                  ...newCalcul,
                  donnees_air_air: {
                    ...donnees,
                    niveau_isolation: niveau as any
                  }
                })}
              >
                <Text style={[
                  styles.isolationButtonText,
                  donnees.niveau_isolation === niveau && styles.isolationButtonTextActive
                ]}>
                  {niveau}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.isolationScale}>
            1: Très mauvais • 3: Moyen • 5: Excellent
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Type d'installation</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.optionsRow}>
              {['Mono_split', 'Multi_split', 'Gainable'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    donnees.type_installation === type && styles.optionButtonActive
                  ]}
                  onPress={() => setNewCalcul({
                    ...newCalcul,
                    donnees_air_air: {
                      ...donnees,
                      type_installation: type as any
                    }
                  })}
                >
                  <Text style={[
                    styles.optionText,
                    donnees.type_installation === type && styles.optionTextActive
                  ]}>
                    {type.replace('_', '-')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.resultatCard}>
          <View style={styles.resultatItem}>
            <Text style={styles.resultatLabel}>Puissance estimée</Text>
            <Text style={styles.resultatValue}>
              {calculerPuissanceAirAir(donnees)} W
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const filteredCalculs = calculs.filter(calcul => calcul.type_pac === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Air_Eau' && styles.activeTab]}
            onPress={() => setActiveTab('Air_Eau')}
          >
            <Ionicons 
              name="water" 
              size={20} 
              color={activeTab === 'Air_Eau' ? '#fff' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'Air_Eau' && styles.activeTabText]}>
              PAC Air/Eau
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Air_Air' && styles.activeTab]}
            onPress={() => setActiveTab('Air_Air')}
          >
            <Ionicons 
              name="cloud" 
              size={20} 
              color={activeTab === 'Air_Air' ? '#fff' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'Air_Air' && styles.activeTabText]}>
              PAC Air/Air
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setNewCalcul({
              ...newCalcul,
              type_pac: activeTab,
              donnees_air_eau: activeTab === 'Air_Eau' ? {
                surface_habitable: 0,
                hauteur_sous_plafond: 2.5,
                temperature_confort: 20,
                isolation_murs: 'Isoles',
                materiaux_murs: '',
                fenetres: 'Double',
                etat_fenetres: 'Bon',
                isolation_toiture: 'Isoles',
                isolation_rdc: false,
                sous_sol: 'Vide_sanitaire',
                consommation_actuelle: {
                  type: 'Gaz',
                  quantite: 0,
                  unite: 'm³'
                },
                nombre_circuits: 1,
                plancher_chauffant: false,
                radiateurs: true,
                nombre_radiateurs: 0,
                temperature_depart: 65,
                puissance_estimee: 0,
                cop_estime: 3.5,
              } : undefined,
              donnees_air_air: activeTab === 'Air_Air' ? {
                pieces: [],
                delta_temperature: 30,
                volume_total: 0,
                puissance_totale_estimee: 0,
                nombre_unites_interieures: 1,
                type_installation: 'Mono_split',
                niveau_isolation: 3,
                exposition_solaire: 'Multiple',
              } : undefined,
            });
            setShowModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {filteredCalculs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calculator-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>
              Aucun calcul PAC {activeTab.replace('_', '/')}
            </Text>
            <Text style={styles.emptySubtext}>
              Créez votre premier calcul de dimensionnement
            </Text>
          </View>
        ) : (
          filteredCalculs.map(calcul => (
            <View key={calcul.id}>
              {renderCalculItem({ item: calcul })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal création/édition */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowModal(false);
              setSelectedCalcul(null);
              setCurrentStep(0);
            }}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedCalcul ? 'Modifier' : 'Nouveau'} Calcul PAC
            </Text>
            <TouchableOpacity onPress={createCalcul}>
              <Text style={styles.saveButton}>
                {currentStep === 1 && newCalcul.type_pac === 'Air_Eau' ? 'Terminer' : 'Sauver'}
              </Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView style={styles.formContent}>
              {!selectedCalcul && (
                <View style={styles.clientInfoSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Client *</Text>
                    <TextInput
                      style={styles.input}
                      value={newCalcul.client_name}
                      onChangeText={(text) => setNewCalcul({...newCalcul, client_name: text})}
                      placeholder="Nom du client"
                      placeholderTextColor="#666"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Adresse</Text>
                    <TextInput
                      style={styles.input}
                      value={newCalcul.adresse}
                      onChangeText={(text) => setNewCalcul({...newCalcul, adresse: text})}
                      placeholder="Adresse du projet"
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>
              )}

              {newCalcul.type_pac === 'Air_Eau' ? renderAirEauForm() : renderAirAirForm()}

              {newCalcul.type_pac === 'Air_Eau' && currentStep === 0 && (
                <View style={styles.navigationButtons}>
                  <TouchableOpacity 
                    style={styles.nextButton}
                    onPress={() => setCurrentStep(1)}
                  >
                    <Text style={styles.nextButtonText}>Calculer</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  calculCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  calculHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calculInfo: {
    flex: 1,
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
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
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
  calculMeta: {
    alignItems: 'flex-end',
  },
  resultatPreview: {
    alignItems: 'flex-end',
  },
  puissanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00D4AA',
  },
  copText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
  },
  formContent: {
    flex: 1,
    padding: 16,
  },
  clientInfoSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
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
  inputSubLabel: {
    color: '#999',
    fontSize: 14,
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
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
  },
  isolationSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  isolationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  isolationButtonActive: {
    backgroundColor: '#007AFF',
  },
  isolationButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  isolationButtonTextActive: {
    color: '#fff',
  },
  isolationScale: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  resultatCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  resultatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultatLabel: {
    color: '#999',
    fontSize: 14,
  },
  resultatValue: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '600',
  },
  navigationButtons: {
    marginTop: 24,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});