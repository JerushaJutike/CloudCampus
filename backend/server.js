const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`CloudCampus server running on port ${PORT}`);
});