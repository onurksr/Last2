'use strict';

// Oyun için hazırlanmış içerikler; anket cevapları gerçek saha araştırması değildir.
const WORDS = {
  easy: ['masa','kalem','kitap','bulut','deniz','kedi','köpek','çiçek','bardak','telefon','limon','pasta','araba','kapı','sahil','orman','yıldız','balık','çanta','müzik','güneş','rüzgar','ekmek','koltuk','tren','resim','bahçe','şeker','elma','kavun'],
  medium: ['macera','özgürlük','pusula','merdiven','gölge','fırtına','zeytin','serüven','kıvılcım','kütüphane','gezegen','şampiyon','laboratuvar','kelebek','gizemli','sürpriz','mücevher','sözlük','başarı','hayalet','şömine','rüya','dalgıç','yolculuk','gökkuşağı','karınca','felsefe','zaman','dostluk','keşif'],
  hard: ['mürekkep','münazara','mütevazı','istikamet','muhakeme','müteahhit','müfredat','kıraathane','müteşebbis','muvaffakiyet','tefekkür','mütemadiyen','müktesebat','müteakip','müstesna','mütereddit','mütecanis','müphem','mütemmim','müteferrik','mücerret','müellif','müktesep','müessese','müspet','müzakere','müeyyide','müktesebat','mütehassıs','mütemayil']
};

const CONNECTIONS = [
 {d:'easy',c:'Günlük yaşam',w:['Anahtar','Kapı','Kilit','Güvenlik'],a:['kapıyı açıp kapatmak','kapı güvenliği','kilit ve anahtar ilişkisi','kapı kilidi']},
 {d:'easy',c:'Mutfak',w:['Tencere','Ocak','Kaşık','Yemek'],a:['yemek pişirmek','mutfak eşyaları','yemek hazırlığı']},
 {d:'easy',c:'Ulaşım',w:['Bilet','Peron','Tren','İstasyon'],a:['tren yolculuğu','demiryolu ulaşımı','tren istasyonu']},
 {d:'easy',c:'Doğa',w:['Yağmur','Şemsiye','Bulut','Su'],a:['yağmur ve su döngüsü','yağmurlu hava','yağmurdan korunmak']},
 {d:'easy',c:'Okul',w:['Defter','Kalem','Silgi','Sıra'],a:['okul malzemeleri','ders araç gereçleri','sınıf']},
 {d:'easy',c:'Spor',w:['File','Raket','Top','Kort'],a:['tenis','tenis oyunu','raket sporları']},
 {d:'easy',c:'Müzik',w:['Nota','Piyano','Tuș','Melodi'],a:['müzik yapmak','piyano çalmak','müzik']},
 {d:'easy',c:'Gökyüzü',w:['Güneş','Ay','Yıldız','Gezegen'],a:['gök cisimleri','uzay','gökyüzü']},
 {d:'medium',c:'Teknoloji',w:['İşlemci','Bellek','Ekran','Klavye'],a:['bilgisayar','bilgisayar donanımı','bilgisayar parçaları']},
 {d:'medium',c:'Sinema',w:['Yönetmen','Senaryo','Kamera','Kurgu'],a:['film yapımı','sinema üretimi','film çekimi']},
 {d:'medium',c:'Denizcilik',w:['Pusula','Harita','Dümen','Gemi'],a:['deniz yolculuğu','gemi kullanmak','seyir']},
 {d:'medium',c:'Fotoğraf',w:['Lens','Diyafram','Enstantane','ISO'],a:['fotoğrafçılık','fotoğraf makinesi ayarları','pozlama']},
 {d:'medium',c:'Ekonomi',w:['Arz','Talep','Fiyat','Pazar'],a:['piyasa ekonomisi','piyasa','ekonomi']},
 {d:'medium',c:'İletişim',w:['Verici','Alıcı','Mesaj','Kanal'],a:['iletişim süreci','iletişim modeli','iletişim']},
 {d:'medium',c:'Biyoloji',w:['Hücre','Çekirdek','DNA','Kromozom'],a:['genetik','hücre ve kalıtım','kalıtım']},
 {d:'medium',c:'Mimari',w:['Temel','Kolon','Kiriş','Çatı'],a:['bina yapımı','inşaat','yapı elemanları']},
 {d:'hard',c:'Bilim',w:['Hipotez','Deney','Kontrol grubu','Sonuç'],a:['bilimsel yöntem','bilimsel araştırma','deneysel yöntem']},
 {d:'hard',c:'Astronomi',w:['Kırmızıya kayma','Tayf','Galaksi','Uzaklaşma'],a:['evrenin genişlemesi','kozmolojik kırmızıya kayma','hubble yasası']},
 {d:'hard',c:'Dilbilim',w:['Sesbirim','Biçimbirim','Sözdizim','Anlam'],a:['dilbilim','dil incelemesi','dilin katmanları']},
 {d:'hard',c:'Felsefe',w:['Etik','Erdem','Mutluluk','Aristoteles'],a:['erdem etiği','aristoteles etiği','antik yunan felsefesi']}
];

