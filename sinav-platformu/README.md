Sınav Platformu 🎓📝
Bu proje, öğretmenlerin soru bankaları oluşturmasına, sınavlar hazırlamasına ve öğrencilerin bu sınavlara katılarak sonuçlarını görüntülemesine olanak tanıyan basit bir öğretmen-öğrenci sınav platformudur. React ve Firebase kullanılarak geliştirilmiştir.

Özellikler ✨
Öğretmenler İçin 🧑‍🏫
Soru Bankası Yönetimi: 📚 Çoktan seçmeli soruları ekleme, düzenleme ve silme.

Sınav Oluşturma: ✍️ Soru bankasından sorular seçerek yeni sınavlar hazırlama.

Sınav Takibi: 📊 Oluşturulan sınavları listeleme ve yönetme.

Sınav Sonuçları: 🏆 Öğrencilerin sınav sonuçlarını ve konu bazlı performanslarını görüntüleme.

Öğrenciler İçin 🧑‍🎓
Sınava Katılma: 🚀 Öğretmen tarafından verilen sınav kodu ile sınavlara katılma.

Cevaplama: ✅ Soruları yanıtlama ve süreyi takip etme.

Sonuçları Görüntüleme: 📈 Tamamlanan sınavların puanlarını ve detaylı cevap analizlerini görme.

Kurulum 🛠️
Yerel Kurulum 💻
Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

Depoyu Klonlayın: ⬇️

git clone [depo-url'niz]
cd [depo-adınız]

Bağımlılıkları Yükleyin: 📦

npm install
# veya
yarn install

Gerekli temel paketler: firebase, react, react-dom, lucide-react.

Uygulamayı Çalıştırın: ▶️

npm start
# veya
yarn start

Uygulama http://localhost:3000 adresinde açılacaktır.

Firebase Kurulumu ve Güvenlik Kuralları 🔥🔒
Bu uygulama Firebase Firestore veritabanını kullanır. Çalışması için bir Firebase projesi kurmanız gerekmektedir.

Firebase Projesi Oluşturma: ✨

Firebase Console'a gidin.

Yeni bir proje oluşturun veya mevcut bir projeyi seçin.

Projeniz içinde Firestore Database'i etkinleştirin. "Test modunda başlat" seçeneğini seçebilirsiniz, ancak güvenlik kurallarını aşağıda belirtildiği gibi ayarlamanız önemlidir.

Firebase Yapılandırması (__firebase_config ve __app_id): ⚙️
Bu uygulama, Canvas ortamında otomatik olarak sağlanan global değişkenler __firebase_config ve __app_id'yi kullanır. Kodu doğrudan yerel bir React uygulamasına taşıyorsanız, bu değişkenleri kendi Firebase proje yapılandırma bilgilerinizle değiştirmeniz gerekecektir.

Örnek olarak, src/App.js dosyasında veya Firebase'i başlattığınız yerde şu şekilde tanımlayabilirsiniz:

// Bu kod parçacığı normalde Canvas ortamında otomatik olarak sağlanır.
// Eğer yerel ortamda çalıştırıyorsanız kendi Firebase config'inizi buraya yapıştırmanız gerekecektir.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// appId için bu şekilde bir değişken tanımlamanız gerekebilir
const appId = "YOUR_APP_ID"; // Firebase config'inizdeki appId ile aynı olmalı

Firestore Güvenlik Kuralları: 🔒
Uygulamanın doğru şekilde çalışması ve veri güvenliğini sağlamak için Firestore güvenlik kurallarınızı aşağıdaki gibi ayarlayın. Bu kurallar, öğretmenlerin kendi verilerine (sorular, sınavlar) özel erişimini, öğrencilerin ise sınav cevapları gibi herkese açık verilere erişimini yönetir.

Firebase Console > Firestore Database > Rules bölümüne gidin ve aşağıdaki kuralları yapıştırın:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Öğretmenlerin kendi soru ve sınavları için özel veri erişimi
    // userId, kimliği doğrulanmış kullanıcının UID'si olmalıdır.
    match /artifacts/{appId}/users/{userId}/{collection=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Genel sınavların ve öğrenci cevaplarının herkese açık erişimi
    // Bu veriler, tüm kimliği doğrulanmış kullanıcılar (öğretmenler ve öğrenciler) tarafından okunabilir ve yazılabilir.
    match /artifacts/{appId}/public/data/{collection=**} {
      allow read, write: if request.auth != null;
    }
  }
}

Bu kuralları Firebase projenize dağıtmayı unutmayın.

Kullanım 🚀💡
Uygulamayı başlattıktan sonra, ana ekranda Öğretmen Girişi veya Öğrenci Girişi seçeneklerini göreceksiniz.

Öğretmen Olarak 👨‍🏫
Öğretmen Girişi'ni seçin.

Soru bankasına yeni sorular ekleyebilir, mevcut soruları düzenleyebilir veya silebilirsiniz.

"Yeni Sınav Oluştur" sayfasında, sorularınızı seçerek ve sınav adı, süresi, başlangıç/bitiş zamanı belirleyerek yeni sınavlar hazırlayabilirsiniz.

Sınavlar listesi sayfasında oluşturduğunuz sınavları görebilir ve her sınav için öğrencilerin cevaplarını ve performanslarını takip edebilirsiniz.

Öğrenci Olarak 👩‍🎓
Öğrenci Girişi'ni seçin.

Adınızı girmeniz istenecektir. Bu, sınav sonuçlarınızın öğretmeniniz tarafından doğru şekilde ilişkilendirilmesi için önemlidir.

Öğretmeninizden aldığınız Sınav Kodunu girerek sınava katılabilirsiniz.

Sınavı tamamladıktan sonra puanınızı ve detaylı cevap analizlerinizi görebilirsiniz.

Katkıda Bulunma 🤝
Geliştirmeye katkıda bulunmak isterseniz, lütfen depoyu fork'layın, değişikliklerinizi yapın ve bir Pull Request (Çekme İsteği) gönderin.

Bu README dosyası, projenizi GitHub'da daha anlaşılır ve yönetilebilir hale getirecektir.
