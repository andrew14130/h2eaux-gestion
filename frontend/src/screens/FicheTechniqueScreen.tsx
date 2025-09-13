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
import * as FileSystem from 'expo-file-system';

interface FicheTechniqueSDB {
  id: string;
  client_name: string;
  adresse: string;
  type_projet: 'Creation' | 'Renovation' | 'Amenagement';
  
  // Dimensions pièce
  dimensions: {
    longueur: number;
    largeur: number;
    hauteur: number;
    surface: number;
  };
  
  // Carrelage sol
  carrelage_sol: {
    format: string; // "30x60", "60x60", etc.
    couleur: string;
    finition: 'Mat' | 'Brillant' | 'Satiné';
    pose: 'Droite' | 'Decalee' | 'Chevrons';
    surface_nette: number;
    surface_avec_chute: number; // +10% généralement
    prix_m2: number;
    fournisseur: string;
    reference: string;
  };
  
  // Faïence murs
  carrelage_murs: {
    format: string;
    couleur: string;
    finition: 'Mat' | 'Brillant' | 'Satiné';
    hauteur_pose: number; // Hauteur en cm
    surface_nette: number;
    surface_avec_chute: number;
    prix_m2: number;
    fournisseur: string;
    reference: string;
  };
  
  // Éléments SDB
  elements: {
    douche: {
      type: 'Italienne' | 'Receveur' | 'Baignoire_douche';
      dimensions: string;
      evacuation: 'Siphon_sol' | 'Siphon_mural';
      paroi: string;
      robinetterie: string;
    };
    lavabo: {
      type: 'Suspendu' | 'Colonne' | 'Plan_vasque';
      dimensions: string;
      robinetterie: string;
      meuble: string;
    };
    wc: {
      type: 'Suspendu' | 'Pose_sol';
      evacuation: 'Horizontale' | 'Verticale';
      lave_mains?: boolean;
    };
    autres: string[];
  };
  
  // Plomberie
  plomberie: {
    alimentation_eau: 'Cuivre' | 'PER' | 'Multicouche';
    evacuation: 'PVC' | 'Fonte';
    ventilation: 'VMC' | 'Naturelle';
    chauffage: 'Radiateur' | 'Plancher_chauffant' | 'Seche_serviette';
  };
  
  // Électricité
  electricite: {
    eclairage_principal: string;
    eclairage_miroir: string;
    prises: number;
    interrupteurs: number;
    ventilation_elec: boolean;
  };
  
  // HSP et particularités
  hsp: number; // Hauteur sous plancher
  particularites: string;
  contraintes: string;
  
  // Calculs et devis
  calculs: {
    main_oeuvre_heures: number;
    taux_horaire: number;
    materiel_total_ht: number;
    total_ht: number;
    tva: number;
    total_ttc: number;
  };
  
  notes_stylet?: string; // Annotations au stylet
  photos: string[]; // Base64 des photos
  