const BLUFF = [
 {q:'“Petrikor” kelimesi ne anlama gelir?',a:'Yağmurdan sonra topraktan gelen hoş koku',fake:['Eski kitapların kendine özgü kokusu','Deniz kıyısındaki tuzlu rüzgâr','Güneş doğmadan önceki sis tabakası'],c:'Kelime bilgisi'},
 {q:'“Selenofili” neyi ifade eder?',a:'Aya ve Ay ışığına duyulan sevgi',fake:['Deniz kabukları biriktirme tutkusu','Sessizlikte kitap okuma alışkanlığı','Yıldızları isimleriyle tanıma becerisi'],c:'Kelime bilgisi'},
 {q:'Bir “zeugma” nedir?',a:'Tek bir sözcüğün iki farklı anlamla kullanıldığı söz sanatı',fake:['Bir şiirde aynı sesin tekrar edilmesi','Bir cümlenin soru biçiminde kurulması','Bir metinde olayların ters sırayla anlatılması'],c:'Edebiyat'},
 {q:'“Hygge” kavramı hangi ülkeyle özdeşleşmiştir?',a:'Danimarka',fake:['İzlanda','Japonya','Portekiz'],c:'Kültür'},
 {q:'Dünyanın en büyük çölü hangisidir?',a:'Antarktika Çölü',fake:['Sahra Çölü','Gobi Çölü','Arabistan Çölü'],c:'Coğrafya'},
 {q:'“Bumerang etkisi” genel olarak neyi anlatır?',a:'Bir davranışın beklenenin tersine sonuç vermesini',fake:['Bir kararın zamanla etkisini kaybetmesini','Bir fikrin hızla yayılmasını','Bir olayın aynı biçimde tekrar etmesini'],c:'Genel kültür'},
 {q:'Satrançta “zugzwang” ne demektir?',a:'Hamle yapmanın oyuncunun konumunu kötüleştirdiği durum',fake:['Şahın iki taş tarafından aynı anda tehdit edilmesi','Oyunun beraberlikle bitmesi','Bir taşın başlangıç karesine dönmesi'],c:'Spor ve oyun'},
 {q:'“Umami” hangi tat sınıfıdır?',a:'Beşinci temel tat',fake:['Acı ile ekşi arasındaki tat','Baharatlı ve yakıcı tat','Tuzsuz ama yoğun tat'],c:'Bilim'},
 {q:'Venüs’te bir gün, bir yıldan daha uzun mudur?',a:'Evet',fake:['Hayır','Sadece kutup bölgelerinde','Mevsime göre değişir'],c:'Bilim'},
 {q:'“Mavi saat” fotoğrafçılıkta hangi zamanı anlatır?',a:'Gün doğumundan önce veya gün batımından sonra oluşan alacakaranlık',fake:['Öğle vakti gökyüzünün en mavi olduğu an','Dolunay gecesinin ilk saati','Yağmur öncesi bulutların koyulaştığı zaman'],c:'Fotoğraf'}
];

