# KeepScribe — Creative Writer's Studio 🖋️✨

An extended Google Keep designed specifically for creative writers, worldbuilders, novelists, and storytellers. Features multi-page story notes, sketch & canvas drawing, voice dictation, video scene references, an interactive key-value vocabulary map, and full-project Markdown exports.

---

## 🚀 Automated GitHub Releases (Android APK & Linux)

This repository includes a preconfigured GitHub Actions CI/CD workflow (`.github/workflows/release.yml`) that automatically compiles and publishes release packages whenever you push to GitHub:

### Generated Release Binaries

- 📱 **Android APK**:
  - `KeepScribe-release-signed.apk` — Fully signed, installable APK for Android phones and tablets.
  - `KeepScribe-debug.apk` — Debug build for testing and developer sideloading.
- 🐧 **Linux Desktop**:
  - `KeepScribe-*-x86_64.AppImage` — Universal Linux executable (Arch Linux, Manjaro, Ubuntu, Debian, Fedora).
  - `KeepScribe_*_amd64.deb` — Debian & Ubuntu installer package.
  - `KeepScribe-*.tar.gz` — Standalone Linux binary archive.

---

## 🛠️ How to Trigger the Build on GitHub

### Option 1: Push a Git Tag (Recommended for Versioned Releases)
```bash
git add .
git commit -m "Release v1.0.0"
git tag v1.0.0
git push origin main --tags
```
GitHub Actions will automatically run the build and publish a new GitHub Release with all binary downloads attached.

### Option 2: Push to `main` branch
Pushing any commit to `main` or `master` will trigger the build pipeline automatically:
```bash
git push origin main
```

### Option 3: Manual Trigger from GitHub UI
1. Go to your repository on GitHub: `https://github.com/akash-arch-dev/Keep-notes`
2. Click the **Actions** tab.
3. Select **"Build and Release (Android APK & Linux)"** from the left sidebar.
4. Click **Run workflow** -> Enter a tag (e.g. `v1.0.0`) -> Click **Run workflow**.
5. Once complete, your files will be available under **Releases**!

---

## 📥 Installation Guide

### Android Installation
1. Download `KeepScribe-release-signed.apk` from GitHub Releases on your Android device.
2. Tap the downloaded file to install (allow *"Install unknown apps"* if prompted).
3. KeepScribe runs 100% offline with touch & stylus support.

### Arch Linux / Universal Linux Installation
1. Download `KeepScribe-*-x86_64.AppImage`.
2. Make it executable:
   ```bash
   chmod +x KeepScribe-*-x86_64.AppImage
   ./KeepScribe-*-x86_64.AppImage
   ```
   *(Optional)* Move it to your path:
   ```bash
   mkdir -p ~/.local/bin
   mv KeepScribe-*-x86_64.AppImage ~/.local/bin/keepscribe
   ```

### Debian / Ubuntu Installation
```bash
sudo dpkg -i KeepScribe_*_amd64.deb
```

---

## ✨ Key Features

- **Multi-Page Story Notes**: Organize scenes, acts, lore, and chapter drafts inside a single note card.
- **Visual Sketches & Sigils**: Draw architectural sketches, floorplans, sigils, and maps directly onto your notes.
- **Voice Dictation & Audio Memos**: Record voice clips with live waveform audio visualization.
- **Independent Markdown Project Export**:
  - Export notes as real local folders (`index.md` + `assets/` subfolder with all images, audio, and drawings) or as `.zip` project folders.
  - 100% compatible with Obsidian, VS Code, Typora, and static site generators.
- **Interactive Vocabulary Codex**: Key-value relationship map for fantasy languages, dialect terminology, and world lore.
- **Offline & PWA Ready**: Stores notes locally in IndexedDB with local fallback sync.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local full-stack development server (port 3000)
npm run dev

# Build production assets
npm run build
```
