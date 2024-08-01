const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');

const app = express();
const port = process.env.port || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// MySQL database connection
const connection = mysql.createConnection({
  // host: 'localhost',
  // user: 'root',
  // password: '',
  // database: 'c237_webapp'
  host: 'sql.freedb.tech',
  user: 'freedb_Jovan',
  password: 'MMW5uq99k4#*u&U',
  database: 'freedb_c237_Webapp'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Routes

// Route to render index page
app.get('/', (req, res) => {
  const sql = 'SELECT * FROM recipes';
  connection.query(sql, (error, results) => {
    if (error) throw error;
    res.render('index', { recipes: results });
  });
});

// Route to render recipe page
app.get('/recipe/:id', (req, res) => {
  const recipeId = req.params.id;
  const sql = 'SELECT recipes.*, user.username AS added_by FROM recipes JOIN user ON recipes.user_id = user.user_id WHERE recipe_id = ?';
  connection.query(sql, [recipeId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving recipe by ID');
    }
    if (results.length > 0) {
      res.render('recipe', { recipe: results[0], currentUser: req.user });
    } else {
      res.status(404).send('Recipe not found');
    }
  });
});

// Route to render addRecipe form
app.get('/addRecipe', (req, res) => {
  // Fetch user names from the users table
  const sql = 'SELECT username FROM user';
  connection.query(sql, (error, results) => {
    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).send('Error fetching users');
    }
    res.render('addRecipe', { currentUser: req.user, users: results });
  });
});

// Route to handle addRecipe form submission
app.post('/addRecipe', upload.single('photos'), (req, res) => {
  const { title, ingredients, instructions, user } = req.body;
  const photos = req.file ? req.file.filename : null;
  
  const sqlSelectUserId = 'SELECT user_id FROM user WHERE username = ?';
  connection.query(sqlSelectUserId, [user], (error, results) => {
    if (error || results.length === 0) {
      console.error('Error fetching user id:', error || 'User not found');
      return res.status(500).send('Error adding recipe');
    }
    const userId = results[0].user_id;
    const sqlInsertRecipe = 'INSERT INTO recipes (title, ingredients, instructions, photos, user_id) VALUES (?, ?, ?, ?, ?)';
    connection.query(sqlInsertRecipe, [title, ingredients, instructions, photos, userId], (error, results) => {
      if (error) {
        console.error('Error adding recipe:', error);
        res.status(500).send('Error adding recipe');
      } else {
        res.redirect('/');
      }
    });
  });
});

// Route to render editRecipe form
app.get('/editRecipe/:id', (req, res) => {
  const recipeId = req.params.id;
  const sql = 'SELECT * FROM recipes WHERE recipe_id = ?';
  connection.query(sql, [recipeId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving recipe by ID');
    }
    if (results.length > 0) {
      res.render('editRecipe', { recipe: results[0] });
    } else {
      res.status(404).send('Recipe not found');
    }
  });
});

// Route to handle editRecipe form submission
app.post('/editRecipe/:id', upload.single('photos'), (req, res) => {
  const recipeId = req.params.id;
  const { title, ingredients, instructions } = req.body;
  const photos = req.file ? req.file.filename : null;
  const sql = 'UPDATE recipes SET title = ?, ingredients = ?, instructions = ?, photos = ? WHERE recipe_id = ?';
  connection.query(sql, [title, ingredients, instructions, photos, recipeId], (error, results) => {
    if (error) {
      console.error('Error updating recipe:', error);
      res.status(500).send('Error updating recipe');
    } else {
      res.redirect('/9');
    }
  });
});

// Route to delete recipe
app.get('/deleteRecipe/:id', (req, res) => {
  const recipeId = req.params.id;
  const sql = 'DELETE FROM recipes WHERE recipe_id = ?';
  connection.query(sql, [recipeId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error deleting recipe');
    }
    res.redirect('/');
  });
});

// Route to render addUser form
app.get('/addUser', (req, res) => {
  res.render('addUser');
});