const SURVEYS = [
 {q:'Bir tatil planında en önemli şey hangisidir?',o:[['Deniz ve plaj',34],['Tarihi yerleri gezmek',26],['Yemekleri keşfetmek',19],['Doğa ve yürüyüş',14],['Alışveriş',7]]},
 {q:'Bir adaya düşsen yanında hangisini bulundurmak daha faydalı olur?',o:[['Çok amaçlı çakı',36],['Su arıtma filtresi',30],['İlk yardım çantası',18],['Uydu telefonu',10],['Gitar',6]]},
 {q:'Arkadaş grubunda film gecesi için en çok hangi tür seçilir?',o:[['Komedi',31],['Aksiyon',25],['Korku',20],['Bilim kurgu',14],['Dram',10]]},
 {q:'Güne başlarken ilk yapılan şey genellikle nedir?',o:[['Telefonu kontrol etmek',38],['Kahvaltı yapmak',24],['Duş almak',16],['Kahve/çay içmek',15],['Spor yapmak',7]]},
 {q:'Uzun bir yolculukta en çok neyle vakit geçirilir?',o:[['Müzik dinlemek',33],['Film/dizi izlemek',22],['Uyumak',21],['Oyun oynamak',15],['Kitap okumak',9]]},
 {q:'Bir süper güç seçsen hangisini seçerdin?',o:[['Işınlanma',35],['Zamanı durdurma',28],['Uçma',18],['Görünmezlik',12],['Zihin okuma',7]]},
 {q:'Bir şehirde yaşamak için en önemli özellik nedir?',o:[['Güvenlik',32],['İş olanakları',26],['Ulaşım',20],['Sosyal hayat',14],['İklim',8]]},
 {q:'Bir restoranda menüden ilk neye bakarsın?',o:[['Ana yemekler',37],['Fiyatlar',25],['Tatlılar',16],['İçecekler',12],['Başlangıçlar',10]]},
 {q:'Hafta sonu için en popüler plan hangisi olur?',o:[['Arkadaşlarla buluşmak',34],['Evde dinlenmek',27],['Gezmeye çıkmak',20],['Spor yapmak',11],['Yeni bir şey öğrenmek',8]]},
 {q:'Telefonunda en sık hangi amaçla vakit geçirirsin?',o:[['Sosyal medya',36],['Mesajlaşma',25],['Video izleme',21],['Oyun',11],['Haber/okuma',7]]},
 {q:'Bir hediye seçerken en çok ne önemlidir?',o:[['Kişiye özel olması',39],['İşe yaraması',25],['Şık görünmesi',16],['Pahalı olması',8],['Sürpriz olması',12]]},
 {q:'Yeni bir beceri öğrenecek olsan hangisini seçerdin?',o:[['Yeni dil',28],['Müzik aleti',23],['Yemek yapmak',19],['Kodlama',18],['Fotoğrafçılık',12]]}
];

