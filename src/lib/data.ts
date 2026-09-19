import { prisma } from "@/lib/prisma";

export async function getProfile() {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });
  if (!profile) {
    throw new Error("Profile is not seeded yet. Run: pnpm prisma db seed");
  }
  return profile;
}

export async function getSocialLinks() {
  return prisma.socialLink.findMany({ orderBy: { platform: "asc" } });
}

export async function getSkills() {
  return prisma.skill.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getWorkExperience() {
  return prisma.workExperience.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getEducation() {
  return prisma.education.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getProjects() {
  let projects = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });

  // Self-healing migration for Körfez Kuyumculuk & project screenshots
  const hasKorfez = projects.some((p) => p.href.includes("korfezkuyumculuk.com"));
  if (!hasKorfez) {
    try {
      // Shift sortOrder for Endüstriyel Süt and Adiatank
      const endustriyel = projects.find((p) => p.title.includes("Endüstriyel Süt"));
      if (endustriyel) {
        await prisma.project.update({ where: { id: endustriyel.id }, data: { sortOrder: 5 } });
      }
      const adiatank = projects.find((p) => p.title.includes("Adiatank"));
      if (adiatank) {
        await prisma.project.update({ where: { id: adiatank.id }, data: { sortOrder: 6 } });
      }

      await prisma.project.create({
        data: {
          title: "Körfez Kuyumculuk",
          href: "https://korfezkuyumculuk.com/",
          dates: "Completed",
          active: false,
          description:
            "Karamürsel Körfez Kuyumculuk için geliştirilen, özel altın ve mücevher koleksiyonları ile anlık canlı altın fiyatlarını sunan lüks kurumsal ve vitrin platformu.",
          technologies: ["Next.js", "React", "Tailwind CSS", "Node.js"],
          image: "/projects/korfez-kuyumculuk.png",
          video: "",
          links: [
            {
              href: "https://korfezkuyumculuk.com/",
              type: "Website",
              iconKey: "globe",
            },
          ],
          sortOrder: 4,
        },
      });

      projects = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
    } catch {
      // ignore
    }
  }

  return projects;
}

export async function getHackathons() {
  return prisma.hackathon.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getPublishedPosts() {
  let posts = await prisma.blogPost.findMany({
    where: { draft: false },
    orderBy: { publishedAt: "desc" },
  });

  // Self-healing migration for Nowcasting Inflation article
  const hasPaper = posts.some((p) => p.slug === "nowcasting-inflation-using-online-prices");
  if (!hasPaper) {
    try {
      await prisma.blogPost.create({
        data: {
          slug: "nowcasting-inflation-using-online-prices",
          title: "Nowcasting Inflation Using Online Prices",
          summary:
            "İstanbul Bilgi Üniversitesi Rektörü Prof. Dr. M. Ege Yazgan ve CEFIS araştırma ekibiyle birlikte hazırlanan bu çalışmada; e-ticaret sitelerinden günlük toplanan büyük veri niteliğindeki çevrimiçi ürün fiyatları kullanılarak Türkiye enflasyonunun yüksek doğrulukla anlık tahmini (nowcasting) gerçekleştirilmiştir.",
          content: `## Özet / Abstract

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
`,
          draft: false,
          publishedAt: new Date("2026-03-14"),
        },
      });

      posts = await prisma.blogPost.findMany({
        where: { draft: false },
        orderBy: { publishedAt: "desc" },
      });
    } catch {
      // ignore
    }
  }

  return posts;
}

export async function getPostBySlug(slug: string) {
  const post = await prisma.blogPost.findFirst({ where: { slug, draft: false } });
  if (!post) {
    // If it's the nowcasting article, trigger getPublishedPosts to seed it
    if (slug === "nowcasting-inflation-using-online-prices") {
      await getPublishedPosts();
      return prisma.blogPost.findFirst({ where: { slug, draft: false } });
    }
  }
  return post;
}
