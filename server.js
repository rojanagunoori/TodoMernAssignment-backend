const express=require("express")

const cors=require("cors")
const jwt=require("jsonwebtoken")
const bcrypt=require("bcryptjs")
const db=require("./db")
const bodyParser = require("body-parser")
require('dotenv').config();

const app=express()
const PORT=process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const allowedOrigins = [
    "https://todo-mern-sqlite3.netlify.app/", 
    "http://localhost:3000" 
];
/** app.use(cors({
    origin: 'https://todo-mern-sqlite3.netlify.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));*/

/*app.use(cors({
    origin: "https://todo-mern-sqlite3.netlify.app" 
}));*/

//app.use(cors())
app.use(bodyParser.json());
/*
const authenticateJWT=(req,res,next)=>{
    const token=req.headers['authorization']
    if(token){
        jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
            if(err) return res.sendStatus(403);
            req.user=user;
            next();
        })
    }else{
        res.sendStatus(401)
    }
}
*/

const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    console.log("Token:", token.split(" ")[1]);
console.log("Secret Key:", JWT_SECRET);

    if (token) {
        jwt.verify(token.split(" ")[1], JWT_SECRET, (err, user) => {
            if (err) {
                console.error("JWT verification failed:", err);
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        console.error("No token provided");
        res.sendStatus(401);
    }
};





app.post("/signup", (req, res) => {
    const { name, email, password } = req.body;
    const id = require("uuid").v4();
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)", [id, name, email, hashedPassword], (err) => {
        if (err) {
            return res.status(400).send({ message: "User already exists!" });
        }
        res.status(201).send({ message: "User created successfully!" });
    });
});




app.post("/login",(req,res)=>{
    const {email,password}=req.body;

    db.get("SELECT * FROM users WHERE email=?",[email],(err,user)=>{
        if(err || !user) return res.status(401).send({message:"Invalid User"});

        const validPassword=bcrypt.compareSync(password,user.password);
        if(!validPassword) return res.status(401).send({message:"Invalid Paswword"});

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "24h" });

        res.json({message:"Login Succesfully",token})
    })
})
app.post("/createtask", authenticateJWT, (req, res) => {
    const { title, status } = req.body;
    const id = require("uuid").v4();
console.log("this is working 1")
   
    if (!title || !status) {
        console.log("Missing title or status");
        return res.status(400).send({ message: "Title and status are required!" });
    }
    console.log("this is working 2")
    db.run("INSERT INTO tasks (id, userId, title, status) VALUES (?, ?, ?, ?)", [id, req.user.id, title, status], (err) => {
        console.error("Database error:", err);
        console.log("this is working 3")
        if (err) {
            console.log("this is working 5")
            console.error("Error creating task:", err); 
            return res.status(500).send({ message: "Error creating task" });
        }
        console.log("this is working 6")
        res.status(201).send({ message: "Task Created Successfully!" });
    });
});


/*app.post("/createtask",authenticateJWT,(req,res)=>{
    const {title,status}=req.body;
    const id=require("uuid").v4();
    if (!title || !status) {
        return res.status(400).send({ message: "Title and status are required!" });
    }

    db.run("INSERT INTO tasks (id,userId,title,status) VALUES (?,?,?,?)",[id,req.user.id,title,status],()=>{
      res.status(201).send({message:"Task Created Successfully!"});

    })

})*/

app.get("/gettasks",authenticateJWT,(req,res)=>{
    db.all("SELECT * FROM tasks WHERE userId=?",[req.user.id],(err,tasks)=>{
  res.status(200).json({message:"Get Details of Task Successfully!",tasks})
    })
})

app.put("/updatetasks/:id",authenticateJWT,(req,res)=>{
    const {title,status}=req.body;

    db.run("UPDATE tasks SET title=?,status=? WHERE id=? AND userId=?",[title,status,req.params.id,req.user.id],(err)=>{
        if(err) return res.status(400).send({message:"Task Update Failed!"});

        res.send({message:"Task Updated Successfully!"})
    })
})

app.delete("/deletetasks/:id",authenticateJWT,(req,res)=>{
    db.run("DELETE FROM tasks WHERE id=? AND userId=?",[req.params.id,req.user.id],(err)=>{
        if(err) return res.status(400).send({message:"DELETE Task Failed!"});

        res.status(200).send({message:"Task Deleted Successfully!"})
    })
})


app.get("/profile",authenticateJWT,(req,res)=>{
    db.get("SELECT id,name,email FROM users WHERE id=?",[req.user.id],(err,user)=>{
        res.json(user)
    })
})




app.put("/updateprofile", authenticateJWT, (req, res) => {
    const { name, email } = req.body;
    db.run("UPDATE users SET name=?, email=? WHERE id=?", [name, email, req.user.id], (err) => {
        if (err) return res.status(400).send({ message: "Profile Update Failed!" });
        res.send({ message: "Profile Updated Successfully!" });
    });
});


app.delete("/deleteprofile", authenticateJWT, (req, res) => {
    db.run("DELETE FROM users WHERE id=?", [req.user.id], (err) => {
        if (err) return res.status(400).send({ message: "Profile Deletion Failed!" });

        res.status(200).send({ message: "Profile Deleted Successfully!" });
    });
});

/*app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});*/


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})