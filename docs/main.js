// Pointe les boutons « Télécharger » directement sur l'APK de la version la plus récente.
// Sans réponse de l'API GitHub, ils mènent à la page des releases (lien du HTML).
'use strict';

const REPO = 'Forthtilliath/ensemble-releases';
const ASSET_PREFIX = `https://github.com/${REPO}/releases/download/`;
const APK_NAME = /^Ensemble-[0-9A-Za-z.-]+\.apk$/;

function findApk(release) {
  if (!release || release.draft || !Array.isArray(release.assets)) return null;
  return (
    release.assets.find(
      (asset) =>
        typeof asset.name === 'string' &&
        APK_NAME.test(asset.name) &&
        typeof asset.browser_download_url === 'string' &&
        asset.browser_download_url.startsWith(ASSET_PREFIX),
    ) || null
  );
}

function formatSize(bytes) {
  return `${Math.round(bytes / 1e6)} Mo`;
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `publiée le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

async function pointToLatestApk() {
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=10`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) return;
  const releases = await response.json();
  if (!Array.isArray(releases)) return;

  for (const release of releases) {
    const apk = findApk(release);
    if (!apk) continue;
    for (const id of ['download', 'download-bottom']) {
      const link = document.getElementById(id);
      if (link) link.href = apk.browser_download_url;
    }
    const version = String(release.tag_name || '').replace(/^v/, '');
    const parts = [
      `Version ${version}`,
      release.prerelease ? 'version de test' : '',
      Number.isFinite(apk.size) ? formatSize(apk.size) : '',
      formatDate(release.published_at),
    ].filter(Boolean);
    const meta = document.getElementById('release-meta');
    if (meta) meta.textContent = parts.join(' · ');
    return;
  }
}

pointToLatestApk().catch(() => {});