const BIGGER = [
 {c:'Coğrafya',a:'Türkiye',b:'Almanya',metric:'Yüz ölçümü',v:0,x:'Türkiye yaklaşık 783 bin km², Almanya yaklaşık 358 bin km².'},
 {c:'Coğrafya',a:'Nil Nehri',b:'Amazon Nehri',metric:'Genellikle kabul edilen uzunluk ölçümü',v:0,x:'Nil, yaygın kaynaklarda yaklaşık 6.650 km ile daha uzun kabul edilir; ölçüm yöntemine göre tartışma vardır.'},
 {c:'Coğrafya',a:'Grönland',b:'Madagaskar',metric:'Yüz ölçümü',v:0,x:'Grönland yaklaşık 2,16 milyon km²; Madagaskar yaklaşık 587 bin km².'},
 {c:'Coğrafya',a:'Japonya',b:'Birleşik Krallık',metric:'Yüz ölçümü',v:0,x:'Japonya yaklaşık 378 bin km²; Birleşik Krallık yaklaşık 244 bin km².'},
 {c:'Hayvanlar',a:'Mavi balina',b:'Afrika fili',metric:'Yetişkin bireyin tipik azami ağırlığı',v:0,x:'Mavi balina yaklaşık 150–200 tona ulaşabilir; Afrika fili yaklaşık 6–7 ton.'},
 {c:'Hayvanlar',a:'Devekuşu',b:'Penguen (imparator)',metric:'Boy',v:0,x:'Devekuşu yaklaşık 2,7 metreye ulaşır; imparator penguen yaklaşık 1,2 metre.'},
 {c:'Bilim',a:'Jüpiter',b:'Satürn',metric:'Çap',v:0,x:'Jüpiter’in çapı yaklaşık 139.820 km; Satürn’ünki yaklaşık 116.460 km.'},
 {c:'Bilim',a:'Güneş',b:'Dünya',metric:'Çap',v:0,x:'Güneş’in çapı yaklaşık 1,39 milyon km; Dünya’nın çapı yaklaşık 12.742 km.'},
 {c:'Tarih',a:'Gize Büyük Piramidi',b:'Roma Kolezyumu',metric:'Yaklaşık yapım tarihi (daha eski olan)',v:0,x:'Gize Büyük Piramidi yaklaşık MÖ 26. yüzyılda; Kolezyum MS 1. yüzyılda tamamlandı.'},
 {c:'Spor',a:'Maraton',b:'Yarı maraton',metric:'Resmî yarış mesafesi',v:0,x:'Maraton 42,195 km; yarı maraton 21,0975 km.'},
 {c:'Film',a:'Avatar (2009)',b:'Titanic (1997)',metric:'Dünya çapında enflasyona göre düzeltilmemiş gişe hasılatı',v:0,x:'Avatar’ın toplam nominal gişe hasılatı Titanic’ten yüksektir; yeniden gösterimler toplamı etkiler.'},
 {c:'Müzik',a:'Queen',b:'The Beatles',metric:'Resmî stüdyo albümü sayısı (ana katalog)',v:0,x:'The Beatles’ın ana stüdyo albümü sayısı genellikle 12 (UK), Queen’in 15 olarak listelenir; katalog tanımı ülkeye göre değişebilir.'},
 {c:'Genel kültür',a:'Eyfel Kulesi',b:'Pisa Kulesi',metric:'Yükseklik',v:0,x:'Eyfel Kulesi yaklaşık 330 metre; Pisa Kulesi yaklaşık 56 metre.'},
 {c:'Genel kültür',a:'Burj Khalifa',b:'Shanghai Tower',metric:'Yükseklik',v:0,x:'Burj Khalifa 828 metre; Shanghai Tower 632 metre.'},
 {c:'Coğrafya',a:'Avustralya',b:'Hindistan',metric:'Yüz ölçümü',v:0,x:'Avustralya yaklaşık 7,7 milyon km²; Hindistan yaklaşık 3,3 milyon km².'},
 {c:'Hayvanlar',a:'Zürafa',b:'Deve',metric:'Tipik yetişkin boyu',v:0,x:'Zürafalar 5 metreyi aşabilir; develer genellikle yaklaşık 2 metre omuz yüksekliğindedir.'},
 {c:'Bilim',a:'Işık (boşlukta)',b:'Ses (havada)',metric:'Yayılma hızı',v:0,x:'Işık yaklaşık 300.000 km/s; ses havada yaklaşık 343 m/s.'},
 {c:'Spor',a:'Basketbol sahası',b:'Futbol sahası',metric:'Oyun alanı yüz ölçümü (standart ölçülerle yaklaşık)',v:1,x:'Futbol sahası yaklaşık 7.140 m² (105×68); basketbol sahası 420 m² (28×15).'}
];




const KELIME_CATEGORIES = {
  'İsim': ['Ahmet','Mehmet','Zeynep','Elif','Deniz','Eylül','Mert','Kerem','Selin','Eren','Ada','Defne','Emir','Duru','Can'],
  'Şehir': ['İstanbul','Ankara','İzmir','Bursa','Antalya','Eskişehir','Trabzon','Konya','Mardin','Gaziantep','Uşak','Samsun','Adana','Edirne','Muğla'],
  'Ülke': ['Türkiye','Almanya','İtalya','Japonya','Brezilya','Kanada','Mısır','Norveç','Portekiz','Avustralya','Arjantin','İspanya','Hollanda','İzlanda','Fas'],
  'Film': ['Titanic','Avatar','Inception','Interstellar','Joker','Gladyatör','Başlangıç','Esaretin Bedeli','Matrix','Coco','Parazit','Kuzuların Sessizliği'],
  'Sanatçı': ['Tarkan','Teoman','Sezen Aksu','Sertab Erener','Manga','Duman','Barış Manço','Şebnem Ferah','Ceza','Ezhel','Ajda Pekkan','Mor ve Ötesi'],
  'Nesne': ['Pusula','Merdiven','Mikroskop','Teleskop','Çekiç','Valiz','Dürbün','Fener','Anahtar','Kilit','Keman','Daktilo','Termometre','Şemsiye','Projektör']
};

