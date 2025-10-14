# Backup de la configuration n8n

Ce dossier contient la sauvegarde de la configuration originale qui utilisait n8n pour scraper les données.

## Fichiers sauvegardés :
- `route.ts.backup` : Route API originale qui appelait n8n
- `page.tsx.backup` : Page principale originale
- `dark-page.tsx.backup` : Page dark mode originale

## Pour revenir à la configuration n8n :

1. Restaurer la route API :
```bash
cp backup_n8n_config/route.ts.backup app/api/scrape/route.ts
```

2. Restaurer la page principale :
```bash
cp backup_n8n_config/page.tsx.backup app/page.tsx
```

3. Restaurer la page dark :
```bash
cp backup_n8n_config/dark-page.tsx.backup app/dark/page.tsx
```

4. Redémarrer l'application :
```bash
npm run dev
```

## Configuration n8n originale :
- **Webhook URL** : https://n8n.virtuamada.com/webhook/f6645a25-ad42-4d85-92e9-f2301bce649d
- **Méthode** : GET
- **Paramètre** : `?symbol=SYMBOLE`

Date de sauvegarde : 2025-10-09