// Route to handle addUser form submission
app.post('/addUser', upload.single('profile_pic'), (req, res) => {
  const { username, email, password } = req.body;
  const profilePic = req.file ? req.file.filename : null;

  const sql = 'INSERT INTO user (username, email, password, profile_pic) VALUES (?, ?, ?, ?)';
  connection.query(sql, [username, email, password, profilePic], (error, results) => {
    if (error) {
      console.error('Error adding user:', error);
      return res.status(500).send('Error adding user');
    } else {
      res.redirect('/');
    }
  });
});

// Route to render viewUsers page
app.get('/viewUsers', (req, res) => {
  const sql = 'SELECT * FROM user'; // Assuming your table is named 'user'
  connection.query(sql, (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving users');
    }
    res.render('viewUsers', { users: results, currentUser: req.user });
  });
});

// Route to render the form to create a collection
app.get('/addCollection', (req, res) => {
  const sql = 'SELECT username FROM user'; // Assuming 'user' is the correct table name
  connection.query(sql, (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving users');
    }
    res.render('addCollection', { users: results, currentUser: req.user });
  });
});

// Handle addCollection form submission
app.post('/addCollection', (req, res) => {
  const { collection_name, username } = req.body;

  const sql = 'INSERT INTO collection (collection_name, username) VALUES (?, ?)';
  connection.query(sql, [collection_name, username], (error, results) => {
    if (error) {
      console.error('Error adding collection:', error);
      res.status(500).send('Error adding collection');
    } else {
      res.redirect('/');
    }
  });
});

// Route to display all collections with added recipes
app.get('/collections', (req, res) => {
  const sqlCollections = 'SELECT * FROM collection';
  connection.query(sqlCollections, (error, collections) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving collections');
    }

    // Fetch recipes for each collection
    const sqlCollectionRecipes = 'SELECT cr.collection_id, r.recipe_id, r.title FROM collection_recipe cr JOIN recipes r ON cr.recipe_id = r.recipe_id';
    connection.query(sqlCollectionRecipes, (error, collectionRecipes) => {
      if (error) {
        console.error('Database query error:', error.message);
        return res.status(500).send('Error retrieving collection recipes');
      }

      // Organize recipes by collection
      collections.forEach(collection => {
        collection.recipes = collectionRecipes
          .filter(cr => cr.collection_id === collection.collection_id)
          .map(cr => ({ recipe_id: cr.recipe_id, title: cr.title }));
      });

      // Fetch all recipes separately for the dropdown
      const sqlRecipes = 'SELECT recipe_id, title FROM recipes';
      connection.query(sqlRecipes, (error, recipes) => {
        if (error) {
          console.error('Database query error:', error.message);
          return res.status(500).send('Error retrieving recipes');
        }

        // Pass collections and recipes to the template
        res.render('collections', { collections, recipes });
      });
    });
  });
});

// Route to handle form submission for adding recipe to collection
app.post('/addRecipeToCollection', (req, res) => {
  const { collection_id, recipe_id } = req.body;
  
  // Insert into your collection_recipe table
  const sql = 'INSERT INTO collection_recipe (collection_id, recipe_id) VALUES (?, ?)';
  connection.query(sql, [collection_id, recipe_id], (error, results) => {
    if (error) {
      console.error('Error adding recipe to collection:', error);
      res.status(500).send('Error adding recipe to collection');
    } else {
      res.redirect('/collections'); // Redirect back to the collections page
    }
  });
});

// Route to handle deletion of recipe from collection
app.post('/removeRecipeFromCollection', (req, res) => {
  const { collection_id, recipe_id } = req.body;
  
  // Delete from your collection_recipe table
  const sql = 'DELETE FROM collection_recipe WHERE collection_id = ? AND recipe_id = ?';
  connection.query(sql, [collection_id, recipe_id], (error, results) => {
    if (error) {
      console.error('Error removing recipe from collection:', error);
      res.status(500).send('Error removing recipe from collection');
    } else {
      res.redirect('/collections'); // Redirect back to the collections page
    }
  });
});

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
