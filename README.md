# Parti Odası – Müzik ve Film güncellemesi

## Render'da çalıştırma
1. Dosyaları GitHub reposuna yükle (index.html, server.js, package.json, data/ klasörü).
2. Render → New Web Service → repoyu seç. Build: `npm install`, Start: `npm start`.
3. **Film oyunu için:** themoviedb.org'da ücretsiz hesap aç → Settings → API → anahtar al.
   Render → Environment → `TMDB_API_KEY` = anahtarın (v3 anahtarı veya v4 "eyJ…" token).
   Anahtar yoksa film oyunu başlatılmaz (uyarı gösterilir); şarkı oyunu anahtarsız çalışır.
4. Sunucuda dışarıya çıkış (internet) açık olmalı (Render ücretsiz planda açık).

## Nasıl çalışıyor
- **Şarkı:** Sunucu, iTunes Search API'den (yedek: Deezer) şarkının resmî 30 sn önizlemesini bulur,
  rastgele bir kesit (seek) ve başlangıç zamanını (playAt) belirler; tüm telefonlar aynı anda çalar.
  Şarkı/sanatçı adı istemciye turun sonuna kadar gönderilmez.
- **Film:** TMDB'den filmin metinsiz (dilsiz) arka plan görselleri çekilir, her turda farklı 5 kare
  seçilir ve süre içinde sırayla açılır. Kare puanı: 100/80/60/40/20.
- Yönetici panelinden film eklerken en az 3 `https` görsel URL'si verilirse TMDB yerine onlar kullanılır.
- iOS Safari için ses kilidi ilk dokunuşta açılır; çalmazsa "Başlat" butonu çıkar.

## Bu sürümde değişenler
- Tur seçenekleri: 5, 10, 15, 20, 25, 30, 40, 50 ve Sınırsız (oda sahibi "Oyunu bitir" ile bitirir).
- İçerik havuzları `data/bonus-content.js` ile genişletildi; havuz bitince içerikler baştan, tekrarsız döngüyle gelir.
- Ortam değişkeni: `TMDB_API_KEY` (yalnızca Film oyunu için). `PORT` Render tarafından verilir.

## Pikseli Aç, şarkı ve test (v3.1)
- **Pikseli Aç:** görseller çalışma anında İngilizce Vikipedi'den çözülür; yalnızca Wikimedia Commons (özgür lisanslı) görseller kabul edilir, her çözünürlük adımı sunucuda yüklenebiliyor mu diye doğrulanır, doğrulanamayan kayıt oyuna girmez. Havuzdaki kaç kaydın gerçekten çözüldüğünü görmek için sunucu açıkken `/pixel-check` adresini aç, birkaç dakika sonra `/pixel-stats` adresine bak (`ok`/`fail`).
- **Şarkı:** parça artık tur bitene kadar çalar (iTunes/Deezer önizlemesi en çok 30 sn).
- **Kategori seçimi:** soru oyunlarında ve Pikseli Aç'ta oda sahibi kategori seçebilir.
- **Gerçek Socket.IO testi:** `npm install && npm test` (8 istemci; sunucuyu kendisi başlatır).


## İçerik genişletmesi (2026-11)
- Soru ve kelime ekleri `data/content-expansion.js` dosyasından yüklenir.
- Film kataloğu `data/extra-content.js` içindedir; gerçek sahne kareleri TMDB backdrop API'sinden tur sırasında alınır.
- Film oyunu için Render ortam değişkeni `TMDB_API_KEY` tanımlanmalıdır. API anahtarı yoksa film sahnesi çözülemez.
- İçerik kontrolü: `npm test` (Node.js 18+).
- Film havuzuna yeni kayıt eklerken İngilizce/orijinal ad ve doğru yapım yılını kullan; TMDB araması bunlarla yapılır.


## Medya düzeltmesi (2026-11)
- Şarkı havuzu 80+ parçaya çıkarıldı; iTunes araması TR/US kataloglarında farklı sorgularla denenir, ardından Deezer yedeği kullanılır.
- Film görseli çözümlemesi artık 3+ kare şartı aramaz. TMDB'den gelen tek bir uygun geniş sahne karesi bile turu oynatır; İngilizce, Türkçe ve metinsiz backdrop görselleri aranır.
- TMDB arama sonuçları film adı ve yılına göre puanlanır; başarısız istekler kısa süreli önbelleğe alınır ve hata durumu sunucuya kaydedilir.
- Dağıtım sonrası `https://SITEN-ADRESIN/media-status` adresinden `tmdbConfigured`, `musicCatalogCount`, `filmCatalogCount`, `filmSuccess`, `filmNoFrames` alanları kontrol edilebilir. Bu uç nokta API anahtarını hiçbir zaman göstermez.
- Film görseli URL'leri TMDB'nin resmi görsel CDN biçiminde oluşturulur. TMDB, görsel adresleri için güvenli temel URL, boyut ve dosya yolunun birleştirilmesini tarif eder: https://developer.themoviedb.org/docs/image-basics

## Yeni oyunlar ve Karma Mod güncellemesi

- Karma Mod artık **2–8 oyun** kabul eder. Seçili oyunlar tek tek kaldırılabilir; seçim sayısı 2'nin altındaysa başlatma sırasında uyarı verilir.
- Yeni oyunlar: **Wordle**, **Kelimelik**, **Bağdaştırıcı**, **Palavra**, **Yüz Kişiye Sorduk** ve **Hangisi Daha Büyük?**
- Wordle: aynı gizli Türkçe kelime, 4–7 harf seçimi, 6 deneme, harf-konum renkleri ve çözme sırasına göre puan.
- Kelimelik: harfler zamanla açılır, yanlış tahminlerden sonra tekrar denenebilir, ilk doğru tahmin en yüksek puanı alır; isim, şehir, ülke, film, sanatçı ve nesne kategorileri seçilebilir.
- Bağdaştırıcı: kolay/orta/zor kelime setleri, birden fazla kabul edilen bağlantı ve oda sahibinin ek cevapları değerlendirmesi.
- Palavra: anonim blöf gönderimi, karıştırılmış cevaplar, doğru cevabı bulma ve başkasını kandırma puanları. Cevap sahibi oylama bitene kadar gizlidir.
- Yüz Kişiye Sorduk: popülerlik puanlı seçenekler ve tur sonunda sıralama. **Bu cevaplar oyun için hazırlanmıştır; gerçek anket araştırması değildir.**
- Hangisi Daha Büyük?: coğrafya, hayvanlar, bilim, tarih, spor, film, müzik ve genel kültür kategorileri; her soruda ölçüt, doğru cevap ve açıklama.
- Yeni oyun havuzları `data/new-games.js` dosyasındadır. `npm test` içerik havuzlarını, veri alanlarını ve mevcut medya çözümleme testlerini kontrol eder.
