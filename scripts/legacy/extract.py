"""
Eski statik siteden (www.idealistmuhendislik.com.tr: index.html, en.html, projects.html, img/) içerik çıkarıcı.
Bir kez çalıştı; çıktısı commit'li: site/src/data/content.json ve site/src/assets/media/*.webp.

Eski sitedeki proje kartları ve açılır pencereler (modal) arasında kopyala-yapıştır hataları vardı (ör. "Özbeker" kartı
"Usta İnşaat Fikirtepe" penceresini açıyordu, Denizli Yurt iki kategoride farklı görsellerle duruyordu). Bu yüzden
projeler aşağıdaki elle düzeltilmiş tabloda; her satırın kaynağı eski kart/pencere metnidir. Belirsizlikler `note` alanında.

Kullanım: python3 -I scripts/legacy/extract.py <eski-site-indirme-klasörü>
"""
import json
import sys
from pathlib import Path

from PIL import Image

SRC = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parents[2]
MEDIA = ROOT / "site" / "src" / "assets" / "media"
OUT = ROOT / "site" / "src" / "data" / "content.json"
MAX_W = 1600

AREAS = [
    ("karma-kullanim", "Karma Kullanım", "Mixed-Use Buildings", "mixed"),
    ("kurum-binalari", "Kurum Binaları", "Institutional Buildings", "institution"),
    ("saglik", "Hastaneler, Laboratuvarlar ve Bakımevleri", "Hospitals, Laboratories and Nursing Homes", "health"),
    ("otel", "Oteller", "Hotels", "hotel"),
    ("konut", "Konutlar", "Residential Buildings", "home"),
    ("ofis", "Ofis Binaları", "Office Buildings", "office"),
    ("egitim", "Eğitim Yapıları ve Yurtlar", "Educational Buildings and Dormitories", "school"),
    ("avm", "Alışveriş Merkezleri", "Shopping Malls", "mall"),
    ("sosyal", "Sosyal Tesisler", "Social Facilities", "social"),
    ("sanayi", "Sanayi, Lojistik ve Ulaşım Tesisleri", "Industrial, Logistics and Transportation Facilities", "industry"),
    ("spor", "Spor Tesisleri", "Sports Facilities", "sport"),
    ("yurt-disi", "Yurt Dışı Projeleri", "International Projects", "globe"),
]

P = "img/proje/"
def imgs(folder, names):
    return [f"{P}{folder}/{n}" for n in names]
def n(folder, count, ext="jpg", skip=()):
    return imgs(folder, [f"{i}.{ext}" for i in range(1, count + 1) if i not in skip])

