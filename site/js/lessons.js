/* Contenu des cours. Blocs : p, ul, ol, code, key, warn, extra, table, sim, steps
   Balisage : `code` et **gras**. */
window.LESSONS = [
/* ───────────────────────── 01 NAT ───────────────────────── */
{
  id: "nat", n: "01", title: "NAT / PAT", kicker: "Traduction d'adresses",
  source: "Cisco NAT r2209A · Réseaux IP Avancés – NAT · Mémo IOS §2.5",
  blurb: "Comment les adresses privées sortent sur Internet : NAT statique, dynamique, NAPT/PAT, redirection de port — et là où le NAT casse.",
  minutes: 25,
  sections: [
    { h: "Pourquoi le NAT ?", blocks: [
      { t: "p", x: "Les adresses IP privées ne sont, par définition, **pas routables sur Internet**. Et le nombre d'adresses IPv4 publiques ne suffit pas pour toutes les machines. La solution : le **NAT (Network Address Translation)**." },
      { t: "p", x: "Le NAT est la **modification des adresses IP dans l'en-tête d'un paquet IP**, réalisée par un routeur : l'adresse source des paquets sortants est remplacée, et inversement pour les réponses." },
      { t: "table", head: ["Terme", "Ce qui change", "Cas typique"], rows: [
        ["**SNAT**", "l'adresse **source**", "un hôte du LAN sort sur Internet"],
        ["**DNAT**", "l'adresse de **destination**", "Internet → serveur dans le LAN (redirection de port)"]
      ]},
      { t: "p", x: "Variantes : **NAT statique**, **NAT dynamique**, **NAPT (PAT)**, **IP masquerading**." },
      { t: "warn", x: "Le NAT **n'est pas un mécanisme de sécurité**. Il économise des adresses, il ne protège pas le réseau. Question classique d'examen." },
      { t: "extra", x: "Plages privées (RFC 1918) : `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`. Tout le reste est public." }
    ]},
    { h: "Inside / Outside : marquer les interfaces", blocks: [
      { t: "p", x: "Avant de traduire quoi que ce soit, il faut dire au routeur où est « l'intérieur » et où est « l'extérieur ». Cela se fait sur **chaque** interface, et c'est le socle commun de tous les types de NAT." },
      { t: "code", x: "R1(config)# interface s0/1/0\nR1(config-if)# ip nat outside\n\nR1(config)# interface fa0/0\nR1(config-if)# ip nat inside" },
      { t: "key", x: "`ip nat outside` : interface côté opérateur/Internet. `ip nat inside` : interface côté LAN. Si on oublie de les marquer, le NAT ne fonctionne pas, sans message d'erreur." }
    ]},
    { h: "NAT statique (1 : 1)", blocks: [
      { t: "ul", items: [
        "Associe **N adresses privées à N adresses publiques** : « une IP interne = une IP externe ».",
        "Le routeur remplace la source (ou la destination) par l'adresse correspondante.",
        "**Limite :** il faut autant d'adresses publiques que d'adresses privées."
      ]},
      { t: "code", x: "R1(config)# ip nat inside source static 192.168.0.2 206.245.160.2" },
      { t: "p", x: "Usage typique : un serveur qui doit être joignable de l'extérieur avec une adresse publique fixe." }
    ]},
    { h: "NAT dynamique (pool d'adresses)", blocks: [
      { t: "ul", items: [
        "Associe **M adresses privées à N adresses publiques, avec M > N**.",
        "L'adresse est prise **dans un pool**, dynamiquement.",
        "**Limite :** nombre de connexions actives = nombre d'adresses publiques du pool."
      ]},
      { t: "p", x: "Trois étapes : (1) une ACL — **qui** on traduit, (2) un pool — **en quoi**, (3) lien ACL + pool." },
      { t: "code", x: "R1(config)# access-list 1 permit 192.168.0.0 0.0.0.255\nR1(config)# ip nat pool MYPOOL 206.245.160.5 206.245.160.10 netmask 255.255.255.240\nR1(config)# ip nat inside source list 1 pool MYPOOL overload" },
      { t: "key", x: "Dans l'ACL de NAT, on utilise un **masque générique (wildcard)** (`0.0.0.255`), pas un masque classique. Ce n'est pas du filtrage : l'ACL sert seulement à **choisir les adresses à traduire**." },
      { t: "extra", x: "Le mot-clé `overload` transforme le NAT dynamique en PAT (plusieurs hôtes partagent les mêmes adresses grâce aux ports). Sans `overload`, on obtient un NAT 1:1 depuis le pool : quand le pool est épuisé, les nouveaux clients n'ont plus de sortie." }
    ]},
    { h: "NAPT / PAT / IP masquerading", blocks: [
      { t: "ul", items: [
        "**NAT dynamique + Port Address Translation (PAT) = NAPT**.",
        "Si le pool est limité à **une seule adresse**, c'est de l'**IP masquerading**.",
        "Très utilisé sur les routeurs WAN **SOHO** (Small Office / Home Office) : tout le bureau sort avec une seule IP publique."
      ]},
      { t: "p", x: "Principe : on distingue les clients non plus par l'IP mais par le **port source**. Le routeur tient une table « IP:port interne ⇄ IP:port externe »." },
      { t: "code", x: "R1(config)# ip access-list extended NatList\nR1(config-ext-nacl)# permit ip any any\n\nR1(config)# ip nat inside source list NatList interface s0/1/0 overload" },
      { t: "p", x: "Remarque : ici, au lieu d'un pool, on indique une **interface** (`interface s0/1/0`) — son adresse devient l'adresse publique." },
      { t: "sim", id: "nat" }
    ]},
    { h: "Redirection de port (port forwarding / mapping)", blocks: [
      { t: "p", x: "Pour **héberger un serveur derrière un routeur NAPT**, on fait une association statique de port :" },
      { t: "table", head: ["Nom", "Exemple", "Sens"], rows: [
        ["**Port forwarding**", "Pub:80 → Priv:80", "les ports sont identiques"],
        ["**Port mapping**", "Pub:8080 → Priv:80", "les ports sont différents"]
      ]},
      { t: "code", x: "R1(config)# ip nat inside source static tcp 192.168.0.4 80 206.245.160.1 80" },
      { t: "p", x: "À lire : `tcp` `<IP interne> <port interne>` `<IP externe> <port externe>`. Dans le Mémo : « PAT statique (port forwarding) : outside → inside »." },
      { t: "key", x: "C'est du **DNAT** : l'adresse de destination des paquets entrants est modifiée." }
    ]},
    { h: "Bilan : avantages, problèmes, solutions", blocks: [
      { t: "p", x: "Le NAT est très utile pour limiter l'usage des adresses publiques, et on peut **mélanger** plusieurs saveurs (statique + dynamique + NAPT). Usages : **DMZ (DeMilitarized Zone)**, serveurs auto-hébergés." },
      { t: "table", head: ["Problèmes", "Solutions"], rows: [
        ["Protocoles **non niveau 4 DoD** avec PAT : ICMP, PPTP/GRE, NetBIOS, IPsec — pas de ports pour les distinguer", "**Proxy**"],
        ["Protocoles avec **connexion de contrôle** qui négocie un flux : FTP, RTSP", "**NAT discovery** : STUN, ICE"],
        ["**Pair-à-pair** (PtP)", "**Serveur relais et hole punching** : TURN"]
      ]},
      { t: "warn", x: "Retiens les paires « problème → solution » : Proxy · STUN/ICE · TURN + hole punching." }
    ]},
    { h: "Aide-mémoire : 4 recettes de NAT", blocks: [
      { t: "table", head: ["Besoin", "Commande"], rows: [
        ["Dynamique (Overload), **une** IP publique, ACL étendue", "`ip nat inside source list NatList interface s0/1/0 overload`"],
        ["Idem avec ACL simple", "`access-list 10 permit 10.0.0.0 0.0.0.255`<br>`ip nat inside source list 10 interface GigabitEthernet0/0 overload`"],
        ["Dynamique (Pool + Overload), **plusieurs** IP publiques", "`ip nat pool MYPOOL 209.165.100.17 209.165.100.24 netmask 255.255.255.240`<br>`ip nat inside source list 1 pool MYPOOL overload`"],
        ["PAT statique (port forwarding), outside → inside", "`ip nat inside source static tcp 192.168.1.80 80 81.10.0.14 80`"],
        ["NAT statique, outside → inside", "`ip nat inside source static 10.0.0.240 209.165.100.29`"]
      ]},
      { t: "code", x: "R1# show ip nat translations" },
      { t: "p", x: "Vérification : la table de traductions. Si elle est vide alors que du trafic passe, cherche l'erreur côté inside/outside ou ACL." }
    ]}
  ]
},

/* ───────────────────────── 02 DHCP ───────────────────────── */
{
  id: "dhcp", n: "02", title: "DHCP", kicker: "Attribution automatique d'adresses",
  source: "Réseaux IP r2501A – DHCP · Mémo IOS §2.3",
  blurb: "DORA : les quatre étapes pour obtenir une adresse, ports UDP 67/68, relais, et configuration d'un serveur DHCP Cisco.",
  minutes: 15,
  sections: [
    { h: "Ce que fait DHCP", blocks: [
      { t: "p", x: "Le **Dynamic Host Configuration Protocol** (RFC 1531, 1993) distribue automatiquement des adresses IP aux machines du réseau. Avec l'adresse, le client reçoit le reste : masque, passerelle (default router), DNS, nom de domaine, durée du bail." },
      { t: "key", x: "Quatre étapes à connaître par cœur : **Discover → Offer → Request → Acknowledge** (DORA)." }
    ]},
    { h: "DORA pas à pas", blocks: [
      { t: "steps", items: [
        ["DHCP Discover", "Le client émet une requête de découverte en **broadcast**."],
        ["DHCP Offer", "Le serveur qui reçoit la requête cherche une adresse libre dans son **pool** et adresse une « offre » au client."],
        ["DHCP Request", "Le client accepte l'offre **après avoir vérifié** que l'adresse est libre (pas de réponse à une requête ARP) et envoie une requête **broadcast** pour accepter l'offre et obtenir le reste des informations."],
        ["DHCP Acknowledge", "Le serveur termine la transaction par un acquittement en **unicast**."]
      ]},
      { t: "sim", id: "dora" },
      { t: "warn", x: "Piège : le Request part en **broadcast** (les autres serveurs DHCP doivent l'entendre pour comprendre que leur offre est refusée), alors que l'Acknowledge est en **unicast**." }
    ]},
    { h: "Fiche technique", blocks: [
      { t: "table", head: ["Paramètre", "Valeur"], rows: [
        ["Transport", "**UDP**"],
        ["Port du client", "**68**"],
        ["Port du serveur", "**67**"],
        ["Basé sur", "**BOOTP** (Bootstrap Protocol, RFC 951)"],
        ["Type de trafic", "paquets et trames de **diffusion** (broadcast)"]
      ]},
      { t: "key", x: "Serveur = **67**, client = **68**. Astuce : le serveur « parle » en premier dans l'ordre des numéros." },
      { t: "p", x: "**Plusieurs serveurs DHCP** dans un même domaine de diffusion : possible seulement avec **synchronisation** entre eux (failover et/ou répartition de charge). Sinon : conflits et comportements non déterministes." }
    ]},
    { h: "Relais DHCP", blocks: [
      { t: "p", x: "Le broadcast ne traverse pas un routeur. Le **relais** permet de transmettre les requêtes DHCP **au-delà du domaine de diffusion** : il les transfère en **unicast** à un serveur DHCP central." },
      { t: "extra", x: "Sur Cisco, le relais s'active avec `ip helper-address <IP du serveur>` sur l'interface côté LAN des clients. Les diapos ne donnent pas la commande, seulement le principe." }
    ]},
    { h: "Serveur DHCP sur Cisco IOS", blocks: [
      { t: "p", x: "On exclut d'abord les adresses à ne pas distribuer (passerelle, serveurs, imprimantes), puis on décrit le pool." },
      { t: "code", x: "ip dhcp excluded-address 172.18.1.1 172.18.1.40\n\nip dhcp pool subnet1\n   network 172.18.1.0 255.255.255.0\n   dns-server 172.17.16.34\n   default-router 172.18.1.1\n   lease 1 0 0\n   domain-name toto.fr" },
      { t: "ul", items: [
        "`excluded-address <début> <fin>` : plage qui n'est **pas** distribuée.",
        "`network` : réseau et masque du pool.",
        "`default-router` : passerelle par défaut des clients.",
        "`dns-server`, `domain-name` : DNS et suffixe.",
        "`lease 1 0 0` : durée du bail — **jours heures minutes** (ici 1 jour)."
      ]},
      { t: "code", x: "show ip dhcp binding        ! qui a reçu quelle adresse\nshow ip dhcp pool [nom]     ! état du pool" },
      { t: "warn", x: "`excluded-address` s'écrit **en mode global**, hors de `ip dhcp pool`, pas à l'intérieur." }
    ]},
    { h: "Côté client : Linux et Windows", blocks: [
      { t: "p", x: "**Linux :** libérer et reprendre un bail, gestion via NetworkManager." },
      { t: "code", x: "$ sudo dhclient -r wlo1        # release : libérer le bail\n$ sudo dhclient wlo1           # redemander\n\n$ nmcli connection show\n$ nmcli connection down POCO23\n$ nmcli connection up POCO23" },
      { t: "p", x: "**Windows :** consulter l'état et renouveler." },
      { t: "code", x: "C:\\> ipconfig /all            # DHCP activé ? adresse, bail\nC:\\> ipconfig /renew VirtualBox   # renouveler le bail sur la carte" },
      { t: "extra", x: "`ipconfig /release` libère l'adresse (équivalent de `dhclient -r`). Les diapos montrent seulement `/all` et `/renew`." }
    ]}
  ]
},

/* ───────────────────────── 03 OSPF théorie ───────────────────────── */
{
  id: "ospf", n: "03", title: "OSPF : théorie", kicker: "Protocole à état de liens",
  source: "Réseaux IP Avancés r2501A – OSPF",
  blurb: "Hello, LSA, LSDB, algorithme de Dijkstra, DR/BDR et aires. Exemple en 7 étapes avec simulateur.",
  minutes: 30,
  sections: [
    { h: "Généralités", blocks: [
      { t: "p", x: "**OSPF — Open Shortest Path First.** L'un des protocoles de routage interne (IGP) les plus répandus, malgré son âge." },
      { t: "table", head: ["Version", "Année", "Document", "Particularité"], rows: [
        ["OSPF (original)", "—", "RFC 1131", "—"],
        ["OSPFv2", "1991", "RFC 1247", "pour IPv4"],
        ["OSPFv3", "2008", "RFC 5340", "**permet IPv6**"]
      ]},
      { t: "p", x: "Chaque routeur échange deux types d'informations :" },
      { t: "ol", items: [
        "Des messages **hello** à intervalle régulier — ils établissent les **relations adjacentes**. Le routeur se présente avec son **Router ID (RID)**.",
        "La liste des réseaux auxquels il est connecté, par des messages **LSA (Link-State Advertisement)** propagés **de proche en proche** à tous les routeurs."
      ]}
    ]},
    { h: "LSDB et algorithme SPF", blocks: [
      { t: "p", x: "L'ensemble des LSA forme la **base de données de l'état des liens — LSDB (Link-State Database)**." },
      { t: "ul", items: [
        "La LSDB est **spécifique à chaque aire (area)**.",
        "Elle est **identique pour tous les routeurs actifs** de cette aire."
      ]},
      { t: "p", x: "Chaque routeur utilise ensuite, indépendamment, l'**algorithme de Dijkstra (SPF — Shortest Path First)** sur sa LSDB pour déterminer la route la plus rapide vers chaque réseau connu." },
      { t: "key", x: "Chaîne complète : **Hello → voisins → LSA → LSDB → SPF (Dijkstra) → table de routage**." }
    ]},
    { h: "Fiche technique", blocks: [
      { t: "table", head: ["Paramètre", "Valeur"], rows: [
        ["Métrique", "**somme des coûts (cost)** des liens"],
        ["Mise à jour", "**par événement** et **périodique (30 minutes)**"],
        ["Vision", "tout le domaine OSPF"],
        ["Taille", "non limitée (en pratique max. ~50 routeurs)"],
        ["Historique", "**classless** (CIDR)"],
        ["Configuration", "relativement complexe (multi-areas)"],
        ["Convergence", "**rapide**"]
      ]}
    ]},
    { h: "OSPF vs RIP", blocks: [
      { t: "p", x: "Exemple classique des diapos : les routeurs A et B sont reliés par un lien lent de 1544 kbps, alors que le chemin par C passe par deux liens gigabit (1 000 000 kbps)." },
      { t: "sim", id: "ripvsospf" },
      { t: "key", x: "RIP compte les **sauts** et prend le lien direct lent. OSPF compte le **coût selon la bande passante** et choisit le chemin plus rapide par C." }
    ]},
    { h: "Exemple en 7 étapes", blocks: [
      { t: "p", x: "Topologie : 7 routeurs, traits épais = 1 Gbps, traits fins = 10 Mbps. Voici les étapes des diapos, avec un schéma interactif." },
      { t: "steps", items: [
        ["1 · Initialisation", "Chaque routeur ne connaît que **ses propres interfaces** et leur domaine. Il doit échanger avec ses voisins du même domaine."],
        ["2 · Hello", "Les paquets hello partent sur l'adresse multicast **224.0.0.5 (AllSPFRouters)** : découverte et maintien des voisins. Un routeur qui vient de recevoir les hello est à l'état **ExStart**."],
        ["3 · Échange des LSA", "Les routeurs échangent leurs données de topologie. États **Exchange** puis **Loading**."],
        ["4 · Full", "LSDB synchronisées, adjacences définies et maintenues — état **Full**."],
        ["5 · Nouveau réseau netA", "On connecte netA à R5 et on le déclare dans OSPF : la route se **propage jusqu'à R1**."],
        ["6 · Calcul SPF", "R1 reçoit la mise à jour et lance SPF vers netA (via R5). Meilleur chemin : par **R6**."],
        ["7 · Coupure R6–R7", "R1 reçoit une mise à jour, modifie son arbre et relance SPF — la route passe maintenant par **R2**."]
      ]},
      { t: "sim", id: "spf" },
      { t: "key", x: "Cost 1 Gbps = 1, cost 10 Mbps = 10 (avec une bande passante de référence de 100 Mbps). Les quatre chemins des diapos : **R2-R3-R4-R5 = 22**, **R2-R3-R7-R5 = 31**, **R6-R7-R5 = 21**, **R6-R7-R3-R4-R5 = 14** → 14 gagne, via R6." }
    ]},
    { h: "États d'un voisin (l'échelle)", blocks: [
      { t: "p", x: "Les diapos citent ExStart → Exchange → Loading → Full. Voici la séquence complète, parcours-la étape par étape." },
      { t: "sim", id: "states" },
      { t: "extra", x: "Les états **Down → Init → 2-Way** précèdent l'échange des bases. Dans `show ip ospf neighbor` tu verras par exemple **2WAY/DROTHER**, tout à fait normal entre deux routeurs non-DR du même segment." }
    ]},
    { h: "DR et BDR", blocks: [
      { t: "p", x: "Sur les interfaces de type **broadcast** (ex : Ethernet), OSPF cherche à **centraliser les échanges** : au lieu d'un maillage complet, tout le monde dialogue avec un routeur central." },
      { t: "ul", items: [
        "**DR (Designated Router)** — routeur élu avec lequel tous se synchronisent.",
        "**BDR (Backup DR)** — de secours, prend le relais si le DR tombe.",
        "Les autres sont des **DROTHER**."
      ]},
      { t: "p", x: "Critère dans les diapos de théorie : le routeur avec le **plus grand RID** est élu. Les diapos de pratique précisent : d'abord la **priorité d'interface la plus haute**, puis, à égalité, le **plus grand RID**. L'élection est renouvelée si un lien tombe." },
      { t: "sim", id: "dr" },
      { t: "extra", x: "Nuance pratique : le DR n'est **pas préempté** — si on ajoute un routeur de priorité supérieure, il ne devient pas DR tant que l'actuel est vivant. Priorité `0` = ne jamais participer à l'élection." }
    ]},
    { h: "Aires (Areas)", blocks: [
      { t: "p", x: "Avec des **centaines de routeurs**, le calcul SPF devient long. On segmente donc le domaine en **aires (areas)**." },
      { t: "ul", items: [
        "**Area 0 — backbone** (dorsale) ; les autres aires s'y raccordent.",
        "Seuls les **ABR (Area Border Router)** connaissent plusieurs aires.",
        "À l'intérieur d'une aire : les **Internal Routers**."
      ]},
      { t: "key", x: "ABR = routeur dont les interfaces sont dans des aires différentes (dont obligatoirement l'area 0)." },
      { t: "warn", x: "Une aire non connectée au backbone nécessite un **virtual-link** — « hors programme » dans le cours, mais retiens le nom." }
    ]}
  ]
},

/* ───────────────────────── 04 OSPF Cisco ───────────────────────── */
{
  id: "ospf-cisco", n: "04", title: "OSPF sur Cisco", kicker: "Configuration et diagnostic",
  source: "Cisco Dynamic Routing r2312A (OSPF) · Mémo IOS §2.4",
  blurb: "network + wildcard, syntaxe moderne, passive-interface, RID, cost, DR, route par défaut, multi-area, show/debug, OSPFv3.",
  minutes: 35,
  sections: [
    { h: "Schéma de configuration de base", blocks: [
      { t: "code", x: "router ospf 1                ! Process ID (numéro de processus local)\n   router-id 1.1.1.1         ! Router ID (optionnel)\n   network 10.0.0.0 0.255.255.255 area 0   ! active OSPF (indirectement) sur l'interface\n\ninterface S0/0/0\n   ip address 10.1.1.1 255.255.255.0   ! l'interface qui sera « attrapée »" },
      { t: "ul", items: [
        "**Process ID** — numéro local ; **plusieurs processus simultanés** sont permis.",
        "**router-id** — optionnel (voir plus bas d'où il vient par défaut).",
        "**network … area N** — définit le numéro d'aire et active *indirectement* OSPF sur les interfaces concernées.",
        "L'activation est « indirecte » (Indirect!) : l'interface n'est pas citée, elle correspond par son IP au `network`."
      ]}
    ]},
    { h: "Ancienne méthode : network + wildcard", blocks: [
      { t: "p", x: "Les **commandes `network` avec wildcard** activent OSPF sur des interfaces précises. Le wildcard est un **masque inversé** : `0` = le bit doit correspondre, `1` = le bit est indifférent." },
      { t: "code", x: "R1(config)# router ospf 1\nR1(config-router)# ! correspond aux 5 interfaces\nR1(config-router)# network 10.1.0.0 0.0.255.255 area 0\nR1(config-router)# ! idem, les 5 aussi\nR1(config-router)# network 10.0.0.0 0.255.255.255 area 0\nR1(config-router)# ! seulement G0/1/0 et G0/2/0\nR1(config-router)# network 10.1.13.0 0.0.0.255 area 0\nR1(config-router)# ! exactement l'interface d'adresse 10.1.14.1\nR1(config-router)# network 10.1.14.1 0.0.0.0 area 0" },
      { t: "key", x: "`0.0.0.0` = correspondance avec **une seule adresse exacte**. Le Mémo conseille d'utiliser **l'adresse de l'interface** et non celle du réseau : `network 81.10.0.9 0.0.0.0 area 0`." },
      { t: "sim", id: "wildcard" }
    ]},
    { h: "Méthode moderne : OSPF sur l'interface", blocks: [
      { t: "p", x: "Le processus est déclaré **directement sur chaque interface**. Pas de masque ni de devinette." },
      { t: "code", x: "R1(config)# router ospf 1\nR1(config-router)# router-id 192.0.0.1\n\nR1(config)# interface G0/0.1\nR1(config-if)# ip ospf 1 area 0\n\nR1(config)# interface G0/0.2\nR1(config-if)# ip ospf 1 area 0\n\nR1(config)# interface G0/0/0\nR1(config-if)# ip ospf 1 area 0" },
      { t: "table", head: ["", "network + wildcard", "ip ospf N area A"], rows: [
        ["Où l'écrire", "dans `router ospf`", "sur l'**interface**"],
        ["Précision", "via le masque, facile de se tromper", "explicite, interface par interface"],
        ["IPv6 (OSPFv3)", "non", "**oui** — seule méthode"]
      ]}
    ]},
    { h: "Interfaces passives", blocks: [
      { t: "p", x: "On ne veut **pas échanger de LSA avec les réseaux terminaux (LAN)**. C'est même un **vecteur d'attaque** : un pirate dans le LAN peut envoyer de faux messages OSPF et **dérouter le trafic**." },
      { t: "code", x: "R1(config)# router ospf 1\nR1(config-router)# passive-interface GigabitEthernet0/0.1\nR1(config-router)# passive-interface GigabitEthernet0/0.2" },
      { t: "key", x: "`passive-interface` : le réseau de l'interface est **annoncé** dans OSPF, mais aucun hello n'est **envoyé** et aucune adjacence ne se forme." },
      { t: "p", x: "Exemple du Mémo : `passive-interface Serial0/2`. Supprimer tout le processus : `no router ospf 1`." }
    ]},
    { h: "Router ID (RID)", blocks: [
      { t: "p", x: "Le RID est un identifiant de 32 bits au format **A.B.C.D**. Sources, par ordre de priorité :" },
      { t: "ol", items: [
        "**Manuellement** — `router-id A.B.C.D`.",
        "**IP de l'interface loopback**.",
        "**Plus grande IP** parmi les interfaces."
      ]},
      { t: "code", x: "R1(config)# router ospf 1\nR1(config-router)# router-id ?\n   A.B.C.D  OSPF router-id in IP address format\n\nR1(config)# interface Loopback0\nR1(config-if)# ip address 192.0.0.1 255.255.255.255" },
      { t: "extra", x: "Le loopback est idéal pour le RID : il **ne tombe jamais** tant que le routeur est vivant. Après un changement de RID, il faut redémarrer le processus (`clear ip ospf process`) pour qu'il soit pris en compte." }
    ]},
    { h: "Cost (coût)", blocks: [
      { t: "key", x: "**Cost = Reference BW / Interface BW.** La Reference BW par défaut est de **100 Mbps**." },
      { t: "p", x: "Trois façons d'influencer le coût :" },
      { t: "code", x: "R1(config-if)# ip ospf cost <1-65535>                      ! fixer le cost directement\nR1(config-if)# bandwidth <1-10000000>                       ! bande passante « déclarée » en kbit/s\nR1(config-router)# auto-cost reference-bandwidth <1-4294967>  ! référence en Mbit/s" },
      { t: "sim", id: "cost" },
      { t: "warn", x: "Piège : avec une reference BW de 100 Mbps, FastEthernet, Gigabit et 10G **ont tous un cost de 1** — OSPF ne les distingue pas. On augmente donc la reference BW (et **à l'identique sur tous les routeurs**)." },
      { t: "p", x: "Exemple des diapos : serial T1 (1544 kbps) → 100 000 / 1544 ≈ **64** ; plus un LAN Gigabit (cost 1) = **65** — d'où le `[110/65]` dans la table de routage." }
    ]},
    { h: "DR/BDR : priorité", blocks: [
      { t: "ul", items: [
        "Le DR par défaut est le routeur à la **priorité d'interface la plus haute**.",
        "À égalité de priorité : le **plus grand RID**.",
        "L'élection est **renouvelée** si un lien tombe."
      ]},
      { t: "code", x: "R1# show ip ospf neighbor\nNeighbor ID  Pri  State        Dead Time  Address    Interface\n2.2.2.2        1  2WAY/DROTHER 00:00:35   10.1.1.2   GigabitEthernet0/0\n3.3.3.3        1  FULL/BDR     00:00:33   10.1.1.3   GigabitEthernet0/0\n4.4.4.4        1  FULL/DR      00:00:35   10.1.1.4   GigabitEthernet0/0\n\nR1(config)# interface gi0/0\nR1(config-if)# ip ospf priority <0-255>" },
      { t: "p", x: "Lecture : **2.2.2.2 est DROTHER** (State 2WAY : normal entre non-DR), **3.3.3.3 est BDR**, **4.4.4.4 est DR** (les deux en FULL avec nous). Dead Time : temps restant avant de déclarer le voisin mort sans hello." },
      { t: "extra", x: "Dans la diapo, `ip ospf priority` affiche `<1-65535> Cost` : c'est un copier-coller erroné ; la vraie plage de priorité est 0–255." }
    ]},
    { h: "Route par défaut dans OSPF", blocks: [
      { t: "ul", items: [
        "Chaque routeur évalue **sa propre** route par défaut.",
        "Peu importe qu'elle **fonctionne** ou non — le routeur l'annonce dès qu'elle existe."
      ]},
      { t: "code", x: "R1(config)# router ospf 1\nR1(config-router)# default-information originate   ! route par défaut\nR1(config-router)# redistribute static              ! autres routes statiques\n\nB1# show ip route ospf\nCodes: L - local, C - connected, S - static, [..]\n       E1 - OSPF external type 1, E2 - OSPF external type 2\nO*E2 0.0.0.0/0 [110/1] via 10.1.12.1, 00:20:51, GigabitEthernet0/1/0" },
      { t: "p", x: "Décodage de `O*E2 0.0.0.0/0 [110/1]` : **O** — OSPF, `*` — candidate à la route par défaut, **E2** — route externe de type 2, **110** — Administrative Distance d'OSPF, **1** — métrique." },
      { t: "p", x: "Route statique par défaut sur le routeur de bordure : `ip route 0.0.0.0 0.0.0.0 s0/0/0`." }
    ]},
    { h: "Multi-area", blocks: [
      { t: "p", x: "L'aire se définit sur l'interface. Un routeur avec des interfaces dans des aires différentes est un **ABR**." },
      { t: "code", x: "R1(config)# router ospf 1\nR1(config)# interface GigabitEthernet0/1\nR1(config-if)# ip ospf 1 area 0\nR1(config)# interface GigabitEthernet0/2\nR1(config-if)# ip ospf 1 area 5" },
      { t: "warn", x: "Si une aire n'est pas reliée au backbone (area 0), il faut un **virtual-link** (hors programme dans le cours)." }
    ]},
    { h: "Statut et diagnostic", blocks: [
      { t: "p", x: "La diapo « OSPF status » est une **échelle de diagnostic** : on descend marche par marche pour trouver où ça casse." },
      { t: "table", head: ["Étape", "Ce qu'on vérifie", "Commandes"], rows: [
        ["Config", "ce qui est configuré", "`show running-config`, `show ip protocols`"],
        ["Enabled Interfaces", "OSPF activé sur les interfaces", "`show ip ospf interface [brief]`"],
        ["Neighbors (Hello)", "voisins découverts", "`show ip ospf neighbor`"],
        ["LSDB (Flood LSAs)", "base synchronisée", "`show ip ospf database`"],
        ["RIB (SPF calculation)", "résultat du calcul", "`show ip ospf rib`"],
        ["Routes (Admin distance)", "routes dans la table", "`show ip route [ospf]`"]
      ]},
      { t: "sim", id: "ladder" },
      { t: "p", x: "**Codes des routes :** `O` OSPF · `O IA` inter-area · `E1/E2` external · `N1/N2` NSSA external · `C` connected · `L` local · `S` static · `D` EIGRP · `R` RIP · `B` BGP." },
      { t: "code", x: "O     172.16.2.0/24 [110/65] via 172.16.3.2, 00:12:54, Serial0/0/0" },
      { t: "p", x: "Lecture : protocole OSPF · réseau · **[AD 110 / métrique 65]** · next-hop · âge de la route · interface de sortie." },
      { t: "p", x: "**Debug :**" },
      { t: "code", x: "R1# debug ip ospf ?\n   adj      OSPF adjacency events\n   events   OSPF events\n\nR1(config)# router ospf 1\nR1(config-router)# no log-adjacency-changes   ! désactiver les logs de changement de voisins" }
    ]},
    { h: "OSPF pour IPv6 (OSPFv3)", blocks: [
      { t: "ul", items: [
        "OSPFv3 — **uniquement la syntaxe « moderne »** (sur l'interface).",
        "Mêmes commandes, mais avec `ipv6` à la place de `ip`.",
        "Le Router ID reste au format **A.B.C.D** (ou loopback IPv4)."
      ]},
      { t: "code", x: "R1(config)# ipv6 router ospf 1\nR1(config-router)# router-id ?\n   A.B.C.D  OSPF router-id in IP address format\nR1(config)# interface GigabitEthernet0/1\nR1(config-if)# ipv6 address 3300::33/64\nR1(config-if)# ipv6 ospf 1 area 0" },
      { t: "warn", x: "Piège classique : en IPv6, le RID **reste de type IPv4**. Si le routeur n'a aucune adresse IPv4, il faut fixer le RID à la main." }
    ]}
  ]
},

/* ───────────────────────── 05 RIPng / EIGRP ───────────────────────── */
{
  id: "ripng-eigrp", n: "05", title: "RIPng et EIGRP", kicker: "Autres IGP",
  source: "Cisco Dynamic Routing r2312A – Other internal protocols",
  blurb: "Deux autres protocoles internes pour IPv6 : RIPng (ouvert) et EIGRP (« ex-Cisco »). Points communs et différences.",
  minutes: 12,
  sections: [
    { h: "Comparaison des trois protocoles", blocks: [
      { t: "table", head: ["", "OSPF", "RIPng", "EIGRP"], rows: [
        ["Origine", "standard ouvert", "ouvert, RFC 2080 (évolution de RIP v2 pour IPv6)", "développé par Cisco, désormais ouvert, **RFC 7868**"],
        ["Router ID", "**oui**", "**non**", "**oui**, comme OSPF"],
        ["IPv6", "oui (OSPFv3)", "oui", "oui"],
        ["« Numéro de processus »", "Process ID", "nom du processus (tag)", "**numéro d'AS**"]
      ]}
    ]},
    { h: "RIPng", blocks: [
      { t: "ul", items: [
        "Standard ouvert, évolution de RIP v2 pour IPv6 — **RFC 2080**.",
        "**Pas de RID.**",
        "Supporte IPv6."
      ]},
      { t: "code", x: "R1(config)# ipv6 router rip cogitux\nR1(config-router)# redistribute static        ! y compris la route par défaut\n\nR1(config)# interface GigabitEthernet0/1\nR1(config-if)# ipv6 address 2043::43/64\nR1(config-if)# ipv6 rip cogitux enable\nR1(config-if)# ipv6 rip cogitux default-information originate" },
      { t: "key", x: "`cogitux` est le **nom** du processus RIPng. Il doit être repris sur l'interface (`ipv6 rip cogitux enable`). La route par défaut s'annonce avec `default-information originate` **sur l'interface**." }
    ]},
    { h: "EIGRP", blocks: [
      { t: "ul", items: [
        "**Enhanced Interior Gateway Routing Protocol.**",
        "Développé par Cisco, désormais standard ouvert (**RFC 7868**).",
        "**RID comme OSPF**, supporte IPv6.",
        "Le numéro de processus s'appelle **AS number**."
      ]},
      { t: "code", x: "R1(config)# ipv6 router eigrp 10\nR1(config-router)# eigrp router-id 41.41.41.41\nR1(config-router)# redistribute static        ! y compris la route par défaut\nR1(config-router)# no shutdown\n\nR1(config)# interface GigabitEthernet0/1\nR1(config-if)# ipv6 address 2041::41/64\nR1(config-if)# ipv6 eigrp 10" },
      { t: "warn", x: "En EIGRP IPv6, le processus est **arrêté par défaut** — il faut `no shutdown` en mode router. Cause fréquente de « les voisins ne montent pas »." },
      { t: "key", x: "Compare la partie interface : OSPF `ipv6 ospf 1 area 0` · RIPng `ipv6 rip NOM enable` · EIGRP `ipv6 eigrp 10`." }
    ]}
  ]
},

/* ───────────────────────── 06 Mémo routeur ───────────────────────── */
{
  id: "memo-router", n: "06", title: "Mémo IOS : routeur", kicker: "Référence de commandes",
  source: "Mémo Cisco IOS (version du 21/05/2025) §1–2",
  blurb: "Modes, astuces de base, route par défaut, DHCP, OSPF, NAT — tout ce qu'il faut savoir taper au clavier.",
  minutes: 18,
  sections: [
    { h: "Modes et invites", blocks: [
      { t: "extra", x: "Savoir où l'on se trouve compte autant que la commande elle-même :" },
      { t: "table", head: ["Invite", "Mode", "Comment y accéder"], rows: [
        ["`R1>`", "User EXEC", "accès par défaut"],
        ["`R1#`", "Privileged EXEC (enable)", "`enable`"],
        ["`R1(config)#`", "Global configuration", "`configure terminal`"],
        ["`R1(config-if)#`", "Interface configuration", "`interface <nom>`"],
        ["`R1(config-router)#`", "Router configuration", "`router ospf 1`"]
      ]}
    ]},
    { h: "Commun (§1)", blocks: [
      { t: "code", x: "do sh run          # lancer une commande enable depuis une config quelconque\n\nno ip domain-lookup   # ne pas résoudre les fautes de frappe comme des noms d'hôtes" },
      { t: "p", x: "**Filtrer l'affichage** (parfait pour ne pas se noyer dans la config) :" },
      { t: "code", x: "show running-config | begin interface      ! à partir de la 1re ligne contenant « interface »\nshow running-config | include password     ! seulement les lignes contenant « password »\nshow running-config | section vty           ! tout un bloc de configuration vty" },
      { t: "p", x: "**Suppression d'une configuration :**" },
      { t: "code", x: "no ip address 81.10.0.1 255.255.255.252   # supprime la config de l'interface (adresse)\ndefault interface Serial0/1               # remet l'interface à zéro" },
      { t: "key", x: "Règle générale : **`no` + la commande d'origine** l'annule." }
    ]},
    { h: "Débogage (§2.1)", blocks: [
      { t: "table", head: ["Mode User", "Mode Enable"], rows: [
        ["`show protocols`", "`show mac-address-table`"],
        ["`show ip interface brief`", "`show running-config`"],
        ["`show interfaces`", ""],
        ["`show ip route`", ""]
      ]},
      { t: "p", x: "**La plus utilisée :** `show ip interface brief` — statut et IP de toutes les interfaces dans un tableau." }
    ]},
    { h: "Route par défaut (§2.2)", blocks: [
      { t: "code", x: "ip route 0.0.0.0 0.0.0.0 s0/0/0" },
      { t: "p", x: "Réseau `0.0.0.0` avec masque `0.0.0.0` : « n'importe quel réseau ». On indique l'interface de sortie (ou l'IP du next-hop)." }
    ]},
    { h: "DHCP (§2.3)", blocks: [
      { t: "code", x: "ip dhcp excluded-address 172.18.1.1 172.18.1.40\n\nip dhcp pool subnet1\n   network 172.18.1.0 255.255.255.0\n   dns-server 172.17.16.34\n   default-router 172.18.1.1\n   lease 1 0 0\n   domain-name toto.fr\n\nshow ip dhcp binding\nshow ip dhcp pool [nom]" },
      { t: "p", x: "Détails dans le cours « DHCP »." }
    ]},
    { h: "OSPF (§2.4)", blocks: [
      { t: "code", x: "router ospf 1\n   network 81.10.0.9 0.0.0.0 area 0\n   passive-interface Serial0/2\n\nno router ospf 1\n\nshow ip protocols\nshow ip route [ospf]\nshow ip ospf database\nshow ip ospf neighbor" },
      { t: "key", x: "Note du Mémo : dans `network`, utilise **l'adresse de l'interface** avec le wildcard `0.0.0.0`, pas l'adresse du réseau." }
    ]},
    { h: "NAT/PAT (§2.5)", blocks: [
      { t: "code", x: "interface fa0/0\n   ip nat inside\ninterface s0/1/0\n   ip nat outside\n\n! Overload avec ACL étendue (une IP publique)\nip access-list extended NatList\n    permit ip any any\nip nat inside source list NatList interface s0/1/0 overload\n\n! Overload avec ACL simple\naccess-list 10 permit 10.0.0.0 0.0.0.255\nip nat inside source list 10 interface GigabitEthernet0/0 overload\n\n! Pool + Overload (plusieurs IP publiques)\naccess-list 1 permit 192.168.1.0 0.0.0.255\nip nat pool MYPOOL 209.165.100.17 209.165.100.24 netmask 255.255.255.240\nip nat inside source list 1 pool MYPOOL overload\n\n! PAT statique (port forwarding) : outside → inside\nip nat inside source static tcp 192.168.1.80 80 81.10.0.14 80\n\n! NAT statique : outside → inside\nip nat inside source static 10.0.0.240 209.165.100.29\n\nshow ip nat translations" }
    ]}
  ]
},

/* ───────────────────────── 07 Mémo switch ───────────────────────── */
{
  id: "memo-switch", n: "07", title: "Mémo IOS : switch", kicker: "Référence de commandes",
  source: "Mémo Cisco IOS (version du 21/05/2025) §3",
  blurb: "STP, EtherChannel, switch L3, VLAN, access/trunk, ROAS, VTP. Les commandes du mémo et ce qu'elles font.",
  minutes: 22,
  sections: [
    { h: "Débogage (§3.1)", blocks: [
      { t: "code", x: "show mac-address-table dynamic   ! adresses MAC apprises dynamiquement\nshow interface status            ! état des ports en une liste" }
    ]},
    { h: "Spanning-Tree (§3.2)", blocks: [
      { t: "extra", x: "Le STP (Spanning Tree Protocol) supprime les boucles en L2 : il élit un **root bridge** et bloque les ports en trop. Le root est le switch à la **priorité la plus basse** (à égalité, la plus petite MAC)." },
      { t: "p", x: "**Priorité manuelle :**" },
      { t: "code", x: "spanning-tree vlan 1 priority 4096" },
      { t: "p", x: "**Priorité automatique :**" },
      { t: "code", x: "spanning-tree vlan 1 root primary      ! devenir root principal\nspanning-tree vlan 1 root secondary    ! devenir root de secours" },
      { t: "p", x: "**Ports « edge » (vers les terminaux) :**" },
      { t: "code", x: "interface range fastEthernet 0/10-20\n    spanning-tree portfast             ! le port passe directement en forwarding\n    spanning-tree bpduguard enable     ! coupe le port si un BPDU arrive" },
      { t: "key", x: "**portfast + bpduguard** vont ensemble sur les ports PC : montée rapide, mais si quelqu'un branche un switch, le port est coupé." },
      { t: "code", x: "show spanning-tree\nshow spanning-tree vlan 1\nshow spanning-tree interface fa0/10 detail" },
      { t: "extra", x: "La priorité STP est un multiple de **4096** (0, 4096, 8192, … 61440), 32768 par défaut." }
    ]},
    { h: "EtherChannel (§3.3)", blocks: [
      { t: "extra", x: "L'EtherChannel regroupe plusieurs ports physiques en un seul port logique (**port-channel**) — plus de débit et de la redondance, tout en apparaissant comme un seul lien pour le STP." },
      { t: "code", x: "interface range gigabitEthernet 0/1-2\n    channel-group 1 mode on\n\nport-channel load-balance src-dst-ip       ! mode de répartition\n\nshow etherchannel summary\nshow etherchannel load-balance" },
      { t: "p", x: "`mode on` : agrégation statique (sans protocole LACP/PAgP). La répartition `src-dst-ip` se fait sur le couple adresse source/destination." }
    ]},
    { h: "Switch L3 (§3.4)", blocks: [
      { t: "code", x: "ip routing\n\ninterface vlan 10\n    ip address 10.10.0.1 255.255.0.0\n    no shutdown" },
      { t: "key", x: "Deux étapes obligatoires : `ip routing` (activer le routage sur le switch) et une **SVI** — `interface vlan N` avec une IP qui sera la passerelle du VLAN." }
    ]},
    { h: "VLAN (§3.5)", blocks: [
      { t: "p", x: "**Déclaration d'un VLAN :**" },
      { t: "code", x: "vlan 10\n    name STUDENTS\n\nshow vlan brief\nshow vlan id 10\nshow vlan name STUDENTS" },
      { t: "p", x: "**Port d'accès** (vers un terminal, un seul VLAN) :" },
      { t: "code", x: "interface range fastEthernet 0/10-20\n    switchport mode access\n    switchport access vlan 10" },
      { t: "p", x: "**Port trunk** (entre switches, plusieurs VLAN, étiquetage 802.1Q) :" },
      { t: "code", x: "interface range gi0/1-2\n    switchport mode trunk\n    switchport trunk encapsulation dot1q\n    switchport trunk native vlan 10\n    switchport trunk allowed vlan 10-80\n\nshow interfaces trunk\nshow interfaces gi0/1 switchport\nshow mac address-table" },
      { t: "ul", items: [
        "`native vlan` : VLAN dont le trafic circule **sans étiquette**.",
        "`allowed vlan 10-80` : VLAN autorisés sur le trunk."
      ]}
    ]},
    { h: "ROAS — Router On A Stick", blocks: [
      { t: "extra", x: "ROAS : une seule interface physique du routeur est découpée en **sous-interfaces**, une par VLAN. Le routeur route entre VLAN via un unique câble trunk." },
      { t: "code", x: "interface gigabitEthernet 1/1\n   no shutdown\n\ninterface gigabitEthernet 1/1.10\n   encapsulation dot1Q 10\n   ip address 10.10.0.1 255.255.0.0" },
      { t: "key", x: "Sous-interface `1/1.10` + `encapsulation dot1Q 10` (numéro du VLAN) + IP passerelle. L'interface physique : seulement `no shutdown`, sans IP." }
    ]},
    { h: "VTP", blocks: [
      { t: "extra", x: "Le VTP (VLAN Trunking Protocol) diffuse la base des VLAN d'un **serveur** vers des **clients** via les trunks, pour ne pas créer les VLAN à la main sur chaque switch." },
      { t: "code", x: "! Serveur\nvtp domain MYDOMAIN\nvtp mode server\nvtp version 2\nvtp password AbCdEfGh123\n\n! Client\nvtp domain MYDOMAIN\nvtp mode client\nvtp password AbCdEfGh123" },
      { t: "warn", x: "Le domaine et le mot de passe doivent **être identiques**. Les VLAN ne se créent que sur le **serveur** ; sur un client, on ne peut pas créer de VLAN à la main." }
    ]}
  ]
}
];
