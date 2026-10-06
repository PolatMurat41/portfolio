// The note seeded once, when the Note table is first created (see
// src/lib/schema-sync.ts). Deleting it from /admin/notes is permanent.

export const FIRST_NOTE_ID = "note_mcp_server_plan";

export const FIRST_NOTE_TITLE = "Fikir: Site için MCP server — AI ile konuşarak bilgi girmek";

export const FIRST_NOTE_CONTENT = `## Amaç

Admin paneline hiç girmeden, Claude gibi bir yapay zeka asistanıyla **konuşarak** siteye bilgi girebilmek. Örnekler:

- "Portföyüme yeni bir proje ekle: adı X, linki Y, teknolojiler Next.js ve FastAPI."
- "Hakkımda metnine yeni işimi ekle, İngilizcesini de güncelle."
- "Bu hafta iletişim formundan gelen mesajları özetle."
- "Chatbot'un sistem promptunu daha kısa yanıtlar verecek şekilde düzenle."

## Nasıl çalışacak

- Site, \`/api/mcp\` adresinde bir **MCP (Model Context Protocol) server** sunar (Streamable HTTP).
- AI istemcisi (Claude Desktop, claude.ai, Claude Code, Cursor...) bu adrese bağlanır, server'ın sunduğu araçları (tools) görür ve sohbet sırasında gerektiğinde çağırır.
- Araçlar, admin panelinin kullandığı **aynı** veritabanı fonksiyonlarını ve doğrulama şemalarını (\`src/lib/validation.ts\`) kullanır; panel ve AI aynı kurallarla çalışır.

## İlk sürümdeki araçlar

**Okuma**
- Profil / hakkımda, iş deneyimi, eğitim, yetenekler, projeler, makaleler
- İletişim mesajları (okunmamışlar dahil), chatbot ayarları ve konuşma kayıtları
- Bu notlar

**Yazma**
- Profil ve hakkımda metnini güncelle (TR/EN)
- Proje, iş deneyimi, eğitim, yetenek ekle / güncelle / sırala
- Makale **taslağı** oluştur (yayınlamak ayrı ve açık bir adım)
- Mesajı okundu işaretle
- Chatbot ayarlarını değiştir (model, sistem promptu, limitler)
- Not ekle / güncelle
- TR → EN çeviri (mevcut çeviri servisi)

## Güvenlik

- Admin şifresinden bağımsız, istenince iptal edilebilen ayrı bir erişim anahtarı: \`MCP_ACCESS_TOKEN\` (Bearer).
- Silme ve yayınlama gibi geri alınamaz işlemler açık bir onay parametresi ister; makaleler önce taslak olarak girer.
- Her yazma işlemi bir **değişiklik kaydına** (audit log) yazılır: ne, ne zaman, önceki değer. Admin panelinde görüntülenir, gerekirse geri alınır.
- İstek limiti (rate limit).

## Bağlanma (örnek)

- **Claude Code:** \`claude mcp add --transport http portfolio https://<site-adresi>/api/mcp --header "Authorization: Bearer <MCP_ACCESS_TOKEN>"\`
- **Claude Desktop / claude.ai:** Özel bağlayıcı (custom connector) olarak site adresini eklemek; bunun için ileride OAuth girişi eklenebilir.

## Yapılacaklar

- [ ] \`@modelcontextprotocol/sdk\` ile \`/api/mcp\` route'u
- [ ] \`MCP_ACCESS_TOKEN\` kontrolü
- [ ] Okuma araçları
- [ ] Yazma araçları (admin paneliyle ortak zod şemaları)
- [ ] Audit log tablosu + admin sayfası
- [ ] Claude ile uçtan uca test
- [ ] (Sonra) OAuth → claude.ai bağlayıcısı
`;
