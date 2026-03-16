# Map Editor

Tarayıcı tabanlı, grid/cell mantığıyla çalışan bir harita editörü.
React + TypeScript + Vite + Zustand ile geliştirilmiştir.

## Özellikler

- Province bazlı düzenleme (paint, erase, fill, eyedropper, rectangle select).
- Terrain / State / Country boyama araçları.
- Farklı görünüm modları:
  - Province
  - Political
  - Terrain
  - State
  - Population
  - Development
  - Resource
- Minimap ile hızlı gezinme.
- Undo / Redo geçmişi.
- Otomatik kayıt (localStorage).
- Proje içe/dışa aktarma ve çoklu dışa aktarma seçenekleri.
- Rastgele harita üretimi.

## Teknoloji Yığını

- React 19
- TypeScript
- Vite
- Zustand + Immer
- TailwindCSS
- Lucide Icons
- Sonner (toast)

## Kurulum

Gereksinim: Node.js 18+

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

Varsayılan olarak Vite yerel geliştirme sunucusunu başlatır.

## Build

```bash
npm run build
```

Üretim çıktısı `dist/` klasörüne alınır.

## Preview

```bash
npm run preview
```

Build sonrası yerel önizleme sunucusunu başlatır.

## Klavye Kısayolları

### Genel

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z`: Redo
- `Ctrl/Cmd + Y`: Redo
- `Ctrl/Cmd + S`: Kaydet
- `Ctrl/Cmd + N`: Yeni proje
- `Ctrl/Cmd + O`: Proje aç
- `Ctrl/Cmd + Shift + E`: Export penceresi
- `Ctrl/Cmd + B`: Bookmark ekle

### Araçlar

- `V`: Select
- `B`: Paint
- `E`: Erase
- `G`: Fill
- `I`: Eyedropper
- `T`: Terrain paint
- `S`: State paint
- `C`: Country paint
- `M`: Rectangle select
- `[` / `]`: Fırça boyutu azalt / artır

### Görünüm Modları

- `F1`: Province
- `F2`: Political
- `F3`: Terrain
- `F4`: State
- `F5`: Population
- `F6`: Development
- `F7`: Resource

## Proje Yapısı

```text
src/
  algorithms/      # Harita üretim/analiz algoritmaları
  components/      # UI bileşenleri (canvas, minimap, ...)
  data/            # Veri üreticiler
  hooks/           # Custom React hook'ları
  stores/          # Zustand store'ları
  types/           # Tipler ve enum'lar
  utils/           # Yardımcı fonksiyonlar
```

## Lisans

Bu proje `LICENSE` dosyasındaki şartlarla lisanslanmıştır.