  status: 'Brouillon' | 'Valide' | 'Envoye_fournisseur' | 'Commande';
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'fiches_techniques_sdb';

const FORMATS_CARRELAGE = [
  '20x20', '25x25', '30x30', '33x33', '40x40', '45x45', '50x50', '60x60',
  '30x60', '20x60', '15x60', '10x60', '15x45', '25x40', '20x50'
];

const COULEURS_POPULAIRES = [
  'Blanc', 'Gris Clair', 'Gris Foncé', 'Noir', 'Beige', 'Taupe',
  'Bois Clair', 'Bois Foncé', 'Pierre', 'Marbre Blanc', 'Marbre Noir'
];

export default function FicheTechniqueScreen() {
  const [fiches, setFiches] = useState<FicheTechniqueSDB[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState<FicheTechniqueSDB | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const [nouvelleFiche, setNouvelleFiche] = useState<Partial<FicheTechniqueSDB>>({
    client_name: '',
    adresse: '',
    type_projet: 'Creation',
    dimensions: {
      longueur: 0,
      largeur: 0,
      hauteur: 2.5,
      surface: 0,
    },
    carrelage_sol: {
      format: '30x60',
      couleur: 'Gris Clair',
      finition: 'Mat',
      pose: 'Decalee',
      surface_nette: 0,
      surface_avec_chute: 0,
      prix_m2: 25,
      fournisseur: '',
      reference: '',
    },
    carrelage_murs: {
      format: '25x40',
      couleur: 'Blanc',
      finition: 'Brillant',
      hauteur_pose: 120,
      surface_nette: 0,
      surface_avec_chute: 0,
      prix_m2: 20,
      fournisseur: '',
      reference: '',
    },
    hsp: 0,
    particularites: '',
    status: 'Brouillon',
  });

  useEffect(() => {
    loadFiches();
  }, []);

  useEffect(() => {
    // Recalculer les surfaces quand les dimensions changent
    if (nouvelleFiche.dimensions) {
      const surface = nouvelleFiche.dimensions.longueur * nouvelleFiche.dimensions.largeur;
      const perimetre = 2 * (nouvelleFiche.dimensions.longueur + nouvelleFiche.dimensions.largeur);
      
      setNouvelleFiche(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions!,
          surface,
        },
        carrelage_sol: {
          ...prev.carrelage_sol!,
          surface_nette: surface,
          surface_avec_chute: surface * 1.1, // +10% chute
        },
        carrelage_murs: {
          ...prev.carrelage_murs!,
          surface_nette: (perimetre * prev.carrelage_murs!.hauteur_pose) / 100,
          surface_avec_chute: ((perimetre * prev.carrelage_murs!.hauteur_pose) / 100) * 1.1,
        },
      }));
    }
  }, [nouvelleFiche.dimensions?.longueur, nouvelleFiche.dimensions?.largeur, nouvelleFiche.carrelage_murs?.hauteur_pose]);

  const loadFiches = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFiches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur chargement fiches:', error);
    }
  };

  const saveFiches = async (fichesData: FicheTechniqueSDB[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fichesData));
      setFiches(fichesData);
    } catch (error) {
      console.error('Erreur sauvegarde fiches:', error);
    }
  };

  const createFiche = async () => {
    if (!nouvelleFiche.client_name?.trim()) {
      Alert.alert('Erreur', 'Le nom du client est obligatoire');
      return;
    }

    const ficheComplete: FicheTechniqueSDB = {
      id: Date.now().toString(),
      client_name: nouvelleFiche.client_name!,
      adresse: nouvelleFiche.adresse || '',
      type_projet: nouvelleFiche.type_projet!,
      dimensions: nouvelleFiche.dimensions!,
      carrelage_sol: nouvelleFiche.carrelage_sol!,
      carrelage_murs: nouvelleFiche.carrelage_murs!,
      elements: {
        douche: {
          type: 'Italienne',
          dimensions: '120x90',
          evacuation: 'Siphon_sol',
          paroi: 'Verre trempé',
          robinetterie: 'Mitigeur thermostatique',
        },
        lavabo: {
          type: 'Suspendu',
          dimensions: '60x45',
          robinetterie: 'Mitigeur',
          meuble: 'Sous-vasque 2 tiroirs',
        },
        wc: {
          type: 'Suspendu',
          evacuation: 'Horizontale',
          lave_mains: false,
        },
        autres: [],
      },
      plomberie: {
        alimentation_eau: 'PER',
        evacuation: 'PVC',
        ventilation: 'VMC',
        chauffage: 'Seche_serviette',
      },
      electricite: {
        eclairage_principal: 'Spots LED encastrés',
        eclairage_miroir: 'Réglette LED',
        prises: 2,
        interrupteurs: 2,
        ventilation_elec: true,
      },
      hsp: nouvelleFiche.hsp || 0,
      particularites: nouvelleFiche.particularites || '',
      contraintes: '',
      calculs: {
        main_oeuvre_heures: 40,
        taux_horaire: 45,
        materiel_total_ht: (nouvelleFiche.carrelage_sol!.surface_avec_chute * nouvelleFiche.carrelage_sol!.prix_m2) +
                          (nouvelleFiche.carrelage_murs!.surface_avec_chute * nouvelleFiche.carrelage_murs!.prix_m2),
        total_ht: 0,
        tva: 20,
        total_ttc: 0,
      },
      photos: [],
      status: 'Brouillon',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Calculer les totaux
    ficheComplete.calculs.total_ht = (ficheComplete.calculs.main_oeuvre_heures * ficheComplete.calculs.taux_horaire) + ficheComplete.calculs.materiel_total_ht;
    ficheComplete.calculs.total_ttc = ficheComplete.calculs.total_ht * (1 + ficheComplete.calculs.tva / 100);

    const updatedFiches = [...fiches, ficheComplete];
    await saveFiches(updatedFiches);

    setShowModal(false);
    resetNouvelleFiche();
    Alert.alert('Succès', 'Fiche technique créée avec succès');
  };

  const resetNouvelleFiche = () => {
    setNouvelleFiche({
      client_name: '',
      adresse: '',
      type_projet: 'Creation',
      dimensions: {
        longueur: 0,
        largeur: 0,
        hauteur: 2.5,
        surface: 0,
      },
      carrelage_sol: {
        format: '30x60',
        couleur: 'Gris Clair',
        finition: 'Mat',
        pose: 'Decalee',
        surface_nette: 0,
        surface_avec_chute: 0,
        prix_m2: 25,
        fournisseur: '',
        reference: '',
      },
      carrelage_murs: {
        format: '25x40',
        couleur: 'Blanc',
        finition: 'Brillant',
        hauteur_pose: 120,
        surface_nette: 0,
        surface_avec_chute: 0,
        prix_m2: 20,
        fournisseur: '',
        reference: '',
      },
      hsp: 0,
      particularites: '',
      status: 'Brouillon',
    });
    setCurrentStep(0);
  };

  const generatePDF = async (fiche: FicheTechniqueSDB) => {
    try {
      // Simulation de génération PDF avec stockage AsyncStorage
      const pdfContent = `
FICHE TECHNIQUE SALLE DE BAIN
==============================

Client: ${fiche.client_name}
Adresse: ${fiche.adresse}
Projet: ${fiche.type_projet}

DIMENSIONS
----------
${fiche.dimensions.longueur}m x ${fiche.dimensions.largeur}m x ${fiche.dimensions.hauteur}m
Surface: ${fiche.dimensions.surface.toFixed(2)} m²

CARRELAGE SOL
-------------
Format: ${fiche.carrelage_sol.format}
Couleur: ${fiche.carrelage_sol.couleur}
Surface: ${fiche.carrelage_sol.surface_avec_chute.toFixed(2)} m² (avec chute)
Prix: ${fiche.carrelage_sol.prix_m2}€/m²

FAÏENCE MURS
------------
Format: ${fiche.carrelage_murs.format}
Couleur: ${fiche.carrelage_murs.couleur}
Hauteur: ${fiche.carrelage_murs.hauteur_pose}cm
Surface: ${fiche.carrelage_murs.surface_avec_chute.toFixed(2)} m² (avec chute)
Prix: ${fiche.carrelage_murs.prix_m2}€/m²

DEVIS
-----
Main d'œuvre: ${fiche.calculs.main_oeuvre_heures}h x ${fiche.calculs.taux_horaire}€ = ${fiche.calculs.main_oeuvre_heures * fiche.calculs.taux_horaire}€
Matériel: ${fiche.calculs.materiel_total_ht.toFixed(2)}€
Total HT: ${fiche.calculs.total_ht.toFixed(2)}€
TVA (${fiche.calculs.tva}%): ${(fiche.calculs.total_ttc - fiche.calculs.total_ht).toFixed(2)}€
Total TTC: ${fiche.calculs.total_ttc.toFixed(2)}€

Particularités: ${fiche.particularites || 'Aucune'}
      `;

      // Stockage du PDF en AsyncStorage
      const fileName = `fiche_${fiche.client_name.replace(/\s+/g, '_')}_${Date.now()}`;
      await AsyncStorage.setItem(`pdf_${fileName}`, pdfContent);
      
      Alert.alert(
        'PDF Généré',
        `Fiche technique sauvegardée : ${fileName}\n\nPrêt pour envoi fournisseur`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la génération du PDF');
    }
  };

  const renderStep0 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informations projet</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Client *</Text>
        <TextInput
          style={styles.input}
          value={nouvelleFiche.client_name}
          onChangeText={(text) => setNouvelleFiche({...nouvelleFiche, client_name: text})}
          placeholder="Nom du client"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Adresse</Text>
        <TextInput
          style={styles.input}
          value={nouvelleFiche.adresse}
          onChangeText={(text) => setNouvelleFiche({...nouvelleFiche, adresse: text})}
          placeholder="Adresse du chantier"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Type de projet</Text>
        <View style={styles.radioGroup}>
          {['Creation', 'Renovation', 'Amenagement'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.radioButton,
                nouvelleFiche.type_projet === type && styles.radioButtonActive
              ]}
              onPress={() => setNouvelleFiche({...nouvelleFiche, type_projet: type as any})}
            >
              <Text style={[
                styles.radioText,
                nouvelleFiche.type_projet === type && styles.radioTextActive
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Dimensions pièce</Text>
      
      <View style={styles.row}>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Longueur (m)</Text>
          <TextInput
            style={styles.input}
            value={nouvelleFiche.dimensions?.longueur.toString()}
            onChangeText={(text) => setNouvelleFiche({
              ...nouvelleFiche,
              dimensions: {
                ...nouvelleFiche.dimensions!,
                longueur: parseFloat(text) || 0
              }
            })}
            placeholder="3.5"
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Largeur (m)</Text>
          <TextInput
            style={styles.input}
            value={nouvelleFiche.dimensions?.largeur.toString()}
            onChangeText={(text) => setNouvelleFiche({
              ...nouvelleFiche,
              dimensions: {
                ...nouvelleFiche.dimensions!,
                largeur: parseFloat(text) || 0
              }
            })}
            placeholder="2.8"
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Hauteur (m)</Text>
          <TextInput
            style={styles.input}
            value={nouvelleFiche.dimensions?.hauteur.toString()}
            onChangeText={(text) => setNouvelleFiche({
              ...nouvelleFiche,
              dimensions: {
                ...nouvelleFiche.dimensions!,
                hauteur: parseFloat(text) || 2.5
              }
            })}
            placeholder="2.5"
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Surface calculée</Text>
          <View style={styles.calculatedValue}>
            <Text style={styles.calculatedText}>
              {nouvelleFiche.dimensions?.surface.toFixed(2)} m²
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>HSP - Hauteur sous plancher (cm)</Text>
        <TextInput
          style={styles.input}
          value={nouvelleFiche.hsp?.toString()}
          onChangeText={(text) => setNouvelleFiche({...nouvelleFiche, hsp: parseInt(text) || 0})}
          placeholder="15"
          keyboardType="numeric"
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Carrelage sol</Text>
      
      <View style={styles.row}>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Format</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.optionsRow}>
              {FORMATS_CARRELAGE.map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.optionChip,
                    nouvelleFiche.carrelage_sol?.format === format && styles.optionChipActive
                  ]}
                  onPress={() => setNouvelleFiche({
                    ...nouvelleFiche,
                    carrelage_sol: {
                      ...nouvelleFiche.carrelage_sol!,
                      format
                    }
                  })}
                >
                  <Text style={[
                    styles.optionChipText,
                    nouvelleFiche.carrelage_sol?.format === format && styles.optionChipTextActive
                  ]}>
                    {format}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Couleur</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.optionsRow}>
            {COULEURS_POPULAIRES.map((couleur) => (
              <TouchableOpacity
                key={couleur}
                style={[
                  styles.optionChip,
                  nouvelleFiche.carrelage_sol?.couleur === couleur && styles.optionChipActive
                ]}
                onPress={() => setNouvelleFiche({
                  ...nouvelleFiche,
                  carrelage_sol: {
                    ...nouvelleFiche.carrelage_sol!,
                    couleur
                  }
                })}
              >
                <Text style={[
                  styles.optionChipText,
                  nouvelleFiche.carrelage_sol?.couleur === couleur && styles.optionChipTextActive
                ]}>
                  {couleur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Prix au m²</Text>
          <TextInput
            style={styles.input}
            value={nouvelleFiche.carrelage_sol?.prix_m2.toString()}
            onChangeText={(text) => setNouvelleFiche({
              ...nouvelleFiche,
              carrelage_sol: {
                ...nouvelleFiche.carrelage_sol!,
                prix_m2: parseFloat(text) || 0
              }
            })}
            placeholder="25.50"
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroupHalf}>
          <Text style={styles.inputLabel}>Surface avec chute</Text>
          <View style={styles.calculatedValue}>
            <Text style={styles.calculatedText}>
              {nouvelleFiche.carrelage_sol?.surface_avec_chute.toFixed(2)} m²
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total carrelage sol</Text>
        <Text style={styles.totalValue}>
          {((nouvelleFiche.carrelage_sol?.surface_avec_chute || 0) * (nouvelleFiche.carrelage_sol?.prix_m2 || 0)).toFixed(2)}€
        </Text>
      </View>
    </View>
  );

  const renderFicheItem = ({ item }: { item: FicheTechniqueSDB }) => (
    <TouchableOpacity 
      style={styles.ficheCard}
      onPress={() => setSelectedFiche(item)}
    >
      <View style={styles.ficheHeader}>
        <View style={styles.ficheInfo}>
          <Text style={styles.clientName}>{item.client_name}</Text>
          <Text style={styles.ficheDetail}>{item.type_projet} • {item.dimensions.surface.toFixed(1)} m²</Text>
          <Text style={styles.ficheDetail}>
            Sol: {item.carrelage_sol.format} {item.carrelage_sol.couleur}
          </Text>
        </View>
        
        <View style={styles.ficheMeta}>
          <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.fichePrice}>{item.calculs.total_ttc.toFixed(0)}€</Text>
        </View>
      </View>
      
      <View style={styles.ficheActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => generatePDF(item)}
        >
          <Ionicons name="document-text" size={16} color="#007AFF" />
          <Text style={styles.actionText}>PDF</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Brouillon': return '#666';
      case 'Valide': return '#00D4AA';
      case 'Envoye_fournisseur': return '#007AFF';
      case 'Commande': return '#FF6B35';
      default: return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Ionicons name="document-text" size={24} color="#FF6B35" />
          <Text style={styles.headerTitle}>Fiches Techniques SDB</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {fiches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>Aucune fiche technique</Text>
            <Text style={styles.emptySubtext}>Créez votre première fiche SDB</Text>
          </View>
        ) : (
          fiches.map(fiche => (
            <View key={fiche.id}>
              {renderFicheItem({ item: fiche })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal création fiche */}
      <Modal visible={showModal} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowModal(false);
              resetNouvelleFiche();
            }}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvelle Fiche SDB</Text>
            <TouchableOpacity onPress={currentStep === 2 ? createFiche : () => setCurrentStep(prev => prev + 1)}>
              <Text style={styles.saveButton}>
                {currentStep === 2 ? 'Créer' : 'Suivant'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressBar}>
            {[0, 1, 2].map((step) => (
              <View 
                key={step}
                style={[
                  styles.progressStep,
                  currentStep >= step && styles.progressStepActive
                ]}
              />
            ))}
          </View>

          <KeyboardAvoidingView 
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView style={styles.stepContent}>
              {currentStep === 0 && renderStep0()}
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
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
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#FF6B35',
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
  ficheCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ficheHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ficheInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  ficheDetail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  ficheMeta: {
    alignItems: 'flex-end',
  },
  statusTag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  fichePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00D4AA',
  },
  ficheActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
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
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#FF6B35',
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
  inputGroupHalf: {
    flex: 1,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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
  calculatedValue: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
  },
  calculatedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  radioButtonActive: {
    backgroundColor: '#FF6B35',
  },
  radioText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  radioTextActive: {
    color: '#fff',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  optionChipActive: {
    backgroundColor: '#007AFF',
  },
  optionChipText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  optionChipTextActive: {
    color: '#fff',
  },
  totalCard: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  totalValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});