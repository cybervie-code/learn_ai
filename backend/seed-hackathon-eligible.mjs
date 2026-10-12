// One-off import: Add all hackathon payment-eligible students as PENDING
// Run: node seed-hackathon-eligible.mjs
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import { EligibleStudent } from './src/models/EligibleStudent.js';

const ELIGIBLE_STUDENTS = [
  { name: 'PATLOLLA SHIVA SAI', mobile: '+917730866691', email: 'shivafgj@gmail.com' },
  { name: 'Vishnu Vardhan goud', mobile: '+919951722338', email: 'vgoud0242@gmail.com' },
  { name: 'PENTKAR VYSHNAVI', mobile: '+917981773502', email: 'vyshnavipentkar@gmail.com' },
  { name: 'ANJURI MOKSHAGNA', mobile: '+918341615249', email: 'mokshaanjuri@gmail.com' },
  { name: 'D Harshini', mobile: '+917569970718', email: 'dubbakaharshini7@gmail.com' },
  { name: 'Pranavya', mobile: '+919959970525', email: 'pranavyabanoth@gmail.com' },
  { name: 'P.Sai Pranavi', mobile: '+919346096999', email: 'pillapranavi76@gmail.com' },
  { name: 'Hasini Boddapadu', mobile: '+917989859357', email: 'hasiniboddapadu78@gmail.com' },
  { name: 'Konda Siri', mobile: '+917981847994', email: 'sirikonda3618@gmail.com' },
  { name: 'Anudeep', mobile: '+919398249908', email: '24bk1a0473@stpetershyd.com' },
  { name: 'Sahithi Uppala', mobile: '+919705001980', email: 'sahithiuppala947@gmail.com' },
  { name: 'Sri Krishna Khandoba', mobile: '+919390500340', email: 'khandobasrikrishna@gmail.com' },
  { name: 'Sri deekshitha', mobile: '+919182873704', email: 'srideekshitha684@gmail.com' },
  { name: 'GANDRA SAI AKSHITH REDDY', mobile: '+919573411976', email: 'gandrasaiakshithreddy@gmail.com' },
  { name: 'Rishant', mobile: '+919892015121', email: 'rish.games07@gmail.com' },
  { name: 'Thurupati Renu Maneesh', mobile: '+919959591427', email: 'thurupatirenumaneesh@gmail.com' },
  { name: 'VINYA KAMATHAM', mobile: '+916309965133', email: 'vinyakamatham15@gmail.com' },
  { name: 'Vasishta', mobile: '+917993798456', email: 'saivasishtamulpuru9@gmail.com' },
  { name: 'Abhinaya sri', mobile: '+918639192620', email: 'Abhinayasridasari11@gmail.com' },
  { name: 'Gudipati Venkata Sai Aditya', mobile: '+919182380362', email: 'adityagudipati05@gmail.com' },
  { name: 'Rajesh Nanubothu', mobile: '+917569026179', email: 'rajeshnanubothu25@gmail.com' },
  { name: 'PEYYALA NANDU', mobile: '+917799541411', email: 'peyyalanandu76@gmail.com' },
  { name: 'Nunavath Rohith', mobile: '+919347068392', email: 'nrohith224@gmail.com' },
  { name: 'Aryan Kajjam', mobile: '+917032582778', email: 'kajjamaryan@gmail.com' },
  { name: 'Varun Nandan Thota', mobile: '+919392123042', email: 'varunnandanthota@gmail.com' },
  { name: 'Rishitha Gandham', mobile: '+919502463340', email: 'rishithagandham03@gmail.com' },
  { name: 'Lahari Chowdary mallela', mobile: '+917207375666', email: 'lahari7002@gmail.com' },
  { name: 'Chinthakindi Ranjitha', mobile: '+919676799264', email: 'chinthakindiranjitha@gmail.com' },
  { name: 'TEJA', mobile: '+919490308523', email: '24071a6608@vnrvjiet.in' },
  { name: 'Suhas Belgavi', mobile: '+919032496699', email: 'tummalanihal3721@gmail.com' },
  { name: 'B.Srivalli', mobile: '+919391688440', email: 'bsrivalli419@gmail.com' },
  { name: 'Nandhishwar reddy Yerrolla', mobile: '+918985759044', email: 'nandhishwarreddy.yerrola@gmail.com' },
  { name: 'Parthu Tanneru', mobile: '+919494241419', email: 'parthutanneru1@gmail.com' },
  { name: 'Nihal Tummala', mobile: '+919182206367', email: 'tummalanihal24@gmail.com' },
  { name: 'Sai Sohan', mobile: '+916309527147', email: 'sai.sohanguddeti08@gmail.com' },
  { name: 'Manaswini Gattu', mobile: '+917075755933', email: 'manaswinigattu123@gmail.com' },
  { name: 'Venkata Jagadeep', mobile: '+918125625408', email: 'sajjavenkatajagadeep@gmail.com' },
  { name: 'Meka Sanketh Reddy', mobile: '+918919758435', email: 'msankethreddy@gmail.com' },
  { name: 'Darpalli Medhansh', mobile: '+918463914975', email: 'darpallimedhansh02@gmail.com' },
  { name: 'Akshara reddy', mobile: '+918977622540', email: 'aksharareddy487@gmail.com' },
  { name: 'Sukumar Rai', mobile: '+916300224660', email: 'raisukumarr@gmail.com' },
  { name: 'Katkar Vinayak', mobile: '+919652339404', email: 'katkarvinayak2006@gmail.com' },
  { name: 'Sushruth Pippiri', mobile: '+918977304560', email: 'sushruth.pippiri@gmail.com' },
  { name: 'Akshaya Guruvannagari', mobile: '+917569952892', email: 'guruvannagariakshaya@gmail.com' },
  { name: 'Lohitha Aithagoni', mobile: '+918688967061', email: 'lohithaaithagoni777@gmail.com' },
  { name: 'Sathwik D', mobile: '+918309426043', email: 'sathwik.fr@gmail.com' },
  { name: 'Laaqshya', mobile: '+919652671464', email: 'laaqshya@gmail.com' },
  { name: 'MALLALA SAI SREEJA', mobile: '+917780445335', email: 'mallalasreeja27@gmail.com' },
  { name: 'R Shashank', mobile: '+916301934256', email: 'shashankrayapuri123@gmail.com' },
  { name: 'dharmavarapu harshitha', mobile: '+918523005290', email: 'harshithadharmavarapu@gmail.com' },
  { name: 'D Sahith Reddy', mobile: '+919949421289', email: 'sahithdilli@gmail.com' },
  { name: 'Riya Kanaka Annavarapu', mobile: '+919063257785', email: 'riyakannavarapu@gmail.com' },
  { name: 'Moturi Sai Teja', mobile: '+919553628095', email: 'saitejamoturi7@gmail.com' },
  { name: 'Anusha Godugu', mobile: '+919154422179', email: 'goduguanusha27@gmail.com' },
  { name: 'Laxmi Prasanna Gurrala', mobile: '+919032624537', email: 'prasannalg12@gmail.com' },
  { name: 'Sri Vedavyasa Sri Rukmini', mobile: '+916301385213', email: 'rukminisrivedavyasasri@gmail.com' },
  { name: 'Bonagiri Bhuvanesh Gupta', mobile: '+919059913133', email: 'bbhuvaneshgupta@gmail.com' },
  { name: 'Ganapurapu Sanath Kumar', mobile: '+919347864079', email: 'sanathkumar.ganapurapu@gmail.com' },
  { name: 'Murala Kushwanth', mobile: '+919866333779', email: 'kushwanthmurala@gmail.com' },
  { name: 'Chaitanya', mobile: '+918179329360', email: 'chaitanyathappeta@gmail.com' },
  { name: 'Rishank Reddy Nagarthi', mobile: '+917981834154', email: 'rishankreddynagarthi@gmail.com' },
  { name: 'R SRI CHARAN', mobile: '+918074825241', email: 'cherryrao22@gmail.com' },
  { name: 'A bharathwaj', mobile: '+918008454686', email: 'attellibharathwaj030@gmail.com' },
  { name: 'G SAI AKSHAYA', mobile: '+919515934507', email: 'akshayagumudala@gmail.com' },
  { name: 'rohith sai', mobile: '+919550493267', email: 'vallamadasrohitsai@gmail.com' },
  { name: 'PRANAVI VANGALA', mobile: '+918008915005', email: 'vangalapranavi2025@gmail.com' },
  { name: 'Chetlapelly Maniharsha', mobile: '+917842420878', email: 'maniharshachetlapelli@gmail.com' },
  { name: 'G.Rishitha Reddy', mobile: '+919493964784', email: 'gudarishithareddy09@gmail.com' },
  { name: 'Ramidi Sriharika', mobile: '+917893331863', email: 'sriharikaramidi19@gmail.com' },
  { name: 'Saranya Nandigama', mobile: '+918328423405', email: 'saranyanandigama7@gmail.com' },
  { name: 'Sreesatvik Vadlamudi', mobile: '+919100917880', email: 'sreesatvik2006@gmail.com' },
  { name: 'Almas sania', mobile: '+919010447404', email: 'almassaniashaik06@gmail.com' },
  { name: 'Sindhuja Merugu', mobile: '+919390658381', email: 'merugusindhuja2005@gmail.com' },
  { name: 'Santhosh Kumar', mobile: '+918686604731', email: 'santhoshterala2@gmail.com' },
  { name: 'Asritha Peddireddy', mobile: '+916304012459', email: 'asrithapeddireddy123@gmail.com' },
  { name: 'Yashaswini Uppala', mobile: '+919182400213', email: 'uppalayashaswini@gmail.com' },
  { name: 'Sharath Krishna', mobile: '+918978901308', email: '25071a05j8@vnrvjiet.in' },
  { name: 'Yasaswini Yarraguntla', mobile: '+919398095867', email: 'yasaswiniy2007@gmail.com' },
  { name: 'Raj Kamal', mobile: '+919014142219', email: 'rajkamalthangallapally@gmail.com' },
  { name: 'B Veekshitha', mobile: '+919390290771', email: 'veekshithasiri@gmail.com' },
  { name: 'V.Shashank Meher', mobile: '+919392489383', email: 'V.shashank2401@gmail.com' },
  { name: 'D.Yasaswi', mobile: '+916303582385', email: '25061A0582@vnrvjiet.in' },
  { name: 'Harshavardhan G', mobile: '+919390891512', email: 'hv967521@gmail.com' },
  { name: 'Kasa Siva Karan Reddy', mobile: '+918985722689', email: 'kasasivakaranreddy@gmail.com' },
  { name: 'D.S.S.Soumya', mobile: '+916281462934', email: 'soumyux@gmail.com' },
  { name: 'Dimple Priya', mobile: '+919705849618', email: 'nallanadimplepriya@gmail.com' },
  { name: 'Raghudeep B', mobile: '+918121825294', email: 'Raghudeep.bollineni@gmail.com' },
  { name: 'Yashaswini', mobile: '+919989212377', email: 'yashaswini071207@gmail.com' },
  { name: 'Vidhatri', mobile: '+918639897664', email: 'vidhatrib127@gmail.com' },
  { name: 'Nikhilesh Sai S Donthala', mobile: '+917893961127', email: '26071a05at@vnrvjiet.in' },
  { name: 'Bollu Harshitha', mobile: '+917386702524', email: 'harshithabollu7@gmail.com' },
  { name: 'CHILUMULA AKHIL', mobile: '+918500027990', email: 'chilumula.akhil19@gmail.com' },
  { name: 'Sama Shivathmika', mobile: '+919849418429', email: 'samashivathmika@gmail.com' },
  { name: 'Vishwasree Seeka', mobile: '+918019682459', email: 'seekavishwasree@gmail.com' },
  { name: 'SRINIDHI PONAGANDLA', mobile: '+919533304950', email: 'srinidhiponagandla25@gmail.com' },
  { name: 'Nakshatra sai Madasu', mobile: '+919398977567', email: 'sureshmadasu921@gmail.com' },
  { name: 'Gayathri Amaroji', mobile: '+917093295201', email: 'gayathri.amaroji14@gmail.com' },
  { name: 'M.Sathwik', mobile: '+919392912737', email: '25071a0592@vnrvjiet.in' },
  { name: 'Karthika Potnuru', mobile: '+919392664003', email: 'potnurukarthika77@gmail.com' },
  { name: 'Siri kolli', mobile: '+919491545159', email: 'sirikoll.in@gmail.com' },
  { name: 'Hansika', mobile: '+919989052288', email: 'ainenihansika@gmail.com' },
  { name: 'Racharla Baba Venkata Sai Krishna', mobile: '+919959546869', email: 'saikrishnaracharla72@gmail.com' },
  { name: 'Sai Sri Pranathi', mobile: '+918008606832', email: 'pranathiswayampakula2311@gmail.com' },
  { name: 'Mandava Ramya', mobile: '+916303283079', email: 'ramyamandava15@gmail.com' },
  { name: 'Koduri Sri Harsha', mobile: '+919652867531', email: 'sriharsha.k798@gmail.com' },
  { name: 'Medishetti Deeksha', mobile: '+919182265259', email: 'deekshashetti31@gmail.com' },
  { name: 'P Shanmukhi', mobile: '+916301934256', email: 'shanmukhipinapaka06@gmail.com' },
  { name: 'Manikanta Siddanth kille', mobile: '+917981989291', email: 'kmsiddanth08@gmail.com' },
  { name: 'Vidya Sahithi', mobile: '+917993032789', email: 'vidyasahithi157@gmail.com' },
  { name: 'Shaeza Kauser', mobile: '+918294066802', email: 'shaeza.375@gmail.com' },
  { name: 'Laxmi Trishali Kocherla', mobile: '+917013320915', email: 'trishalikocherla@gmail.com' },
  { name: 'Aashrith', mobile: '+918460125678', email: 'inturiaashrith.chowdary@gmail.com' },
  { name: 'UPPERU SAHITHI', mobile: '+917416446114', email: '24071a6664@vnrvjiet.in' },
  { name: 'SATHWIK ANANTHULA', mobile: '+917013006580', email: 'sathwik3404@gmail.com' },
  { name: 'Haasini Bingi', mobile: '+919494668669', email: 'haasinibingi@gmail.com' },
  { name: 'Vishnu Vardhan', mobile: '+919059158072', email: '25071a67h1@vnrvjiet.in' },
  { name: 'Gampa Sathwik', mobile: '+918897766640', email: 'gampasathwik2220@gmail.com' },
  { name: 'THODUPOONURI SRI SAI CHANDRA', mobile: '+919347094793', email: 'sschandra2006@gmail.com' },
  { name: 'hrishikesh sanipini', mobile: '+919154778002', email: 'hrishikesh.sanipini@gmail.com' },
  { name: 'Suhaas Karnam', mobile: '+916305715697', email: 'karnamsuhaas@gmail.com' },
  { name: 'Vignesh Theerdala', mobile: '+917674098342', email: 'theerdalavignesh@gmail.com' },
  { name: 'Abhishek Kokkilagadda', mobile: '+919110350295', email: 'kokkiligaddaabhishek2006@gmail.com' },
  { name: 'Challa brundha', mobile: '+917207172167', email: 'challabrunda21@gmail.com' },
  { name: 'Suhaas Chandra', mobile: '+917842870455', email: 'gsuhaasch@gmail.com' },
  { name: 'Nishanth Paritala', mobile: '+918309020055', email: 'nishanthparitala15@gmail.com' },
  { name: 'Nallella Rithvika', mobile: '+916301670690', email: 'rithvika4788@gmail.com' },
  { name: 'Nitya Sri Konchu', mobile: '+918341822146', email: 'nityakonchu2802@gmail.com' },
  { name: 'Sohith', mobile: '', email: 'sohithpatha1234@gmail.com' },
  { name: 'Haasini Gayathri Kamatkar', mobile: '+919391082510', email: 'haasini.gsk@gmail.com' },
  { name: 'LAXMI VARSHITHA SRI PERUMBUDURI', mobile: '+919700311312', email: '24071a6631@vnrvjiet.in' },
  { name: 'Nadella Shyamanth', mobile: '+919492015239', email: 'nadellashyamanth@gmail.com' },
  { name: 'Pattalla Puneeth', mobile: '+917981802087', email: 'pattalla.puneeth@gmail.com' },
  { name: 'Madhunala Madhuri', mobile: '+918019595468', email: '24071a6633@vnrvjiet.in' },
  { name: 'Malothu Sravanthi', mobile: '+917386095372', email: 'sravanthim.malothu@gmail.com' },
  { name: 'P. Bhavishya', mobile: '+917337441235', email: 'bhavishyajai22@gmail.com' },
  { name: 'M. Vaishali', mobile: '+919390268407', email: 'manchukonda.vaishali@gmail.com' },
  { name: 'Charan sai srujan', mobile: '+918885594668', email: 'charansaisrujan@gmail.com' },
  { name: 'Ashwanth N P', mobile: '+916238519011', email: 'ashwanthnp8@gmail.com' },
  { name: 'Sai pavan Alladi', mobile: '+916303705603', email: 'alladisaipavan6@gmail.com' },
  { name: 'Vignesh sha chand', mobile: '+919947996662', email: 'Vigneshsc583@gmail.com' },
  { name: 'ABHINAV P', mobile: '+919846118692', email: 'abhinavpschool3@gmail.com' },
  { name: 'Sathwik', mobile: '+917396104418', email: 'sathwikgaddam21@gmail.com' },
  { name: 'G Nandakishore Reddy', mobile: '+918555042086', email: 'nandhakishore12713@gmail.com' },
  { name: 'KAKKIRALA HARSHITH KUMAR', mobile: '+917416002298', email: 'kumarharshith4452@gmail.com' },
  { name: 'Vooturi.Akshay Kumar', mobile: '+917893650259', email: 'akshayk41901@gmail.com' },
  { name: 'Golla Manaswi', mobile: '+919494949578', email: 'manaswigolla250@gmail.com' },
  { name: 'Jorrigala Nithish Kumar', mobile: '+919014123243', email: 'jorrigalanithish@gmail.com' },
  { name: 'Karthik', mobile: '+918688439762', email: 'karthikvakiti3@gmail.com' },
  { name: 'SHAIK FARHEEN', mobile: '+919989810055', email: 'reachout2shaikfarheen@gmail.com' },
  { name: 'Madhu Muttamsetty', mobile: '+918074350460', email: 'muttamsetty09@gmail.com' },
  { name: 'PALLETI VAMSHI', mobile: '+919346860568', email: 'vamshipalleti18@gmail.com' },
  { name: 'SAITEJA', mobile: '+917981429306', email: 'saitejabayyavarapu0127@gmail.com' },
  { name: 'sadhu abhilash', mobile: '+917386173645', email: 'abhiabhiiii699@gmail.com' },
  { name: 'Pulapa Vikramaditya Sai', mobile: '+918790496237', email: 'vsai3890@gmail.com' },
  { name: 'Javvaji Venkata Naga Sai Sukumar', mobile: '+917981001134', email: 'sukumarjavvaji4@gmail.com' },
  { name: 'Nuchu Goutami', mobile: '+919391490703', email: 'gouthaminurchu@gmail.com' },
  { name: 'Chandana Reddy Singireddy', mobile: '+918309616027', email: 's.chandanareddy949@gmail.com' },
  { name: 'Rohith Devireddy', mobile: '+919603497621', email: 'devireddyrohith@gmail.com' },
  { name: 'Kalewar sunil', mobile: '+916301895153', email: 'kalewarsunil337@gmail.com' },
  { name: 'Krishna Teja Narmala', mobile: '+916304803628', email: 'krishnateja1007@gmail.com' },
  { name: 'UDARLA DINESH', mobile: '+917286809733', email: 'udarladinesh@gmail.com' },
  { name: 'Vignesh rao Peggarla', mobile: '+916300306330', email: 'vigneshraopeggarla@gmail.com' },
  { name: 'VUTUKURI CHOHITH', mobile: '+916304457830', email: 'chohith2007@gmail.com' },
  { name: 'rahul nakirakommula', mobile: '+918919674386', email: 'rahulrohith132@gmail.com' },
  { name: 'SAI DINESH MOGAPARTHI', mobile: '+919704951643', email: 'saidineshm24@gmail.com' },
  { name: 'Ajith Ponnala', mobile: '+919490380184', email: 'ponnalaajithreddy78@gmail.com' },
  { name: 'RAGOLU DILIP', mobile: '+917569999159', email: 'dilip22126525@gmail.com' },
  { name: 'laksh lahoti', mobile: '+919059380170', email: 'lakshlahoti15@gmail.com' },
  { name: 'Ritheesh Chandra Pasaladi', mobile: '+916300518967', email: 'ritheeshp1527@gmail.com' },
  { name: 'Abhishek singuluri', mobile: '+918977044239', email: 'abhisheksinguluri200610@gmail.com' },
  { name: 'Dakshatha Dasari', mobile: '+917207500929', email: 'ddakshatha18@gmail.com' },
  { name: 'Bandi manohar', mobile: '+917013801636', email: '25071a05e9@vnrvjiet.in' },
  { name: 'Veda', mobile: '+919121107995', email: 'n.veda2006@gmail.com' },
  { name: 'B Ananya', mobile: '+918309544650', email: 'bukkapatnamananya@gmail.com' },
  { name: 'Jayani Patibandla', mobile: '+919000279659', email: 'jayanip613@gmail.com' },
  { name: 'JYOSHNA NUNAVATH', mobile: '+918247763351', email: 'nunavathjyoshna2006@gmail.com' },
  { name: 'Sanvitha Ganji', mobile: '+919396698765', email: 'saisanvitha1126@gmail.com' },
  { name: 'Kampalli Pallavi', mobile: '+918919505048', email: 'kampallipallavi@gmail.com' },
  { name: 'Javali Chilumula', mobile: '+919515233801', email: 'Javalireddychilumula@gmail.com' },
  { name: 'Jahnavi Dhulipati', mobile: '+918978220402', email: 'jahnavi.dhulipati@gmail.com' },
  { name: 'BMVRSS Meghana', mobile: '+919701820468', email: 'meghana.bmvrs@gmail.com' },
  { name: 'Nidhish Nutakki', mobile: '+919154271006', email: 'nidhishnutakki06@gmail.com' },
  { name: 'Pasupuleti Sudeepthi', mobile: '+918688798958', email: 'pasupuletisudeepthi235@gmail.com' },
  { name: 'Vedhaharshitha Rayini', mobile: '+917095224252', email: 'vedhaharshitharayini2007@gmail.com' },
  { name: 'Gagana Sai Sree Somarathi', mobile: '+919063741043', email: 'somarathigaganasaisree@gmail.com' },
  { name: 'Narreddy Meghana', mobile: '+916301129355', email: 'Meghana2807reddy@gmail.com' },
  { name: 'Anjali Navathe', mobile: '+919059603999', email: 'anjalinavathe@gmail.com' },
  { name: 'BAKKOLLA NIHARIKA', mobile: '+919866308512', email: 'bakkollaniharika5@gmail.com' },
  { name: 'Mandadi Lakshmi Sahithi', mobile: '+919182624247', email: 'lakshmisahithi2906@gmail.com' },
  { name: 'Chiroori Rithvik', mobile: '+916303957329', email: 'radicalmaniax@gmail.com' },
  { name: 'Druthi Chirasani', mobile: '+918125491067', email: 'druthi076@gmail.com' },
  { name: 'Auti Sahasra', mobile: '+917013596336', email: 'sahasraauti7@gmail.com' },
];

await connectDB();
console.log('=== IMPORTING ELIGIBLE STUDENTS AS PENDING ===\n');

let added = 0;
let skipped = 0;
let updated = 0;

for (const student of ELIGIBLE_STUDENTS) {
  const email = student.email.toLowerCase().trim();
  const existing = await EligibleStudent.findOne({ email });

  if (existing) {
    if (!existing.name || !existing.mobile) {
      existing.name = existing.name || student.name;
      existing.mobile = existing.mobile || student.mobile;
      await existing.save();
      updated++;
      console.log(`[UPDATED] ${email} (${student.name}) - kept status: ${existing.status}`);
    } else {
      skipped++;
      console.log(`[SKIP]    ${email} already exists (status: ${existing.status})`);
    }
    continue;
  }

  await EligibleStudent.create({
    email,
    name: student.name,
    mobile: student.mobile,
    status: 'pending',
  });
  added++;
  console.log(`[ADDED]   ${email} (${student.name})`);
}

console.log('\n=== IMPORT COMPLETE ===');
console.log(`  Added:   ${added}`);
console.log(`  Updated: ${updated}`);
console.log(`  Skipped: ${skipped}`);
console.log(`  Total:   ${await EligibleStudent.countDocuments()}`);

await mongoose.disconnect();
