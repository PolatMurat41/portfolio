import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const slug = "nowcasting-inflation-using-online-prices";
  const title = "Nowcasting Inflation Using Online Prices";
  const summary =
    "İstanbul Bilgi Üniversitesi Rektörü Prof. Dr. M. Ege Yazgan ve CEFIS araştırma ekibiyle birlikte hazırlanan bu çalışmada; e-ticaret sitelerinden günlük toplanan büyük veri niteliğindeki çevrimiçi ürün fiyatları kullanılarak Türkiye enflasyonunun yüksek doğrulukla anlık tahmini (nowcasting) gerçekleştirilmiştir.";

  const content = `## Özet / Abstract

**Yazarlar:** M. Ege Yazgan (İstanbul Bilgi Üniversitesi Rektörü), Umutcan Adıgüzel, Murat Can Polat, Barış Soybilgen  
**Yayın:** CEFIS Working Paper (Finansal Uygulama ve Araştırma Merkezi)  
**Sunum:** International Conference on Econometrics and Big Data Analysis (iCEBDA)  
**Web:** [https://cefis.bilgi.edu.tr/](https://cefis.bilgi.edu.tr/)

---

### Giriş ve Motivasyon

Geleneksel tüketici fiyat endeksleri (TÜFE), resmi istatistik kurumları tarafından ayda bir kez ve gecikmeli olarak yayımlanmaktadır. Yüksek enflasyonist dönemlerde ve ani piyasa dalgalanmalarında politika yapıcılar, finansal kurumlar ve piyasa aktörleri için anlık fiyat hareketlerini takip etmek hayati öneme sahiptir.

Bu çalışmada, Türkiye'deki önde gelen e-ticaret platformlarından web scraping yöntemleriyle her gün toplanan yüz binlerce ürün fiyatından oluşan yüksek frekanslı bir veri tabanı inşa edilmiştir.

---

### Metodoloji ve Veri Mimarisi

1. **Yüksek Frekanslı Veri Toplama:** 
   - Çok kanallı web scraping botları ve pipeline'lar aracılığıyla günlük ürün fiyatları, indirim oranları ve kategori ağaçları otomatik olarak toplanmıştır.
2. **Veri Temizleme & Eşleştirme:**
   - Eksik veri tamamlama, aykırı değer (outlier) temizliği ve TÜFE sepeti madde ağırlıklarıyla harmonizasyon algoritmaları uygulanmıştır.
3. **Nowcasting ve Ekonometrik Modelleme:**
   - Toplanan çevrimiçi fiyat endeksleri, ekonometrik zaman serisi modelleri ve makine öğrenimi yaklaşımları (Ridge/Lasso, Random Forest, Gradient Boosting) ile harmanlanarak aylık resmi enflasyon verisi açıklanmadan önce anlık tahmin üretilmiştir.

---

### Temel Bulgular

- Çevrimiçi fiyat verileriyle oluşturulan günlük endekslerin, resmi TÜFE dinamiklerini yüksek korelasyonla önceden yakaladığı gözlemlenmiştir.
- Özellikle gıda, temel tüketim ve dayanıklı tüketim mallarında anlık fiyat şokları günler öncesinden tespit edilebilmektedir.
- Modelin sunduğu nowcasting sinyalleri, resmi enflasyon duyurularından önceki belirsizliği önemli ölçüde azaltmaktadır.

---

### Teşekkür & Kurumsal Bağlantı

Bu araştırma, **İstanbul Bilgi Üniversitesi Finansal Uygulama ve Araştırma Merkezi (CEFIS)** bünyesinde yürütülmüştür.

- Araştırma detayları ve güncel endeksler için: [CEFIS Resmi Sitesi](https://cefis.bilgi.edu.tr/)
`;

  const existing = await prisma.blogPost.findUnique({ where: { slug } });

  if (existing) {
    await prisma.blogPost.update({
      where: { slug },
      data: {
        title,
        summary,
        content,
        draft: false,
        publishedAt: new Date("2026-03-14"),
      },
    });
    console.log("Updated article in DB:", slug);
  } else {
    await prisma.blogPost.create({
      data: {
        slug,
        title,
        summary,
        content,
        draft: false,
        publishedAt: new Date("2026-03-14"),
      },
    });
    console.log("Created article in DB:", slug);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