# slug, ad, alanlar, kullanım, işveren, mimar, yıl, konum, m², görseller, öne çıkan sırası, not
PROJECTS = [
    ("merkez-ankara", "Merkez Ankara", ["karma-kullanim"], "Konut, AVM, Ofis", "Pasifik Çiftay İş Ortaklığı", "", 2017, "Ankara", 1333255, imgs("1karma/1a-ego", ["1.jpg", "3.jpg"]), 2, "Eski sitede pencere başlığı: Pasifik Çiftay İş Ortaklığı, Ego Projesi."),
    ("santra", "Santra", ["karma-kullanim"], "Konut, AVM, Ofis", "Recep Uzelli", "", None, "Çayyolu, Ankara", 250000, n("1karma/1recep-uzelli", 1), 3, "Eski sitede yıl iki yerde farklı (2005 ve 2015); boş bırakıldı. Kart adı yer yer Recep Uzelli."),
    ("velux-ankara", "Velux Ankara", ["karma-kullanim"], "Konut, AVM, Ofis (karma kompleks)", "Fırat & Atayıldız", "", 2020, "Ankara", 200000, n("1karma/velux", 1, "jpeg"), None, ""),
    ("golbahce-konutlari", "Gölbahçe Konutları", ["karma-kullanim"], "Konut, AVM, Ofis (karma kompleks)", "Bayraktar İnşaat", "", 2020, "Ankara", 580000, n("1karma/golbahce", 1), None, ""),
    ("fikirtepe", "Fikirtepe", ["karma-kullanim"], "Konut, Ticaret", "Usta İnşaat", "", 2012, "Fikirtepe, İstanbul", 150000, n("1karma/2fikirtepe", 1), None, ""),
    ("ozbeker-yasamkent", "Özbeker Yaşamkent", ["karma-kullanim"], "Konut, AVM", "Beker İnşaat", "", 2015, "Yaşamkent, Ankara", 54000, n("1karma/4ozbeker-yasamkent", 1), None, "Eski sitede Özbeker Plaza / Öz Beker İş Merkezi adlarıyla da geçiyor."),
    ("mfz-beytepe", "MFZ Beytepe", ["karma-kullanim"], "Konut, Ticaret", "MFZ Grup", "", 2014, "Beytepe, Ankara", 53600, n("1karma/11mfz-beytepe", 1), None, ""),
    ("demircioglu-plaza", "Demircioğlu Plaza", ["karma-kullanim"], "Ofis, Rezidans, Ticaret", "Demirbilekler İnşaat", "", 2014, "Beytepe, Ankara", 32200, n("1karma/17demircioglu-plaza", 1), None, ""),
    ("can-bakkal-tower", "Can Bakkal Tower", ["karma-kullanim"], "Konut, Ticaret", "Canbakkal İnşaat", "", 2014, "Trabzon", 45000, n("1karma/19can-bakkal-tower", 1), None, ""),
    ("keyvan", "Keyvan", ["karma-kullanim"], "", "", "", None, "", None, n("1karma/keyvan", 8), None, "Eski sitede proje bilgisi yoktu."),
    ("osman-tan-konya-yolu", "Osman Tan Konya Yolu", ["karma-kullanim"], "", "Çankaya Belediyesi", "", 2016, "Çankaya, Ankara", 150000, n("1karma/osman-tan-konya-yolu", 2), None, ""),
    ("cevre-ve-sehircilik-bakanligi", "Çevre ve Şehircilik Bakanlığı", ["kurum-binalari"], "Kamu binası", "", "", None, "Ankara", 150000, n("2kurum/1cevre-sehircilik", 1), 1, ""),
    ("kahramanmaras-belediyesi", "Kahramanmaraş Belediyesi", ["kurum-binalari"], "Belediye hizmet binası", "", "", None, "Kahramanmaraş", None, n("2kurum/2kahramanmaras-belediyesi", 1), None, ""),
    ("polatli-devlet-hastanesi", "Polatlı 300 Yataklı Devlet Hastanesi", ["saglik"], "Hastane", "", "", 2014, "Polatlı, Ankara", 55000, n("3hastane/1polatlı", 2), None, ""),
    ("afyon-sandikli-huzurevi", "Afyon Sandıklı Huzurevi", ["saglik"], "Huzurevi", "", "", None, "Sandıklı, Afyonkarahisar", None, n("3hastane/2afyon-sandikli-huzur-evi", 4, skip=(3,)), None, ""),
    ("birecik-devlet-hastanesi", "Birecik 120 Yataklı Devlet Hastanesi", ["saglik"], "Hastane", "", "", None, "Birecik, Şanlıurfa", None, n("3hastane/3birecik-120-ydh", 3), None, ""),
    ("bolu-ftr-hastanesi", "Bolu 100 Yataklı FTR Hastanesi", ["saglik"], "Fizik tedavi ve rehabilitasyon hastanesi", "", "", None, "Bolu", None, n("3hastane/4bolu-ftr-100", 4), None, ""),
    ("ceylanpinar-devlet-hastanesi", "Ceylanpınar 75 Yataklı Devlet Hastanesi", ["saglik"], "Hastane", "", "", None, "Ceylanpınar, Şanlıurfa", None, n("3hastane/5ceylanpinari-75-ydh", 19), None, ""),
    ("cankiri-hastanesi", "Çankırı 100 Yataklı Devlet Hastanesi", ["saglik"], "Hastane", "", "", None, "Çankırı", None, n("3hastane/6cankiri-100-hastane", 5), None, ""),
    ("gumushane-devlet-hastanesi", "Gümüşhane 200 Yataklı Devlet Hastanesi", ["saglik"], "Hastane", "", "", None, "Gümüşhane", None, n("3hastane/7gumushane-200-ydh", 7), None, "Eski sitede kartı vardı, penceresi eksikti."),
    ("kocaeli-hastanesi", "Kocaeli Hastanesi", ["saglik"], "Hastane", "", "", None, "Kocaeli", None, n("3hastane/9kocaeli-hastane", 8, "png"), None, ""),
    ("pursaklar-devlet-hastanesi", "Pursaklar 150 Yataklı Devlet Hastanesi", ["saglik"], "Hastane", "", "", None, "Pursaklar, Ankara", None, n("3hastane/10pursaklar-150-ydh", 8), None, ""),
    ("koru-hastanesi", "Koru Hastanesi", ["saglik"], "Hastane", "", "", None, "", None, n("3hastane/koru", 1), None, ""),
    ("balikesir-devlet-hastanesi", "Balıkesir 400 Yataklı Devlet Hastanesi", ["saglik"], "Hastane", "", "Musab Kesgin Mimarlık", 2020, "Balıkesir", 80000, n("3hastane/balikesir400", 1, "jpeg"), None, ""),
    ("batman-devlet-hastanesi", "Batman 500 Yataklı Devlet Hastanesi", ["saglik"], "Hastane", "", "Ekip", 2021, "Batman", 100000, n("3hastane/batman500", 1, "jpeg"), None, ""),
    ("bursa-uludag-devlet-hastanesi", "Bursa Uludağ 200 Yataklı Devlet Hastanesi", ["saglik"], "Hastane", "", "Mimakman Mimarlık", 2021, "Bursa", 59146, n("3hastane/bursa200", 1, "jpeg"), None, ""),
    ("manisa-salihli-devlet-hastanesi", "Manisa Salihli 300 Yataklı Devlet Hastanesi", ["saglik"], "Hastane", "", "Mimakman Mimarlık", 2021, "Salihli, Manisa", 78000, n("3hastane/manisa300", 1, "jpeg"), None, ""),
    ("sheraton-batum", "Sheraton Batum Oteli", ["otel", "yurt-disi"], "Otel", "", "", None, "Batum, Gürcistan", None, n("4otel/1sheraton-otel-batum", 3), None, ""),
    ("tvf-alanya-otel", "Voleybol Federasyonu Alanya Oteli", ["otel"], "5 yıldızlı otel", "Türkiye Voleybol Federasyonu", "", None, "Alanya, Antalya", 30000, n("4otel/2voleybol-federasyonu-alanya-otel", 2), None, ""),
    ("yozgat-otel-kaplica", "Yozgat Dedeman Otel ve Kaplıca", ["otel"], "5 yıldızlı otel", "", "", None, "Yozgat", 60000, n("4otel/3yozgat-otel-kaplica", 2), None, ""),
    ("resort-zigana-alacati", "Resort Zigana Alaçatı", ["otel"], "Otel", "Tek-Art", "", 2017, "Alaçatı, İzmir", 500000, n("4otel/4resort-zigana", 1), None, ""),
    ("platin-beytepe-konutlari", "Platin Beytepe Konutları", ["konut"], "Konut", "Toker Mesken A.Ş.", "", 2013, "Çankaya, Ankara", 23200, n("5konut/1beytepe", 1) + n("6ofis/6platin-beytepe-konutlari", 1), None, "Eski sitede Konutlar ve Ofis Binaları altında iki ayrı kart; birleştirildi."),
    ("enpark-tower", "Enpark Tower", ["konut"], "Konut, Ticaret", "Enpark Grup", "", 2011, "Çukurambar, Ankara", None, n("5konut/2enpark", 1), None, "Eski sitede yıl \"2+011\" yazıyordu; 2011 kabul edildi."),
    ("gozum-plaza", "Gözüm Plaza", ["konut"], "", "", "", None, "", None, n("5konut/3gozumplaza", 1), None, ""),
    ("yasamkent-bordo", "Yaşamkent Bordo", ["konut"], "Konut", "", "ZK Mimarlık", 2022, "Yaşamkent, Ankara", 34447, n("5konut/4yasamkentbordo", 1, "jpeg"), None, ""),
    ("saraycik-5-etap", "Saraycık 5. Etap", ["konut"], "Konut", "", "ZK Mimarlık", 2022, "", 34447, n("5konut/5saraycik", 1, "jpeg"), None, "Alan Yaşamkent Bordo ile aynı yazılmıştı; kontrol edilmeli."),
    ("saraycik-6-etap", "Saraycık 6. Etap", ["konut"], "Konut", "", "", None, "", None, n("5konut/6saraycik", 1, "jpeg"), None, "Eski sitede proje bilgisi yoktu."),
    ("gokcek", "Gökçek", ["konut"], "Konut", "", "ZK Mimarlık", 2022, "", None, n("5konut/7gokcek", 1, "jpeg"), None, ""),
    ("kahramankazan", "Kahramankazan", ["konut"], "Konut, Otel", "", "ZK Mimarlık", 2023, "Kahramankazan, Ankara", 36665, n("5konut/8kazan", 1, "jpeg"), None, ""),
    ("lazzoni", "Lazzoni", ["konut"], "Konut", "", "ZK Mimarlık", 2022, "", 42140, n("5konut/9lazzoni", 1, "jpeg"), None, ""),
    ("natura-cakirlar", "Natura Çakırlar", ["konut"], "Konut", "", "ZK Mimarlık", 2022, "Ankara", None, n("5konut/10naturacakirlar", 1, "jpeg"), None, ""),
    ("natura-incek", "Natura İncek", ["konut"], "Konut", "", "ZK Mimarlık", 2022, "İncek, Ankara", 57665, n("5konut/11naturaincek", 1, "jpeg"), None, ""),
    ("nep-ofis", "Nep Ofis", ["ofis"], "Ofis, Rezidans, Ticaret", "Özil İnşaat", "", 2014, "Mustafa Kemal, Ankara", 32000, n("6ofis/1nep-ofis", 1), None, ""),
    ("mevlut-topbas-plaza", "Mevlüt Topbaş Plaza", ["ofis"], "Ofis, Ticaret", "Mevlüt Topbaş", "", 2014, "Konya Yolu, Ankara", 45000, n("6ofis/2mevlut-topbas-plaza", 1), None, ""),
    ("osman-tan-is-merkezi", "Osman Tan İş Merkezi", ["ofis"], "Ofis, Ticaret", "Osman Tan", "", 2013, "Balgat, Ankara", 19800, n("6ofis/3osman-tan-is-merkezi", 1), None, ""),
    ("sahin-koc-sogutozu", "Şahin Koç Söğütözü", ["ofis"], "Ofis", "Fatih Koç İnşaat", "", 2013, "Söğütözü, Ankara", 20000, n("6ofis/4sahin-koc-sogutozu", 1), None, ""),
    ("toyota-efe", "Toyota Efe", ["ofis"], "Ticaret", "Anka", "", 2013, "Eskişehir Yolu, Ankara", 25000, n("6ofis/5toyota-efe", 1), None, ""),
    ("uzelli-tower", "Uzelli Tower", ["ofis"], "Konut, AVM, Ofis", "Recep Uzelli", "", 2015, "Çayyolu, Ankara", None, n("6ofis/7uzelli-tower", 1, "png"), None, "Eski sitede bilgileri Santra ile aynıydı (250.000 m²); alan boş bırakıldı."),
    ("tekart-media-center", "Tekart Media Center", ["ofis"], "", "Tek-Art", "", None, "", None, n("6ofis/8tekart-media-center", 2), None, ""),
    ("ulusoy-plaza", "Ulusoy Plaza", ["ofis"], "", "", "", None, "", None, n("6ofis/9ulusoy-plaza", 1), None, ""),
    ("kervansaray", "Kervansaray", ["ofis"], "Ofis", "Hasançatkaya Constructions", "", 2023, "", 140000, n("6ofis/kervansaray", 1, "jpeg"), None, ""),
    ("uzka-cayyolu", "Uzka Çayyolu", ["ofis"], "", "", "", None, "Çayyolu, Ankara", None, n("6ofis/uzka", 1), None, ""),
    ("ziya-kahraman-cukurambar", "Ziya Kahraman Çukurambar", ["ofis"], "", "", "", None, "Çukurambar, Ankara", None, n("6ofis/ziyakahraman", 1), None, ""),
    ("bayburt-24-derslikli-lise", "Bayburt 24 Derslikli Lise", ["egitim"], "Lise", "", "", None, "Bayburt", None, n("7egitim/1bayburt-24-derslik-lise", 1), None, ""),
    ("bayburt-300-yatakli-yurt", "Bayburt 300 Yataklı Yurt", ["egitim"], "Öğrenci yurdu", "", "", None, "Bayburt", None, n("7egitim/2bayburt-300-yatak-yurt", 1), None, ""),
    ("bayburt-ilkogretim-okulu", "Bayburt 2. Bölge 350 Konut ve 24 Derslikli İlköğretim Okulu", ["egitim"], "İlköğretim okulu, konut", "", "", None, "Bayburt", None, n("7egitim/3bayburt-ilkogretim-okulu", 1), None, ""),
    ("denizli-300-yatakli-yurt", "Denizli 300 Yataklı Yurt", ["egitim"], "Öğrenci yurdu", "", "", None, "Denizli", None, n("7egitim/4denizli-300-yatak-yurt", 7), None, "Eski sitede Karma Kullanım altında da (3 görselle) vardı; tek proje yapıldı."),
    ("kutahya-1000-kisilik-yurt", "Kütahya 1000 Kişilik Yurt", ["egitim"], "Öğrenci yurdu", "", "", None, "Kütahya", 20000, n("7egitim/5kutahya-1000-kisi-yurt", 1), None, ""),
    ("ugur-okullari-batikent", "Uğur Okulları Batıkent", ["egitim"], "Okul", "", "", None, "Batıkent, Ankara", None, n("7egitim/6ugur-okullari-batikent", 7), None, ""),
    ("artek-avm", "Artek AVM", ["avm"], "Alışveriş merkezi", "", "", None, "", None, n("8avm/1artek-avm", 11), None, ""),
    ("galleria", "Galleria", ["avm"], "Ofis, AVM", "Bezci İnşaat", "", 2015, "Ümitköy, Ankara", 30000, n("8avm/2galleria", 1), None, ""),
    ("kocalar", "Kocalar", ["avm"], "", "", "", None, "", None, n("8avm/3kocalar", 1, "jpeg"), None, ""),
    ("tanik", "Tanık", ["avm"], "", "", "", None, "", None, n("8avm/4tanik", 1, "jpeg"), None, ""),
    ("afyon-muze", "Afyon Müze", ["sosyal"], "Müze", "", "", None, "Afyonkarahisar", None, n("9sosyal/1afyon-muze", 3), None, ""),
    ("cer-muze", "Cer Müze", ["sosyal"], "Müze", "", "", None, "", None, imgs("9sosyal/2cer-muze", ["1.JPG"]), None, ""),
    ("diyarbakir-dini-ihtisas-merkezi", "Diyarbakır Dini İhtisas Merkezi", ["sosyal"], "Eğitim ve konaklama", "", "", None, "Diyarbakır", None, n("9sosyal/3diyarbakir-dini-ihtisas-merkezi", 5), None, ""),
    ("yenimahalle-kultur-merkezi", "Yenimahalle Kültür Merkezi", ["sosyal"], "Kültür merkezi", "", "", None, "Yenimahalle, Ankara", None, n("9sosyal/4yenimahalle-kultur-merkezi", 1), None, ""),
    ("adapazari-terminal", "Adapazarı Terminal", ["sanayi"], "Otogar", "", "", None, "Adapazarı, Sakarya", None, n("10sanayi/1adapazari-terminal", 4), None, ""),
    ("elektroland-fabrika", "Elektroland Fabrika", ["sanayi"], "Fabrika", "", "", None, "", None, n("10sanayi/2elektroland-fabrika", 1), None, ""),
    ("ceceli-fabrika", "Ceceli Fabrika", ["sanayi"], "İmalathane", "", "ZK Mimarlık", 2021, "", 6463, n("10sanayi/3ceceli", 1, "jpeg"), None, ""),
    ("burhan-felek-spor-salonu", "Burhan Felek Spor Salonu", ["spor"], "Spor salonu", "", "", None, "İstanbul", None, n("11spor/1burhan-felek-spor-salonu", 1), None, ""),
    ("malta-city-center", "Malta City Center", ["yurt-disi", "karma-kullanim"], "Konut, AVM, Otel", "", "", 2021, "Malta", 150000, imgs("12yurtdisi/malta", ["1.2.jpg", "1.jpeg"]), 4, ""),
    ("tiflis-rehabilitasyon-merkezi", "Tiflis Rehabilitasyon Merkezi", ["yurt-disi", "saglik"], "Rehabilitasyon merkezi", "", "", None, "Tiflis, Gürcistan", None, n("12yurtdisi/tiflis-rehab", 2), None, ""),
]

