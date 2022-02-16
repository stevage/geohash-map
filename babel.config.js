module.exports = {
    ignore: [process.env.NODE_ENV !== 'production' ? './src' : ''],
    presets: ['@vue/app'],
};
