require("dotenv").config();
var express = require("express");
const { MongoClient } = require("mongodb");
var cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
const fileUpload = require("express-fileupload");

const {sendScheduledSms,sendReminder} = require('./reminder');
var app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.edqye.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
// console.log(uri);
async function run() {
	// for medicine
	try {
		await client.connect();
		const database = client.db("medicines_portal");
		const medicinesCollection = database.collection("medicines");
		const myrecordsCollection = database.collection("myrecords");
		const vaccinesCollection = database.collection("vaccines");
		const appointmentsCollection = database.collection("appointments");
		const profilesCollection = database.collection("profiles");
		const membersCollection = database.collection('members');
		// console.log(`connect successfully`);

		// ==================medicine collection========================
		// medicine data get api
		app.get("/medicines", async (req, res) => {
			const email = req.query.email;
			const query = { email: email };
			// console.log(query);
			const cursor = medicinesCollection.find(query);
			const medicines = await cursor.toArray();
			res.json(medicines);
		});

		
		  // Start listing users from the beginning, 1000 at a time.
		  


		//medicine  data post api
		app.post("/medicines", async (req, res) => {
			const medicine = req.body;
			const result = await medicinesCollection.insertOne(medicine);
			res.json(result);
			const time = medicine.time.split(':')
			 
			sendReminder(time[1], time[0], medicine.name, medicine.mobile)
		});

		// medicine data delet api
		app.delete(`/medicines/:id`, async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await medicinesCollection.deleteOne(query);
			res.json(result);
		});

		// ==================my records collection========================
		// myrecords data post api
		app.post(`/myrecords`, async (req, res) => {
			const description = req.body.description;
			const name = req.body.name;
			const pic = req.files.image;
			const picData = pic.data;
			const encodePic = picData.toString("base64");
			const imageBuffer = Buffer.from(encodePic, "base64");
			const records = {
				description,
				image: imageBuffer,
				name
			};

			console.log(records);
			const result = await myrecordsCollection.insertOne(records);
			// console.log("body", req.body);
			// console.log("files", req.files);

			// res.json({ success: true });
			res.json(result);
		});

		// myrecords data get api
		app.get("/myrecords/:name", async (req, res) => {
			const name = req.params.name;
			const query = {name: name}
			const cursor = myrecordsCollection.find(query);
			const myrecords = await cursor.toArray();
			res.json(myrecords);
		});

		//myrecords data delete
		app.delete(`/myrecords/:id`, async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await myrecordsCollection.deleteOne(query);
			res.json(result);
		});

		// vaccinesCollection;
		// vaccine data get api
		app.get("/vaccines", async (req, res) => {
			const email = req.query.email;
			const query = { email: email };
			// console.log(query);
			const cursor = vaccinesCollection.find(query);
			const vaccines = await cursor.toArray();
			res.json(vaccines);
		});

		//vaccine  data post api
		app.post("/vaccines", async (req, res) => {
			const vaccine = req.body;
			const result = await vaccinesCollection.insertOne(vaccine);
			res.json(result);

			let vaccineSMS= 'You have a vaccination appointment today with Dr.' + vaccine.name;
			sendScheduledSms(vaccine.mobile, vaccine.date,vaccineSMS);

		});

		// vaccine data delet api
		app.delete(`/vaccines/:id`, async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await vaccinesCollection.deleteOne(query);
			res.json(result);
		});

		// appointmentsCollection;
		// appointments data get api
		app.get("/appointments", async (req, res) => {
			const email = req.query.email;
			const query = { email: email };
			// console.log(query);
			const cursor = appointmentsCollection.find(query);
			const appointments = await cursor.toArray();
			res.json(appointments);
		});

		//appointments  data post api
		app.post("/appointments", async (req, res) => {
			const appointments = req.body;
			const result = await appointmentsCollection.insertOne(appointments);
			// console.log(result);
			res.json(result);
			let appointmentSMS= 'You have a appointment today with Dr.' + appointments.name;
			sendScheduledSms(appointments.mobile, appointments.date,appointmentSMS);
		});

		// appointments data delet api
		app.delete(`/appointments/:id`, async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await appointmentsCollection.deleteOne(query);
			res.json(result);
		});
		// appointments
		// appointment

		//profiles  data post api
		app.post("/profiles", async (req, res) => {
			const profile = req.body;
			const result = await profilesCollection.insertOne(profile);
			console.log(result);
			res.json(result);
		});

		// profiles data get api
		app.get("/profiles", async (req, res) => {
			const email = req.query.email;
			const query = { email: email };
			// console.log(query);
			const cursor = profilesCollection.find(query);
			const profiles = await cursor.toArray();
			res.json(profiles);
		});

		//user data post api
		app.post('/members', async (req,res) => {
			const user = req.body;

			const checkUsr = await membersCollection.findOne({email: user.email})
			if(!checkUsr) {
				const result =  membersCollection.insertOne(user)
				console.log(result)
				res.json(result)
			} else {
				res.json({message: "Alreday exist!"})
			}
		})

		app.get('/members', async (req,res) => {
			const email = req.query.email;
			const query = { email: email };

			const membersList =  membersCollection.find(query);
			const members = await membersList.toArray();
			console.log(members)
			res.json(members)
		})

		app.get('/patients', async (req,res) => {
			const search = req.query.s;
			const membersList =  membersCollection.find({$text: {
				$search: search,
				$caseSensitive: false
			}});
			const patients = await membersList.toArray();
			console.log(patients)
			res.json(patients)
		})



		// // profiles data delet api
		// app.delete(`/medicines/:id`, async (req, res) => {
		// 	const id = req.params.id;
		// 	const query = { _id: ObjectId(id) };
		// 	const result = await profilesCollection.deleteOne(query);
		// 	res.json(result);
		// });
	} finally {
	}
}

