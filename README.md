# 🛡️ Scout Code Analysis — Local AI Architect

![Scout AI Banner](https://img.shields.io/badge/Scout_AI-Local_Architect-FF0000?style=for-the-badge&logo=electron&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-v34.0-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-v18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Ollama](https://img.shields.io/badge/Ollama-Local_AI-000000?style=for-the-badge&logo=ollama&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

> **Scout Code Analysis (Local AI Architect)**, yazılım projelerinizi **%100 yerel yapay zeka modelleri (Ollama)** kullanarak tarayan, güvenlik zafiyetlerini, performans darboğazlarını ve mimari hataları tespit edip tek tıkla otomatik düzelten (**Auto-Fix**) yeni nesil masaüstü kod analiz platformudur.

---

## ✨ Öne Çıkan Özellikler

### 🚀 1. Çift Tarama Modu (Fast & Deep Mode)
- ⚡ **Fast Mode (Hızlı Mod):** Kod tabanınızı saniyeler içinde tarar, özet güvenlik ve kalite raporu sunar. Sorunların yanında yer alan **`💬 Bot'a Sor`** butonu ile AI asistanından anında tavsiye alabilirsiniz.
- 🔍 **Deep Mode (Derin Mod):** Projenizdeki tüm fonksiyonları ve mantıksal akışları detaylıca inceler. Onay kutuları ile seçtiğiniz veya tüm sorunları **`🛠️ Seçilenleri Toplu Düzelt`** butonuyla otomatik olarak kodunuza uygular.

### 📊 2. 5 Dikey Kategori Kanban Kurulu & Akordeon Klasörler
- Tespit edilen tüm sorunlar 5 dikey sütunda kategorize edilir: **Güvenlik 🔒**, **Performans ⚡**, **Kod Kalitesi 🧹**, **Test Kapsamı 🧪** ve **Mimari 🏗️**.
- **Önem Sıralaması & Puan Katkısı:** Sorunlar önem derecesine göre (`Critical`, `High`, `Medium`, `Low`) dizilir ve düzeltildiğinde projenize sağlayacağı katkı (**`+2.5 Puan`**, **`+1.5 Puan`**) canlı olarak hesaplanır.
- **Alt Kategoriler (Collapsible Accordions):** Karmaşıklığı önlemek için sorunlar varsayılan olarak kapalı akordeon klasörlerinde tutulur; kullanıcı dilediğinde tıklar ve detayları inceler.

### 🤖 3. Bağlam Duyarlı Canlı AI Chatbot (Scout AI Assistant)
- Projenizin yapısına, taranan dosyalarına ve tespit edilen tüm sorunlarına **tam bağlam hakimiyeti** olan dahili sohbet asistanı.
- Akışlı yanıt alma ve dilediğiniz an canlı durdurma (**`⏹️ Durdur`**) desteği.

### 📦 4. Otomatik Model İndirme (On-Demand Auto-Pull)
- Ayarlar menüsünden veya sistem üzerinden henüz bilgisayarınızda yüklü olmayan herhangi bir modeli (`qwen2.5-coder:1.5b`, `qwen2.5-coder:3b`, `mistral:7b`, `deepseek-coder:6.7b`, `deepseek-coder-v2:16b`) seçtiğinizde, uygulama terminal komutuna gerek kalmadan modeli arka planda **otomatik indirir** ve ekranda canlı ilerleme gösterir.

### ✏️ 5. Özel Analiz İsimlendirme & Geçmiş Yönetimi
- Gerçekleştirilen analizlere dilediğiniz an kalem simgesine tıklayarak özel isimler (**ör: "Jarvis 1. Analiz"**) verebilir, geçmiş analizleri ve rapor özetlerini dilediğiniz zaman görüntüleyebilirsiniz.

### 🎨 6. Red & Black Modern Tasarım Sistemi
- Yüksek performanslı Dark ve Light tema desteği, cam efekti (Glassmorphism), dinamik grafikler (Radar & Bar Chart) ve modern tipografi.

---

## 🛠️ Teknolojik Mimari (Tech Stack)

- **Frontend & UI:** React 18, Vite, React Router v6, Recharts (Radar & Bar Grafikleri)
- **Desktop Framework:** Electron 34, IPC (Inter-Process Communication)
- **AI Engine & Service:** Ollama REST API, Dynamic Stream Reader, AbortController
- **Styling:** Custom Vanilla CSS Design Tokens (Red & Black Theme, Geist & JetBrains Mono Fonts)
- **Data Persistence:** Local JSON File DB (Scout Database Architecture)

---

## 💻 Kurulum ve Çalıştırma

### Gereksinimler
1. **Node.js** (v18 veya üzeri)
2. **Ollama** (Bilgisayarınızda kurulu ve çalışır durumda olmalıdır: [ollama.com](https://ollama.com))

### Adım 1: Projeyi Klonlayın
```bash
git clone https://github.com/Ibrahim-Taskiran/Scout_Code-Analysis.git
cd Scout_Code-Analysis
```

### Adım 2: Bağımlılıkları Yükleyin
```bash
npm install
```

### Adım 3: Geliştirici Modunda Çalıştırın
```bash
npm run dev
```

### Adım 4: Production (Üretim) Sürümünü Derleyin
```bash
npm run build
npm start
```

---

## 📖 Kullanım Kılavuzu

1. **Uygulamayı Başlatın:** Ana ekranda taranan toplam proje ve ortalama skor istatistiklerini görüntüleyin.
2. **Yeni Tarama Başlatın:** `▶ Run Scan` veya `Analiz` menüsünden taranacak proje klasörünü seçin.
3. **Mod ve Kategori Seçin:** **Fast Mode** veya **Deep Mode** arasından seçim yapın, incelemek istediğiniz kategorileri işaretleyin.
4. **Raporu İnceleyin ve Düzeltin:**
   - Sorunları dikey sütunlar altında inceleyin.
   - **Deep Mode'da:** Seçtiğiniz hataları tek tıkla `🛠️ Seçilenleri Toplu Düzelt` diyerek kodunuza uygulayın.
   - **Fast Mode'da:** Sorunun yanındaki `💬 Bot'a Sor` butonuna basarak AI asistanından tavsiye alın.
5. **Raporu Dışa Aktarın:** `📥 Raporu İndir (.md)` butonuna basarak detaylı analizi Markdown formatında kaydedin.

---

## 📜 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına göz atabilirsiniz.
