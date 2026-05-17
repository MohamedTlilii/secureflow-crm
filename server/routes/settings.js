const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const auth     = require('../middleware/auth');

const col = () => mongoose.connection.db.collection('settings');

const DEFAULTS = {
  villes: [
    // ── Île de Montréal ───────────────────────────────────────────────────
    'Montréal','Westmount','Mont-Royal','Outremont','Côte-Saint-Luc',
    'Dollard-des-Ormeaux','Pointe-Claire','Kirkland','Beaconsfield','Baie-D\'Urfé',
    'Sainte-Anne-de-Bellevue','Dorval','Lachine','LaSalle','Verdun',
    'Saint-Laurent','Anjou','Saint-Léonard','Montréal-Est','Montréal-Nord',
    'Pierrefonds','Roxboro',
    // ── Laval ─────────────────────────────────────────────────────────────
    'Laval','Chomedey','Sainte-Rose','Vimont','Auteuil','Fabreville',
    'Duvernay','Saint-François','Laval-des-Rapides','Pont-Viau',
    // ── Rive-Nord (Laurentides / Lanaudière) ─────────────────────────────
    'Terrebonne','Repentigny','Mascouche','Blainville','Mirabel',
    'Saint-Eustache','Boisbriand','Sainte-Thérèse','Rosemère','Lorraine',
    'Deux-Montagnes','Saint-Jérôme','Lachute','Sainte-Agathe-des-Monts',
    'Mont-Tremblant','Saint-Sauveur','Prévost','Sainte-Sophie',
    'L\'Assomption','Joliette','Berthierville','Rawdon',
    // ── Rive-Sud (Montérégie) ─────────────────────────────────────────────
    'Longueuil','Brossard','Saint-Jean-sur-Richelieu','Châteauguay',
    'Boucherville','Varennes','Saint-Bruno-de-Montarville','Candiac',
    'La Prairie','Sainte-Julie','Beloeil','Mont-Saint-Hilaire',
    'Saint-Constant','Delson','Sainte-Catherine','Saint-Philippe',
    'Carignan','Chambly','Saint-Basile-le-Grand','McMasterville',
    'Saint-Lambert','Greenfield Park','Saint-Hyacinthe',
    'Sorel-Tracy','Granby','Bromont','Cowansville','Magog',
    'Saint-Jean-Baptiste','Vaudreuil-Dorion','Hudson','Rigaud',
    // ── Grand Québec ──────────────────────────────────────────────────────
    'Québec','Lévis','Sainte-Foy','Charlesbourg','Beauport','Sillery',
    'Cap-Rouge','Ancienne-Lorette','Saint-Augustin-de-Desmaures',
    'L\'Ancienne-Lorette','Lac-Beauport','Shannon','Stoneham',
    'Saint-Georges','Thetford Mines','Victoriaville','Plessisville',
    // ── Sherbrooke / Estrie ────────────────────────────────────────────────
    'Sherbrooke','Magog','Coaticook','Windsor','East Angus',
    'Cookshire-Eaton','Lac-Mégantic','Val-des-Sources','Waterville',
    'Bromptonville','Rock Forest','Deauville','Fleurimont',
    // ── Mauricie / Centre-du-Québec ───────────────────────────────────────
    'Trois-Rivières','Shawinigan','La Tuque','Louiseville',
    'Bécancour','Nicolet','Drummondville','Victoriaville',
    'Cap-de-la-Madeleine','Grand-Mère','Shawinigan-Sud',
    // ── Outaouais ─────────────────────────────────────────────────────────
    'Gatineau','Aylmer','Hull','Buckingham','Thurso',
    'Chelsea','Cantley','La Pêche','Papineauville','Maniwaki',
    'Pontiac','Luskville','Masson-Angers','Rockland',
    // ── Saguenay–Lac-Saint-Jean ───────────────────────────────────────────
    'Saguenay','Chicoutimi','Jonquière','La Baie','Alma',
    'Roberval','Dolbeau-Mistassini','Saint-Félicien',
    // ── Bas-Saint-Laurent / Gaspésie ─────────────────────────────────────
    'Rimouski','Rivière-du-Loup','Matane','Amqui','Mont-Joli',
    // ── Autre ─────────────────────────────────────────────────────────────
    'Autre'
  ],
  typeCommerce: [
    // ── SERVICES ──────────────────────────────────────────────────────────
    {key:'coiffure_esthetique',              label:'Coiffure et esthétique'},
    {key:'salle_de_sport',                   label:'Salle de sport'},
    {key:'vape',                             label:'Vape'},
    {key:'cafe',                             label:'Café'},
    {key:'garderie_familiale',               label:'Garderie familiale'},
    {key:'couture',                          label:'Couture'},
    {key:'tatouage',                         label:'Tatouage'},
    {key:'auto_ecole',                       label:'Auto école'},
    {key:'garderie_educative',               label:'Garderie éducative'},
    {key:'agence_de_voyage',                 label:'Agence de voyage'},
    {key:'alimentation_specialisee',         label:'Alimentation spécialisée'},
    {key:'joaillier',                        label:'Joaillier'},
    {key:'rembourrage',                      label:'Rembourrage'},
    {key:'ateliers_usinage',                 label:"Ateliers d'usinage"},
    {key:'nettoyage',                        label:'Nettoyage'},
    {key:'formation_education',              label:'Formation et éducation'},
    {key:'courtier_hypotheque_assurance',    label:"Courtier d'hypothèque et d'assurance"},
    {key:'inspecteur_batiment',              label:'Inspecteur en bâtiment'},
    {key:'courtier_immobilier',              label:'Courtier immobilier'},
    {key:'industrie_vetements_professionnels', label:'Industrie des vêtements professionnels'},
    {key:'industrie_produits_mineraux',      label:'Industries de produits minéraux non métalliques'},
    {key:'services_comptabilite',            label:'Services de comptabilité et de tenue de livres'},
    {key:'services_conciergerie',            label:"Services de conciergerie et d'entretien"},
    {key:'services_desinfection',            label:"Services de désinfection et d'extermination"},
    {key:'services_location',               label:'Services de location'},
    {key:'services_publicite',              label:'Services de publicité'},
    {key:'soudeur',                         label:'Soudeur'},
    {key:'recyclage',                       label:'Recyclage'},
    {key:'photographie',                    label:'Photographie'},
    {key:'services_transport',              label:'Services de transport'},
    // ── COMMERCE ──────────────────────────────────────────────────────────
    {key:'boucherie',                       label:'Boucherie'},
    {key:'epicerie',                        label:'Épicerie'},
    {key:'animalerie',                      label:'Animalerie'},
    {key:'fleuriste',                       label:'Fleuriste'},
    {key:'poissonnerie',                    label:'Poissonnerie'},
    {key:'commerce',                        label:'Commerce'},
    {key:'friperie',                        label:'Friperie'},
    {key:'magasin_antiquites',              label:"Magasin d'antiquités"},
    {key:'librairie',                       label:'Librairie'},
    {key:'magasin_nourriture_animaux',      label:'Magasin de nourriture pour animaux'},
    {key:'commerce_lunetier',               label:'Commerce de lunetier'},
    {key:'commerce_peinture_vitres',        label:'Commerce de détail de peinture de vitres et de papier peint'},
    {key:'commerce_gros',                   label:'Commerce en gros'},
    {key:'magasin_fruits_legumes',          label:'Magasins de fruits et légumes'},
    {key:'commerce_vetement',               label:'Commerce de détail de vêtements'},
    {key:'commerce_equipements',            label:"Commerce de détail d'équipements"},
    {key:'commerce_motocyclettes',          label:'Commerce de détail de motocyclettes et de motoneiges'},
    {key:'vente_materiel_informatique',     label:'Vente et entretien de matériel informatique'},
    {key:'vente_electromenager',            label:"Vente et entretien de matériel d'électroménager"},
    {key:'vente_reparation_montres',        label:"Vente et réparation de montres et d'horloges"},
    {key:'distribution_eau',               label:"Distribution d'eau"},
    {key:'depanneur',                       label:'Dépanneur'},
    {key:'magasin_ameublement',            label:"Magasin d'ameublement et de décoration"},
    {key:'concession_auto_comm',            label:"Concession d'auto"},
    {key:'vente_produits_capillaire',       label:'Vente de produits capillaires'},
    // ── AUTO ──────────────────────────────────────────────────────────────
    {key:'esthetique_automobile',           label:'Esthétique automobile'},
    {key:'lave_auto',                       label:'Lave-auto'},
    {key:'mecanique_pneus',                 label:'Mécanique et pneus'},
    {key:'carrosserie',                     label:'Carrosserie'},
    {key:'concession_auto',                 label:'Concession auto'},
    {key:'piece_rechange_voiture',          label:'Pièce de rechange voiture'},
    {key:'vente_automobile',               label:"Vente d'automobile"},
    {key:'remplacement_pare_brise',         label:'Remplacement de pare-brise'},
    {key:'remorquage',                      label:'Remorquage'},
    // ── FOOD ──────────────────────────────────────────────────────────────
    {key:'pizzeria',                        label:'Pizzeria'},
    {key:'restaurant',                      label:'Restaurant'},
    {key:'restaurant_dejeuners',            label:'Restaurant de déjeuners'},
    {key:'boulangerie',                     label:'Boulangerie'},
    {key:'traiteur',                        label:'Traiteur'},
    {key:'vente_desserts_congeles',         label:'Préparation et vente de desserts congelés'},
    {key:'industrie_confiseries',           label:'Industrie des confiseries et du chocolat'},
    // ── PARAMÉDICAL ───────────────────────────────────────────────────────
    {key:'veterinaire',                     label:'Vétérinaire'},
    {key:'massotherapie',                   label:'Massothérapie'},
    {key:'cabinet_infirmier',               label:"Cabinets d'infirmiers et d'infirmières"},
    {key:'clinique_dentaire',               label:'Clinique dentaire'},
    {key:'cabinet_chiropraticien',          label:'Cabinets de chiropraticiens'},
    // ── CONSTRUCTION ──────────────────────────────────────────────────────
    {key:'architecte',                      label:'Architecte'},
    {key:'designer_interieur',              label:"Designer d'intérieur et peinture"},
    {key:'vente_portes_fenetres',           label:'Vente et installation de portes et fenêtres'},
    {key:'paysagiste',                      label:'Paysagiste'},
    {key:'travaux_chantier',                label:'Travaux sur chantier'},
    {key:'gestion_construction',            label:'Gestion de travaux de construction'},
    {key:'sablage',                         label:'Sablage au jet de sable'},
    {key:'excavation_nivellement',          label:"Travaux d'excavation et de nivellement"},
    {key:'amenagement',                     label:'Aménagement'},
    {key:'climatisation_chauffage',         label:'Climatisation et chauffage'},
    {key:'electricien',                     label:'Service électricien'},
    {key:'maconnerie',                      label:'Maçonnerie'},
    {key:'plomberie',                       label:'Plomberie'},
    {key:'toiture',                         label:'Toiture'},
    {key:'installation_piscines',           label:'Installation de piscines'},
    {key:'boiserie_ebenisterie',            label:'Boiserie et ébénisterie'},
    {key:'location_grues',                  label:'Location de grues'},
    {key:'installation_vitres',             label:'Installation de vitres'},
    {key:'serruier',                        label:'Serruier'},
    {key:'autre',                           label:'Autre'},
  ],
  typeLead: [
    {key:'nouvelle_entreprise',label:'Nouvelle entreprise'},
    {key:'demenagement',label:'Déménagement'},
    {key:'reouverture',label:'Réouverture'},
    {key:'commerce_existant',label:'Commerce existant'},
    {key:'autre',label:'Autre'}
  ],
  qualificationSysteme: [
    {key:'pas_de_systeme',label:'Pas de système'},
    {key:'systeme_plus_10_ans',label:'Système +10 ans'},
    {key:'systeme_non_connecte_nouveau_proprio',label:'Non connecté (nouveau proprio)'},
    {key:'systeme_non_connecte_insatisfait',label:'Non connecté (insatisfait)'},
    {key:'systeme_non_connecte_diy',label:'Non connecté (DIY)'},
    {key:'systeme_moins_5_ans_avec_contrat',label:'-5 ans avec contrat'},
    {key:'systeme_moins_5_ans_sans_contrat',label:'-5 ans sans contrat'},
    {key:'systeme_5_10_ans_panneau_tactile',label:'5-10 ans panneau tactile'},
    {key:'systeme_5_10_ans_panneau_boutons',label:'5-10 ans panneau boutons'},
    {key:'inconnu',label:'Inconnu'}
  ],
  services: [
    {
      id:'alarme', label:'Alarme', color:'#f04438', icon:'shield',
      actuel:[
        {key:'inconnu',label:'Inconnu'},{key:'protectron',label:'Protectron'},
        {key:'adt',label:'ADT'},{key:'telus_alarme',label:'Telus'},
        {key:'bell_alarme',label:'Bell'},{key:'api_alarm',label:'API'},
        {key:'stanley',label:'Stanley'},{key:'securitas',label:'Securitas'},
        {key:'gardaworld',label:'GardaWorld'},{key:'alarme_mirabel',label:'Alarme Mirabel'},
        {key:'alarme_signal_teck',label:'Signal Teck'},{key:'bigbrothers',label:'Bigbrothers'},
        {key:'allo_alarme',label:'Alloo Alarme'},{key:'autre',label:'Autre'}
      ],
      propose:[
        {key:'aucun',label:'Aucun'},{key:'gardaworld',label:'GardaWorld'},
        {key:'telus_alarme',label:'Telus'},{key:'autre',label:'Autre'}
      ],
      equipements:[
        {key:'iq2',                  label:'IQ2',                            category:'base',  color:'#f04438'},
        {key:'iq_hub',               label:'IQ HUB',                         category:'base',  color:'#f04438'},
        {key:'iq4',                  label:'IQ4',                            category:'base',  color:'#f04438'},
        {key:'iq5',                  label:'IQ5',                            category:'base',  color:'#f04438'},
        {key:'panneau',              label:'Panneau de contrôle',             category:'base',  color:'#f04438'},
        {key:'application',          label:'Application mobile (Alarme.com)', category:'base',  color:'#f04438'},
        {key:'camera_ext',           label:'Caméras Extérieures',            category:'extra', color:'#0ea5e9'},
        {key:'camera_int',           label:'Caméras Intérieures',            category:'extra', color:'#a855f7'},
        {key:'sd_card',              label:'SD card',                         category:'extra', color:'#94a3b8'},
        {key:'detecteur_temperature',label:'Détecteur de Température',       category:'extra', color:'#f97316'},
        {key:'detecteur_fumee',      label:'Détecteur de Fumée',             category:'extra', color:'#b91c1c'},
        {key:'detecteur_vitre',      label:'Détecteur de brise du vitre',    category:'extra', color:'#84cc16'},
        {key:'clavier_secondaire',   label:'Clavier Secondaire',             category:'extra', color:'#14b8a6'},
        {key:'skybell',              label:'Sonnette Vidéo Sans Fil (SkyBell)',category:'extra',color:'#f59e0b'},
        {key:'serrure_intelligente', label:'Serrure Intelligente',           category:'extra', color:'#10b981'},
        {key:'thermostat',           label:'Thermostat',                     category:'extra', color:'#6366f1'},
        {key:'detecteur_monoxyde',   label:'Détecteur de monoxyde de carbone',category:'extra',color:'#78716c'},
        {key:'detecteur_eau',        label:"Détecteur d'eau",                category:'extra', color:'#38bdf8'},
        {key:'valve_eau',            label:"Valve d'eau",                    category:'extra', color:'#4ade80'},
        {key:'lampe_intelligente',   label:'Lampe Intelligente',             category:'extra', color:'#facc15'},
        {key:'prise_intelligente',   label:'Prise intelligente',             category:'extra', color:'#fb923c'},
        {key:'super_switch',         label:'Super Switch',                   category:'extra', color:'#e879f9'},
        {key:'dvr',                  label:'DVR',                            category:'extra', color:'#c084fc'},
        {key:'nvr',                  label:'NVR',                            category:'extra', color:'#22d3ee'}
      ]
    },
    {
      id:'internet', label:'Internet', color:'#3b6cf8', icon:'wifi',
      actuel:[
        {key:'inconnu',label:'Inconnu'},{key:'bell_internet',label:'Bell'},
        {key:'virgin',label:'Virgin'},{key:'lucky_mobile',label:'Lucky Mobile'},
        {key:'telus_internet',label:'Telus'},{key:'koodo',label:'Koodo'},
        {key:'public_mobile',label:'Public Mobile'},{key:'rogers',label:'Rogers'},
        {key:'fido',label:'Fido'},{key:'chatr',label:'Chatr'},
        {key:'videotron',label:'Vidéotron'},{key:'fizz',label:'Fizz'},
        {key:'autre',label:'Autre'}
      ],
      propose:[
        {key:'aucun',label:'Aucun'},{key:'rogers_comwave',label:'Rogers ComeWave'},
        {key:'rogers_5g',label:'Rogers 5G'},{key:'ebox',label:'EBox'}
      ],
      equipements:[]
    },
    {
      id:'mobile', label:'Mobile', color:'#12b76a', icon:'smartphone',
      actuel:[
        {key:'inconnu',label:'Inconnu'},{key:'bell_mobile',label:'Bell'},
        {key:'virgin_plus',label:'Virgin'},{key:'lucky_mobile',label:'Lucky Mobile'},
        {key:'telus_mobile',label:'Telus'},{key:'koodo',label:'Koodo'},
        {key:'public_mobile',label:'Public Mobile'},{key:'rogers',label:'Rogers'},
        {key:'fido',label:'Fido'},{key:'chatr',label:'Chatr'},
        {key:'videotron',label:'Vidéotron'},{key:'fizz',label:'Fizz'},
        {key:'autre',label:'Autre'}
      ],
      propose:[
        {key:'aucun',label:'Aucun'},{key:'rogers',label:'Rogers'}
      ],
      equipements:[]
    }
  ]
};

router.get('/', auth, async (req, res) => {
  try {
    let doc = await col().findOne({ _id: 'global' });
    if (!doc) {
      await col().insertOne({ _id: 'global', ...DEFAULTS });
      doc = { _id: 'global', ...DEFAULTS };
    }
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/', auth, async (req, res) => {
  try {
    const { villes, typeCommerce, typeLead, qualificationSysteme, services } = req.body;
    const update = {};
    if (villes               !== undefined) update.villes               = villes;
    if (typeCommerce         !== undefined) update.typeCommerce         = typeCommerce;
    if (typeLead             !== undefined) update.typeLead             = typeLead;
    if (qualificationSysteme !== undefined) update.qualificationSysteme = qualificationSysteme;
    if (services             !== undefined) update.services             = services;
    await col().updateOne({ _id: 'global' }, { $set: update }, { upsert: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
