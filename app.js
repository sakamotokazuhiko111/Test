const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const morgan = require('morgan');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.flash = req.query.flash || null;
  res.locals.flashType = req.query.flashType || 'info';
  res.locals.currentPath = req.path;
  next();
});

app.use('/', require('./routes/index'));
app.use('/employees', require('./routes/employees'));
app.use('/departments', require('./routes/departments'));

app.use((req, res) => {
  res.status(404).render('error', { message: 'ページが見つかりません', status: 404 });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'サーバーエラーが発生しました', status: 500 });
});

module.exports = app;
