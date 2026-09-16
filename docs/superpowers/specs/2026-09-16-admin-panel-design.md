# Admin Panel — Tasarım Spec'i

**Tarih:** 2026-09-16
**Durum:** Onaylandı, uygulama planına geçiliyor.

## Amaç

Şu an tamamen statik olan portfolio sitesindeki (Next.js 16 + content-collections) blog yazıları ve özgeçmiş/profil verisi, kod değişikliği ve deploy gerektirmeden düzenlenebilsin diye bir admin panel eklenecek. Panel, tek admin kullanıcısı (site sahibi) tarafından kullanılacak.

## Kapsam

Admin panel şunları yönetecek:
- Blog yazıları (şu an `content/*.mdx`)
- Profil/hero bilgileri, iş deneyimi, eğitim, projeler, yetenekler, sosyal linkler (şu an `src/data/resume.tsx`)

Site, artık bu verileri build-time MDX/sabit kod yerine runtime'da veritabanından okuyacak.

## 1. Mimari ve Teknoloji Yığını

- **Next.js App Router** üzerinde `/admin` altında yeni bir route grubu; mevcut public sayfalar (`/`, `/blog`) etkilenmez.
- **Veritabanı:** Vercel Postgres + **Prisma** ORM.
- **Auth:** `iron-session` ile şifrelenmiş, imzalı, HTTP-only oturum çerezi. Giriş, `ADMIN_PASSWORD_HASH` ortam değişkenindeki bcrypt hash'e karşı doğrulanır.
- `middleware.ts`, `/admin/*` altındaki (login hariç) tüm istekleri oturum kontrolünden geçirir.
- **API:** Next.js Route Handlers (`/app/api/admin/...`), CRUD işlemleri için — tümü oturum zorunlu.
- Public site tarafı (`/`, `/blog`) `content-collections` yerine doğrudan Prisma üzerinden veritabanını okuyacak; `content-collections` bağımlılığı kaldırılacak.

## 2. Veri Modeli (Prisma Schema)

- **`Profile`** (tek satır): `name, initials, url, location, locationLink, description, summary, avatarUrl, email, tel`.
- **`SocialLink`**: `platform` (enum: GitHub/LinkedIn/X/Youtube/Email), `url`, `showInNavbar` (bool). İkon, DB'de saklanmaz — `platform` değerine göre kod tarafındaki sabit bir registry'den React component'e eşlenir.
- **`Skill`**: `name, iconKey, sortOrder`. `iconKey` sabit ikon registry'sindeki bir anahtar (örn. `"react"`, `"nextjs"`).
- **`WorkExperience`**: `company, href, location, title, logoUrl, start, end, description, badges (string[]), sortOrder`.
- **`Education`**: `school, href, degree, logoUrl, start, end, sortOrder`.
- **`Project`**: `title, href, dates, active (bool), description, technologies (string[]), image, video, links (JSON: [{type, href, iconKey}]), sortOrder`.
- **`BlogPost`**: `slug (unique), title, summary, content (markdown text), publishedAt, image, draft (bool)`.
- **`Hackathon`**: `title, dates, location, description, image, mlh (nullable), win (nullable), links (JSON: [{title, href, iconKey}]), sortOrder`. (`resume.tsx` içindeki `hackathons` dizisinin karşılığı — planlamada fark edilen ve admin CRUD kapsamına dahil edilmesine karar verilen bir alan.)

İkon alanları için `src/lib/icon-registry.ts` adında sabit bir eşleme dosyası oluşturulur: `iconKey -> React component`. Admin panelde ikon seçimi dropdown ile yapılır; mevcut inline JSX ikonlar (örn. proje linklerindeki `<Icons.globe />`) bu registry'ye taşınır.

## 3. Kimlik Doğrulama Akışı

- `/admin/login`: tek şifre alanlı form. Girilen şifre `bcrypt.compare` ile `ADMIN_PASSWORD_HASH`'e karşı doğrulanır.
- Doğruysa `iron-session` ile şifrelenmiş, HTTP-only, Secure bir oturum çerezi set edilir (süre: 7 gün).
- `middleware.ts`, `/admin` altındaki her istekte çerezi doğrular; geçersiz/eksikse `/admin/login`'e yönlendirir.
- `/admin/logout`: çerezi temizler.
- Basit rate limiting: aynı IP'den ardışık başarısız deneme sayısı in-memory sayaç ile sınırlanır (tek kullanıcılık panel için yeterli, ek altyapı gerekmiyor).
- `ADMIN_PASSWORD_HASH` ve `iron-session` secret'ı `.env.local` üzerinden verilir, repoya commit edilmez. README'ye kurulum notu eklenir.

## 4. Admin Panel Sayfaları

Ortak bir `AdminLayout` (sol menü + üst bar, mevcut shadcn/ui bileşenleriyle) tüm `/admin/*` sayfalarını sarar.

- **`/admin`** — dashboard: yazı sayısı, son düzenlenenler, hızlı linkler.
- **`/admin/blog`** — liste (taslak/yayında filtresi), yeni/düzenle/sil.
  - **`/admin/blog/[id]`** — form: title, slug (otomatik + manuel düzenlenebilir), summary, image, markdown içerik (textarea + canlı önizleme), draft/yayınla toggle.
- **`/admin/profile`** — hero/iletişim formu (name, description, summary, avatar, email, tel, social linkler).
- **`/admin/work`** — iş deneyimi listesi + sıralama + CRUD.
- **`/admin/education`** — eğitim listesi + sıralama + CRUD.
- **`/admin/projects`** — proje listesi + sıralama + CRUD, link/ikon seçimi.
- **`/admin/skills`** — yetenek listesi + sıralama + ikon seçimi.
- **`/admin/hackathons`** — hackathon listesi + sıralama + CRUD (title, dates, location, description, image, mlh, win, links).

## 5. Mevcut İçeriğin Taşınması (Migration)

- Prisma migration ile şema oluşturulduktan sonra tek seferlik `prisma/seed.ts` script'i:
  - `content/*.mdx` içindeki 7 blog yazısını frontmatter + içerikleriyle `BlogPost` tablosuna aktarır.
  - `src/data/resume.tsx` içindeki `DATA` objesini (profile, work, education, projects, skills, contact, hackathons) veritabanına aktarır; ikon component referansları `iconKey` string'lerine çevrilir.
- Seed sonrası `content/*.mdx`, `content-collections.ts`, `src/data/resume.tsx` kod tabanından kaldırılır.
- `content-collections` paketi `package.json`'dan çıkarılır.

## 6. Hata Yönetimi

- Tüm form girişleri Zod şemalarıyla hem client hem server tarafında doğrulanır (zorunlu alanlar, URL formatı, slug benzersizliği).
- API hataları toast/inline mesaj olarak gösterilir; slug çakışması, boş zorunlu alan gibi durumlar kullanıcıya net şekilde bildirilir.
- Silme işlemleri `AlertDialog` ile onay gerektirir.
- Oturumsuz `/admin/*` isteği → `/admin/login` redirect; oturumsuz API isteği → 401.

## 7. Test

Proje şu an otomatik test altyapısı içermiyor; admin panel için de otomatik test eklenmeyecek. Uygulama sonrası her CRUD akışı (blog, work, education, projects, skills, profile) tarayıcıda manuel olarak doğrulanacak.

## Kapsam Dışı

- Çoklu admin kullanıcı / rol yönetimi.
- Zengin metin (WYSIWYG) editör — markdown + önizleme yeterli kabul edildi.
- Resim/medya yükleme altyapısı (dosya URL'leri manuel girilir, ayrı bir upload sistemi kurulmuyor).
