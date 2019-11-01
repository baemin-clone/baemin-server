module.exports = function(app){
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/app/signUp').post(user.signUp);
    app.route('/app/signIn').post(user.signIn);

    app.use('/check', jwtMiddleware);
    app.get('/check', user.check);
};