SETTINGS = {
    "companyName": "İdealist Mühendislik",
    "legalName": "İdealist Mühendislik Mimarlık Müşavirlik İnşaat Turizm Sanayi ve Ticaret Limited Şirketi",
    "phone": "+90 (312) 905 55 66",
    "phone2": "+90 (312) 905 55 77",
    "fax": "+90 (312) 284 08 09",
    "email": "info@idealistmuhendislik.com.tr",
    "address": "JW Marriott, Kızılırmak Mah. No: 1/34 Çankaya, Ankara, Türkiye",
    "mapUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3060.414156021176!2d32.80263996014839!3d39.909747035912005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14d34f0b7837e21b%3A0x3e999624378542bb!2zxLBERUFMxLBTVCBNw5xIRU5ExLBTTMSwSy5Nw5zFni4gVMSwQy4gxZ5UxLA!5e0!3m2!1sen!2str!4v1681557967816!5m2!1sen!2str",
    "tagline": "Kaliteli, modern ve güvenli projeler",
    "heroTitle": "Mekanik tesisat tasarımı ve müşavirlikte 20 yılı aşkın deneyim",
    "heroText": "2004'ten beri hastaneden konuta, ofisten yurt dışı projelerine; ulusal ve uluslararası standartlara uygun, sürdürülebilir mekanik tesisat çözümleri üretiyoruz.",
    "aboutSummary": "Mekanik Tesisat Tasarım ve Müşavirlik konularında hizmet veren İdealist Mühendislik, yurt içi ve yurt dışı büyük projelerde edindiği deneyimler ve oluşturduğu seçkin, yetenekli ve tecrübeli kadrosu ile ulusal ve uluslararası standartlara uygun, çeşitli ve fonksiyonel çözümler üretirken, aynı zamanda çevresel ve sürdürülebilirlik (yeşil bina) kavramlarını ön planda tutmakta ve yenilikçi teknolojileri projelerinde optimum düzeyde uygulayarak, sağlıklı yarınların yaratılmasına yardımcı olmaya devam etmektedir.",
    "foundedYear": 2004,
    "footerText": "Mekanik tesisat tasarım ve müşavirlik. Ankara.",
    "seoDescription": "İdealist Mühendislik: 2004'ten beri hastane, konut, ofis, AVM, otel ve yurt dışı projelerinde mekanik tesisat tasarım ve müşavirlik. Ankara.",
}

