module.exports = function(app){
    const index = require('../controllers/indexController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.use('/app', jwtMiddleware);
    app.get('/app', index.default);
};
