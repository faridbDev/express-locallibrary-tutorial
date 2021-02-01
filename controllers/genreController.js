var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const {body, validationResult} = require('express-validator');


// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find().sort([['name', 'ascending']]).exec(function(err, list_genres) {
        if (err) {return next(err);}
        res.render('genre_list', {title: 'Genre List', genre_list: list_genres});
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({'genre': req.params.id}).exec(callback);
        },
    }, function(err, results) {
        if (err) {return next(err);}
        if (results.genre == null) {
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: "Create Genre"});
};

// Handle Genre create on POST.
exports.genre_create_post = [ // Instead of a single middleware function, we specify an array of middleware functions(each method called in order)
    body('name', 'Genre name required').trim().isLength({min: 1}).escape(), // Validate and sanitize the 'name' field

    (req, res, next) => { // Process request after validation and sanitization
        const errors = validationResult(req); // Extract the validation errors from the request

        var genre = new Genre( // Create a genre object with escaped and trimmed data
            {name: req.body.name}
        );

        if (!errors.isEmpty()) { // There are errors! Render the form again with sanitized value/error massages
            res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()});
            return;
        }
        else { // Data from form is valid(Check if Genre with same name already exists)
            Genre.findOne({'name': req.body.name}).exec(function(err, found_genre) {
                if (err) {return next(err);}
                if (found_genre) {
                    res.redirect(found_genre.url); // Genre exists, redirect to its detail page
                }
                else {
                    genre.save(function(err) {
                        if (err) {return next(err);}
                        res.redirect(genre.url); // New Genre saved! redirect to the genre detail page
                    });
                    
                }
            });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genres_books: function(callback) {
            Book.find({'genre': req.params.id}).exec(callback);
        }
    }, function(err, results) {
        if (err) {return next(err);}
        if (results.genre == null) {
            res.redirect('/catalog/genres');
        }
        res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books});
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({'genre': req.body.genreid}).exec(callback);
        }
    }, function(err, results) {
        if (err) {return next(err);}
        if (results.genre_books.length > 0) { // Genre has books. Render in same way as for GET route
            res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
            return;
        }
        else {
            Genre.findByIdAndRemove(req.body.genreid, function(err) {
                if (err) {return next(err);}
                res.redirect('/catalog/genres');
            })
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id).exec(function(err, genre) {
        if (err) {return next(err);}
        if (genre == null) {
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_form', {title: 'Update Genre', genre: genre});
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    body('name', 'Genre name required').trim().isLength({min: 1}).escape(), // Validate and sanitize the 'name' field

    (req, res, next) => { // Process request after validation and sanitization
        const errors = validationResult(req); // Extract the validation errors from the request

        var genre = new Genre( // Create a genre object with escaped and trimmed data
            {
                name: req.body.name,
                _id: req.params.id
            }
        );

        if (!errors.isEmpty()) { // There are errors! Render the form again with sanitized value/error massages
            res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors.array()});
            return;
        }
        else { // Data from form is valid(Check if Genre with same name already exists)
            Genre.findOne({'name': req.body.name}).exec(function(err, found_genre) {
                if (err) {return next(err);}
                if (found_genre) {
                    res.redirect(found_genre.url); // Genre exists, redirect to its detail page
                }
                else {
                    Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, thegenre) {
                        if (err) {return next(err);}
                        res.redirect(thegenre.url);
                    })
                }
            });
        }
    }    
];