ABOUT_TR = """<p>Mekanik Tesisat Tasarım ve Müşavirlik konularında hizmet veren İdealist Mühendislik, yurt içi ve yurt dışı büyük projelerde edindiği deneyimler ve oluşturduğu seçkin, yetenekli ve tecrübeli kadrosu ile ulusal ve uluslararası standartlara uygun, çeşitli ve fonksiyonel çözümler üretirken, aynı zamanda çevresel ve sürdürülebilirlik (yeşil bina) kavramlarını ön planda tutmakta ve yenilikçi teknolojileri projelerinde optimum düzeyde uygulayarak, sağlıklı yarınların yaratılmasına yardımcı olmaya devam etmektedir.</p>
<h2>Kuruluş</h2>
<p>Proje ve İnşaat sektörüne 2001 yılında mekanik tesisat projeleri ile giriş yapan Genel Müdürümüz Mikail Sandıkcı ve Yüksek Makine Mühendisi Gökhan Aytaç Sandıkcı, sahip olduğu mesleki bilgi birikimi ve tecrübesiyle 2004 yılında İdealist Mühendislik Mimarlık Müşavirlik İnşaat Turizm Sanayi ve Ticaret Limited Şirketini kurmuştur.</p>
<h2>Misyon</h2>
<p>Kurulduğu tarihten itibaren üstlendiği çeşitli inşaatların mekanik tesisat projelerini zamanında ve üstün kalite anlayışıyla tamamlayan İdealist Mühendislik, dinamik ve profesyonel kadrosuyla, güvenilir ve dürüst hizmet verme felsefesiyle koyduğu hedefleri ve üstlendiği projeleri gerçekleştirmek için var gücüyle çalışmaktadır.</p>
<p>İdealist Mühendislik üstlendiği bütün projelerde müşteri memnuniyetini ve kalite anlayışını ön planda tutarak, müşterileri ile sağlam temellere dayalı uzun ve köklü ilişkiler kurmayı amaçlamaktadır. Yurt içinde ve yurt dışı altyapı ve üstyapı projeleriyle sektörde daha güçlü ve sağlam bir yere sahip olmak için yoluna emin adımlarla devam etmektedir.</p>
<p>Birlikte çalışmak umuduyla.</p>"""

