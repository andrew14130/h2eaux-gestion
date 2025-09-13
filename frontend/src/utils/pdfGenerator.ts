import * as FileSystem from 'expo-file-system';

export interface PDFOptions {
  title: string;
  client: string;
  adresse?: string;
  date?: string;
  logo?: string;
}

export class H2EAUXPDFGenerator {
  private static readonly HEADER = `
╔══════════════════════════════════════════════════════════════════════╗
║                           H2EAUX GESTION                              ║
║                   PLOMBERIE • CHAUFFAGE • CLIMATISATION               ║
╚══════════════════════════════════════════════════════════════════════╝
`;

  private static readonly FOOTER = `
═══════════════════════════════════════════════════════════════════════
Document généré par H2EAUX GESTION - Application mobile professionnelle
Pour toute question : contact@h2eaux-gestion.fr
═══════════════════════════════════════════════════════════════════════
`;

  static async generateFicheTechniquePDF(fiche: any): Promise<string> {
    const content = `${this.HEADER}
                               FICHE TECHNIQUE
                            SALLE DE BAIN CLÉ EN MAIN

CLIENT: ${fiche.client_name}
ADRESSE: ${fiche.adresse || 'Non renseignée'}
PROJET: ${fiche.type_projet}
DATE: ${new Date(fiche.created_at).toLocaleDateString('fr-FR')}

═══════════════════════════════════════════════════════════════════════
                            DIMENSIONS PIÈCE
═══════════════════════════════════════════════════════════════════════
🏠 Longueur: ${fiche.dimensions.longueur}m
🏠 Largeur: ${fiche.dimensions.largeur}m  
🏠 Hauteur: ${fiche.dimensions.hauteur}m
🏠 Surface: ${fiche.dimensions.surface.toFixed(2)} m²
🏠 HSP (Hauteur sous plancher): ${fiche.hsp}cm

═══════════════════════════════════════════════════════════════════════
                          CARRELAGE SOL
═══════════════════════════════════════════════════════════════════════
📐 Format: ${fiche.carrelage_sol.format}
🎨 Couleur: ${fiche.carrelage_sol.couleur}
✨ Finition: ${fiche.carrelage_sol.finition}
🔄 Pose: ${fiche.carrelage_sol.pose}

📊 SURFACES ET QUANTITÉS:
   • Surface nette: ${fiche.carrelage_sol.surface_nette.toFixed(2)} m²
   • Surface avec chute (+10%): ${fiche.carrelage_sol.surface_avec_chute.toFixed(2)} m²
   • Prix unitaire: ${fiche.carrelage_sol.prix_m2}€/m²
   • TOTAL CARRELAGE SOL: ${(fiche.carrelage_sol.surface_avec_chute * fiche.carrelage_sol.prix_m2).toFixed(2)}€

🏭 Fournisseur: ${fiche.carrelage_sol.fournisseur || 'À définir'}
📝 Référence: ${fiche.carrelage_sol.reference || 'À définir'}

═══════════════════════════════════════════════════════════════════════
                          FAÏENCE MURS
═══════════════════════════════════════════════════════════════════════
📐 Format: ${fiche.carrelage_murs.format}
🎨 Couleur: ${fiche.carrelage_murs.couleur}
✨ Finition: ${fiche.carrelage_murs.finition}
📏 Hauteur de pose: ${fiche.carrelage_murs.hauteur_pose}cm

📊 SURFACES ET QUANTITÉS:
   • Surface nette: ${fiche.carrelage_murs.surface_nette.toFixed(2)} m²
   • Surface avec chute (+10%): ${fiche.carrelage_murs.surface_avec_chute.toFixed(2)} m²
   • Prix unitaire: ${fiche.carrelage_murs.prix_m2}€/m²
   • TOTAL FAÏENCE MURS: ${(fiche.carrelage_murs.surface_avec_chute * fiche.carrelage_murs.prix_m2).toFixed(2)}€

🏭 Fournisseur: ${fiche.carrelage_murs.fournisseur || 'À définir'}
📝 Référence: ${fiche.carrelage_murs.reference || 'À définir'}

═══════════════════════════════════════════════════════════════════════
                         ÉLÉMENTS SALLE DE BAIN
═══════════════════════════════════════════════════════════════════════
🚿 DOUCHE:
   • Type: ${fiche.elements.douche.type}
   • Dimensions: ${fiche.elements.douche.dimensions}
   • Évacuation: ${fiche.elements.douche.evacuation}
   • Paroi: ${fiche.elements.douche.paroi}
   • Robinetterie: ${fiche.elements.douche.robinetterie}

🚰 LAVABO:
   • Type: ${fiche.elements.lavabo.type}
   • Dimensions: ${fiche.elements.lavabo.dimensions}
   • Robinetterie: ${fiche.elements.lavabo.robinetterie}
   • Meuble: ${fiche.elements.lavabo.meuble}

🚽 WC:
   • Type: ${fiche.elements.wc.type}
   • Évacuation: ${fiche.elements.wc.evacuation}
   • Lave-mains: ${fiche.elements.wc.lave_mains ? 'Oui' : 'Non'}

═══════════════════════════════════════════════════════════════════════
                           INSTALLATIONS
═══════════════════════════════════════════════════════════════════════
🔧 PLOMBERIE:
   • Alimentation eau: ${fiche.plomberie.alimentation_eau}
   • Évacuation: ${fiche.plomberie.evacuation}
   • Ventilation: ${fiche.plomberie.ventilation}
   • Chauffage: ${fiche.plomberie.chauffage}

⚡ ÉLECTRICITÉ:
   • Éclairage principal: ${fiche.electricite.eclairage_principal}
   • Éclairage miroir: ${fiche.electricite.eclairage_miroir}
   • Nombre de prises: ${fiche.electricite.prises}
   • Interrupteurs: ${fiche.electricite.interrupteurs}
   • Ventilation électrique: ${fiche.electricite.ventilation_elec ? 'Oui' : 'Non'}

═══════════════════════════════════════════════════════════════════════
                              DEVIS DÉTAILLÉ
═══════════════════════════════════════════════════════════════════════
💼 MAIN D'ŒUVRE:
   • Nombre d'heures: ${fiche.calculs.main_oeuvre_heures}h
   • Taux horaire: ${fiche.calculs.taux_horaire}€/h
   • Total main d'œuvre: ${(fiche.calculs.main_oeuvre_heures * fiche.calculs.taux_horaire).toFixed(2)}€

🛠️ MATÉRIEL:
   • Carrelage sol: ${(fiche.carrelage_sol.surface_avec_chute * fiche.carrelage_sol.prix_m2).toFixed(2)}€
   • Faïence murs: ${(fiche.carrelage_murs.surface_avec_chute * fiche.carrelage_murs.prix_m2).toFixed(2)}€
   • Autres matériels: ${(fiche.calculs.materiel_total_ht - (fiche.carrelage_sol.surface_avec_chute * fiche.carrelage_sol.prix_m2) - (fiche.carrelage_murs.surface_avec_chute * fiche.carrelage_murs.prix_m2)).toFixed(2)}€
   • TOTAL MATÉRIEL HT: ${fiche.calculs.materiel_total_ht.toFixed(2)}€

💰 TOTAUX:
   • TOTAL HT: ${fiche.calculs.total_ht.toFixed(2)}€
   • TVA (${fiche.calculs.tva}%): ${(fiche.calculs.total_ttc - fiche.calculs.total_ht).toFixed(2)}€
   • TOTAL TTC: ${fiche.calculs.total_ttc.toFixed(2)}€

═══════════════════════════════════════════════════════════════════════
                            NOTES TECHNIQUES
═══════════════════════════════════════════════════════════════════════
🔍 Particularités: ${fiche.particularites || 'Aucune particularité'}

🔧 Contraintes: ${fiche.contraintes || 'Aucune contrainte particulière'}

📋 Notes stylet: ${fiche.notes_stylet || 'Aucune annotation'}

═══════════════════════════════════════════════════════════════════════
                           RÉCAPITULATIF FOURNITURE
═══════════════════════════════════════════════════════════════════════
Pour commande fournisseur:

🔲 CARRELAGE SOL:
   Référence: ${fiche.carrelage_sol.reference || '[À COMPLÉTER]'}
   Quantité: ${fiche.carrelage_sol.surface_avec_chute.toFixed(2)} m²
   Format: ${fiche.carrelage_sol.format}
   Couleur: ${fiche.carrelage_sol.couleur}
   Fournisseur: ${fiche.carrelage_sol.fournisseur || '[À COMPLÉTER]'}

🔲 FAÏENCE MURS:
   Référence: ${fiche.carrelage_murs.reference || '[À COMPLÉTER]'}
   Quantité: ${fiche.carrelage_murs.surface_avec_chute.toFixed(2)} m²
   Format: ${fiche.carrelage_murs.format}
   Couleur: ${fiche.carrelage_murs.couleur}
   Fournisseur: ${fiche.carrelage_murs.fournisseur || '[À COMPLÉTER]'}

${this.FOOTER}
`;

    return await this.savePDFFile(content, `fiche_sdb_${fiche.client_name.replace(/\s+/g, '_')}_${Date.now()}.txt`);
  }

