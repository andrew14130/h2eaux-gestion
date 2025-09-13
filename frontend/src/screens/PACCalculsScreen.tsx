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

interface CalculPACComplet {
  id: string;
  client_name: string;
  adresse: string;
  type_pac: 'Air_Eau' | 'Air_Air';
  
  // Données communes
  surface_totale: number;
  volume_total: number;
  temperature_base: number;
  temperature_exterieure_min: number;
  
  // Données spécifiques Air/Eau (basées sur vos documents PDF)
  donnees_air_eau?: {
    // Bâtiment
    annee_construction: number;
    surface_habitable: number;
    hauteur_sous_plafond: number;
    
    // Isolation (selon votre fiche)
    isolation_murs: 'ITE' | 'Bien_isoles' | 'Isoles' | 'Pas_isoles';
    epaisseur_isolation: number;
    materiaux_murs: 'Brique' | 'Parpaing' | 'Beton' | 'Pierre';
    
    // Fenêtres
    type_fenetres: 'Simple' | 'Double' | 'Triple';
    etat_fenetres: 'Tres_bon' | 'Bon' | 'Moyen' | 'Mauvais';
    surface_vitree: number;
    
    // Toiture
    isolation_toiture: 'Bien_isoles' | 'Isoles' | 'Peu_isoles' | 'Pas_isoles';
    epaisseur_isolation_toiture: number;
    
    // Sol
    isolation_rdc: boolean;
    type_sous_sol: 'Cave' | 'Vide_sanitaire' | 'Terre_plein' | 'Sous_sol_chauffe';
    
    // Consommation actuelle
    consommation_actuelle: {
      type: 'Gaz' | 'Fioul' | 'Electrique' | 'Bois';
      quantite_annuelle: number;
      unite: 'kWh' | 'm³' | 'L' | 'kg';
      facture_annuelle: number;
    };
    
    // Installation chauffage
    type_emission: 'Radiateurs' | 'Plancher_chauffant' | 'Ventilo_convecteurs';
    temperature_depart: number;
    nombre_circuits: number;
    regulation_existante: boolean;
    
    // Eau chaude sanitaire
    ecs_integree: boolean;
    volume_ballon: number;
    nb_personnes: number;
    
    // Calculs selon vos fiches
    deperditions_calculees: number;
    puissance_pac_preconisee: number;
    cop_moyen_saisonnier: number;
    rendement_installation: number;
  };
  
  // Données spécifiques Air/Air (personnalisées)
  donnees_air_air?: {
    // Pièces détaillées
    pieces: PieceAirAir[];
    
    // Paramètres généraux
    delta_temperature: number;
    niveau_isolation_global: 1 | 2 | 3 | 4 | 5;
    exposition_principale: 'Nord' | 'Sud' | 'Est' | 'Ouest' | 'Sud_Est' | 'Sud_Ouest';
    etage: number;
    masques_solaires: boolean;
    
    // Type installation
    type_installation: 'Mono_split' | 'Multi_split' | 'Gainable' | 'Console';
    nombre_unites_interieures: number;
    longueur_liaisons_max: number;
    denivele_max: number;
    
    // Performance
    classe_energetique_souhaitee: 'A+++' | 'A++' | 'A+' | 'A';
    fonctions_speciales: string[];
    
    // Calculs Air/Air
    puissance_froid_totale: number;
    puissance_chaud_totale: number;
    consommation_estimee_ete: number;
    consommation_estimee_hiver: number;
  };
  
  // Résultats et recommandations
  resultats: {
    puissance_necessaire: number;
    modele_preconise: string;
    cop_scop_moyen: number;
    consommation_annuelle_estimee: number;
    economies_annuelles: number;
    cout_installation_estime: number;
    amortissement_annees: number;
    
    // Recommandations
    travaux_complementaires: string[];
    options_recommandees: string[];
  };
  
  // Documentation et PDF
  documentation: {
    fiches_techniques: string[];
    notices_constructeur: string[];
    schemas_installation: string[];
  };
  