ABOUT_EN = """<p>Idealist Engineering, which provides services in Mechanical Installation Design and Consultancy, produces various and functional solutions in accordance with national and international standards, with its experience gained in large domestic and international projects and its distinguished, talented and experienced staff. Idealist Engineering prioritizes environmental and sustainability (green building) concepts and continues to help create healthy tomorrows by applying innovative technologies in its projects at the optimum level.</p>
<h2>Establishment</h2>
<p>With over 20 years of professional knowledge and experience in mechanical installation projects, our General Manager Mikail Sandıkcı and Master Mechanical Engineer Gökhan Aytaç Sandıkcı established Idealist Engineering Architecture Consulting Construction Tourism Industry and Trade Limited Company in 2004.</p>
<h2>Mission</h2>
<p>Since its establishment, Idealist Engineering has completed the mechanical installation projects of various constructions on time and with superior quality. With its dynamic and professional staff and its philosophy of providing reliable and honest service, Idealist Engineering works with all its strength to realize the targets set and the projects it has undertaken.</p>
<p>Idealist Engineering aims to establish long and deep-rooted relationships with its customers based on solid foundations by prioritizing customer satisfaction and quality in all the projects it undertakes. With its domestic and international infrastructure and superstructure projects, Idealist Engineering continues on its way to have a stronger and more solid place in the sector.</p>"""