run().catch(console.dir);

app.get("/users", (req, res) => {
	res.send(users);
});



app.get("/users/:id", (req, res) => {
	let id = req.params.id;
	// console.log(req.params.id);
	res.send(users[id]);
});

const users = [
	{
		id: 0,
		name: "Diabetes ",
		description:
			"Diabetes mellitus, commonly known as diabetes, is a metabolic disease that causes a persons blood sugar level (also called blood glucose) is too high. Most of the food you eat is broken down ",
		img: "https://image.freepik.com/free-photo/world-diabetes-day-medical-equipment-wooden-floor_1150-26692.jpg",
	},
	{
		id: 1,
		name: "heart Diseases",
		description:
			"The heart is a muscular organ in most animals, which pumps blood through the blood vessels of the circulatory system.[1] The pumped blood carries oxygen and nutrients to the body, while carrying metabolic waste such as carbon dioxide to the lungs.[2] In humans, the heart is approximately the size of a closed fist and is located between the lungs, in the middle compartment of the chest.",
		img: "https://s3.amazonaws.com/cms.ipressroom.com/338/files/202011/5fdba32c2cfac203a5f793e6_heart+patient/heart+patient_481926d4-4500-42cd-9aef-ba711e91b287-prv.jpg",
	},
	{
		id: 2,
		name: "women health",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://image.freepik.com/free-photo/concentrated-woman-stretching-her-arms-with-sky-background_1150-376.jpg",
	},
	{
		id: 3,
		name: "child care",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://image.freepik.com/free-photo/my-daughter-isn-t-afraid-pay-visit-here_329181-7634.jpg",
	},

	{
		id: 5,
		name: "allergy",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://image.freepik.com/free-photo/sick-woman-sneezing-sofa-grayscale_53876-139531.jpg",
	},
	{
		id: 6,
		name: "back pain",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://image.freepik.com/free-photo/close-up-man-rubbing-his-painful-back-isolated-white-background_1150-2935.jpg",
	},
	{
		id: 7,
		name: "skin Diseases",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://image.freepik.com/free-photo/skin-allergy-reaction-person-s-arm_23-2149140472.jpg",
	},
	{
		id: 8,
		name: "depression",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://image.freepik.com/free-photo/sad-business-man-sit-hotel-room_1150-6488.jpg",
	},
	{
		id: 9,
		name: "daily workout",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
	},
	{
		id: 10,
		name: "kidney Diseases",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://image.freepik.com/free-photo/dissatisfied-woman-holds-aching-hip-has-kidney-inflammation-touches-location-pain-near-ribs-marked-with-red-dot-wears-sport-bra_273609-33727.jpg",
	},
	{
		id: 11,
		name: "cold flu and cough",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://image.freepik.com/free-photo/sick-woman-with-rheum-headache-holding-napkin-sitting-sofa-with-coverlet-pills-home_231208-5465.jpg",
	},
	{
		id: 12,
		name: "migraine",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://image.freepik.com/free-photo/businesswoman-with-headache_23-2147768299.jpg",
	},
	{
		id: 13,
		name: "brain stroke",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://media.istockphoto.com/photos/brain-diseases-problem-cause-chronic-severe-headache-migraine-male-picture-id1126707579?b=1&k=20&m=1126707579&s=170667a&w=0&h=V8DfPLwHccq3CAVPt94o6dBHWUO9WmmjWTAgE44rerY=",
	},
	{
		id: 14,
		name: "diet and nutrition",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://image.freepik.com/free-photo/concept-healthy-food-sports-lifestyle-vegetarian-lunch-healthy-breakfast-proper-nutrition-top-view-flat-lay_2829-6082.jpg",
	},
	{
		id: 00,
		name: "corona",
		description:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!",
		img: "https://www.istockphoto.com/photo/doctor-in-a-home-visit-to-a-senior-man-gm1289183630-384933550?utm_source=unsplash&utm_medium=affiliate&utm_campaign=srp_photos_top&utm_content=https%3A%2F%2Funsplash.com%2Fs%2Fphotos%2Fcorona&utm_term=corona%3A%3A%3A",
	},
];

app.listen(port, () => {
	console.log(`listening at http://localhost:${port}`);
});
