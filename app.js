const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

require('dotenv').config()

console.log(process.env);

const databaseUrl = process.env.DATABASE_URL;
const port = process.env.PORT || 3000;


const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));


mongoose.set('strictQuery', false);
mongoose.connect(databaseUrl);

const itemsSchema = new mongoose.Schema({
  name: String
});

const listsSchema = new mongoose.Schema({
  name: String,
  list: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listsSchema)

const item1 = new Item({
  name: "Buy Food"
});

const item2 = new Item({
  name: "Cook Food"
});

const item3 = new Item({
  name: "Eat Food"
});

const defaultItems = [item1, item2, item3];

const workItems = [];

app.get("/", function (req, res) {

  Item.find((err, results) => {
    if (err) {
      console.log(err);
    } else {
      if (results.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("success");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: results });
      }
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save().then(() => {
      res.redirect("/");
    });
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.list.push(newItem);
      foundList.save().then(() => {
        res.redirect("/" + listName);
      });
    })
  }


});

app.post("/delete", function (req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully removed the item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {list : {_id: checkedItemID}}}, (err, foundList) => {
      if(!err) {
        console.log("Item deleted succesfully");
        res.redirect("/" + listName);
      }
    });
  }

  
});

app.get("/:listName", function (req, res) {

  const listName = _.capitalize(req.params.listName);

  List.findOne({ name: listName }, (err, result) => {
    if (result === null) {
      // Path creating new list
      const list = new List({
        name: listName,
        list: defaultItems
      });
      list.save().then(() => {
        console.log("No list found, new list created.");
        res.redirect("/" + listName);
      });
    } else {
      res.render("list", { listTitle: result.name, newListItems: result.list });
    }
  })

});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(port, function () {
  console.log("Server started on port " + port);
});