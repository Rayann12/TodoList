const express = require('express');
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = express();
app.use(express.json());

const secretKey = 'S3CR3T_KEY';

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    todos: [{type: mongoose.Schema.Types.ObjectId, ref: 'Todo'}]
});

const todoSchema = new mongoose.Schema({
    title: String,
    description: String
})

const User = new mongoose.model('User', userSchema);
const Todo = new mongoose.model('Todo', todoSchema);



const authenticator = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader){
        const token = authHeader.split(" ")[1];
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    }
    else{
        res.sendStatus(401);    }
}

mongoose.connect('mongodb+srv://rayanswag2001:Donspapi1%23@cluster0.wriuw1d.mongodb.net/',{ useNewUrlParser: true, useUnifiedTopology: true, dbName: "TodoWeb" }),

app.post('/user/signup', async (req, res) => {
    const {username, password} = req.headers;
    const user = await User.findOne({username});

    if (user){
        res.status(403).json( {message: "User already exists!" } );
    }
    else{
        const user = {username: username, password: password};
        newUser = new User({username, password});
        await newUser.save();
        const token = jwt.sign(user, secretKey,{expiresIn: '1d'});
        res.json({message: "User logged in successfuly", token: token});
    }
})

app.post('/user/login', async (req, res) => {
    const {username, password} = req.headers;
    const user = await User.findOne({username, password});
    if (user){
        const token = jwt.sign({username: username, password: password}, secretKey,{expiresIn: '1d'});
        res.json({message: "Logged in successfully", token: token});
    }
    else{
        res.json({message: "Error! Account does not exist."});
}})

app.post('/user/todos', authenticator, async (req, res) =>{
    const user = await User.findOne({username: req.user.username});
    if (user){
    const newTodo = new Todo({title: req.body.title, description: req.body.description});
    await newTodo.save();
    user.todos.push(newTodo);
    await user.save();
    res.json({message: "Todo List added successfully!"});}
    else{res.json({message: "User not found"});}
})

app.get('/user/todos', authenticator, async (req, res) =>{
    const user = await User.findOne({username: req.user.username}).populate('todos');
    if (user){
    res.json({message: "Course List", todos: user.todos || []});}
    else{res.json({message: "User not found"});}
})

app.put('/user/todos/:todoID', authenticator, async (req, res) => {
    const todo = await Todo.findByIdAndUpdate(req.params.todoID, req.body, {new: true});
    if (todo){
        res.json({message: "Successfully Updated!"});
    }
    else{
        res.status(404).json( {message: "User/Todo Not Found!" } );
    }
})

app.delete('/user/todos/:todoID', authenticator, async (req, res) => {
    const deleted = await Todo.findByIdAndDelete(req.params.todoID);
    if (deleted){
    const user = await User.findOne({username: req.user.username, password: req.user.password});
    if (user){
    user.todos = user.todos.filter(t => t.toString()!= req.params.todoID);
    await user.save();
    res.json({message: "Deletion successful both from User DB and from Todo DB"});
    }
    else{
        res.json({message: "Deletion successful only from Todo DB"})
    }
    }
    else{
        res.json({message: "Error during deletion!"});
    }
})

app.listen(3000, () => {console.log("Listening at port 3000!")});
