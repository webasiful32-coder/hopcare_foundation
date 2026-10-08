import { BloodGroup, Campaign, BloodDonor, BloodRequest, Beneficiary, BlogPost, GalleryItem, Volunteer } from '../types';

export const BANGLADESH_DIVISIONS: Record<string, string[]> = {
  Dhaka: [
    'Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur', 
    'Manikganj', 'Munshiganj', 'Narsingdi', 'Kishoreganj', 
    'Gopalganj', 'Madaripur', 'Rajbari', 'Shariatpur'
  ],
  Chattogram: [
    'Chattogram', "Cox's Bazar", 'Cumilla', 'Feni', 'Brahmanbaria', 
    'Chandpur', 'Lakshmipur', 'Noakhali', 'Khagrachhari', 'Rangamati', 'Bandarban'
  ],
  Rajshahi: [
    'Rajshahi', 'Bogura', 'Joypurhat', 'Naogaon', 'Natore', 
    'Chapai Nawabganj', 'Pabna', 'Sirajganj'
  ],
  Khulna: [
    'Khulna', 'Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 
    'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'
  ],
  Barishal: [
    'Barishal', 'Barguna', 'Bhola', 'Jhalokathi', 'Patuakhali', 'Pirojpur'
  ],
  Sylhet: [
    'Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'
  ],
  Rangpur: [
    'Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Nilphamari', 
    'Thakurgaon', 'Lalmonirhat', 'Panchagarh'
  ],
  Mymensingh: [
    'Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'
  ],
};

export const DIVISION_NAMES_BN: Record<string, string> = {
  Dhaka: 'ঢাকা',
  Chattogram: 'চট্টগ্রাম',
  Rajshahi: 'রাজশাহী',
  Khulna: 'খুলনা',
  Barishal: 'বরিশাল',
  Sylhet: 'সিলেট',
  Rangpur: 'রংপুর',
  Mymensingh: 'ময়মনসিংহ',
};

export const DISTRICT_NAMES_BN: Record<string, string> = {
  Dhaka: 'ঢাকা',
  Gazipur: 'গাজীপুর',
  Narayanganj: 'নারায়ণগঞ্জ',
  Tangail: 'টাঙ্গাইল',
  Faridpur: 'ফরিদপুর',
  Manikganj: 'মানিকগঞ্জ',
  Munshiganj: 'মুন্সীগঞ্জ',
  Narsingdi: 'নরসিংদী',
  Kishoreganj: 'কিশোরগঞ্জ',
  Gopalganj: 'গোপালগঞ্জ',
  Madaripur: 'মাদারীপুর',
  Rajbari: 'রাজবাড়ী',
  Shariatpur: 'শরীয়তপুর',
  Chattogram: 'চট্টগ্রাম',
  "Cox's Bazar": 'কক্সবাজার',
  Cumilla: 'কুমিল্লা',
  Feni: 'ফেনী',
  Brahmanbaria: 'ব্রাহ্মণবাড়িয়া',
  Chandpur: 'চাঁদপুর',
  Lakshmipur: 'লক্ষ্মীপুর',
  Noakhali: 'নোয়াখালী',
  Khagrachhari: 'খাগড়াছড়ি',
  Rangamati: 'রাঙ্গামাটি',
  Bandarban: 'বান্দরবান',
  Rajshahi: 'রাজশাহী',
  Bogura: 'বগুড়া',
  Joypurhat: 'জয়পুরহাট',
  Naogaon: 'নওগাঁ',
  Natore: 'নাটোর',
  'Chapai Nawabganj': 'চাঁপাইনবাবগঞ্জ',
  Pabna: 'পাবনা',
  Sirajganj: 'সিরাজগঞ্জ',
  Khulna: 'খুলনা',
  Bagerhat: 'বাগেরহাট',
  Chuadanga: 'চুয়াডাঙ্গা',
  Jashore: 'যশোর',
  Jhenaidah: 'ঝিনাইদহ',
  Kushtia: 'কুষ্টিয়া',
  Magura: 'মাগুরা',
  Meherpur: 'মেহেরপুর',
  Narail: 'নড়াইল',
  Satkhira: 'সাতক্ষীরা',
  Barishal: 'বরিশাল',
  Barguna: 'বরগুনা',
  Bhola: 'ভোলা',
  Jhalokathi: 'ঝালকাঠি',
  Patuakhali: 'পটুয়াখালী',
  Pirojpur: 'পিরোজপুর',
  Sylhet: 'সিলেট',
  Habiganj: 'হবিগঞ্জ',
  Moulvibazar: 'মৌলভীবাজার',
  Sunamganj: 'সুনামগঞ্জ',
  Rangpur: 'রংপুর',
  Dinajpur: 'দিনাজপুর',
  Gaibandha: 'গাইবান্ধা',
  Kurigram: 'কুড়িগ্রাম',
  Lalmonirhat: 'লালমনিরহাট',
  Nilphamari: 'নীলফামারী',
  Panchagarh: 'পঞ্চগড়',
  Thakurgaon: 'ঠাকুরগাঁও',
  Mymensingh: 'ময়মনসিংহ',
  Jamalpur: 'জামালপুর',
  Netrokona: 'নেত্রকোণা',
  Sherpur: 'শেরপুর'
};