// Ek turlar: havuzlar tekrar hissini azaltmak için geniş tutulur.
WORDS.easy.push('kasa','saat','biber','kutu','yolcu','şehir','kitaplık','kavanoz','dondurma','toprak','nehir','çorap','makas','karga','sandal','kireç','kablo','simit','üzüm','kiraz','fener','kule','sabah','gece','kural','oyun','renk','şarkı','düğme','pencere');
WORDS.medium.push('gözlemci','atmosfer','kıta','kıyafet','karakter','bulmaca','ihtimal','başlangıç','sorumluluk','kavram','meraklı','anlatıcı','gelenek','denge','dayanışma','serüvenli','çözümleme','yansıma','yaklaşım','mücadele','sembol','alışkanlık','gösterge','yankı','ufuk','gölgelik','sığınak','şelale','volkan','kıvrım');
WORDS.hard.push('müteakiben','mütemadi','müktesebat','mücerretlik','mütefekkir','müktesep','müteredditlik','müstakil','mütehassıs','mütemmim','mütecanislik','müspetlik','müphemlik','müzakereci','müelliflik','müteşekkir','mütevellit','mütemayiz','müfredatlı','müessir');
CONNECTIONS.push(
 {d:'easy',c:'Ev',w:['Yastık','Yorgan','Yatak','Uyku'],a:['uyumak','yatak odası','uyku düzeni']},
 {d:'easy',c:'Bahçe',w:['Toprak','Tohum','Sulama','Fide'],a:['bitki yetiştirmek','bahçecilik','ekim ve sulama']},
 {d:'easy',c:'Kış',w:['Atkı','Eldiven','Mont','Soğuk'],a:['kışlık kıyafet','soğuktan korunmak','kış mevsimi']},
 {d:'easy',c:'Futbol',w:['Hakem','Düdük','Faul','Kart'],a:['futbol kuralları','futbol maçı','hakem kararları']},
 {d:'medium',c:'Hukuk',w:['Dava','Hâkim','Delil','Karar'],a:['mahkeme süreci','yargılama','hukuk sistemi']},
 {d:'medium',c:'Havacılık',w:['Kanat','Kokpit','İrtifa','Pist'],a:['uçak','uçuş','havacılık']},
 {d:'medium',c:'Matematik',w:['Açı','Kenar','Üçgen','Alan'],a:['geometri','üçgen geometrisi','geometrik şekiller']},
 {d:'medium',c:'Sağlık',w:['Nabız','Tansiyon','Kalp','Dolaşım'],a:['kalp ve dolaşım sistemi','dolaşım sistemi','kalp sağlığı']},
 {d:'hard',c:'Jeoloji',w:['Magma','Lav','Volkan','Kül'],a:['volkanik faaliyet','volkanizma','volkan patlaması']},
 {d:'hard',c:'İstatistik',w:['Ortalama','Medyan','Mod','Dağılım'],a:['merkezi eğilim ölçüleri','istatistiksel ölçüler','veri analizi']},
 {d:'hard',c:'Fizik',w:['Kütle','İvme','Kuvvet','Newton'],a:['newtonun hareket yasaları','mekanik','kuvvet ve hareket']},
 {d:'hard',c:'Ekoloji',w:['Üretici','Tüketici','Ayrıştırıcı','Besin ağı'],a:['ekosistem','besin zinciri','ekolojik ilişkiler']}
);
BLUFF.push(
 {q:'“Limerence” kavramı neyi tanımlar?',a:'Yoğun ve istemsiz romantik takıntı hâlini',fake:['Bir kitabı tek oturuşta bitirme isteğini','Yeni bir yere taşınma heyecanını','Bir melodiyi sürekli hatırlama durumunu'],c:'Psikoloji'},
 {q:'Dünyanın en derin okyanus noktası hangisidir?',a:'Mariana Çukuru’ndaki Challenger Deep',fake:['Tonga Çukuru','Java Çukuru','Puerto Rico Çukuru'],c:'Coğrafya'},
 {q:'“Pareidolia” nedir?',a:'Belirsiz görüntülerde tanıdık şekiller veya yüzler algılamak',fake:['Bir sesi olduğundan daha yüksek duymak','Renkleri ters tonlarda algılamak','Bir kokuyu anıyla eşleştirmek'],c:'Bilim'},
 {q:'Bir “palindrom” nasıl bir sözcük veya dizidir?',a:'Tersten okunduğunda da aynı olan',fake:['Her harfi alfabetik sırada olan','Yalnızca ünlülerden oluşan','Aynı harfle başlayıp bitmeyen'],c:'Dil'},
 {q:'Satürn’ün en büyük uydusu hangisidir?',a:'Titan',fake:['Europa','Ganymede','Enceladus'],c:'Astronomi'},
 {q:'“Fermat’ın son teoremi” hangi matematik alanıyla ilgilidir?',a:'Sayılar teorisi',fake:['Olasılık teorisi','Diferansiyel geometri','Oyun teorisi'],c:'Matematik'},
 {q:'Kutup ışıkları temel olarak hangi etkileşimle oluşur?',a:'Güneş kaynaklı yüklü parçacıkların atmosferle etkileşimi',fake:['Ay ışığının buz kristallerinden yansıması','Okyanus akıntılarının elektrik üretmesi','Bulutların sürtünmeyle ışık yayması'],c:'Bilim'},
 {q:'“Sfumato” tekniği hangi sanatçıyla özellikle özdeşleşir?',a:'Leonardo da Vinci',fake:['Vincent van Gogh','Claude Monet','Pablo Picasso'],c:'Sanat'}
);
SURVEYS.push(
 {q:'Bir kafede en sık hangi içecek tercih edilir?',o:[['Filtre kahve',32],['Türk kahvesi',27],['Latte',21],['Çay',14],['Soğuk kahve',6]]},
 {q:'Bir oyunda en çok hangi özellik önemlidir?',o:[['Eğlenceli oynanış',37],['Hikâye',25],['Grafikler',17],['Çok oyunculu mod',14],['Müzikler',7]]},
 {q:'Bir seyahatte konaklama için hangisi daha cazip?',o:[['Otel',35],['Kiralık ev',28],['Butik otel',18],['Kamp',12],['Hostel',7]]},
 {q:'Bir arkadaşta en çok hangi özellik aranır?',o:[['Güvenilirlik',42],['Mizah',24],['Dürüstlük',20],['Macera ruhu',8],['Ortak ilgi alanı',6]]},
 {q:'Sinemada film izlerken en çok ne alınır?',o:[['Patlamış mısır',55],['Nachos',17],['Çikolata',13],['Şekerleme',9],['Hiçbir şey',6]]},
 {q:'Bir evcil hayvan seçerken hangisi daha çok tercih edilir?',o:[['Kedi',38],['Köpek',36],['Kuş',12],['Balık',9],['Diğer',5]]},
 {q:'Bir müzik listesinde hangi dönem daha çok dinlenir?',o:[['Güncel şarkılar',34],['2000’ler',27],['90’lar',19],['80’ler',12],['70’ler ve öncesi',8]]},
 {q:'Bir okul gezisinde en eğlenceli aktivite hangisi?',o:[['Serbest zaman',31],['Müze gezisi',22],['Eğlence parkı',21],['Doğa yürüyüşü',15],['Rehberli tur',11]]},
 {q:'Bir tatlı seçmen gerekse hangisini alırsın?',o:[['Cheesecake',25],['Baklava',24],['Sütlaç',20],['Dondurma',19],['Profiterol',12]]},
 {q:'Evde boş bir akşamı nasıl geçirirsin?',o:[['Dizi/film izleyerek',36],['Oyun oynayarak',25],['Müzik dinleyerek',16],['Kitap okuyarak',13],['Bir şeyler pişirerek',10]]},
 {q:'Spor izlerken en çok hangi atmosfer heyecan verir?',o:[['Derbi maçı',34],['Final karşılaşması',28],['Milli maç',22],['Rekor denemesi',10],['Dostluk maçı',6]]},
 {q:'Bir uygulamayı telefonda tutma sebebin genellikle nedir?',o:[['Sık kullanmam',40],['İşimi kolaylaştırır',26],['Eğlenceli içerik sunar',18],['Arkadaşlarım kullanır',10],['Alışkanlık',6]]}
);
BIGGER.push(
 {c:'Coğrafya',a:'Afrika',b:'Kuzey Amerika',metric:'Yüz ölçümü',v:0,x:'Afrika yaklaşık 30,3 milyon km²; Kuzey Amerika yaklaşık 24,7 milyon km².'},
 {c:'Coğrafya',a:'Karadeniz',b:'Ege Denizi',metric:'Yüz ölçümü',v:0,x:'Karadeniz yaklaşık 436 bin km²; Ege Denizi yaklaşık 214 bin km².'},
 {c:'Hayvanlar',a:'Kutupsal ayı',b:'Panda',metric:'Tipik yetişkin ağırlığı',v:0,x:'Kutup ayıları genellikle pandalardan daha ağırdır.'},
 {c:'Hayvanlar',a:'Mavi balina kalbi',b:'İnsan kalbi',metric:'Ağırlık',v:0,x:'Mavi balinanın kalbi yüzlerce kilogram ağırlığa ulaşabilir; insan kalbi yaklaşık 300 gramdır.'},
 {c:'Bilim',a:'Samanyolu',b:'Güneş Sistemi',metric:'Çap',v:0,x:'Samanyolu yaklaşık 100 bin ışık yılı çapındadır; Güneş Sistemi bunun çok küçük bir bölümünü kaplar.'},
 {c:'Bilim',a:'Atom çekirdeği',b:'Atomun tamamı',metric:'Boyut',v:1,x:'Atomun tamamı, çekirdekten yaklaşık on binlerce kat daha geniştir.'},
 {c:'Tarih',a:'Çin Seddi',b:'Panama Kanalı',metric:'Uzunluk',v:0,x:'Çin Seddi’nin tüm kollarıyla toplam uzunluğu on binlerce kilometredir; Panama Kanalı yaklaşık 82 km.'},
 {c:'Tarih',a:'Ayasofya',b:'Tac Mahal',metric:'Yapının tamamlanma yılı (daha eski olan)',v:0,x:'Ayasofya 537’de, Tac Mahal 17. yüzyılda tamamlandı.'},
 {c:'Spor',a:'Olimpik yüzme havuzu',b:'Olimpik atletizm pisti',metric:'Bir tur/uzunluk mesafesi',v:1,x:'Atletizm pistinin bir turu 400 m; olimpik havuzun uzunluğu 50 m.'},
 {c:'Spor',a:'NBA basketbol sahası',b:'Voleybol sahası',metric:'Oyun alanı yüz ölçümü',v:0,x:'NBA sahası 420 m²; voleybol sahası 162 m².'},
 {c:'Film',a:'Yüzüklerin Efendisi: Kralın Dönüşü',b:'Joker (2019)',metric:'Akademi Ödülleri toplamı',v:0,x:'Kralın Dönüşü 11 Oscar; Joker 2 Oscar kazandı.'},
 {c:'Film',a:'Harry Potter serisi',b:'Hobbit film üçlemesi',metric:'Ana sinema filmi sayısı',v:0,x:'Harry Potter ana serisi 8 film; Hobbit üçlemesi 3 film.'},
 {c:'Müzik',a:'Beethoven 9. Senfoni',b:'Vivaldi Dört Mevsim',metric:'Bölüm/hareket sayısı',v:1,x:'Dört Mevsim dört konçertodan ve toplam 12 bölümden oluşur; 9. Senfoni dört bölümden oluşur.'},
 {c:'Genel kültür',a:'Bir yıl',b:'Bir artık yıl',metric:'Gün sayısı',v:1,x:'Normal yıl 365 gün, artık yıl 366 gündür.'},
 {c:'Genel kültür',a:'A4 kâğıdı',b:'A3 kâğıdı',metric:'Yüz ölçümü',v:1,x:'A3, A4’ün iki katı yüz ölçümüne sahiptir.'},
 {c:'Coğrafya',a:'Pasifik Okyanusu',b:'Atlantik Okyanusu',metric:'Yüz ölçümü',v:0,x:'Pasifik, dünyanın en büyük okyanusudur.'},
 {c:'Hayvanlar',a:'Zürafa',b:'Aslan',metric:'Yetişkin bireyin tipik boyu',v:0,x:'Zürafa çok daha uzundur; aslanın omuz yüksekliği yaklaşık 1,2 metredir.'},
 {c:'Bilim',a:'Bir ışık yılı',b:'Bir astronomik birim',metric:'Mesafe',v:0,x:'Işık yılı yaklaşık 9,46 trilyon km; astronomik birim yaklaşık 150 milyon km.'},
 {c:'Genel kültür',a:'Everest Dağı',b:'Kilimanjaro Dağı',metric:'Deniz seviyesinden yükseklik',v:0,x:'Everest 8.849 m; Kilimanjaro 5.895 m.'}
);

for (const level of Object.keys(WORDS)) WORDS[level] = [...new Map(WORDS[level].map(word => [word.toLocaleLowerCase('tr-TR'), word])).values()];

module.exports = { WORDS, CONNECTIONS, BLUFF, SURVEYS, BIGGER, KELIME_CATEGORIES };