  static async generateCalculPACPDF(calcul: any): Promise<string> {
    const content = `${this.HEADER}
                            ÉTUDE THERMIQUE PAC
                         ${calcul.type_pac.replace('_', '/')}

CLIENT: ${calcul.client_name}
ADRESSE: ${calcul.adresse || 'Non renseignée'}
DATE: ${new Date(calcul.created_at).toLocaleDateString('fr-FR')}

═══════════════════════════════════════════════════════════════════════
                            DONNÉES GÉNÉRALES
═══════════════════════════════════════════════════════════════════════
🏠 Surface totale: ${calcul.surface_totale} m²
📐 Volume total: ${calcul.volume_total} m³
🌡️ Température de base: ${calcul.temperature_base}°C
❄️ Température extérieure min: ${calcul.temperature_exterieure_min}°C

═══════════════════════════════════════════════════════════════════════
                          CALCULS THERMIQUES
═══════════════════════════════════════════════════════════════════════
⚡ Puissance nécessaire: ${calcul.resultats.puissance_necessaire} W
🏷️ Modèle préconisé: ${calcul.resultats.modele_preconise}
📊 COP/SCOP moyen: ${calcul.resultats.cop_scop_moyen}
💡 Consommation estimée: ${calcul.resultats.consommation_annuelle_estimee} kWh/an

═══════════════════════════════════════════════════════════════════════
                           ANALYSE ÉCONOMIQUE
═══════════════════════════════════════════════════════════════════════
💰 Économies annuelles: ${calcul.resultats.economies_annuelles}€/an
💵 Coût installation: ${calcul.resultats.cout_installation_estime}€
⏰ Amortissement: ${calcul.resultats.amortissement_annees} ans

═══════════════════════════════════════════════════════════════════════
                         PRÉCONISATIONS TECHNIQUES
═══════════════════════════════════════════════════════════════════════
🔧 Travaux complémentaires recommandés:
${calcul.resultats.travaux_complementaires.map((t: string) => `   • ${t}`).join('\n')}

⭐ Options recommandées:
${calcul.resultats.options_recommandees.map((o: string) => `   • ${o}`).join('\n')}

═══════════════════════════════════════════════════════════════════════
                           DOCUMENTATION JOINTE
═══════════════════════════════════════════════════════════════════════
📋 Fiches techniques: ${calcul.documentation.fiches_techniques.join(', ')}
📖 Notices: ${calcul.documentation.notices_constructeur.join(', ')}
📐 Schémas: ${calcul.documentation.schemas_installation.join(', ')}

═══════════════════════════════════════════════════════════════════════
                             NOTES TECHNIQUES
═══════════════════════════════════════════════════════════════════════
${calcul.notes_techniques || 'Aucune note particulière'}

═══════════════════════════════════════════════════════════════════════
Étude réalisée selon normes EN 12831 et RT2012
Étude valable 6 mois - H2EAUX GESTION
═══════════════════════════════════════════════════════════════════════

${this.FOOTER}
`;

    return await this.savePDFFile(content, `etude_pac_${calcul.client_name.replace(/\s+/g, '_')}_${Date.now()}.txt`);
  }