export const DISTRICT_UPAZILAS: Record<string, string[]> = {
  // Dhaka Division (13 Districts)
  Dhaka: ['Dhanmondi', 'Mirpur', 'Uttara', 'Gulshan', 'Mohakhali', 'Mohammadpur', 'Savar', 'Keraniganj', 'Tejgaon', 'Badda', 'Motijheel', 'Old Dhaka', 'Dhamrai', 'Nawabganj', 'Dohar'],
  Gazipur: ['Gazipur Sadar', 'Tongi', 'Kaliakair', 'Sreepur', 'Kapasia', 'Kaliganj'],
  Narayanganj: ['Narayanganj Sadar', 'Bandar', 'Fatullah', 'Siddhirganj', 'Sonargaon', 'Rupganj', 'Araihazar'],
  Tangail: ['Tangail Sadar', 'Mirzapur', 'Madhupur', 'Ghatail', 'Gopalpur', 'Sakhipur', 'Kalihati', 'Basail', 'Delduar', 'Nagarpur', 'Bhuapur', 'Dhanbari'],
  Faridpur: ['Faridpur Sadar', 'Boalmari', 'Alfadanga', 'Madhukhali', 'Bhanga', 'Nagarkanda', 'Charbhadrasan', 'Sadarpur', 'Saltha'],
  Manikganj: ['Manikganj Sadar', 'Singair', 'Saturia', 'Shivalaya', 'Harirampur', 'Ghior', 'Daulatpur'],
  Munshiganj: ['Munshiganj Sadar', 'Sreenagar', 'Sirajdikhan', 'Tongibari', 'Louhajang', 'Gazaria'],
  Narsingdi: ['Narsingdi Sadar', 'Raipura', 'Shibpur', 'Belabo', 'Monohardi', 'Palash'],
  Kishoreganj: ['Kishoreganj Sadar', 'Bhairab', 'Bajitpur', 'Katiadi', 'Kuliarchar', 'Pakundia', 'Karimganj', 'Tarail', 'Hossainpur', 'Itna', 'Mithamain', 'Austagram', 'Nikli'],
  Gopalganj: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
  Madaripur: ['Madaripur Sadar', 'Shibchar', 'Kalkini', 'Rajoir', 'Dasar'],
  Rajbari: ['Rajbari Sadar', 'Goalanda', 'Pangsha', 'Baliakandi', 'Kalukhali'],
  Shariatpur: ['Shariatpur Sadar', 'Damudya', 'Naria', 'Janjira', 'Bhedarganj', 'Gosairhat'],

  // Chattogram Division (11 Districts)
  Chattogram: ['Panchlaish', 'Kotwali', 'Halishahar', 'Agrabad', 'Pahartali', 'Bakolia', 'Hathazari', 'Sitakunda', 'Patiya', 'Raozan', 'Fatikchhari', 'Boalkhali', 'Anwara', 'Chandanaish', 'Mirsharai', 'Satkania', 'Lohagara', 'Banshkhali', 'Karnafuli'],
  "Cox's Bazar": ['Coxs Bazar Sadar', 'Ramu', 'Teknaf', 'Ukhia', 'Chakaria', 'Pekua', 'Kutubdia', 'Maheshkhali', 'Eidgaon'],
  Cumilla: ['Cumilla Adarsha Sadar', 'Cumilla Sadar Dakshin', 'Daudkandi', 'Chandina', 'Debidwar', 'Laksam', 'Barura', 'Brahmanpara', 'Burichang', 'Homna', 'Meghna', 'Muradnagar', 'Nangalkot', 'Titas', 'Monohargonj', 'Lalmai'],
  Feni: ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Fulgazi', 'Sonagazi'],
  Brahmanbaria: ['Brahmanbaria Sadar', 'Ashuganj', 'Sarail', 'Nasirnagar', 'Nabinagar', 'Bancharampur', 'Kasba', 'Akhaura', 'Bijoynagar'],
  Chandpur: ['Chandpur Sadar', 'Hajiganj', 'Faridganj', 'Matlab Uttar', 'Matlab Dakshin', 'Shahrasti', 'Kachua', 'Haimchar'],
  Lakshmipur: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'],
  Noakhali: ['Noakhali Sadar (Sudharam)', 'Begumganj', 'Senbagh', 'Companiganj', 'Chatkhil', 'Hatiya', 'Subarnachar', 'Kabirhat', 'Sonaimuri'],
  Khagrachhari: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Mahalchhari', 'Matiranga', 'Manikchhari', 'Ramgarh', 'Guimara'],
  Rangamati: ['Rangamati Sadar', 'Kaptai', 'Kawkhali', 'Baghaichhari', 'Barkal', 'Langadu', 'Rajasthali', 'Belaichhari', 'Juraichhari', 'Naniarchar'],
  Bandarban: ['Bandarban Sadar', 'Ruma', 'Thanchi', 'Rowangchhari', 'Lama', 'Alikadam', 'Naikhongchhari'],

  // Rajshahi Division (8 Districts)
  Rajshahi: ['Boalia', 'Rajpara', 'Motihar', 'Shah Makhdum', 'Paba', 'Godagari', 'Bagmara', 'Tanore', 'Charghat', 'Durgapur', 'Puthia', 'Bagha', 'Mohanpur'],
  Bogura: ['Bogura Sadar', 'Sherpur', 'Shibganj', 'Sariakandi', 'Gabtali', 'Dhunat', 'Kahaloo', 'Nandigram', 'Shajahanpur', 'Adamdighi', 'Dupchanchia', 'Sonatala'],
  Joypurhat: ['Joypurhat Sadar', 'Panchbibi', 'Kalai', 'Khetlal', 'Akkelpur'],
  Naogaon: ['Naogaon Sadar', 'Mohadevpur', 'Manda', 'Badalgachhi', 'Patnitala', 'Dhamoirhat', 'Niamatpur', 'Sapahar', 'Porsha', 'Raninagar', 'Atrai'],
  Natore: ['Natore Sadar', 'Singra', 'Baraigram', 'Bagatipara', 'Gurudaspur', 'Lalpur', 'Naldanga'],
  'Chapai Nawabganj': ['Chapai Nawabganj Sadar', 'Shibganj', 'Gomastapur', 'Nachole', 'Bholahat'],
  Pabna: ['Pabna Sadar', 'Ishwardi', 'Sujanagar', 'Santhia', 'Bera', 'Chatmohar', 'Faridpur', 'Atgharia', 'Bhangura'],
  Sirajganj: ['Sirajganj Sadar', 'Ullapara', 'Shahjadpur', 'Belkuchi', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Tarash', 'Chauhali'],

  // Khulna Division (10 Districts)
  Khulna: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Rupsha', 'Dighalia', 'Phultala', 'Dumuria', 'Batiaghata', 'Dacope', 'Paikgachha', 'Koyra', 'Terokhada'],
  Bagerhat: ['Bagerhat Sadar', 'Mongla', 'Morrelganj', 'Kachua', 'Sharankhola', 'Rampal', 'Fakirhat', 'Mollahat', 'Chitalmari'],
  Chuadanga: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
  Jashore: ['Jashore Sadar', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Sharsha'],
  Jhenaidah: ['Jhenaidah Sadar', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa', 'Harinakunda'],
  Kushtia: ['Kushtia Sadar', 'Kumarkhali', 'Khoksa', 'Mirpur', 'Bheramara', 'Daulatpur'],
  Magura: ['Magura Sadar', 'Sreepur', 'Mohammadpur', 'Shalikha'],
  Meherpur: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'],
  Narail: ['Narail Sadar', 'Lohagara', 'Kalia'],
  Satkhira: ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],

  // Barishal Division (6 Districts)
  Barishal: ['Barishal Sadar', 'Bakerganj', 'Babuganj', 'Wazirpur', 'Banaripara', 'Gournadi', 'Agailjhara', 'Muladi', 'Hizla', 'Mehendiganj'],
  Barguna: ['Barguna Sadar', 'Amtali', 'Patharghata', 'Betagi', 'Bamna', 'Taltali'],
  Bhola: ['Bhola Sadar', 'Daulatkhan', 'Borhanuddin', 'Lalmohan', 'Char Fasson', 'Tazumuddin', 'Monpura'],
  Jhalokathi: ['Jhalokathi Sadar', 'Nalchity', 'Rajapur', 'Kathalia'],
  Patuakhali: ['Patuakhali Sadar', 'Bauphal', 'Galachipa', 'Dashmina', 'Kalapara', 'Mirzaganj', 'Dumki', 'Rangabali'],
  Pirojpur: ['Pirojpur Sadar', 'Bhandaria', 'Mathbaria', 'Kawkhali', 'Nazirpur', 'Nesarabad (Swarupkathi)', 'Indurkani'],

  // Sylhet Division (4 Districts)
  Sylhet: ['Sylhet Sadar', 'Beanibazar', 'Golapganj', 'Zakiganj', 'Osmani Nagar', 'Balaganj', 'Bishwanath', 'Fenchuganj', 'Companiganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'South Surma'],
  Habiganj: ['Habiganj Sadar', 'Nabiganj', 'Bahubal', 'Madhabpur', 'Chunarughat', 'Lakhai', 'Baniachong', 'Ajmiriganj', 'Sayestaganj'],
  Moulvibazar: ['Moulvibazar Sadar', 'Sreemangal', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Barlekha', 'Juri'],
  Sunamganj: ['Sunamganj Sadar', 'Chhatak', 'Jagannathpur', 'Derai', 'Dharampasha', 'Dowarabazar', 'Tahirpur', 'Jamalganj', 'Shantiganj', 'Bishwamvarpur', 'Madhyanagar'],

  // Rangpur Division (8 Districts)
  Rangpur: ['Rangpur Sadar', 'Pirgachha', 'Badarganj', 'Mithapukur', 'Kaunia', 'Gangachhara', 'Pirganj', 'Taraganj'],
  Dinajpur: ['Dinajpur Sadar', 'Birganj', 'Biral', 'Birol', 'Bochaganj', 'Chirirbandar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
  Gaibandha: ['Gaibandha Sadar', 'Gobindaganj', 'Sundarganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Phulchhari'],
  Kurigram: ['Kurigram Sadar', 'Nageshwari', 'Bhurungamari', 'Phulbari', 'Rajarhat', 'Ulipur', 'Chilmari', 'Rowmari', 'Char Rajibpur'],
  Lalmonirhat: ['Lalmonirhat Sadar', 'Aditmari', 'Kaliganj', 'Hatibandha', 'Patgram'],
  Nilphamari: ['Nilphamari Sadar', 'Saidpur', 'Domar', 'Dimla', 'Jaldhaka', 'Kishoreganj'],
  Panchagarh: ['Panchagarh Sadar', 'Boda', 'Debiganj', 'Atwari', 'Tetulia'],
  Thakurgaon: ['Thakurgaon Sadar', 'Pirganj', 'Ranisankail', 'Baliadangi', 'Haripur'],

  // Mymensingh Division (4 Districts)
  Mymensingh: ['Mymensingh Sadar', 'Muktagachha', 'Trishal', 'Bhaluka', 'Fulbaria', 'Gaffargaon', 'Gouripur', 'Ishwarganj', 'Haluaghat', 'Dhobaura', 'Nandail', 'Phulpur', 'Tara Khanda'],
  Jamalpur: ['Jamalpur Sadar', 'Melandaha', 'Islampur', 'Dewanganj', 'Sarishabari', 'Madarganj', 'Bakshiganj'],
  Netrokona: ['Netrokona Sadar', 'Kendua', 'Durgapur', 'Mohanganj', 'Purbadhala', 'Atpara', 'Barhatta', 'Kalmakanda', 'Madan', 'Khaliajuri'],
  Sherpur: ['Sherpur Sadar', 'Nalitabari', 'Nakla', 'Sreebardi', 'Jhenaigati'],
};

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const INITIAL_CAMPAIGNS: Campaign[] = [];
export const INITIAL_BLOOD_DONORS: BloodDonor[] = [];
export const INITIAL_BLOOD_REQUESTS: BloodRequest[] = [];
export const INITIAL_BENEFICIARIES: Beneficiary[] = [];
export const INITIAL_BLOG_POSTS: BlogPost[] = [];
export const INITIAL_GALLERY_ITEMS: GalleryItem[] = [];
export const INITIAL_VOLUNTEERS: Volunteer[] = [];