SERVICES = [
    ("Mekanik ve Elektrik Mühendisliği", "Mechanical and Electrical Engineering", "mep",
     "Isıtma, soğutma, havalandırma, sıhhi tesisat ve yangın tesisatı başta olmak üzere bina mekanik sistemlerinin tasarımı; elektrik projeleriyle koordinasyon."),
    ("Yapısal ve İnşaat Mühendisliği", "Structural and Civil Engineering", "structure",
     "Projenin yapısal ve inşaat disiplinleriyle eş güdüm içinde, uygulanabilir ve standartlara uygun mühendislik çözümleri."),
    ("Mimari ve Tasarım", "Architecture and Design", "design",
     "Mimari ekiplerle birlikte çalışarak tesisat çözümlerini tasarımın ilk aşamasından itibaren projeye entegre etme."),
    ("Proje Yönetimi", "Project Management", "management",
     "Tasarımdan uygulamaya proje süreçlerinin planlanması, müşavirlik ve kontrolörlük hizmetleri."),
]

def to_webp(rel, name):
    src = SRC / rel
    im = Image.open(src)
    im = im.convert("RGB")
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    im.save(MEDIA / name, "WEBP", quality=80, method=6)
    return name

def main():
    MEDIA.mkdir(parents=True, exist_ok=True)
    projects = []
    for slug, name, areas, usage, client, architect, year, location, m2, paths, featured, note in PROJECTS:
        files = [to_webp(p, f"{slug}-{i + 1}.webp") for i, p in enumerate(paths)]
        projects.append({
            "slug": slug, "name": name, "areas": areas, "usage": usage, "client": client, "architect": architect,
            "year": year or 0, "location": location, "areaM2": m2 or 0, "images": files,
            "featured": featured or 0, "summary": "", "note": note,
        })
    hero = to_webp("img/proje/12yurtdisi/malta/1.2.jpg", "hero.webp")
    content = {
        "settings": {**SETTINGS, "heroImage": hero},
        "pages": {
            "about": {"title": "Hakkımızda", "body": ABOUT_TR},
            "en": {"title": "Idealist Engineering", "body": ABOUT_EN},
        },
        "services": [{"title": t, "titleEn": te, "icon": ic, "summary": s} for t, te, ic, s in SERVICES],
        "areas": [{"slug": s, "title": t, "titleEn": te, "icon": ic} for s, t, te, ic in AREAS],
        "projects": projects,
    }
    OUT.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(projects)} proje, {sum(len(p['images']) for p in projects)} görsel")

if __name__ == "__main__":
    main()