  static async generateMegExportPDF(data: any): Promise<string> {
    const content = `${this.HEADER}
                          EXPORT DONNÉES MEG
                      Synchronisation comptabilité

DATE EXPORT: ${new Date().toLocaleDateString('fr-FR')}

═══════════════════════════════════════════════════════════════════════
                            CLIENTS EXPORTÉS
═══════════════════════════════════════════════════════════════════════
Nombre total: ${data.clients.length}

${data.clients.map((client: any, index: number) => `
${index + 1}. ${client.prenom} ${client.nom}
   📧 ${client.email || 'Non renseigné'}
   📞 ${client.telephone || 'Non renseigné'}  
   📍 ${client.adresse}, ${client.code_postal} ${client.ville}
   🏠 Type chauffage: ${client.type_chauffage || 'Non renseigné'}
`).join('')}

═══════════════════════════════════════════════════════════════════════
                           MATÉRIELS EXPORTÉS  
═══════════════════════════════════════════════════════════════════════
Nombre total: ${data.materiels.length}

${data.materiels.map((materiel: any, index: number) => `
${index + 1}. ${materiel.designation}
   🏷️ Référence: ${materiel.reference}
   💰 Prix achat: ${materiel.prix_achat}€ | Vente: ${materiel.prix_vente}€
   📦 Stock: ${materiel.stock} ${materiel.unite}
   🏭 Fournisseur: ${materiel.fournisseur}
   📂 Catégorie: ${materiel.categorie}
`).join('')}

═══════════════════════════════════════════════════════════════════════
                              STATISTIQUES
═══════════════════════════════════════════════════════════════════════
📊 Répartition par catégorie:
   • Plomberie: ${data.materiels.filter((m: any) => m.categorie === 'Plomberie').length}
   • Chauffage: ${data.materiels.filter((m: any) => m.categorie === 'Chauffage').length}  
   • Climatisation: ${data.materiels.filter((m: any) => m.categorie === 'Climatisation').length}
   • Carrelage: ${data.materiels.filter((m: any) => m.categorie === 'Carrelage').length}
   • Faïence: ${data.materiels.filter((m: any) => m.categorie === 'Faience').length}

💰 Valeur stock total: ${data.materiels.reduce((sum: number, m: any) => sum + (m.prix_achat * m.stock), 0).toFixed(2)}€

${this.FOOTER}
`;

    return await this.savePDFFile(content, `export_meg_${Date.now()}.txt`);
  }

  private static async savePDFFile(content: string, fileName: string): Promise<string> {
    try {
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, content);
      return fileName;
    } catch (error) {
      throw new Error('Erreur lors de la sauvegarde du fichier PDF');
    }
  }
}

export default H2EAUXPDFGenerator;