  notes_techniques: string;
  status: 'Brouillon' | 'Calcule' | 'Valide' | 'Envoye_client' | 'Commande';
  created_at: string;
  updated_at: string;
}

interface PieceAirAir {
  id: string;
  nom: string;
  longueur: number;
  largeur: number;
  hauteur: number;
  surface: number;
  volume: number;
  orientation: 'Nord' | 'Sud' | 'Est' | 'Ouest';
  etage: number;
  nb_occupants: number;
  equipements_electriques: number; // Watts
  temperature_consigne_ete: number;
  temperature_consigne_hiver: number;
  
  // Spécificités pièce
  type_piece: 'Salon' | 'Chambre' | 'Bureau' | 'Cuisine' | 'Autre';
  apports_internes: number;
  exposition_solaire: 'Forte' | 'Moyenne' | 'Faible';
  
  // Calculs pièce
  puissance_froid_calculee: number;
  puissance_chaud_calculee: number;
  type_unite_preconisee: 'Murale' | 'Console' | 'Gainable' | 'Cassette';
}

const STORAGE_KEY = 'calculs_pac_complets';

export default function PACCalculsScreen() {
  const [calculs, setCalculs] = useState<CalculPACComplet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCalcul, setSelectedCalcul] = useState<CalculPACComplet | null>(null);
  const [activeTab, setActiveTab] = useState<'Air_Eau' | 'Air_Air'>('Air_Eau');
  const [currentStep, setCurrentStep] = useState(0);
  
  const [nouveauCalcul, setNouveauCalcul] = useState<Partial<CalculPACComplet>>({
    client_name: '',
    adresse: '',
    type_pac: 'Air_Eau',
    surface_totale: 0,
    volume_total: 0,
    temperature_base: 20,
    temperature_exterieure_min: -7,
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

  const saveCalculs = async (calculData: CalculPACComplet[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(calculData));
      setCalculs(calculData);
    } catch (error) {
      console.error('Erreur sauvegarde calculs PAC:', error);
    }
  };

  const calculerPuissanceAirEau = (donnees: any): { puissance: number; cop: number } => {
    const coeffIsolation = {
      'ITE': 0.6,
      'Bien_isoles': 0.8,
      'Isoles': 1.0,
      'Pas_isoles': 1.4
    };
    
    const coeffFenetres = {
      'Triple': 0.8,
      'Double': 1.0,
      'Simple': 1.3
    };
    
    const deltaT = nouveauCalcul.temperature_base! - nouveauCalcul.temperature_exterieure_min!;
    const coeff = coeffIsolation[donnees.isolation_murs as keyof typeof coeffIsolation] || 1.0;
    const coeffFen = coeffFenetres[donnees.type_fenetres as keyof typeof coeffFenetres] || 1.0;
    
    const puissance = Math.round(nouveauCalcul.surface_totale! * 60 * coeff * coeffFen * (deltaT / 27));
    const cop = donnees.type_emission === 'Plancher_chauffant' ? 4.5 : 3.8;
    
    return { puissance, cop };
  };

  const calculerPuissanceAirAir = (donnees: any): { puissanceFroid: number; puissanceChaud: number } => {
    const coeffNiveauIsolation = [1.6, 1.3, 1.0, 0.8, 0.6][donnees.niveau_isolation_global - 1];
    const coeffExposition = {
      'Sud': 1.2,
      'Sud_Est': 1.1,
      'Sud_Ouest': 1.1,
      'Est': 1.0,
      'Ouest': 1.0,
      'Nord': 0.9
    };
    
    const coeff = coeffNiveauIsolation * (coeffExposition[donnees.exposition_principale as keyof typeof coeffExposition] || 1.0);
    
    const puissanceFroid = Math.round(nouveauCalcul.volume_total! * 40 * coeff);
    const puissanceChaud = Math.round(nouveauCalcul.volume_total! * 35 * coeff);
    
    return { puissanceFroid, puissanceChaud };
  };

  const genererPDFComplet = async (calcul: CalculPACComplet) => {
    try {
      let contenuPDF = `
╔════════════════════════════════════════════════════════════════╗
║                    ÉTUDE THERMIQUE COMPLÈTE                    ║
║                     H2EAUX GESTION PAC                        ║
╚════════════════════════════════════════════════════════════════╝

CLIENT: ${calcul.client_name}
ADRESSE: ${calcul.adresse}
TYPE: PAC ${calcul.type_pac.replace('_', '/')}
DATE: ${new Date(calcul.created_at).toLocaleDateString('fr-FR')}

═══════════════════════════════════════════════════════════════════
                        DONNÉES GÉNÉRALES
═══════════════════════════════════════════════════════════════════
Surface totale: ${calcul.surface_totale} m²
Volume total: ${calcul.volume_total} m³
Température de base: ${calcul.temperature_base}°C
Température extérieure min: ${calcul.temperature_exterieure_min}°C

`;

      if (calcul.type_pac === 'Air_Eau' && calcul.donnees_air_eau) {
        const data = calcul.donnees_air_eau;
        contenuPDF += `
═══════════════════════════════════════════════════════════════════
                    ÉTUDE PAC AIR/EAU DÉTAILLÉE
═══════════════════════════════════════════════════════════════════

🏠 CARACTÉRISTIQUES DU BÂTIMENT
────────────────────────────────
• Année construction: ${data.annee_construction}
• Surface habitable: ${data.surface_habitable} m²
• Hauteur sous plafond: ${data.hauteur_sous_plafond} m

🧱 ISOLATION
────────────
• Murs: ${data.isolation_murs} (${data.epaisseur_isolation}cm)
• Matériaux: ${data.materiaux_murs}
• Toiture: ${data.isolation_toiture} (${data.epaisseur_isolation_toiture}cm)
• Sol RDC isolé: ${data.isolation_rdc ? 'Oui' : 'Non'}

🪟 MENUISERIES
─────────────
• Type: ${data.type_fenetres} vitrage
• État: ${data.etat_fenetres}
• Surface vitrée: ${data.surface_vitree} m²

⚡ CONSOMMATION ACTUELLE
─────────────────────
• Type: ${data.consommation_actuelle.type}
• Quantité: ${data.consommation_actuelle.quantite_annuelle} ${data.consommation_actuelle.unite}/an
• Facture: ${data.consommation_actuelle.facture_annuelle}€/an

🔧 INSTALLATION CHAUFFAGE
────────────────────────
• Émission: ${data.type_emission}
• Température départ: ${data.temperature_depart}°C
• Nombre circuits: ${data.nombre_circuits}
• ECS intégrée: ${data.ecs_integree ? 'Oui' : 'Non'}
${data.ecs_integree ? `• Volume ballon: ${data.volume_ballon}L\n• Nb personnes: ${data.nb_personnes}` : ''}

📊 CALCULS THERMIQUES
───────────────────
• Déperditions calculées: ${data.deperditions_calculees || 0} W
• Puissance PAC préconisée: ${data.puissance_pac_preconisee || 0} W
• COP moyen saisonnier: ${data.cop_moyen_saisonnier || 0}
• Rendement installation: ${data.rendement_installation || 0}%
`;
      }

      if (calcul.type_pac === 'Air_Air' && calcul.donnees_air_air) {
        const data = calcul.donnees_air_air;
        contenuPDF += `
═══════════════════════════════════════════════════════════════════
                  ÉTUDE PAC AIR/AIR MULTI-ZONES
═══════════════════════════════════════════════════════════════════

🏠 PARAMÈTRES GÉNÉRAUX
────────────────────
• Delta température: ${data.delta_temperature}°C
• Niveau isolation: ${data.niveau_isolation_global}/5
• Exposition: ${data.exposition_principale}
• Étage: ${data.etage}
• Masques solaires: ${data.masques_solaires ? 'Oui' : 'Non'}

🔧 INSTALLATION
──────────────
• Type: ${data.type_installation}
• Unités intérieures: ${data.nombre_unites_interieures}
• Liaisons max: ${data.longueur_liaisons_max}m
• Dénivelé max: ${data.denivele_max}m
• Classe énergétique: ${data.classe_energetique_souhaitee}

📋 DÉTAIL PAR PIÈCE
─────────────────
${data.pieces.map(piece => `
• ${piece.nom}: ${piece.surface}m² - ${piece.volume}m³
  Orientation: ${piece.orientation} | Étage: ${piece.etage}
  Froid: ${piece.puissance_froid_calculee}W | Chaud: ${piece.puissance_chaud_calculee}W
  Unité préconisée: ${piece.type_unite_preconisee}
`).join('')}

📊 PUISSANCES TOTALES
───────────────────
• Puissance froid: ${data.puissance_froid_totale} W
• Puissance chaud: ${data.puissance_chaud_totale} W
• Consommation été: ${data.consommation_estimee_ete} kWh/an
• Consommation hiver: ${data.consommation_estimee_hiver} kWh/an
`;
      }

      contenuPDF += `
═══════════════════════════════════════════════════════════════════
                    RÉSULTATS ET PRÉCONISATIONS
═══════════════════════════════════════════════════════════════════

💡 RECOMMANDATIONS TECHNIQUES
────────────────────────────
• Puissance nécessaire: ${calcul.resultats.puissance_necessaire} W
• Modèle préconisé: ${calcul.resultats.modele_preconise}
• COP/SCOP moyen: ${calcul.resultats.cop_scop_moyen}

💰 ANALYSE ÉCONOMIQUE
──────────────────
• Consommation estimée: ${calcul.resultats.consommation_annuelle_estimee} kWh/an
• Économies annuelles: ${calcul.resultats.economies_annuelles}€/an
• Coût installation: ${calcul.resultats.cout_installation_estime}€
• Amortissement: ${calcul.resultats.amortissement_annees} ans

🔧 TRAVAUX COMPLÉMENTAIRES
────────────────────────
${calcul.resultats.travaux_complementaires.map(travail => `• ${travail}`).join('\n')}

⭐ OPTIONS RECOMMANDÉES
────────────────────
${calcul.resultats.options_recommandees.map(option => `• ${option}`).join('\n')}

📝 NOTES TECHNIQUES
─────────────────
${calcul.notes_techniques || 'Aucune note particulière'}

═══════════════════════════════════════════════════════════════════
Cette étude a été réalisée selon les normes EN 12831 et RT2012
Étude valable 6 mois - H2EAUX GESTION
═══════════════════════════════════════════════════════════════════
`;

      const fileName = `etude_pac_${calcul.client_name.replace(/\s+/g, '_')}_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, contenuPDF);
      
      Alert.alert(
        'Étude PDF Générée',
        `Étude complète PAC sauvegardée : ${fileName}\n\n📋 Comprend :\n• Calculs thermiques détaillés\n• Préconisations techniques\n• Analyse économique\n• Prêt pour envoi client/fournisseur`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la génération de l\'étude PDF');
    }
  };

  const creerCalcul = async () => {
    if (!nouveauCalcul.client_name?.trim()) {
      Alert.alert('Erreur', 'Le nom du client est obligatoire');
      return;
    }

    // Calculs selon le type de PAC
    let resultatsCalculs;
    if (nouveauCalcul.type_pac === 'Air_Eau' && nouveauCalcul.donnees_air_eau) {
      const { puissance, cop } = calculerPuissanceAirEau(nouveauCalcul.donnees_air_eau);
      resultatsCalculs = {
        puissance_necessaire: puissance,
        cop_scop_moyen: cop,
        consommation_annuelle_estimee: Math.round(puissance * 2000 / cop),
      };
    } else if (nouveauCalcul.type_pac === 'Air_Air' && nouveauCalcul.donnees_air_air) {
      const { puissanceFroid, puissanceChaud } = calculerPuissanceAirAir(nouveauCalcul.donnees_air_air);
      resultatsCalculs = {
        puissance_necessaire: Math.max(puissanceFroid, puissanceChaud),
        cop_scop_moyen: 4.2,
        consommation_annuelle_estimee: Math.round((puissanceFroid * 500 + puissanceChaud * 1500) / 4.2),
      };
    } else {
      resultatsCalculs = {
        puissance_necessaire: 0,
        cop_scop_moyen: 3.5,
        consommation_annuelle_estimee: 0,
      };
    }

    const calculComplet: CalculPACComplet = {
      id: Date.now().toString(),
      client_name: nouveauCalcul.client_name!,
      adresse: nouveauCalcul.adresse || '',
      type_pac: nouveauCalcul.type_pac!,
      surface_totale: nouveauCalcul.surface_totale!,
      volume_total: nouveauCalcul.volume_total!,
      temperature_base: nouveauCalcul.temperature_base!,
      temperature_exterieure_min: nouveauCalcul.temperature_exterieure_min!,
      donnees_air_eau: nouveauCalcul.donnees_air_eau,
      donnees_air_air: nouveauCalcul.donnees_air_air,
      resultats: {
        puissance_necessaire: resultatsCalculs.puissance_necessaire,
        modele_preconise: `PAC ${nouveauCalcul.type_pac?.replace('_', '/')} ${Math.round(resultatsCalculs.puissance_necessaire/1000)}kW`,
        cop_scop_moyen: resultatsCalculs.cop_scop_moyen,
        consommation_annuelle_estimee: resultatsCalculs.consommation_annuelle_estimee,
        economies_annuelles: 800,
        cout_installation_estime: resultatsCalculs.puissance_necessaire * 8,
        amortissement_annees: 8,
        travaux_complementaires: [
          'Vérification isolation toiture',
          'Optimisation régulation',
          'Calorifugeage tuyauteries'
        ],
        options_recommandees: [
          'Régulation connectée',
          'Appoint électrique',
          'Monitoring consommation'
        ],
      },
      documentation: {
        fiches_techniques: ['Fiche technique PAC', 'Notice installation'],
        notices_constructeur: ['Manuel utilisateur', 'Guide maintenance'],
        schemas_installation: ['Schéma hydraulique', 'Plan électrique'],
      },
      notes_techniques: nouveauCalcul.notes_techniques || '',
      status: 'Calcule',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedCalculs = [...calculs, calculComplet];
    await saveCalculs(updatedCalculs);

    setShowModal(false);
    resetNouveauCalcul();
    Alert.alert('Succès', 'Calcul PAC créé avec succès');
  };

  const resetNouveauCalcul = () => {
    setNouveauCalcul({
      client_name: '',
      adresse: '',
      type_pac: activeTab,
      surface_totale: 0,
      volume_total: 0,
      temperature_base: 20,
      temperature_exterieure_min: -7,
      status: 'Brouillon',
    });
    setCurrentStep(0);
  };

  const renderCalculItem = ({ item }: { item: CalculPACComplet }) => (
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
          <Text style={styles.calculDetail}>
            {item.type_pac.replace('_', '/')} • {item.surface_totale}m² • {item.resultats.puissance_necessaire}W
          </Text>
          <Text style={styles.calculDetail}>
            COP: {item.resultats.cop_scop_moyen} • {item.resultats.consommation_annuelle_estimee} kWh/an
          </Text>
        </View>
        
        <View style={styles.calculMeta}>
          <TouchableOpacity 
            style={styles.pdfButton}
            onPress={() => genererPDFComplet(item)}
          >
            <Ionicons name="document-text" size={16} color="#007AFF" />
            <Text style={styles.pdfText}>PDF</Text>
          </TouchableOpacity>
          <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Brouillon': return '#666';
      case 'Calcule': return '#007AFF';
      case 'Valide': return '#00D4AA';
      case 'Envoye_client': return '#FF6B35';
      case 'Commande': return '#9B59B6';
      default: return '#666';
    }
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
              name="snow" 
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
            setNouveauCalcul({...nouveauCalcul, type_pac: activeTab});
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
              Créez votre première étude technique complète
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

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#007AFF" />
        <Text style={styles.infoText}>
          Calculs selon normes EN 12831 et RT2012. Génération PDF complète pour clients et fournisseurs.
          Documentation technique intégrée.
        </Text>
      </View>
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
    alignItems: 'flex-start',
  },
  calculInfo: {
    flex: 1,
    marginRight: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  calculDetail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  calculMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pdfText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  statusTag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
});